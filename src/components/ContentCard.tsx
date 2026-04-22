"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, FileText, Instagram, Copy, CheckCheck, ExternalLink, ArrowRight, Send } from "lucide-react";
import { CleanPost } from "@/data/social_content_clean";
import { sendToWhatsApp, getPostShareText } from "@/lib/whatsapp";
interface ContentCardProps {
  post: CleanPost;
  clientPhone?: string;
  onClick: (post: CleanPost) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  "Weight Loss":          { bg: "bg-orange-50",   text: "text-orange-600",   bar: "bg-orange-400" },
  "PCOS":                 { bg: "bg-pink-50",     text: "text-pink-600",     bar: "bg-pink-400" },
  "Pregnancy":            { bg: "bg-rose-50",     text: "text-rose-600",     bar: "bg-rose-400" },
  "Menopause":            { bg: "bg-fuchsia-50",  text: "text-fuchsia-600",  bar: "bg-fuchsia-400" },
  "Diabetes":             { bg: "bg-amber-50",    text: "text-amber-600",    bar: "bg-amber-400" },
  "Thyroid":              { bg: "bg-violet-50",   text: "text-violet-600",   bar: "bg-violet-400" },
  "Cardiac":              { bg: "bg-red-50",      text: "text-red-600",      bar: "bg-red-400" },
  "Gut Health":           { bg: "bg-lime-50",     text: "text-lime-600",     bar: "bg-lime-400" },
  "Child Nutrition":      { bg: "bg-indigo-50",   text: "text-indigo-600",   bar: "bg-indigo-400" },
  "Gain Weight":          { bg: "bg-green-50",    text: "text-green-600",    bar: "bg-green-400" },
  "Build Muscles":        { bg: "bg-teal-50",     text: "text-teal-600",     bar: "bg-teal-400" },
  "Intermittent Fasting": { bg: "bg-cyan-50",     text: "text-cyan-600",     bar: "bg-cyan-400" },
  "Recipe":               { bg: "bg-emerald-50",  text: "text-emerald-600",  bar: "bg-emerald-400" },
  "Transformation":       { bg: "bg-blue-50",     text: "text-blue-600",     bar: "bg-blue-400" },
  "General":              { bg: "bg-gray-50",     text: "text-gray-500",     bar: "bg-gray-300" },
};

export default function ContentCard({ post, clientPhone, onClick }: ContentCardProps) {
  const [copied, setCopied] = useState(false);
  const cat = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS["General"];

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(getPostShareText(post));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const descPreview = post.descriptionPlain
    .split("\n")
    .filter(Boolean)
    .slice(0, 2)
    .join(" — ");

  let thumbnailUrl = post.imageUrl;
  const hasVideo = !!post.videoUrl || post.videoType === "youtube" || !!post.instagramUrl;

  // Fallback for video thumbnails if imageUrl is missing
  if (!thumbnailUrl) {
    if (post.videoType === "cloudinary" && post.videoUrl) {
      thumbnailUrl = post.videoUrl
        .replace(".mp4", ".jpg")
        .replace("/upload/", "/upload/so_1/"); // Get frame at 1s to avoid black first frames
    } else if (post.videoType === "youtube" && post.youtubeId) {
      thumbnailUrl = `https://img.youtube.com/vi/${post.youtubeId}/hqdefault.jpg`;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(post)}
      className="bg-white rounded-3xl border border-[#0E5858]/8 shadow-sm hover:shadow-xl hover:border-[#00B6C1]/40 transition-all cursor-pointer group overflow-hidden"
    >
      {/* ── Thumbnail ─────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden shrink-0 bg-gray-50">
        {thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt={post.title}
              className="w-full h-auto max-h-[300px] object-contain group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          <div className={`w-full aspect-video flex flex-col items-center justify-center p-6 text-center ${cat.bg}`}>
            {post.instagramUrl ? (
              <Instagram size={36} className={`${cat.text} opacity-40 mb-3`} />
            ) : hasVideo || post.platforms?.includes("youtube") ? (
              <Play size={36} className={`${cat.text} opacity-40 mb-3`} fill="currentColor" />
            ) : (
              <FileText size={36} className={`${cat.text} opacity-40 mb-3`} />
            )}
            <span className={`text-xs font-black uppercase tracking-wider ${cat.text} opacity-60 line-clamp-3 leading-relaxed drop-shadow-sm`}>
              {post.title}
            </span>
          </div>
        )}

        {/* Play overlay for video posts */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <Play size={18} className="text-[#0E5858] translate-x-0.5" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Media type badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm
            ${post.mediaType === "reel" ? "bg-blue-600/90 text-white" : "bg-white/90 text-[#0E5858]"}`}>
            {post.mediaType === "reel" ? <Play size={8} fill="currentColor" /> : <FileText size={8} />}
            {post.videoType === "youtube" ? "YouTube" : post.mediaType === "reel" ? "Reel" : "Static"}
          </span>
        </div>

        {/* Category accent bar (bottom of thumbnail) */}
        <div className={`absolute bottom-0 left-0 right-0 h-0.5 z-10 ${cat.bar}`} />
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="p-4 space-y-2.5">
        {/* Category chip */}
        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${cat.bg} ${cat.text}`}>
          {post.category}
        </span>

        {/* Title */}
        <h4 className="text-sm font-bold text-[#0E5858] leading-snug group-hover:text-[#00B6C1] transition-colors line-clamp-2">
          {post.title}
        </h4>

        {/* Description preview */}
        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 font-medium">
          {descPreview}
        </p>
      </div>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div
        className="px-4 pb-4 flex items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          {post.instagramUrl && (
            <a
              href={post.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-pink-50 hover:bg-pink-500 hover:text-white text-pink-500 flex items-center justify-center transition-all"
              title="View on Instagram"
            >
              <Instagram size={12} />
            </a>
          )}
          {post.videoType === "youtube" && post.youtubeId && (
            <a
              href={`https://www.youtube.com/watch?v=${post.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center transition-all"
              title="Watch on YouTube"
            >
              <ExternalLink size={11} />
            </a>
          )}
          <button
            onClick={handleCopy}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              copied
                ? "bg-green-100 text-green-600"
                : "bg-[#FAFCEE] text-[#0E5858]/60 hover:bg-[#0E5858] hover:text-white"
            }`}
            title="Copy description"
          >
            {copied ? <CheckCheck size={11} /> : <Copy size={11} />}
          </button>
          {clientPhone && clientPhone.length >= 10 && (
            <button
               onClick={(e) => { e.stopPropagation(); sendToWhatsApp(clientPhone, post); }}
               className="w-7 h-7 rounded-full bg-green-50 hover:bg-green-500 hover:text-white text-green-600 flex items-center justify-center transition-all"
               title="Send to WhatsApp"
            >
               <Send size={11} />
            </button>
          )}
        </div>

        {/* Open modal CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); onClick(post); }}
          className="w-7 h-7 rounded-full bg-[#FAFCEE] group-hover:bg-[#00B6C1] group-hover:text-white text-[#0E5858]/40 flex items-center justify-center transition-all"
        >
          <ArrowRight size={13} />
        </button>
      </div>
    </motion.div>
  );
}
