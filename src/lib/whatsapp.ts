import { CleanPost } from "@/data/social_content_clean";

const getOptimizedPreviewUrl = (post: CleanPost) => {
  let url = post.imageUrl;
  let isVideo = false;
  
  if (!url && post.videoUrl && post.videoType === "cloudinary") {
    url = post.videoUrl;
    isVideo = true;
  }

  if (!url) return null;

  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    if (isVideo && url.endsWith(".mp4")) {
      return url.replace(".mp4", ".jpg").replace("/upload/", "/upload/w_800,q_auto,so_1/");
    }
    return url.replace("/upload/", "/upload/w_800,q_auto/");
  }
  
  return url;
};

export const getPostShareText = (post: CleanPost) => {
  let text = `*${post.title}*\n\n${post.descriptionPlain}\n\n`;
  
  const links: string[] = [];
  
  if (post.storySlug) {
    links.push(`Read Full Story: https://www.balancenutrition.in/success-stories/${post.storySlug}`);
  }
  
  if (post.recipeSlug) {
    links.push(`View Recipe: https://www.balancenutrition.in/recipes/${post.recipeSlug}`);
  }
  
  if (post.instagramUrl) links.push(`View Post: ${post.instagramUrl}`);
  else if (post.videoType === "youtube" && post.youtubeId) links.push(`Watch Video: https://youtube.com/watch?v=${post.youtubeId}`);
  else if (post.videoUrl) links.push(`Watch Video: ${post.videoUrl}`);
  
  const previewUrl = getOptimizedPreviewUrl(post);
  if (previewUrl && previewUrl !== post.videoUrl) {
    links.push(`Preview Image: ${previewUrl}`);
  }
  
  if (links.length > 0) {
    text += `🔗 *Attached Media & Links:*\n` + links.join("\n");
  }
  
  return text.trim();
};

export const sendToWhatsApp = (phone: string, post: CleanPost) => {
  const message = encodeURIComponent(getPostShareText(post));
  window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
};
