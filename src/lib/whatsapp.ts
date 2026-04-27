import { CleanPost } from "@/data/social_content_clean";


export const getPostShareText = (post: CleanPost) => {
  let text = `*${post.title}*\n\n${post.descriptionPlain}\n\n`;
  
  const links: string[] = [];
  
  if (post.storySlug) {
    links.push(`Read Full Story: https://www.balancenutrition.in/testimonials/${post.storySlug}`);
  }
  
  if (post.recipeSlug) {
    const categoryPath = post.recipeCategoryName ? `${encodeURIComponent(post.recipeCategoryName)}/` : '';
    links.push(`View Recipe: https://www.balancenutrition.in/recipes/${categoryPath}${post.recipeSlug}`);
  }
  
  if (post.instagramUrl) links.push(`View Post: ${post.instagramUrl}`);
  else if (post.videoType === "youtube" && post.youtubeId) links.push(`Watch Video: https://youtube.com/watch?v=${post.youtubeId}`);
  else if (post.videoUrl) {
    const finalUrl = post.videoUrl.startsWith("http") ? post.videoUrl : `https://youtube.com/watch?v=${post.videoUrl}`;
    links.push(`Watch Video: ${finalUrl}`);
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
