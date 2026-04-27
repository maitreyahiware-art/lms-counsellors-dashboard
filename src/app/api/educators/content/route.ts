import { NextResponse } from 'next/server';
import type { CleanPost, ContentCategory } from '@/data/social_content_clean';

// ─── Config ────────────────────────────────────────────────────────────────────
const BN_API_BASE = 'https://bn-new-api.balancenutritiononline.com/api/v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const PAGE_SIZE = 100;

// The cookie is needed for the social-posts endpoint. Store in env or fallback to known value.
const API_HEADERS: Record<string, string> = {
  'source': 'cs_db',
  'Content-Type': 'application/json',
  ...(process.env.BN_API_COOKIE ? { 'Cookie': process.env.BN_API_COOKIE } : {}),
};

// ─── In-Memory Cache ───────────────────────────────────────────────────────────
interface CacheEntry {
  posts: CleanPost[];
  fetchedAt: number;
}
let cache: CacheEntry | null = null;

// ─── Tag → Category Mapping ────────────────────────────────────────────────────
const TAG_TO_CATEGORY: Record<string, ContentCategory> = {
  pcos: 'PCOS', pcod: 'PCOS', pcosweightloss: 'PCOS', pcosdiet: 'PCOS',
  polycystic: 'PCOS', pcosfertility: 'PCOS',
  pregnancy: 'Pregnancy', pregnant: 'Pregnancy', prenatal: 'Pregnancy',
  postnatal: 'Pregnancy', fertility: 'Pregnancy', conceive: 'Pregnancy',
  menopause: 'Menopause', perimenopause: 'Menopause', menopausal: 'Menopause',
  diabetes: 'Diabetes', diabetic: 'Diabetes', bloodsugar: 'Diabetes', insulin: 'Diabetes',
  thyroid: 'Thyroid', hypothyroid: 'Thyroid', hyperthyroid: 'Thyroid',
  cardiac: 'Cardiac', hypertension: 'Cardiac', cholesterol: 'Cardiac',
  cardiovascular: 'Cardiac', fattyliver: 'Cardiac',
  guthealth: 'Gut Health', acidity: 'Gut Health', bloating: 'Gut Health',
  constipation: 'Gut Health', gastric: 'Gut Health', ibs: 'Gut Health',
  digestion: 'Gut Health', digestive: 'Gut Health',
  childnutrition: 'Child Nutrition', kidsnutrition: 'Child Nutrition',
};

const SUBTYPE_MAP: Record<string, string> = {
  Gyans: 'Gyan', 'Dose of Gyaan': 'Gyan', 'Did You Know': 'Gyan', Tips: 'Tips',
  'Chai Time': 'Gyan', 'What Makes Our Diet Programs Stand Out': 'Gyan',
  'Corporate Wellness': 'Gyan', 'About Us': 'Gyan', 'Recognitions & Honors': 'Gyan',
  'E-Kit': 'Gyan', 'Our Online Diet Programs': 'Gyan',
  Recipe: 'Recipe', 'Healthy Recipe': 'Recipe', 'What I eat in a day': 'Recipe',
  'What our clients eat on diet': 'Recipe', 'Travel & Eat Out': 'Recipe',
  'Good Feedback': 'Success Story', Transformation: 'Success Story',
  'Youtube Transformation': 'Success Story', 'Success Stories': 'Success Story',
  'Podcast Snippets': 'Podcast', 'Balanced Bites with Khyati Podcast': 'Podcast',
  Challenge: 'Challenge', 'Media Spotlight': 'General', General: 'General',
};

const INFERENCE_PRIORITY: [string, ContentCategory][] = [
  ['pcos', 'PCOS'], ['pcod', 'PCOS'],
  ['diabetes', 'Diabetes'], ['diabetic', 'Diabetes'], ['blood sugar', 'Diabetes'],
  ['blood pressure', 'Cardiac'], ['hypertension', 'Cardiac'], ['cholesterol', 'Cardiac'],
  ['cardiac', 'Cardiac'], ['heart health', 'Cardiac'], ['fatty liver', 'Cardiac'],
  ['thyroid', 'Thyroid'],
  ['gut health', 'Gut Health'], ['acidity', 'Gut Health'], ['bloating', 'Gut Health'],
  ['constipation', 'Gut Health'], ['digestion', 'Gut Health'], ['ibs', 'Gut Health'],
  ['pregnancy', 'Pregnancy'], ['pregnant', 'Pregnancy'], ['prenatal', 'Pregnancy'],
  ['menopause', 'Menopause'], ['perimenopause', 'Menopause'],
  ['child nutrition', 'Child Nutrition'], ['kids nutrition', 'Child Nutrition'],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&rsquo;/g, "'").replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n').trim();
}

function extractMediaUrl(field: any): string | null {
  if (!field) return null;
  if (typeof field === 'string') {
    if (field.startsWith('http')) return field;
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed) && parsed[0]?.file?.path) return parsed[0].file.path;
    } catch (_) {}
    return null;
  }
  if (Array.isArray(field) && field[0]?.file?.path) return field[0].file.path;
  return null;
}

function parseYouTubeId(url: string | null): string | null {
  if (!url) return null;
  // Handle full URLs
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  // Handle bare IDs (11 characters, alphanumeric + underscores/dashes)
  if (url.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(url)) return url;
  return null;
}

function extractInstagramUrl(instaAccount: any): string | null {
  if (!instaAccount || typeof instaAccount !== 'object') return null;
  for (const val of Object.values(instaAccount)) {
    if (typeof val === 'string' && val.includes('instagram.com')) return val;
  }
  return null;
}

function extractYouTubeUrl(ytAccount: any): string | null {
  if (!ytAccount || typeof ytAccount !== 'object') return null;
  for (const val of Object.values(ytAccount)) {
    if (typeof val === 'string' && (val.includes('youtube.com') || val.includes('youtu.be'))) return val;
  }
  return null;
}

function parseTags(field: any): string[] {
  if (!field) return [];
  if (typeof field === 'string') {
    if (!field.trim()) return [];
    try {
      const p = JSON.parse(field);
      if (Array.isArray(p)) return p.map((t: any) => String(t).trim()).filter(Boolean);
    } catch (_) {}
    return field.split(',').map(t => t.trim()).filter(Boolean);
  }
  if (Array.isArray(field)) return field.map(t => String(t).trim()).filter(Boolean);
  return [];
}

function normalizeCategory(tags: string[], title: string, description: string): ContentCategory {
  for (const raw of tags) {
    const n = raw.trim().toLowerCase().replace(/^#/, '');
    if (TAG_TO_CATEGORY[n]) return TAG_TO_CATEGORY[n];
    for (const [key, cat] of Object.entries(TAG_TO_CATEGORY)) {
      if (n.includes(key) || key.includes(n)) return cat;
    }
  }
  const text = ((title || '') + ' ' + (description || '')).toLowerCase();
  for (const [kw, cat] of INFERENCE_PRIORITY) {
    if (text.includes(kw)) return cat;
  }
  return 'General';
}

function titleHash(title: string): string {
  return title.replace(/[^a-z0-9]/gi, '').toLowerCase().substring(0, 50);
}

function videoTypeFrom(videoUrl: string | null, youtubeId: string | null): string | null {
  if (youtubeId) return 'youtube';
  if (videoUrl?.includes('cloudinary.com')) return 'cloudinary';
  if (videoUrl) return 'unknown';
  return null;
}

// ─── Fetchers ──────────────────────────────────────────────────────────────────
async function fetchAllPages(url: string, maxPages: number): Promise<any[]> {
  const all: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ page, limit: PAGE_SIZE }),
      });
      if (!res.ok) break;
      const json = await res.json();
      const obj = Array.isArray(json) ? json[0] : json;
      const items = obj?.data || [];
      if (items.length === 0) break;
      all.push(...items);
    } catch (_) { break; }
  }
  return all;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────
function normalizeSocialPost(raw: any, seen: Map<string, string>): CleanPost | null {
  const id = String(raw.id);
  const title = (raw.title || '').trim();
  if (!title || title.length < 3) return null;

  let videoUrl = extractMediaUrl(raw.video);
  if (!videoUrl) videoUrl = extractYouTubeUrl(raw.youtube_account);
  const imageUrl = extractMediaUrl(raw.image) || extractMediaUrl(raw.thumbnailImage);
  const desc = stripHtml(raw.description || '');

  if (!videoUrl && !imageUrl && desc.length < 10) return null;

  const hash = titleHash(title);
  if (seen.has(hash)) return null;

  const youtubeId = parseYouTubeId(videoUrl);
  let thumbnailUrl = extractMediaUrl(raw.thumbnailImage) || extractMediaUrl(raw.image) || imageUrl;
  if (!thumbnailUrl && youtubeId) thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  if (!thumbnailUrl && videoUrl?.includes('cloudinary.com'))
    thumbnailUrl = videoUrl.replace('.mp4', '.jpg').replace('/upload/', '/upload/so_1/');

  const cleanTags = parseTags(raw.tags).map(t => t.replace(/^#/, '').trim()).filter(t => t.length > 1);
  const category = normalizeCategory(cleanTags, title, desc);
  const instagramUrl = extractInstagramUrl(raw.insta_account) || raw.postLink || null;
  const platforms: string[] = Array.isArray(raw.platforms) ? raw.platforms.filter(Boolean) :
    Array.isArray(raw.postedOn) ? raw.postedOn.filter(Boolean) : [];

  let date: string | null = null;
  if (raw.created_at && raw.created_at !== '0000-00-00 00:00:00') date = new Date(raw.created_at).toISOString();
  else if (raw.updated_at && raw.updated_at !== '0000-00-00 00:00:00') date = new Date(raw.updated_at).toISOString();

  seen.set(hash, id);
  return {
    id, title, category,
    subType: (SUBTYPE_MAP[raw.postSubType || ''] || 'General') as any,
    mediaType: raw.postType === 'reel' ? 'reel' : 'static',
    videoUrl: videoUrl || null,
    videoType: videoTypeFrom(videoUrl, youtubeId) as any,
    youtubeId: youtubeId || null,
    imageUrl: thumbnailUrl || null,
    descriptionPlain: desc,
    tags: cleanTags,
    instagramUrl: typeof instagramUrl === 'string' && instagramUrl.startsWith('http') ? instagramUrl : null,
    platforms, date,
  };
}

function normalizeSuccessStory(raw: any, seen: Map<string, string>): CleanPost | null {
  const id = 'ss_' + raw.id;
  const name = raw.client_details?.name || 'Anonymous';
  let weightLoss = raw.program_details?.weight_loss || raw.meta_data?.total_weight_loss;
  if (weightLoss) weightLoss = String(weightLoss).trim() + 'kgs';

  let title = `${name}'s Transformation`;
  if (weightLoss) title += ` - Lost ${weightLoss}`;

  const hash = titleHash(title);
  if (seen.has(hash)) return null;

  const desc = stripHtml(raw.short_descriptions || raw.long_descriptions || '');
  const cl = raw.meta_data?.check_list?.[0];

  let imageUrl: string | null = null;
  if (cl?.before_after_photo?.[0]?.file?.path) imageUrl = cl.before_after_photo[0].file.path;
  else if (cl?.after_photo?.[0]?.file?.path) imageUrl = cl.after_photo[0].file.path;
  else if (raw.images?.length > 0) imageUrl = extractMediaUrl(raw.images);

  let videoUrl: string | null = raw.yt_link || null;
  if (!videoUrl && cl?.testimonial_video?.[0]?.file?.path) videoUrl = cl.testimonial_video[0].file.path;

  const youtubeId = parseYouTubeId(videoUrl);
  if (!imageUrl && youtubeId) imageUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  const cleanTags = parseTags(raw.health_conditions).map(t => t.replace(/^#/, '').trim()).filter(t => t.length > 1);
  const category = normalizeCategory(cleanTags, title, desc);

  // Extract storySlug from website_link in meta_data
  const websiteLink = cl?.website_link || null;
  const storySlug = websiteLink ? websiteLink.split('/').pop() || null : raw.slug || null;

  let date: string | null = null;
  if (raw.created_at && raw.created_at !== '0000-00-00 00:00:00') date = new Date(raw.created_at).toISOString();

  seen.set(hash, id);
  return {
    id, title, category,
    subType: 'Success Story',
    mediaType: videoUrl ? 'reel' : 'static',
    videoUrl: videoUrl || null,
    videoType: videoTypeFrom(videoUrl, youtubeId) as any,
    youtubeId: youtubeId || null,
    imageUrl: imageUrl || null,
    descriptionPlain: desc,
    tags: cleanTags,
    instagramUrl: null,
    platforms: [], date,
    storySlug,
  };
}

function normalizeRecipe(raw: any, seen: Map<string, string>): CleanPost | null {
  const id = 'recipe_v2_' + raw.id;
  const title = (raw.title || '').trim();
  if (!title) return null;

  const hash = titleHash(title);
  if (seen.has(hash)) return null;

  const meta = raw.meta_data || {};
  const healthMeter = stripHtml(meta.health_meter || '');
  const method = Array.isArray(meta.method) ? meta.method.join('\n') : '';
  const ingredients = Array.isArray(raw.ingredients) ? raw.ingredients.join(', ') : '';
  let nutrition = '';
  if (meta.energy || meta.protein || meta.fat || meta.carbs) {
    nutrition = `\n\nNUTRITION INFO:\n- Energy: ${meta.energy || 0} kcal\n- Protein: ${meta.protein || 0}g\n- Fat: ${meta.fat || 0}g\n- Carbs: ${meta.carbs || 0}g\n- Fiber: ${meta.fiber || 0}g`;
  }
  const desc = `${healthMeter}\n\nINGREDIENTS:\n${ingredients}\n\nMETHOD:\n${method}${nutrition}`;

  let imageUrl: string | null = null;
  if (raw.recipe_images?.length > 0) imageUrl = raw.recipe_images[0]?.file?.path || null;
  else if (raw.recipe_thumbnail_images?.length > 0) imageUrl = raw.recipe_thumbnail_images[0]?.file?.path || null;

  const videoUrl = raw.recipe_video || null;
  const youtubeId = parseYouTubeId(videoUrl);

  const cleanTags = parseTags(raw.health_tags).map((t: string) => t.replace(/^#/, '').trim()).filter((t: string) => t.length > 1);
  const category = normalizeCategory(cleanTags, title, desc);

  const recipeSlug = raw.slug || null;
  const recipeCategoryName = raw.category || null;

  seen.set(hash, id);
  return {
    id, title, category,
    subType: 'Recipe',
    mediaType: videoUrl ? 'reel' : 'static',
    videoUrl: videoUrl || null,
    videoType: videoTypeFrom(videoUrl, youtubeId) as any,
    youtubeId: youtubeId || null,
    imageUrl: imageUrl || null,
    descriptionPlain: desc,
    tags: cleanTags,
    instagramUrl: null,
    platforms: [], date: null,
    recipeSlug, recipeCategoryName,
  };
}

// ─── Main Aggregator ───────────────────────────────────────────────────────────
async function aggregateContent(): Promise<CleanPost[]> {
  // Fetch all three sources in parallel
  const [socialRaw, storiesRaw, recipesRaw] = await Promise.all([
    fetchAllPages(`${BN_API_BASE}/social-posts/all`, 30),
    fetchAllPages(`${BN_API_BASE}/success-stories/all`, 10),
    fetchAllPages(`${BN_API_BASE}/recipe/all`, 15),
  ]);

  const seen = new Map<string, string>();
  const posts: CleanPost[] = [];

  for (const raw of socialRaw) {
    const p = normalizeSocialPost(raw, seen);
    if (p) posts.push(p);
  }
  for (const raw of storiesRaw) {
    const p = normalizeSuccessStory(raw, seen);
    if (p) posts.push(p);
  }
  for (const raw of recipesRaw) {
    const p = normalizeRecipe(raw, seen);
    if (p) posts.push(p);
  }

  return posts;
}

// ─── Route Handlers ────────────────────────────────────────────────────────────

/** GET /api/educators/content — returns cached or freshly fetched posts */
export async function GET() {
  try {
    const now = Date.now();

    // Serve from cache if still fresh
    if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json({
        posts: cache.posts,
        fetchedAt: cache.fetchedAt,
        fromCache: true,
        count: cache.posts.length,
      });
    }

    // Fetch fresh data
    const posts = await aggregateContent();
    cache = { posts, fetchedAt: now };

    return NextResponse.json({
      posts,
      fetchedAt: now,
      fromCache: false,
      count: posts.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** DELETE /api/educators/content — busts the cache (admin only via UI) */
export async function DELETE() {
  cache = null;
  return NextResponse.json({ success: true, message: 'Content cache cleared. Next request will re-fetch from BN APIs.' });
}
