"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Instagram, Copy, CheckCheck, ExternalLink, Play,
  Calendar, Tag, Globe, Video, FileText, ChevronDown, ChevronUp, Send
} from "lucide-react";
import { CleanPost } from "@/data/social_content_clean";
import { sendToWhatsApp, getPostShareText } from "@/lib/whatsapp";

interface ContentModalProps {
  post: CleanPost;
  clientPhone?: string;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Weight Loss":          { bg: "bg-orange-50",   text: "text-orange-600",   border: "border-orange-200" },
  "PCOS":                 { bg: "bg-pink-50",     text: "text-pink-600",     border: "border-pink-200" },
  "Pregnancy":            { bg: "bg-rose-50",     text: "text-rose-600",     border: "border-rose-200" },
  "Menopause":            { bg: "bg-fuchsia-50",  text: "text-fuchsia-600",  border: "border-fuchsia-200" },
  "Diabetes":             { bg: "bg-amber-50",    text: "text-amber-600",    border: "border-amber-200" },
  "Thyroid":              { bg: "bg-violet-50",   text: "text-violet-600",   border: "border-violet-200" },
  "Cardiac":              { bg: "bg-red-50",      text: "text-red-600",      border: "border-red-200" },
  "Gut Health":           { bg: "bg-lime-50",     text: "text-lime-600",     border: "border-lime-200" },
  "Child Nutrition":      { bg: "bg-indigo-50",   text: "text-indigo-600",   border: "border-indigo-200" },
  "Gain Weight":          { bg: "bg-green-50",    text: "text-green-600",    border: "border-green-200" },
  "Build Muscles":        { bg: "bg-teal-50",     text: "text-teal-600",     border: "border-teal-200" },
  "Intermittent Fasting": { bg: "bg-cyan-50",     text: "text-cyan-600",     border: "border-cyan-200" },
  "Recipe":               { bg: "bg-emerald-50",  text: "text-emerald-600",  border: "border-emerald-200" },
  "Transformation":       { bg: "bg-blue-50",     text: "text-blue-600",     border: "border-blue-200" },
  "General":              { bg: "bg-gray-50",     text: "text-gray-600",     border: "border-gray-200" },
};

export default function ContentModal({ post, clientPhone, onClose }: ContentModalProps) {
  const [copied, setCopied] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cat = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS["General"];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getPostShareText(post));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = post.date
    ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(post.date))
    : null;

  const descLines = post.descriptionPlain.split("\n").filter(Boolean);
  const isLong = descLines.length > 6;
  const visibleLines = descExpanded ? descLines : descLines.slice(0, 6);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
        >
          {/* ── Media Area ──────────────────────────────────────────────── */}
          <div className="relative w-full bg-[#0E5858]/5 shrink-0">
            {post.videoType === "youtube" && post.youtubeId ? (
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${post.youtubeId}?autoplay=0&rel=0`}
                  title={post.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : post.videoType === "cloudinary" && post.videoUrl ? (
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src={post.videoUrl}
                  controls
                  playsInline
                  poster={post.imageUrl ?? undefined}
                />
              </div>
            ) : post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full max-h-72 object-cover"
              />
            ) : (
              <div className={`w-full h-48 flex flex-col items-center justify-center p-6 text-center ${cat.bg}`}>
                {post.instagramUrl ? (
                  <Instagram size={48} className={`${cat.text} opacity-40 mb-3`} />
                ) : post.videoType === "youtube" || post.videoUrl || post.mediaType === "reel" ? (
                  <Play size={48} className={`${cat.text} opacity-40 mb-3`} fill="currentColor" />
                ) : (
                  <FileText size={48} className={`${cat.text} opacity-40 mb-3`} />
                )}
                <span className={`text-sm font-black uppercase tracking-wider ${cat.text} opacity-60 leading-relaxed drop-shadow-sm`}>
                  {post.title}
                </span>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
            >
              <X size={18} />
            </button>

            {/* Media Type Badge */}
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm
                ${post.mediaType === "reel" ? "bg-blue-600 text-white" : "bg-white/90 text-[#0E5858]"}`}>
                {post.mediaType === "reel" ? <><Play size={10} fill="currentColor" /> Reel</> : <><FileText size={10} /> Static</>}
              </span>
            </div>
          </div>

          {/* ── Content Area ─────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Header row */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {/* Category chip */}
                <span className={`inline-block mb-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cat.bg} ${cat.text} ${cat.border}`}>
                  {post.category}
                </span>
                <h2 className="text-xl font-bold text-[#0E5858] leading-snug">{post.title}</h2>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-medium">
              {formattedDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} /> {formattedDate}
                </span>
              )}
              {post.platforms.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Globe size={12} /> {post.platforms.join(", ")}
                </span>
              )}
              {post.videoType === "youtube" && (
                <span className="flex items-center gap-1.5 text-red-400">
                  <Video size={12} /> YouTube
                </span>
              )}
              {post.videoType === "cloudinary" && (
                <span className="flex items-center gap-1.5 text-[#00B6C1]">
                  <Video size={12} /> Cloudinary
                </span>
              )}
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-[#FAFCEE] text-[#0E5858]/60 border border-[#0E5858]/10 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <Tag size={9} /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Description */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Description</p>
              <div className="text-sm text-[#0E5858]/80 leading-relaxed space-y-1.5">
                {visibleLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              {isLong && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#00B6C1] hover:text-[#0E5858] transition-colors"
                >
                  {descExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show full description</>}
                </button>
              )}
            </div>
          </div>

          {/* ── Action Footer ─────────────────────────────────────────────── */}
          <div className="p-4 border-t border-gray-100 bg-[#FAFCEE]/50 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {post.instagramUrl && (
                <a
                  href={post.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                >
                  <Instagram size={13} /> View on Instagram
                </a>
              )}
              {post.videoType === "youtube" && post.youtubeId && (
                <a
                  href={`https://www.youtube.com/watch?v=${post.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                >
                  <ExternalLink size={13} /> YouTube
                </a>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                  copied
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-[#0E5858] text-white hover:bg-[#00B6C1]"
                }`}
              >
                {copied ? <><CheckCheck size={13} /> Copied!</> : <><Copy size={13} /> Copy Text</>}
              </button>
              
              {clientPhone && clientPhone.length >= 10 && (
                <button
                  onClick={() => sendToWhatsApp(clientPhone, post)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-full text-xs font-bold hover:bg-green-600 transition-all shadow-sm"
                >
                  <Send size={13} /> Send text via WhatsApp
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
