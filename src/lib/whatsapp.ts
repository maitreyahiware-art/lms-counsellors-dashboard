import { CleanPost } from "@/data/social_content_clean";

export const sendToWhatsApp = (phone: string, post: CleanPost) => {
  const message = encodeURIComponent(
    `*${post.title}*\n\n${post.descriptionPlain.slice(0, 500)}...\n\n` +
    `${post.instagramUrl ? `Watch: ${post.instagramUrl}` : 
       post.videoUrl ? `Watch: ${post.videoUrl}` : ''}`
  );
  window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
};
