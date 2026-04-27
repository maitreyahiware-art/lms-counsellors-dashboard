"use client";

import { motion, Variants } from "framer-motion";
import {
  Search, Users, Activity, Target, Droplets, Leaf, Heart, Sparkles,
  Video, Trophy, ClipboardList, Phone, Flame, Baby, Stethoscope,
  Lightbulb, BookOpen, Mic, TrendingUp, Dumbbell, RefreshCw
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { CleanPost, ContentCategory } from "@/data/social_content_clean";
import ContentCard from "@/components/ContentCard";
import ContentModal from "@/components/ContentModal";
import EducatorsTour from "@/components/EducatorsTour";
import { rankByRelevance, RankableItem } from "@/lib/searchRanking";

// ── Health Filter Tabs — 8 official conditions + All ────────────────────────
const HEALTH_CONDITIONS: { id: string; label: string; icon: React.ElementType; maps: string[] }[] = [
  { id: "all", label: "All Content", icon: Users, maps: [] },
  { id: "pcos", label: "PCOS", icon: Droplets, maps: ["PCOS"] },
  { id: "pregnancy", label: "Pregnancy", icon: Baby, maps: ["Pregnancy"] },
  { id: "menopause", label: "Menopause", icon: Flame, maps: ["Menopause"] },
  { id: "diabetes", label: "Diabetes", icon: Target, maps: ["Diabetes"] },
  { id: "thyroid", label: "Thyroid", icon: Activity, maps: ["Thyroid"] },
  { id: "cardiac", label: "Cardiac", icon: Heart, maps: ["Cardiac"] },
  { id: "gut", label: "Gut & GI", icon: Leaf, maps: ["Gut Health"] },
  { id: "child", label: "Child Nutrition", icon: Stethoscope, maps: ["Child Nutrition"] },
];

// ── Media Format Filter Tabs ────────────────────────────────────────────────
const MEDIA_FORMATS = [
  { id: "all", label: "All Formats" },
  { id: "video", label: "Video" },
  { id: "blog", label: "Blogs" },
  { id: "static", label: "Static" },
];

// ── Kanban Column Definitions (mapped to PostSubType) ─────────────────────
type ColumnId = "general" | "gyan" | "recipes" | "success" | "podcasts" | "challenges";

const KANBAN_COLUMNS: {
  id: ColumnId;
  title: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
  filter: (p: CleanPost) => boolean;
}[] = [
    {
      id: "general",
      title: "General",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
      description: "General posts, reads, and more",
      filter: (p) => p.subType === "General",
    },
    {
      id: "gyan",
      title: "Gyan & Tips",
      icon: Lightbulb,
      color: "text-amber-500",
      bg: "bg-amber-50",
      description: "Gyans, Did You Know, Tips",
      filter: (p) => p.subType === "Gyan" || p.subType === "Tips",
    },
    {
      id: "recipes",
      title: "Recipes",
      icon: BookOpen,
      color: "text-green-500",
      bg: "bg-green-50",
      description: "Healthy Recipes & What I Eat",
      filter: (p) => p.subType === "Recipe",
    },
    {
      id: "success",
      title: "Success Stories",
      icon: Trophy,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
      description: "Transformations & Feedback",
      filter: (p) => p.subType === "Success Story",
    },
    {
      id: "podcasts",
      title: "Podcasts",
      icon: Mic,
      color: "text-purple-500",
      bg: "bg-purple-50",
      description: "Podcast Snippets & Episodes",
      filter: (p) => p.subType === "Podcast",
    },
    {
      id: "challenges",
      title: "Challenges",
      icon: ClipboardList,
      color: "text-[#0E5858]",
      bg: "bg-[#0E5858]/10",
      description: "Day-by-day challenges",
      filter: (p) => p.subType === "Challenge",
    },
  ];

// ── Skeleton Card ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-3 border border-gray-100 animate-pulse space-y-2">
      <div className="w-full h-28 bg-gray-100 rounded-xl" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="flex gap-2 pt-1">
        <div className="h-5 w-14 bg-gray-100 rounded-full" />
        <div className="h-5 w-10 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function EducatorsModulePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeFormat, setActiveFormat] = useState("all");
  const [selectedPost, setSelectedPost] = useState<CleanPost | null>(null);
  const [clientPhone, setClientPhone] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [showTour, setShowTour] = useState(false);

  // ── Dynamic content state ──────────────────────────────────────────────
  const [allPosts, setAllPosts] = useState<CleanPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/educators/content");
      if (!res.ok) throw new Error(`Failed to load content (${res.status})`);
      const json = await res.json();
      setAllPosts(json.posts || []);
      setFetchedAt(json.fetchedAt || null);
    } catch (err: any) {
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadContent();
  }, [loadContent]);

  // Check if educators tour should be shown
  useEffect(() => {
    const pending = localStorage.getItem('educators_tour_pending');
    const completed = localStorage.getItem('educators_tour_completed');
    if (pending && !completed) {
      setShowTour(true);
    }
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // ── Last updated label ──────────────────────────────────────────────────
  const lastUpdatedLabel = useMemo(() => {
    if (!fetchedAt) return null;
    const diffMs = Date.now() - fetchedAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    if (diffMins < 2) return "just now";
    if (diffHrs < 1) return `${diffMins}m ago`;
    return `${diffHrs}h ago`;
  }, [fetchedAt]);

  // ── Active category filter mapping ───────────────────────────────────────
  const activeCondition = HEALTH_CONDITIONS.find((c) => c.id === activeTab)!;

  // ── Filtered posts: health tab + search ─────────────────────────────────
  const filteredPosts = useMemo(() => {
    let posts = [...allPosts];

    if (activeCondition.id !== "all") {
      posts = posts.filter((p) => {
        if (activeCondition.maps.length > 0 && activeCondition.maps.includes(p.category)) {
          return true;
        }
        const searchText = `${p.title} ${p.descriptionPlain} ${p.tags.join(" ")}`.toLowerCase();
        if (activeCondition.id === "transformation") {
          return p.subType === "Success Story" || searchText.includes("transformation") || searchText.includes("lost");
        }
        if (activeCondition.id === "sculpting") {
          return searchText.includes("sculpt") || searchText.includes("toning") || searchText.includes("inch loss") || searchText.includes("muscle");
        }
        if (activeCondition.id === "wellness") {
          return p.category === "General" || searchText.includes("wellness") || searchText.includes("habit") || searchText.includes("lifestyle");
        }
        return false;
      });
    }

    // 2. Format Filter
    if (activeFormat !== "all") {
      posts = posts.filter(p => {
        const isVideo = !!(p.videoUrl || p.videoType === "youtube" || p.mediaType === "reel" || (p.instagramUrl && p.instagramUrl.includes("reel")));
        const hasImage = !!p.imageUrl;
        if (activeFormat === "video") return isVideo;
        if (activeFormat === "blog") return !isVideo && hasImage;
        if (activeFormat === "static") return !isVideo && !hasImage;
        return true;
      });
    }

    // 3. Search filter + Relevance Ranking
    if (searchQuery.trim().length >= 2) {
      const q = searchQuery.toLowerCase();
      const stopWords = new Set(["i", "need", "want", "to", "something", "looking", "for", "a", "the", "in", "on", "at", "my", "me", "is", "and", "or", "some", "can", "you", "give", "show", "tell"]);
      const rawTokens = q.split(/[\s.,!?]+/).filter(t => t.length > 1 && !stopWords.has(t));

      const synMap: Record<string, string[]> = {
        "morning": ["breakfast", "morning", "wake", "tea", "coffee"],
        "eat": ["food", "recipe", "snack", "meal", "hunger", "hungry", "eat", "dinner", "lunch", "breakfast"],
        "hungry": ["food", "recipe", "snack", "meal", "hunger", "hungry", "eat"],
        "night": ["dinner", "night", "sleep", "bed"],
        "evening": ["dinner", "snack", "evening"],
        "weight": ["weight", "fat", "inches", "lose"],
        "fat": ["weight", "fat", "inches", "lose"],
        "sweet": ["sweet", "sugar", "craving", "dessert"],
        "drink": ["juice", "water", "drink", "beverage", "tea", "coffee"],
        "gut": ["gut", "acidity", "bloating", "digestion", "gastric", "constipation"],
        "heart": ["heart", "cardiac", "cholesterol", "blood pressure", "hypertension", "bp"],
        "sugar": ["sugar", "diabetes", "diabetic", "blood sugar", "insulin"],
        "hormone": ["hormone", "thyroid", "pcos", "menopause", "pregnancy"],
      };

      posts = posts.filter((p) => {
        const fullText = `${p.title} ${p.descriptionPlain} ${p.category} ${p.subType} ${p.tags.join(" ")}`.toLowerCase();
        if (fullText.includes(q)) return true;
        if (rawTokens.length > 0) {
          return rawTokens.every(token => {
            const termsToCheck = [token, ...(synMap[token] || [])];
            return termsToCheck.some(term => fullText.includes(term));
          });
        }
        return false;
      });

      const rankableItems: (CleanPost & RankableItem)[] = posts.map(p => ({
        ...p,
        description: p.descriptionPlain,
        code: p.id,
      }));
      posts = rankByRelevance(rankableItems, searchQuery).length > 0
        ? rankByRelevance(rankableItems, searchQuery) as unknown as CleanPost[]
        : posts;
    }

    return posts;
  }, [activeTab, activeFormat, searchQuery, activeCondition, allPosts]);

  // ── Posts per Kanban column ──────────────────────────────────────────────
  const getColumnPosts = useCallback(
    (col: (typeof KANBAN_COLUMNS)[0]) => filteredPosts.filter(col.filter),
    [filteredPosts]
  );

  const totalCount = filteredPosts.length;

  return (
    <>
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative p-6 lg:p-10 max-w-[1800px] mx-auto min-h-screen flex flex-col gap-8"
      >
        {/* Marquee Note */}
        <div className="w-full max-w-4xl mx-auto overflow-hidden bg-red-50 border border-red-100 py-3 rounded-2xl flex items-center mb-[-1rem] shrink-0 relative shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-red-50 to-transparent z-10"></div>
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 15, ease: "linear", repeat: Infinity }}
            className="whitespace-nowrap text-[11px] font-black uppercase tracking-[0.2em] text-red-500 whitespace-pre"
          >
            ⚠️ ONE WEEK UNTIL THE FINAL CERTIFICATION VIVA ⚠️                  ⚠️ ONE WEEK UNTIL THE FINAL CERTIFICATION VIVA ⚠️                  ⚠️ ONE WEEK UNTIL THE FINAL CERTIFICATION VIVA ⚠️
          </motion.div>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-red-50 to-transparent z-10"></div>
        </div>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.header variants={itemVariants} className="text-center max-w-4xl mx-auto shrink-0">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAFCEE] border border-[#00B6C1]/20 rounded-full text-[#00B6C1] text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles size={14} />
            <span>Educators Module</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-serif text-[#0E5858] mb-6 leading-tight">
            Content <span className="text-[#00B6C1]">CRM Library</span>
          </h1>

          {/* Live data badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {isLoading ? (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                Loading content library…
              </span>
            ) : fetchError ? (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                ⚠️ {fetchError} —
                <button onClick={loadContent} className="underline hover:text-red-600">retry</button>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Live · {totalCount} posts · updated {lastUpdatedLabel}
              </span>
            )}
          </div>

          <p className="text-gray-400 text-sm font-medium mb-8 max-w-xl mx-auto">
            {isLoading ? "Syncing content from BN servers…" : `${totalCount} posts ready to use · Search, filter by health condition and share with clients.`}
          </p>

          {/* Search */}
          <div id="edu-tour-search" className="relative group max-w-3xl mx-auto mb-6">
            <div className="absolute inset-0 bg-[#00B6C1]/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white border border-[#0E5858]/10 rounded-[2.5rem] shadow-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#FAFCEE] rounded-full flex items-center justify-center text-[#0E5858] shrink-0">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, keyword, condition — e.g. 'PCOS breakfast'"
                className="flex-1 bg-transparent border-none outline-none text-[#0E5858] font-medium placeholder:text-gray-400 text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-300 hover:text-gray-500 text-xs font-bold shrink-0"
                >
                  ✕ Clear
                </button>
              )}
              <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-[#0E5858] text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-[#00B6C1] transition-all shrink-0">
                <Sparkles size={12} /> AI Search
              </button>
            </div>
          </div>

          {/* Health condition tabs */}
          <div id="edu-tour-health-tabs" className="flex flex-wrap justify-center gap-2.5 mb-4">
            {HEALTH_CONDITIONS.map((condition) => {
              const isActive = activeTab === condition.id;
              const Icon = condition.icon;
              return (
                <button
                  key={condition.id}
                  onClick={() => setActiveTab(condition.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium ${isActive
                    ? "bg-[#0E5858] text-white border-[#0E5858] shadow-lg"
                    : "bg-white text-gray-500 border-gray-200 hover:border-[#00B6C1]/50 hover:text-[#0E5858]"
                    }`}
                >
                  <Icon size={14} className={isActive ? "text-[#00B6C1]" : "opacity-60"} />
                  {condition.label}
                </button>
              );
            })}
          </div>

          {/* Format tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {MEDIA_FORMATS.map((format) => {
              const isActive = activeFormat === format.id;
              return (
                <button
                  key={format.id}
                  onClick={() => setActiveFormat(format.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isActive
                    ? "bg-[#0E5858] text-white shadow-md"
                    : "bg-[#0E5858]/5 text-[#0E5858]/60 hover:bg-[#0E5858]/10"
                    }`}
                >
                  {format.label}
                </button>
              );
            })}
          </div>

          {/* Client WhatsApp Number Input Bar */}
          <div id="edu-tour-whatsapp" className="max-w-2xl mx-auto bg-white border border-[#0E5858]/10 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-4 justify-center">
            <div className="flex items-center gap-2 text-[#0E5858] font-bold text-sm">
              <Phone size={16} className="text-[#00B6C1]" />
              Client WhatsApp Number:
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 font-semibold">+91</span>
              <input
                type="text"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                placeholder="Enter 10-digit number"
                className="w-40 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#00B6C1] transition-all"
              />
              <button
                onClick={() => setClientPhone(tempPhone)}
                className="bg-[#00B6C1] hover:bg-[#0E5858] text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
              >
                Set
              </button>
            </div>
            {clientPhone && clientPhone.length >= 10 && (
              <div className="w-full text-center mt-2 text-xs text-green-600 font-medium">
                Currently sending to: +91 {clientPhone}
              </div>
            )}
          </div>
        </motion.header>

        {/* ── Kanban Board ──────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} id="edu-tour-columns" className="flex-1 overflow-x-auto pb-8">
          <div className="flex gap-5 min-h-[600px] items-start w-max lg:w-full">
            {KANBAN_COLUMNS.map((col) => {
              const posts = getColumnPosts(col);
              const ColIcon = col.icon;

              return (
                <div
                  key={col.id}
                  className="w-[300px] shrink-0 bg-white/60 backdrop-blur-md border border-[#0E5858]/8 rounded-[2rem] flex flex-col overflow-hidden"
                >
                  {/* Column header */}
                  <div className="p-5 border-b border-[#0E5858]/5 flex items-center gap-3 bg-white/50 shrink-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${col.bg} ${col.color}`}>
                      <ColIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#0E5858] truncate">{col.title}</h3>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        {isLoading ? "Loading…" : `${posts.length} ${posts.length === 1 ? "item" : "items"} · ${col.description}`}
                      </p>
                    </div>
                  </div>

                  {/* Column cards */}
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 max-h-[72vh]" style={{ scrollbarWidth: "thin" }}>
                    {isLoading ? (
                      // Skeleton loader
                      Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                    ) : posts.length === 0 ? (
                      <div className="h-48 flex flex-col items-center justify-center text-center p-4 opacity-40">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-gray-300">
                          <Search size={20} />
                        </div>
                        <p className="text-[11px] font-bold text-[#0E5858] uppercase tracking-widest mb-1">
                          {searchQuery ? "No matches" : "No content"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                          {searchQuery
                            ? "Try a different keyword or clear the search."
                            : `No ${col.title.toLowerCase()} in this category.`}
                        </p>
                      </div>
                    ) : (
                      posts.map((post) => (
                        <ContentCard
                          key={post.id}
                          post={post}
                          clientPhone={clientPhone}
                          onClick={setSelectedPost}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.main>

      {/* ── Educators Walkthrough Tour ───────────────────────────────── */}
      {showTour && (
        <EducatorsTour onComplete={() => setShowTour(false)} />
      )}

      {/* ── Content Modal ──────────────────────────────────────────────── */}
      {selectedPost && (
        <ContentModal
          post={selectedPost}
          clientPhone={clientPhone}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}
