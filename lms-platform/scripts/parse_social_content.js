/**
 * parse_social_content.js
 * Run: node parse_social_content.js
 * 
 * Reads Social_Content.json (PHPMyAdmin export), cleans and normalizes
 * all posts, then writes:
 *   - src/data/social_content_clean.ts   (usable TS data)
 *   - src/data/social_content_audit.json (full audit report)
 */

const fs = require("fs");
const path = require("path");

// ─── Paths ────────────────────────────────────────────────────────────────────
const INPUT_PATH = path.resolve(__dirname, "../../data_backups/Social_Content.json");
const OUTPUT_DATA = path.resolve(__dirname, "../src/data/social_content_clean.ts");
const OUTPUT_AUDIT = path.resolve(__dirname, "../src/data/social_content_audit.json");

// ─── Category Normalization Map ───────────────────────────────────────────────
// Maps raw tag strings (lowercase) to clean category names
const TAG_TO_CATEGORY = {
  // Weight Loss
  "weight loss": "Weight Loss",
  "lose weight": "Weight Loss",
  "losing weight": "Weight Loss",
  "low carb weight dinner": "Weight Loss",
  "high calorie snacks": "Weight Loss",
  "intermittent fasting": "Intermittent Fasting",
  
  // Health Conditions
  "pcos": "PCOS",
  "pcod": "PCOS",
  "diabetes": "Diabetes",
  "diabetic": "Diabetes",
  "hypertension": "Cardiac",
  "blood pressure": "Cardiac",
  "bp": "Cardiac",
  "cardiac": "Cardiac",
  "cholesterol": "Cardiac",
  "fatty liver": "Cardiac",
  "acidity": "Gut Health",
  "bloating": "Gut Health",
  "acid": "Gut Health",
  "gut health": "Gut Health",
  "gi": "Gut Health",
  "thyroid": "Thyroid",
  "pregnancy": "Pregnancy",
  "pregnant": "Pregnancy",
  "pre natal": "Pregnancy",
  "post natal": "Pregnancy",
  "menopause": "Menopause",
  "child nutrition": "Child Nutrition",
  "kids": "Child Nutrition",
  "child": "Child Nutrition",
  "gain weight": "Gain Weight",
  "build muscles": "Build Muscles",
  "muscle": "Build Muscles",

  // Content types
  "general": "General",
  "recipe": "Recipe",
  "transformation": "Transformation",
  "success": "Transformation",
};

// Maps sub-type strings
const SUBTYPE_CATEGORY_MAP = {
  "Transformation": "Transformation",
  "Recipe": "Recipe",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip HTML tags and inline styles, decode HTML entities */
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract first URL from a JSON-encoded media field */
function extractMediaUrl(jsonStr) {
  if (!jsonStr) return null;
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed[0]?.file?.path) {
      return parsed[0].file.path;
    }
  } catch (_) {}
  return null;
}

/** Detect if a URL is a YouTube link and extract the video ID */
function parseYouTubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/** Extract Instagram post URL from accounts JSON */
function extractInstagramUrl(accountsStr) {
  if (!accountsStr) return null;
  try {
    const accounts = JSON.parse(accountsStr);
    const insta = accounts?.insta_account;
    if (insta) {
      // Try "Balance Nutrition" first, then any key
      const url = insta["Balance Nutrition"] || Object.values(insta).find(v => typeof v === "string" && v.includes("instagram.com"));
      if (url && url.startsWith("http")) return url;
    }
  } catch (_) {}
  return null;
}

/** Parse posted_on field */
function parsePlatforms(postedOnStr) {
  if (!postedOnStr) return [];
  try {
    const parsed = JSON.parse(postedOnStr);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch (_) {}
  return [];
}

/** Normalize tags array into a single ContentCategory */
function normalizeCategory(tagsStr, postSubType, titleText, descriptionText) {
  // 1. Check sub_type first (Transformation, Recipe are definitive)
  if (SUBTYPE_CATEGORY_MAP[postSubType]) {
    return SUBTYPE_CATEGORY_MAP[postSubType];
  }

  // 2. Try tags
  if (tagsStr) {
    try {
      const tags = JSON.parse(tagsStr);
      if (Array.isArray(tags)) {
        for (const tag of tags) {
          if (!tag || tag.trim() === "." || tag.trim() === "") continue;
          const normalized = tag.trim().toLowerCase();
          if (TAG_TO_CATEGORY[normalized]) {
            return TAG_TO_CATEGORY[normalized];
          }
          // Partial match
          for (const [key, val] of Object.entries(TAG_TO_CATEGORY)) {
            if (normalized.includes(key) || key.includes(normalized)) {
              return val;
            }
          }
        }
      }
    } catch (_) {}
  }

  // 3. Infer from title/description keywords
  const searchText = (titleText + " " + descriptionText).toLowerCase();
  const inferenceMap = [
    ["transformation", "Transformation"],
    ["success story", "Transformation"],
    ["lost ", "Transformation"],
    ["recipe", "Recipe"],
    ["ingredients", "Recipe"],
    ["step 1", "Recipe"],
    ["pcos", "PCOS"],
    ["pcod", "PCOS"],
    ["diabetes", "Diabetes"],
    ["diabetic", "Diabetes"],
    ["blood pressure", "Cardiac"],
    ["hypertension", "Cardiac"],
    ["cholesterol", "Cardiac"],
    ["cardiac", "Cardiac"],
    ["thyroid", "Thyroid"],
    ["acidity", "Gut Health"],
    ["bloat", "Gut Health"],
    ["gut", "Gut Health"],
    ["gastric", "Gut Health"],
    ["pregnancy", "Pregnancy"],
    ["pregnant", "Pregnancy"],
    ["natal", "Pregnancy"],
    ["menopause", "Menopause"],
    ["child", "Child Nutrition"],
    ["kids", "Child Nutrition"],
    ["weight loss", "Weight Loss"],
    ["lose weight", "Weight Loss"],
    ["portion size", "Weight Loss"],
    ["gain weight", "Gain Weight"],
    ["muscle", "Build Muscles"],
    ["intermittent fasting", "Intermittent Fasting"],
  ];
  for (const [keyword, cat] of inferenceMap) {
    if (searchText.includes(keyword)) return cat;
  }

  return "General";
}

/** Parse the best available date */
function parseDate(createdAt, updatedAt) {
  if (createdAt && createdAt !== "0000-00-00 00:00:00") {
    return new Date(createdAt).toISOString();
  }
  if (updatedAt && updatedAt !== "0000-00-00 00:00:00") {
    return new Date(updatedAt).toISOString();
  }
  return null;
}

/** Generate a title hash for dedup */
function titleHash(title) {
  return title.replace(/[^a-z0-9]/gi, "").toLowerCase().substring(0, 50);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const rawJson = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));

// The file is a PHPMyAdmin export: array with header, database, and table objects
const tableEntry = rawJson.find(e => e.type === "table" && e.name === "social_post");
if (!tableEntry) {
  console.error("Could not find social_post table in JSON");
  process.exit(1);
}

const rawPosts = tableEntry.data;
console.log(`\n📦 Total raw posts: ${rawPosts.length}`);

// ─── Process each post ────────────────────────────────────────────────────────

const cleanPosts = [];
const auditLog = {
  total: rawPosts.length,
  accepted: 0,
  rejected: [],
  duplicates: [],
  categoryBreakdown: {},
  missingThumbnail: [],
  invalidDateFallback: [],
};

const seenTitleHashes = new Map(); // hash -> cleanPost id

for (const raw of rawPosts) {
  const id = raw.id;
  const title = (raw.title || "").trim().replace(/^[\s\t]+/, "");
  const descriptionRaw = raw.description || "";
  const descriptionText = stripHtml(descriptionRaw);
  // Normalize subType — CRM has some non-standard values like "What I eat in a day"
  const KNOWN_SUBTYPES = ["General", "Tips", "Recipe", "Transformation"];
  const rawSubType = raw.post_sub_type || "General";
  const postSubType = KNOWN_SUBTYPES.includes(rawSubType) ? rawSubType : "General";

  // ── Rejection checks ──────────────────────────────────────────────────────

  // R1: Missing title
  if (!title || title.length < 3) {
    auditLog.rejected.push({ id, reason: "Missing or too-short title", title: raw.title });
    continue;
  }

  // R2: Missing both image and video
  const videoUrl = extractMediaUrl(raw.video);
  const imageUrl = extractMediaUrl(raw.image) || extractMediaUrl(raw.thumbnail_image);
  if (!videoUrl && !imageUrl) {
    auditLog.rejected.push({ id, reason: "No media (no video and no image/thumbnail)", title });
    continue;
  }

  // R3: Missing description
  if (!descriptionText || descriptionText.length < 20) {
    auditLog.rejected.push({ id, reason: "Empty or minimal description", title });
    continue;
  }

  // ── Deduplicate by title hash ──────────────────────────────────────────────
  const hash = titleHash(title);
  if (seenTitleHashes.has(hash)) {
    const existingId = seenTitleHashes.get(hash);
    // Keep whichever has a more recent updated_at
    const existing = cleanPosts.find(p => p.id === existingId);
    const existingDate = existing?.date || "0";
    const thisDate = parseDate(raw.created_at, raw.updated_at) || "0";
    
    auditLog.duplicates.push({
      keptId: existingId,
      droppedId: id,
      title,
      reason: `Duplicate title hash. Kept ID ${existingId} (${existingDate}), dropped ID ${id} (${thisDate})`,
    });
    continue;
  }

  // ── Media parsing ──────────────────────────────────────────────────────────
  const youtubeId = parseYouTubeId(videoUrl);
  const videoType = youtubeId
    ? "youtube"
    : videoUrl?.includes("cloudinary.com")
    ? "cloudinary"
    : videoUrl
    ? "unknown"
    : null;

  // Thumbnail: prefer explicit thumbnail, then image, then YouTube API
  let thumbnailUrl = extractMediaUrl(raw.thumbnail_image) || extractMediaUrl(raw.image);
  if (!thumbnailUrl && youtubeId) {
    thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  if (!thumbnailUrl) {
    auditLog.missingThumbnail.push({ id, title });
  }

  // ── Date ──────────────────────────────────────────────────────────────────
  const date = parseDate(raw.created_at, raw.updated_at);
  if (!date) {
    auditLog.invalidDateFallback.push({ id, title, note: "No valid date found, set to null" });
  } else if (raw.created_at === "0000-00-00 00:00:00") {
    auditLog.invalidDateFallback.push({ id, title, note: "created_at was 0000-00-00, used updated_at" });
  }

  // ── Category ──────────────────────────────────────────────────────────────
  const category = normalizeCategory(raw.tags, postSubType, title, descriptionText);

  // ── Clean tags list ────────────────────────────────────────────────────────
  let cleanTags = [];
  try {
    const parsed = JSON.parse(raw.tags || "[]");
    cleanTags = Array.isArray(parsed)
      ? parsed
          .map(t => t.trim())
          .filter(t => t && t !== "." && t.length > 1)
      : [];
  } catch (_) {}

  // ── Instagram URL ──────────────────────────────────────────────────────────
  const instagramUrl = extractInstagramUrl(raw.accounts) || (raw.post_link || null);
  const platforms = parsePlatforms(raw.posted_on);

  // ── Build clean post ──────────────────────────────────────────────────────
  const cleanPost = {
    id: String(id),
    title,
    category,
    subType: postSubType,
    mediaType: raw.post_type === "reel" ? "reel" : "static",
    videoUrl: videoUrl || null,
    videoType,
    youtubeId: youtubeId || null,
    imageUrl: thumbnailUrl || null,
    descriptionPlain: descriptionText,
    tags: cleanTags,
    instagramUrl: instagramUrl || null,
    platforms,
    date,
  };

  seenTitleHashes.set(hash, String(id));
  cleanPosts.push(cleanPost);

  // Track category breakdown
  auditLog.categoryBreakdown[category] = (auditLog.categoryBreakdown[category] || 0) + 1;
}

auditLog.accepted = cleanPosts.length;

// ─── Print Summary ────────────────────────────────────────────────────────────

console.log(`\n✅ Accepted:   ${auditLog.accepted}`);
console.log(`❌ Rejected:   ${auditLog.rejected.length}`);
console.log(`🔁 Duplicates: ${auditLog.duplicates.length}`);
console.log(`\n📊 Category Breakdown:`);
for (const [cat, count] of Object.entries(auditLog.categoryBreakdown).sort((a,b) => b[1]-a[1])) {
  console.log(`   ${cat.padEnd(25)} ${count}`);
}
console.log(`\n⚠️  Missing thumbnails: ${auditLog.missingThumbnail.length}`);
console.log(`📅 Date fallbacks:      ${auditLog.invalidDateFallback.length}`);

// ─── Write audit JSON ─────────────────────────────────────────────────────────

fs.writeFileSync(OUTPUT_AUDIT, JSON.stringify(auditLog, null, 2), "utf-8");
console.log(`\n📄 Audit written → ${OUTPUT_AUDIT}`);

// ─── Write clean TypeScript data file ────────────────────────────────────────

const tsContent = `// AUTO-GENERATED — do not edit manually.
// Run: node parse_social_content.js from lms-platform/
// Generated: ${new Date().toISOString()}
// Source: Social_Content.json (${rawPosts.length} raw → ${cleanPosts.length} clean posts)

export type ContentCategory =
  | "Weight Loss"
  | "PCOS"
  | "Diabetes"
  | "Cardiac"
  | "Gut Health"
  | "Thyroid"
  | "Pregnancy"
  | "Menopause"
  | "Child Nutrition"
  | "Gain Weight"
  | "Build Muscles"
  | "Intermittent Fasting"
  | "Recipe"
  | "Transformation"
  | "General";

export type PostSubType = "General" | "Tips" | "Recipe" | "Transformation";
export type MediaType = "reel" | "static";
export type VideoType = "cloudinary" | "youtube" | "unknown" | null;

export interface CleanPost {
  id: string;
  title: string;
  category: ContentCategory;
  subType: PostSubType;
  mediaType: MediaType;
  videoUrl: string | null;
  videoType: VideoType;
  youtubeId: string | null;
  imageUrl: string | null;
  descriptionPlain: string;
  tags: string[];
  instagramUrl: string | null;
  platforms: string[];
  date: string | null;
}

export const CLEAN_POSTS: CleanPost[] = ${JSON.stringify(cleanPosts, null, 2)};

export const CATEGORY_COUNTS: Record<ContentCategory, number> = ${JSON.stringify(auditLog.categoryBreakdown, null, 2)} as Record<ContentCategory, number>;
`;

fs.writeFileSync(OUTPUT_DATA, tsContent, "utf-8");
console.log(`📦 Data written → ${OUTPUT_DATA}`);
console.log(`\n✅ Done!\n`);
