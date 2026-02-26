"use client";

import {
  ArrowRight,
  Trophy,
  Clock,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  Sparkles,
  Target,
  User,
  Activity,
  Share2,
  Layers,
  Leaf,
  Briefcase,
  ListChecks,
  ShoppingBag,
  Globe,
  Phone,
  Mail,
  X,
  ExternalLink,
  Info,
  MessageSquare,
  Bell,
  Send,
  XCircle,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { syllabusData } from "@/data/syllabus";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import DashboardTour from "@/components/DashboardTour";

export default function Home() {
  const router = useRouter();
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [userStats, setUserStats] = useState({ progress: 0, avgScore: 0, quizzes: 0 });
  const [lastModule, setLastModule] = useState<{ id: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [trainingBuddy, setTrainingBuddy] = useState<string>("");
  const [dynamicContent, setDynamicContent] = useState<any[]>([]);
  const [allMentors, setAllMentors] = useState<any[]>([]);
  const [showBuddyModal, setShowBuddyModal] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Email Modal States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    message: "",
    userName: ""
  });
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailError, setEmailError] = useState("");


  useEffect(() => {
    const fetchPersonalStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      setUserId(session.user.id);
      setUserName(session.user.user_metadata?.full_name || "Counsellor");

      // 0. Fetch Profile for Training Buddy
      const { data: profile } = await supabase
        .from('profiles')
        .select('training_buddy')
        .eq('id', session.user.id)
        .single();

      if (profile?.training_buddy) {
        setTrainingBuddy(profile.training_buddy);
      }

      // 1. Fetch Dynamic Content Metadata (to count total topics)
      const { data: dynContent } = await supabase
        .from('syllabus_content')
        .select('id, module_id');

      const dynamicCount = dynContent?.length || 0;
      setDynamicContent(dynContent || []);

      // 2. Fetch Assessment Scores
      const { data: assessments } = await supabase
        .from('assessment_logs')
        .select('*')
        .eq('user_id', session.user.id);

      // 3. Fetch Detailed Topic Progress
      const { data: topicProgress, error: tpError } = await supabase
        .from('mentor_progress')
        .select('topic_code')
        .eq('user_id', session.user.id);

      const completedTopicCodes = new Set(topicProgress?.map(p => p.topic_code) || []);
      const dbCompletedModules: string[] = [];
      const dynamicArray = dynContent || [];

      // Calculate which modules are done based on syllabus (static) + dynamic topics
      syllabusData.filter(m => m.id !== 'resource-bank').forEach(module => {
        const dynamicForModule = dynamicArray.filter(d => d.module_id === module.id);

        const staticTopicsDone = module.topics.every(t => completedTopicCodes.has(t.code));
        const dynamicTopicsDone = dynamicForModule.every(d => completedTopicCodes.has(`DYN-${d.id}`));

        const hasContent = module.topics.length > 0 || dynamicForModule.length > 0;
        if (hasContent && staticTopicsDone && dynamicTopicsDone) {
          dbCompletedModules.push(module.id);
        }
      });

      setCompletedModules(dbCompletedModules);

      // Stats Calculation
      const totalSyllabusTopics = syllabusData
        .filter(m => m.id !== 'resource-bank')
        .reduce((acc, m) => acc + m.topics.length, 0);

      const totalTopics = totalSyllabusTopics + dynamicCount;
      const progressPercent = totalTopics > 0 ? Math.round((completedTopicCodes.size / totalTopics) * 100) : 0;

      const avgScore = (assessments || []).length > 0
        ? Math.round((assessments || []).reduce((acc, curr) => acc + curr.score, 0) / (assessments || []).length * 20) // Assuming scores out of 5
        : 0;

      setUserStats({
        progress: progressPercent,
        avgScore,
        quizzes: (assessments || []).length
      });

      // 4. Resolve Trainer Buddy Details
      let mentorData: any[] = [];
      if (profile?.training_buddy) {
        let emails = [];
        try {
          const parsed = JSON.parse(profile.training_buddy);
          mentorData = (Array.isArray(parsed) ? parsed : [parsed]).map(v => ({
            full_name: v.full_name || v.name || "Training Buddy",
            email: v.email || "",
            phone: v.phone || "",
            role: v.role || "Training Mentor"
          }));
        } catch (e) {
          emails = profile.training_buddy.split(',').map((e: string) => e.trim());
          const { data: mentors } = await supabase
            .from('profiles')
            .select('full_name, email, role, phone')
            .in('email', emails);
          mentorData = (mentors || []).map(m => ({
            full_name: m.full_name,
            email: m.email,
            phone: m.phone,
            role: m.role || 'Training Mentor'
          }));
        }
      }

      setAllMentors(mentorData);

      // 5. Fetch Last Activity to determine Resume Module
      const { data: lastLog } = await supabase
        .from('mentor_activity_logs')
        .select('module_id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let targetModule = null;
      if (lastLog?.module_id && lastLog.module_id !== 'System') {
        const mod = syllabusData.find(m => m.id === lastLog.module_id);
        if (mod) targetModule = { id: mod.id, title: mod.title };
      }

      // If no activity or invalid module, find first incomplete module
      if (!targetModule) {
        const firstIncomplete = syllabusData.find(m => !dbCompletedModules.includes(m.id));
        if (firstIncomplete) {
          targetModule = { id: firstIncomplete.id, title: firstIncomplete.title };
        } else {
          // All complete? Link to first
          targetModule = { id: syllabusData[0].id, title: syllabusData[0].title };
        }
      }
      setLastModule(targetModule);

      // 6. Fetch Activity Logs
      const { data: logs } = await supabase
        .from('mentor_activity_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(6);
      setActivityLogs(logs || []);

      // 7. Fetch Notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (notifs) {
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      }

      setLoading(false);
    };
    fetchPersonalStats();
  }, [router]);

  const handleSendEmail = async () => {
    setSendingEmail(true);
    setEmailError("");
    setEmailSuccess("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired");

      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(emailForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");

      setEmailSuccess("Email dispatched successfully.");
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailSuccess("");
      }, 2000);
    } catch (err: any) {
      setEmailError(err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFCEE]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0E5858]/10 border-t-[#00B6C1] rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-[#0E5858]/30 uppercase tracking-[0.2em]">Synchronizing Your Dashboard...</p>
        </div>
      </div>
    );
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };


  return (
    <main className="min-h-screen bg-[#FAFCEE] p-6 lg:p-12 relative overflow-hidden">
      {userId && <DashboardTour userId={userId} onComplete={() => { }} />}
      {/* Premium Background Blobs */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#00B6C1]/5 rounded-full blur-[120px] -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FFCC00]/5 rounded-full blur-[100px] -z-10"></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#0E5858] text-white text-[10px] font-black uppercase tracking-widest rounded-lg">BN Internal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B6C1] animate-pulse"></span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-serif text-[#0E5858] leading-none mb-4">
              Welcome back, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0E5858] to-[#00B6C1]">{userName}</span>
            </h1>
            <p className="text-gray-400 font-medium max-w-md italic">Maintain clinical precision and document your progress.</p>
          </motion.div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#0E5858] shadow-sm border border-[#0E5858]/5 hover:shadow-xl transition-all relative group"
              >
                <Bell size={24} className="group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-[#00B6C1] text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-[#FAFCEE] shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-[#0E5858]/5 z-[110] overflow-hidden"
                  >
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-[#FAFCEE]/50">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#0E5858]">Notifications</h4>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {notifications.length > 0 ? notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${n.is_read ? 'bg-white border-gray-50' : 'bg-[#FAFCEE] border-[#00B6C1]/20 shadow-sm'}`}
                          onClick={async () => {
                            if (!n.is_read) {
                              await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
                              setNotifications(notifications.map(item => item.id === n.id ? { ...item, is_read: true } : item));
                              setUnreadCount(prev => Math.max(0, prev - 1));
                            }
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {n.type === 'alert' || n.type === 'warning' ? <Info size={12} className="text-red-500" /> : <Sparkles size={12} className="text-[#00B6C1]" />}
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0E5858] truncate">{n.title}</h5>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{n.message}</p>
                          <p className="text-[8px] text-gray-300 font-bold uppercase tracking-[0.1em] mt-2">{new Date(n.created_at).toLocaleDateString()}</p>
                        </div>
                      )) : (
                        <div className="py-12 text-center opacity-30">
                          <Bell size={32} className="mx-auto mb-3" />
                          <p className="text-[9px] font-black uppercase tracking-widest">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {allMentors.length > 0 && (
              <div className="flex items-center gap-3">
                {allMentors[0]?.phone && (
                  <a
                    href={`https://wa.me/${(allMentors[0]?.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hi! I'm currently on my *BN Academy Dashboard*.\n\nCurrent Progress: ${userStats.progress}%\nTests Taken: ${userStats.quizzes}\nAverage Score: ${userStats.avgScore}%\n\nCan you please help me with some queries?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#25D366] shadow-sm border border-[#0E5858]/5 hover:bg-[#25D366] hover:text-white hover:shadow-xl hover:-translate-y-1 transition-all group"
                    title={`WhatsApp ${allMentors[0].full_name}`}
                  >
                    <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
                  </a>
                )}
                <button
                  onClick={() => {
                    setEmailForm({
                      to: allMentors[0]?.email,
                      subject: "Inquiry from Academy Counsellor",
                      message: `Hi ${allMentors[0]?.full_name},\n\nI need some help regarding...`,
                      userName: allMentors[0]?.full_name
                    });
                    setIsEmailModalOpen(true);
                  }}
                  className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#0E5858] shadow-sm border border-[#0E5858]/5 hover:bg-[#0E5858] hover:text-white hover:shadow-xl hover:-translate-y-1 transition-all group"
                  title={`Email ${allMentors[0]?.full_name}`}
                >
                  <Mail size={24} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Top Stats Cards */}
        <header id="tour-stats" className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowBuddyModal(true)}
              className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-[#0E5858]/5 flex items-center gap-4 min-w-[170px] hover:border-[#00B6C1]/30 hover:shadow-md transition-all text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#00B6C1]/10 text-[#00B6C1] flex items-center justify-center">
                <Briefcase size={18} />
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Training Buddy</p>
                <div className="flex items-center gap-1">
                  <p className="text-lg font-serif text-[#0E5858] truncate max-w-[100px]">
                    {allMentors.length > 0 ? (allMentors.length > 1 ? `${allMentors.length} Mentors` : allMentors[0].full_name.split(' ')[0]) : 'Unassigned'}
                  </p>
                  <Info size={10} className="text-[#00B6C1]" />
                </div>
              </div>
            </button>
            <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-[#0E5858]/5 flex items-center gap-4 min-w-[170px]">
              <div className="w-10 h-10 rounded-2xl bg-[#00B6C1]/10 text-[#00B6C1] flex items-center justify-center">
                <Trophy size={18} />
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Mastery Score</p>
                <p className="text-lg font-serif text-[#0E5858]">{userStats.avgScore}%</p>
              </div>
            </div>
            <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-[#0E5858]/5 flex items-center gap-4 min-w-[170px]">
              <div className="w-10 h-10 rounded-2xl bg-[#FFCC00]/10 text-[#FFCC00] flex items-center justify-center">
                <Activity size={18} />
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tests Taken</p>
                <p className="text-lg font-serif text-[#0E5858]">{userStats.quizzes}</p>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Hero Section: Progress Tracking */}
        <motion.section variants={itemVariants} className="mb-12">
          <div className="relative isolate group p-8 lg:p-12 bg-[#0E5858] rounded-[3.5rem] shadow-3xl shadow-[#0E5858]/30 overflow-hidden text-white">
            <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-[#00B6C1]/10 rounded-full blur-[100px] -z-10 group-hover:scale-110 transition-transform duration-1000"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00B6C1]/20 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
                  <Sparkles size={12} className="text-[#00B6C1]" />
                  Session Highlight
                </div>
                <h2 className="text-5xl lg:text-6xl font-serif mb-6 leading-tight">Master the Art of <br />Counselling</h2>
                <button
                  onClick={() => router.push(`/modules/${lastModule?.id || 'module-1'}`)}
                  className="px-8 py-4 bg-[#00B6C1] text-[#0E5858] rounded-2xl font-bold shadow-2xl hover:bg-white transition-all flex items-center gap-3 group/btn"
                >
                  {completedModules.includes(lastModule?.id || '') ? 'Review' : 'Resume'} {lastModule?.title || 'Training'}
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs font-medium text-white/60 mb-1">Current Mastery Progress</p>
                    <h3 className="text-4xl font-serif">{userStats.progress}%</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-widest">{completedModules.length}/{syllabusData.filter(m => m.id !== 'resource-bank').length} Modules</p>
                  </div>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${userStats.progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#00B6C1] to-[#FFCC00]"
                  ></motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Training Support & Activity Trail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Quick Access: Training Support */}
          <motion.section id="tour-buddy" variants={itemVariants} className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-serif text-[#0E5858]">Training Support</h3>
              <div className="h-0.5 flex-1 bg-gray-100 mx-6 opacity-50" />
              <button onClick={() => setShowBuddyModal(true)} className="text-[10px] font-black text-[#00B6C1] uppercase tracking-widest hover:underline transition-all">View All</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allMentors.slice(0, 4).map((mentor, i) => (
                <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-[#0E5858]/5 shadow-sm hover:shadow-xl hover:shadow-[#0E5858]/5 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#FAFCEE] rounded-2xl flex items-center justify-center text-[#0E5858] font-black text-lg border border-[#0E5858]/5 group-hover:bg-[#0E5858] group-hover:text-white transition-colors">
                      {mentor.full_name?.[0] || 'B'}
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-bold text-[#0E5858] mb-0.5">{mentor.full_name}</h4>
                      <p className="text-[9px] font-bold text-[#00B6C1] uppercase tracking-widest opacity-70">{mentor.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${mentor.phone}`} className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0E5858] hover:bg-white hover:shadow-sm transition-all">
                      <Phone size={14} />
                    </a>
                    {mentor.phone && (
                      <a href={`https://wa.me/${mentor.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-white hover:shadow-sm transition-all">
                        <MessageSquare size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setEmailForm({
                          to: mentor.email,
                          subject: "Inquiry from Academy Counsellor",
                          message: `Hi ${mentor.full_name},\n\nI had a question regarding the training...`,
                          userName: mentor.full_name
                        });
                        setIsEmailModalOpen(true);
                      }}
                      className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0E5858] hover:bg-white hover:shadow-sm transition-all"
                      title="Compose Email"
                    >
                      <Mail size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Activity Trail */}
          <motion.section variants={itemVariants} className="bg-white p-8 rounded-[3.5rem] border border-[#0E5858]/5 shadow-sm overflow-hidden flex flex-col h-full">
            <h3 className="text-xl font-serif text-[#0E5858] mb-6 flex items-center gap-3">
              <Activity size={20} className="text-[#00B6C1]" />
              Activity Trail
            </h3>
            <div className="space-y-6 overflow-y-auto pr-2 scrollbar-hide flex-grow">
              {activityLogs.length > 0 ? activityLogs.map((log, i) => (
                <div key={log.id} className="relative pl-6 pb-2 group">
                  {i !== activityLogs.length - 1 && (
                    <div className="absolute left-[3px] top-4 bottom-0 w-[1px] bg-gray-100 group-last:hidden" />
                  )}
                  <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#00B6C1] ring-4 ring-[#00B6C1]/10" />
                  <div>
                    <p className="text-[11px] font-bold text-[#0E5858] leading-tight mb-1">
                      {log.activity_type.replace('_', ' ')}: <span className="text-gray-400">{log.content_title || log.topic_code}</span>
                    </p>
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">
                      {new Date(log.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                  <Clock size={40} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Activity...</p>
                </div>
              )}
            </div>
          </motion.section>
        </div>

        {/* Modules Grid */}
        <motion.section id="tour-modules" variants={itemVariants}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-serif text-[#0E5858]">Expertise Modules</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Self-Paced Training Modules</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {syllabusData.filter(m => m.id !== 'resource-bank').map((module, index) => {
              const isCompleted = completedModules.includes(module.id);
              return (
                <motion.div
                  key={module.id}
                  whileHover={{ y: -8 }}
                  onClick={() => router.push(`/modules/${module.id}`)}
                  className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-transparent hover:border-[#00B6C1]/20 transition-all cursor-pointer group flex flex-col justify-between min-h-[300px]"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-[#FAFCEE] rounded-2xl flex items-center justify-center text-[#0E5858] group-hover:bg-[#0E5858] group-hover:text-white transition-all duration-500">
                        <BookOpen size={24} />
                      </div>
                      {isCompleted && (
                        <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Complete
                        </div>
                      )}
                    </div>

                    <h4 className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em] mb-2">Module {index + 1}</h4>
                    <h3 className="text-xl font-serif text-[#0E5858] mb-4 group-hover:text-[#00B6C1] transition-colors">{module.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{module.description}</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <ListChecks size={12} />
                        {module.topics.length + (dynamicContent.filter((d: any) => d.module_id === module.id).length || 0)} Sections
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 group-hover:bg-[#00B6C1] group-hover:border-transparent group-hover:text-white transition-all">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Modal: Training Buddies */}
        <AnimatePresence>
          {showBuddyModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowBuddyModal(false)}
                className="absolute inset-0 bg-[#0E5858]/40 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-3xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8">
                  <button onClick={() => setShowBuddyModal(false)} className="text-gray-300 hover:text-[#0E5858] transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <header className="mb-10">
                  <div className="w-16 h-16 bg-[#0E5858] rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-xl">
                    <User size={28} />
                  </div>
                  <h3 className="text-4xl font-serif text-[#0E5858]">Training Buddies</h3>
                  <p className="text-sm text-gray-400 font-medium italic mt-2">Connecting you with mentors for guidance.</p>
                </header>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                  {allMentors.length > 0 ? allMentors.map((mentor, i) => (
                    <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 group flex items-center justify-between hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all">
                      <div>
                        <h4 className="text-lg font-serif text-[#0E5858] mb-0.5">{mentor.full_name}</h4>
                        <p className="text-[9px] font-black text-[#00B6C1] uppercase tracking-[0.2em]">{mentor.role}</p>
                      </div>
                      <div className="flex gap-2">
                        {mentor.phone && (
                          <a href={`https://wa.me/${mentor.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-xl text-gray-400 hover:text-green-500 hover:shadow-md transition-all">
                            <MessageSquare size={16} />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setEmailForm({
                              to: mentor.email,
                              subject: "Learning Support Request",
                              message: `Hi ${mentor.full_name},\n\n`,
                              userName: mentor.full_name
                            });
                            setIsEmailModalOpen(true);
                          }}
                          className="p-3 bg-white rounded-xl text-gray-400 hover:text-[#0E5858] hover:shadow-md transition-all"
                          title="Compose Email"
                        >
                          <Mail size={16} />
                        </button>
                        <a href={`tel:${mentor.phone || '#'}`} className={`p-3 bg-white rounded-xl ${mentor.phone ? 'text-gray-400 hover:text-[#00B6C1]' : 'text-gray-200 cursor-not-allowed'} hover:shadow-md transition-all`}>
                          <Phone size={16} />
                        </a>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-gray-400 italic py-10">No mentors assigned yet.</p>
                  )}
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100 flex items-center gap-4 text-gray-400">
                  <Info size={16} />
                  <p className="text-[10px] font-medium leading-relaxed">Contact your assigned buddy for training questions or process clarifications.</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>


      {/* Email Dispatcher Modal */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <div className="fixed inset-0 bg-[#0E5858]/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-xl w-full shadow-3xl relative overflow-hidden"
            >
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="absolute top-8 right-8 text-gray-300 hover:text-[#0E5858] transition-colors"
              >
                <XCircle size={24} />
              </button>

              <div className="mb-8">
                <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em] mb-2">Internal Academy Support</p>
                <h3 className="text-3xl font-serif text-[#0E5858]">Compose Message</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">To Buddy</label>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-bold text-[#0E5858]">
                    {emailForm.to}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Subject</label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#00B6C1]/10 text-[#0E5858]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Message</label>
                  <textarea
                    rows={6}
                    value={emailForm.message}
                    onChange={e => setEmailForm({ ...emailForm, message: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-medium outline-none h-40 resize-none focus:ring-2 focus:ring-[#00B6C1]/10 text-[#0E5858]"
                    placeholder="Describe your query or progress..."
                  />
                </div>

                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="w-full py-5 bg-[#0E5858] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#00B6C1] transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  {sendingEmail ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Send Message</>}
                </button>

                {emailSuccess && <p className="text-green-500 text-[9px] font-black text-center uppercase tracking-widest animate-pulse">{emailSuccess}</p>}
                {emailError && <p className="text-red-500 text-[9px] font-black text-center uppercase tracking-widest">{emailError}</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
