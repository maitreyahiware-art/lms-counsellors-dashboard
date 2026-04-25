/**
 * hydrate_educator_content.js
 * ────────────────────────────────────────────────────────────────────────────
 * Fetches ALL social posts from the live BN API, normalizes them into
 * clean health-category-tagged content, and writes:
 *   - src/data/social_content_clean.ts   (TypeScript data consumed by the UI)
 *   - src/data/social_content_audit.json (audit report)
 *
 * Run:  node scripts/hydrate_educator_content.js
 * ────────────────────────────────────────────────────────────────────────────
 */

const fs = require("fs");
const path = require("path");

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = "https://bn-new-api.balancenutritiononline.com/api/v1/social-posts/all";
const API_HEADERS = {
  "source": "cs_db",
  "Content-Type": "application/json",
  "Cookie": "connect.sid=s%3ARfynDp4c9t-DRbRgaKoT606qIqMZoYVD.TJ9LnjwK%2FHJdnfiCzRNKZPSf2oBBL3TMCbatvIcp7Ew",
};
const PAGES_TO_FETCH = 30;  // fetch up to 30 pages of 100 => 3000 max
const PAGE_SIZE = 100;

const OUTPUT_DATA = path.resolve(__dirname, "../src/data/social_content_clean.ts");
const OUTPUT_AUDIT = path.resolve(__dirname, "../src/data/social_content_audit.json");

// ─── Tag → Health Category Mapping ────────────────────────────────────────────
// Only the 8 official BN health conditions are used as categories.
// All other content falls into "General" (shows in All Content tab only).
const TAG_TO_CATEGORY = {
  // PCOS
  "pcos": "PCOS", "pcod": "PCOS", "pcosweightloss": "PCOS", "pcosdiet": "PCOS",
  "polycystic": "PCOS", "pcosfertility": "PCOS",

  // Pregnancy
  "pregnancy": "Pregnancy", "pregnant": "Pregnancy", "prenatal": "Pregnancy",
  "pre natal": "Pregnancy", "postnatal": "Pregnancy", "post natal": "Pregnancy",
  "fertility": "Pregnancy", "conceive": "Pregnancy",

  // Menopause
  "menopause": "Menopause", "perimenopause": "Menopause", "menopausal": "Menopause",

  // Diabetes
  "diabetes": "Diabetes", "diabetic": "Diabetes", "bloodsugar": "Diabetes",
  "blood sugar": "Diabetes", "insulin": "Diabetes",

  // Thyroid
  "thyroid": "Thyroid", "hypothyroid": "Thyroid", "hyperthyroid": "Thyroid",
  "thyroidhealth": "Thyroid",

  // Cardiac
  "cardiac": "Cardiac", "hypertension": "Cardiac", "blood pressure": "Cardiac",
  "bp": "Cardiac", "cholesterol": "Cardiac", "heartdisease": "Cardiac",
  "cardiovascular": "Cardiac", "fatty liver": "Cardiac", "fattyliver": "Cardiac",

  // Gut Health
  "guthealth": "Gut Health", "gut health": "Gut Health", "acidity": "Gut health",
  "bloating": "Gut Health", "bloated": "Gut Health", "constipation": "gut Health",
  "gut reset challenge": "Gut Health", "gastric": "Gut Health", "ibs": "Gut health",
  "digestion": "Gut Health", "digestive": "Gut Health",

  // Child Nutrition
  "child nutrition": "Child Nutrition", "childnutrition": "Child Nutrition",
  "kidsnutrition": "Child Nutrition",
};

// ─── API SubType → Clean SubType Mapping ──────────────────────────────────────
const SUBTYPE_MAP = {
  // Tips & Gyan
  "Gyans": "Gyan",
  "Dose of Gyaan": "Gyan",
  "Did You Know": "Gyan",
  "Tips": "Tips",
  "Chai Time": "Gyan",
  "What Makes Our Diet Programs Stand Out": "Gyan",
  "Corporate Wellness": "Gyan",
  "About Us": "Gyan",
  "Recognitions & Honors": "Gyan",
  "E-Kit": "Gyan",
  "Our Online Diet Programs": "Gyan",

  // Recipes
  "Recipe": "Recipe",
  "Healthy Recipe": "Recipe",
  "What I eat in a day": "Recipe",
  "What our clients eat on diet": "Recipe",
  "Travel & Eat Out": "Recipe",

  // Success Stories
  "Good Feedback": "Success Story",
  "Transformation": "Success Story",
  "Youtube Transformation": "Success Story",
  "Success Stories": "Success Story",

  // Podcasts / External
  "Podcast Snippets": "Podcast",
  "Balanced Bites with Khyati Podcast": "Podcast",

  // Challenge
  "Challenge": "Challenge",

  // Media
  "Media Spotlight": "General",

  // Default
  "General": "General",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip HTML tags, decode common entities */
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
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract first URL from a media field (could be array of objects) */
function extractMediaUrl(field) {
  if (!field) return null;
  if (typeof field === "string") {
    if (field.startsWith("http")) return field;
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed) && parsed[0]?.file?.path) return parsed[0].file.path;
    } catch (_) {}
    return null;
  }
  if (Array.isArray(field) && field[0]?.file?.path) return field[0].file.path;
  return null;
}

/** YouTube ID extractor */
function parseYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

/** Extract Instagram URL from insta_account object */
function extractInstagramUrl(instaAccount) {
  if (!instaAccount || typeof instaAccount !== "object") return null;
  for (const val of Object.values(instaAccount)) {
    if (typeof val === "string" && val.includes("instagram.com")) return val;
  }
  return null;
}

/** Extract YouTube URL from youtube_account object */
function extractYouTubeUrl(ytAccount) {
  if (!ytAccount || typeof ytAccount !== "object") return null;
  for (const val of Object.values(ytAccount)) {
    if (typeof val === "string" && (val.includes("youtube.com") || val.includes("youtu.be"))) return val;
  }
  return null;
}

/** Normalize tags array from API format */
function parseApiTags(tagsField) {
  if (!tagsField) return [];
  if (typeof tagsField === "string") {
    if (tagsField.trim() === "") return [];
    try {
      const parsed = JSON.parse(tagsField);
      if (Array.isArray(parsed)) return parsed.map(t => t.trim()).filter(Boolean);
    } catch (_) {}
    return tagsField.split(",").map(t => t.trim()).filter(Boolean);
  }
  if (Array.isArray(tagsField)) {
    return tagsField.map(t => typeof t === "string" ? t.trim() : "").filter(Boolean);
  }
  return [];
}

/** Determine health category — only the 8 official BN conditions or General */
function normalizeCategory(tags, subType, title, description) {
  // 1. Check raw tags against the 8 official conditions
  for (const rawTag of tags) {
    const normalized = rawTag.trim().toLowerCase().replace(/^#/, "");
    if (TAG_TO_CATEGORY[normalized]) return TAG_TO_CATEGORY[normalized];
    // Partial match
    for (const [key, cat] of Object.entries(TAG_TO_CATEGORY)) {
      if (normalized.includes(key) || key.includes(normalized)) return cat;
    }
  }

  // 2. Infer from title + description keywords (strict condition-only list)
  const searchText = ((title || "") + " " + (description || "")).toLowerCase();
  const inferencePriority = [
    ["pcos", "PCOS"], ["pcod", "PCOS"],
    ["diabetes", "Diabetes"], ["diabetic", "Diabetes"], ["blood sugar", "Diabetes"],
    ["blood pressure", "Cardiac"], ["hypertension", "Cardiac"], ["cholesterol", "Cardiac"],
    ["cardiac", "Cardiac"], ["heart health", "Cardiac"], ["fatty liver", "Cardiac"],
    ["thyroid", "Thyroid"],
    ["gut health", "Gut Health"], ["acidity", "Gut Health"], ["bloating", "Gut Health"],
    ["constipation", "Gut Health"], ["digestion", "Gut Health"], ["ibs", "Gut Health"],
    ["pregnancy", "Pregnancy"], ["pregnant", "Pregnancy"], ["prenatal", "Pregnancy"],
    ["menopause", "Menopause"], ["perimenopause", "Menopause"],
    ["child nutrition", "Child Nutrition"], ["kids nutrition", "Child Nutrition"],
  ];
  for (const [keyword, cat] of inferencePriority) {
    if (searchText.includes(keyword)) return cat;
  }

  // 3. Everything else → General (shows in All Content but not condition-specific tabs)
  return "General";
}

/** Deduplicate hash */
function titleHash(title) {
  return (title || "").replace(/[^a-z0-9]/gi, "").toLowerCase().substring(0, 50);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 Hydrating Educator Content from Live API...\n");

  // ── Fetch all pages ────────────────────────────────────────────────────────
  let allPosts = [];
  for (let page = 1; page <= PAGES_TO_FETCH; page++) {
    console.log(`  📡 Fetching page ${page} (limit: ${PAGE_SIZE})...`);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ page, limit: PAGE_SIZE }),
      });
      const json = await res.json();
      const resObj = Array.isArray(json) ? json[0] : json;
      const posts = resObj?.data || [];
      if (posts.length === 0) {
        console.log(`  ✅ Page ${page} returned 0 posts — done fetching.`);
        break;
      }
      allPosts = allPosts.concat(posts);
      console.log(`     → ${posts.length} posts (total: ${allPosts.length})`);
    } catch (err) {
      console.error(`  ❌ Error fetching page ${page}:`, err.message);
      break;
    }
  }

  console.log(`\n📦 Total raw social posts from API: ${allPosts.length}`);

  // ── Fetch Success Stories ──────────────────────────────────────────────────
  const SUCCESS_API_URL = "https://bn-new-api.balancenutritiononline.com/api/v1/success-stories/all";
  let allSuccessStories = [];
  for (let page = 1; page <= 10; page++) {
    console.log(`  🌟 Fetching success stories page ${page} (limit: ${PAGE_SIZE})...`);
    try {
      const res = await fetch(SUCCESS_API_URL, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ page, limit: PAGE_SIZE }),
      });
      const json = await res.json();
      const resObj = Array.isArray(json) ? json[0] : json;
      const posts = resObj?.data || [];
      if (posts.length === 0) {
        console.log(`  ✅ Page ${page} returned 0 success stories — done fetching.`);
        break;
      }
      allSuccessStories = allSuccessStories.concat(posts);
      console.log(`     → ${posts.length} stories (total: ${allSuccessStories.length})`);
    } catch (err) {
      console.error(`  ❌ Error fetching success stories page ${page}:`, err.message);
      break;
    }
  }

  console.log(`📦 Total raw success stories from API: ${allSuccessStories.length}`);
 
  // ── Fetch Recipes ─────────────────────────────────────────────────────────
  const RECIPE_API_URL = "https://bn-new-api.balancenutritiononline.com/api/v1/recipe/all";
  let allRecipes = [];
  for (let page = 1; page <= 15; page++) { // Fetch up to 15 pages of recipes
    console.log(`  🥗 Fetching recipes page ${page} (limit: ${PAGE_SIZE})...`);
    try {
      const res = await fetch(RECIPE_API_URL, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ page, limit: PAGE_SIZE }),
      });
      const json = await res.json();
      const resObj = Array.isArray(json) ? json[0] : json;
      const posts = resObj?.data || [];
      if (posts.length === 0) {
        console.log(`  ✅ Page ${page} returned 0 recipes — done fetching.`);
        break;
      }
      allRecipes = allRecipes.concat(posts);
      console.log(`     → ${posts.length} recipes (total: ${allRecipes.length})`);
    } catch (err) {
      console.error(`  ❌ Error fetching recipes page ${page}:`, err.message);
      break;
    }
  }

  console.log(`📦 Total raw recipes from API: ${allRecipes.length}`);

  // ── Process each post ──────────────────────────────────────────────────────
  const cleanPosts = [];
  const auditLog = {
    source: "Live API: " + API_URL + ", " + SUCCESS_API_URL + " & " + RECIPE_API_URL,
    fetchedAt: new Date().toISOString(),
    totalRaw: allPosts.length + allSuccessStories.length + allRecipes.length,
    accepted: 0,
    rejected: [],
    duplicates: [],
    categoryBreakdown: {},
    subTypeBreakdown: {},
    missingThumbnail: [],
  };

  const seenTitleHashes = new Map();

  // Process Social Posts
  for (const raw of allPosts) {
    const id = String(raw.id);
    const title = (raw.title || "").trim();
    const descriptionRaw = raw.description || "";
    const descriptionText = stripHtml(descriptionRaw);
    const rawSubType = raw.postSubType || "General";
    const cleanSubType = SUBTYPE_MAP[rawSubType] || "General";

    // ── Rejection: Missing title ──────────────────────────────────────────
    if (!title || title.length < 3) {
      auditLog.rejected.push({ id, reason: "Missing or too-short title", title: raw.title });
      continue;
    }

    // ── Media extraction ─────────────────────────────────────────────────
    let videoUrl = extractMediaUrl(raw.video);
    if (!videoUrl) videoUrl = extractYouTubeUrl(raw.youtube_account);
    const imageUrl = extractMediaUrl(raw.image) || extractMediaUrl(raw.thumbnailImage);

    // ── Rejection: No media AND no description ───────────────────────────
    if (!videoUrl && !imageUrl && (!descriptionText || descriptionText.length < 10)) {
      auditLog.rejected.push({ id, reason: "No media and no description", title });
      continue;
    }

    // ── Deduplicate ──────────────────────────────────────────────────────
    const hash = titleHash(title);
    if (seenTitleHashes.has(hash)) {
      auditLog.duplicates.push({ keptId: seenTitleHashes.get(hash), droppedId: id, title });
      continue;
    }

    // ── YouTube detection ────────────────────────────────────────────────
    const youtubeId = parseYouTubeId(videoUrl);
    const videoType = youtubeId
      ? "youtube"
      : videoUrl?.includes("cloudinary.com")
      ? "cloudinary"
      : videoUrl
      ? "unknown"
      : null;

    // ── Thumbnail ────────────────────────────────────────────────────────
    let thumbnailUrl = extractMediaUrl(raw.thumbnailImage) || extractMediaUrl(raw.image);
    if (!thumbnailUrl) {
      if (youtubeId) {
        thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
      } else if (videoType === "cloudinary" && videoUrl) {
        // Fallback: Generate Cloudinary thumb at 1s
        thumbnailUrl = videoUrl.replace(".mp4", ".jpg").replace("/upload/", "/upload/so_1/");
      }
    }
    
    if (!thumbnailUrl) {
      auditLog.missingThumbnail.push({ id, title });
    }

    // ── Tags ─────────────────────────────────────────────────────────────
    const cleanTags = parseApiTags(raw.tags)
      .map(t => t.replace(/^#/, "").trim())
      .filter(t => t.length > 1);

    // ── Category ─────────────────────────────────────────────────────────
    const category = normalizeCategory(cleanTags, rawSubType, title, descriptionText);

    // ── Instagram ────────────────────────────────────────────────────────
    const instagramUrl = extractInstagramUrl(raw.insta_account) || raw.postLink || null;

    // ── Platforms ────────────────────────────────────────────────────────
    let platforms = [];
    if (Array.isArray(raw.platforms)) platforms = raw.platforms.filter(Boolean);
    else if (Array.isArray(raw.postedOn)) platforms = raw.postedOn.filter(Boolean);

    // ── Date ─────────────────────────────────────────────────────────────
    let date = null;
    if (raw.created_at && raw.created_at !== "0000-00-00 00:00:00") {
      date = new Date(raw.created_at).toISOString();
    } else if (raw.updated_at && raw.updated_at !== "0000-00-00 00:00:00") {
      date = new Date(raw.updated_at).toISOString();
    }

    // ── Build clean post ─────────────────────────────────────────────────
    const cleanPost = {
      id,
      title,
      category,
      subType: cleanSubType,
      mediaType: raw.postType === "reel" ? "reel" : "static",
      videoUrl: videoUrl || null,
      videoType,
      youtubeId: youtubeId || null,
      imageUrl: thumbnailUrl || null,
      descriptionPlain: descriptionText,
      tags: cleanTags,
      instagramUrl: (typeof instagramUrl === "string" && instagramUrl.startsWith("http")) ? instagramUrl : null,
      platforms,
      date,
    };

    seenTitleHashes.set(hash, id);
    cleanPosts.push(cleanPost);

    // Track breakdowns
    auditLog.categoryBreakdown[category] = (auditLog.categoryBreakdown[category] || 0) + 1;
    auditLog.subTypeBreakdown[cleanSubType] = (auditLog.subTypeBreakdown[cleanSubType] || 0) + 1;
  }

  // Process Success Stories
  for (const raw of allSuccessStories) {
    const id = "ss_" + raw.id;
    const clientName = raw.client_details?.name || "Anonymous";
    let weightLoss = raw.program_details?.weight_loss || raw.meta_data?.total_weight_loss;
    if (weightLoss) weightLoss = weightLoss.toString().trim() + "kgs";
    
    // Construct Title
    let title = `${clientName}'s Transformation`;
    if (weightLoss) title += ` - Lost ${weightLoss}`;

    const descriptionText = stripHtml(raw.short_descriptions || raw.long_descriptions || "");
    
    // Media
    let imageUrl = null;
    let videoUrl = null;
    
    // Check meta_data.check_list first for photos
    const cl = raw.meta_data?.check_list?.[0];
    if (cl && cl.before_after_photo && cl.before_after_photo[0]?.file?.path) {
      imageUrl = cl.before_after_photo[0].file.path;
    } else if (cl && cl.after_photo && cl.after_photo[0]?.file?.path) {
      imageUrl = cl.after_photo[0].file.path;
    } else if (raw.images && raw.images.length > 0) {
      imageUrl = extractMediaUrl(raw.images);
    }

    // Video 
    if (raw.yt_link) {
      videoUrl = raw.yt_link;
    } else if (cl && cl.testimonial_video && cl.testimonial_video[0]?.file?.path) {
      videoUrl = cl.testimonial_video[0].file.path;
    }

    // Deduplicate
    const hash = titleHash(title);
    if (seenTitleHashes.has(hash)) {
      auditLog.duplicates.push({ keptId: seenTitleHashes.get(hash), droppedId: id, title });
      continue;
    }

    const youtubeId = parseYouTubeId(videoUrl);
    const videoType = youtubeId
      ? "youtube"
      : videoUrl?.includes("cloudinary.com")
      ? "cloudinary"
      : videoUrl
      ? "unknown"
      : null;

    if (!imageUrl && youtubeId) {
      imageUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }
    if (!imageUrl && !videoUrl) {
       auditLog.missingThumbnail.push({ id, title });
    }

    const cleanTags = parseApiTags(raw.health_conditions)
      .map(t => t.replace(/^#/, "").trim())
      .filter(t => t.length > 1);

    const category = normalizeCategory(cleanTags, "Transformation", title, descriptionText);

    let date = null;
    if (raw.created_at && raw.created_at !== "0000-00-00 00:00:00") {
      date = new Date(raw.created_at).toISOString();
    }

    const cleanPost = {
      id,
      title,
      category,
      subType: "Success Story",
      mediaType: videoUrl ? "reel" : "static",
      videoUrl: videoUrl || null,
      videoType,
      youtubeId: youtubeId || null,
      imageUrl: imageUrl || null,
      descriptionPlain: descriptionText,
      tags: cleanTags,
      instagramUrl: null,
      platforms: [],
      date,
      storySlug: raw.slug || null,
    };

    seenTitleHashes.set(hash, id);
    cleanPosts.push(cleanPost);

    auditLog.categoryBreakdown[category] = (auditLog.categoryBreakdown[category] || 0) + 1;
    auditLog.subTypeBreakdown["Success Story"] = (auditLog.subTypeBreakdown["Success Story"] || 0) + 1;
  }

  // Process Recipes
  for (const raw of allRecipes) {
    const id = "recipe_v2_" + raw.id;
    const title = (raw.title || "").trim();
    if (!title) continue;

    const meta = raw.meta_data || {};
    const healthMeter = stripHtml(meta.health_meter || "");
    const method = Array.isArray(meta.method) ? meta.method.join("\n") : "";
    const ingredients = Array.isArray(raw.ingredients) ? raw.ingredients.join(", ") : "";

    // Construct Nutrition Info
    let nutrition = "";
    if (meta.energy || meta.protein || meta.fat || meta.carbs) {
      nutrition = `\n\nNUTRITION INFO:\n- Energy: ${meta.energy || 0} kcal\n- Protein: ${meta.protein || 0}g\n- Fat: ${meta.fat || 0}g\n- Carbs: ${meta.carbs || 0}g\n- Fiber: ${meta.fiber || 0}g`;
    }

    const descriptionText = `${healthMeter}\n\nINGREDIENTS:\n${ingredients}\n\nMETHOD:\n${method}${nutrition}`;

    // Media
    let imageUrl = null;
    if (raw.recipe_images && raw.recipe_images.length > 0) {
      imageUrl = raw.recipe_images[0]?.file?.path;
    } else if (raw.recipe_thumbnail_images && raw.recipe_thumbnail_images.length > 0) {
      imageUrl = raw.recipe_thumbnail_images[0]?.file?.path;
    }

    const videoUrl = raw.recipe_video || null;

    // Deduplicate
    const hash = titleHash(title);
    if (seenTitleHashes.has(hash)) {
      auditLog.duplicates.push({ keptId: seenTitleHashes.get(hash), droppedId: id, title });
      continue;
    }

    const youtubeId = parseYouTubeId(videoUrl);
    const videoType = youtubeId
      ? "youtube"
      : videoUrl?.includes("cloudinary.com")
      ? "cloudinary"
      : videoUrl
      ? "unknown"
      : null;

    const cleanTags = parseApiTags(raw.health_tags)
      .map(t => t.replace(/^#/, "").trim())
      .filter(t => t.length > 1);

    const category = normalizeCategory(cleanTags, "Recipe", title, descriptionText);

    const recipeSlug = raw.slug || "";
    const recipeCategoryName = raw.category || "General";

    const cleanPost = {
      id,
      title,
      category,
      subType: "Recipe",
      mediaType: videoUrl ? "reel" : "static",
      videoUrl: videoUrl || null,
      videoType,
      youtubeId: youtubeId || null,
      imageUrl: imageUrl || null,
      descriptionPlain: descriptionText,
      tags: cleanTags,
      instagramUrl: null,
      platforms: [],
      date: null,
      recipeSlug: recipeSlug || null,
      recipeCategoryName: recipeCategoryName || null,
    };

    seenTitleHashes.set(hash, id);
    cleanPosts.push(cleanPost);

    auditLog.categoryBreakdown[category] = (auditLog.categoryBreakdown[category] || 0) + 1;
    auditLog.subTypeBreakdown["Recipe"] = (auditLog.subTypeBreakdown["Recipe"] || 0) + 1;
  }

  auditLog.accepted = cleanPosts.length;

  // ─── Console Summary ───────────────────────────────────────────────────────
  console.log(`\n✅ Accepted:   ${auditLog.accepted}`);
  console.log(`❌ Rejected:   ${auditLog.rejected.length}`);
  console.log(`🔁 Duplicates: ${auditLog.duplicates.length}`);
  console.log(`\n📊 Category Breakdown:`);
  for (const [cat, count] of Object.entries(auditLog.categoryBreakdown).sort((a,b) => b[1]-a[1])) {
    console.log(`   ${cat.padEnd(25)} ${count}`);
  }
  console.log(`\n📂 SubType Breakdown:`);
  for (const [st, count] of Object.entries(auditLog.subTypeBreakdown).sort((a,b) => b[1]-a[1])) {
    console.log(`   ${st.padEnd(25)} ${count}`);
  }
  console.log(`\n⚠️  Missing thumbnails: ${auditLog.missingThumbnail.length}`);

  // ─── Write Audit JSON ──────────────────────────────────────────────────────
  fs.writeFileSync(OUTPUT_AUDIT, JSON.stringify(auditLog, null, 2), "utf-8");
  console.log(`\n📄 Audit written → ${OUTPUT_AUDIT}`);

  // ─── Write TypeScript Data File ────────────────────────────────────────────
  const tsContent = `// AUTO-GENERATED — do not edit manually.
// Run: node scripts/hydrate_educator_content.js
// Generated: ${new Date().toISOString()}
// Source: Live API (${allPosts.length} raw → ${cleanPosts.length} clean posts)

export type ContentCategory =
  | "PCOS"
  | "Pregnancy"
  | "Menopause"
  | "Diabetes"
  | "Thyroid"
  | "Cardiac"
  | "Gut Health"
  | "Child Nutrition"
  | "General";

export type PostSubType = "General" | "Tips" | "Gyan" | "Recipe" | "Success Story" | "Podcast" | "Challenge";
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
  recipeSlug?: string | null;
  recipeCategoryName?: string | null;
  storySlug?: string | null;
}

export const CLEAN_POSTS: CleanPost[] = ${JSON.stringify(cleanPosts, null, 2)} as CleanPost[];

export const CATEGORY_COUNTS: Record<ContentCategory, number> = ${JSON.stringify(auditLog.categoryBreakdown, null, 2)} as Record<ContentCategory, number>;
`;

  fs.writeFileSync(OUTPUT_DATA, tsContent, "utf-8");
  console.log(`📦 Data written → ${OUTPUT_DATA}`);
  console.log(`\n✅ Done! ${cleanPosts.length} posts hydrated.\n`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
