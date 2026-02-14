
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, Zap, Trophy, Send, Sparkles, Heart, MessageCircle, 
  Plus, Bot, Stars, Search, Menu, X, Flame, Share2, 
  Edit3, Layout, Calculator, User, Award, Users, Settings,
  CheckCircle2, Crown, Ghost, BookOpen, GraduationCap,
  LogOut, ArrowRight, Bell, Clock, BrainCircuit, Target, 
  ThumbsUp, Smile, MoreHorizontal, ThumbsDown, Scale,
  ChevronRight, Calendar, LayoutGrid, FireExtinguisher,
  ShieldCheck, Globe, Facebook, Key, MessageSquare, Compass, 
  Star, CheckCircle, BarChart3, ListTodo, Rocket, Shield,
  RefreshCw, AlertTriangle, Grid3X3, Gem
} from 'lucide-react';
import { UserProfile, AppTab, LoginMethod, DailyQuest, QuestType } from './types';
import { getLevelInfo, BADGES } from './constants';
import Feed from './components/Feed';
import AITutor from './components/AITutor';
import FocusZone from './components/FocusZone';
import QuizArena from './components/QuizArena';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import StudyTools from './components/StudyTools';
import MissionControl from './components/MissionControl';

const INITIAL_QUESTS: DailyQuest[] = [
  { id: 'q1', type: 'focus_time', text: 'Học tập trung 15 phút (Anh/Toán)', target: 15, current: 0, reward: 100, gems: 20, isClaimed: false },
  { id: 'q2', type: 'quiz_correct', text: 'Giải đúng 10 câu trắc nghiệm', target: 10, current: 0, reward: 150, gems: 30, isClaimed: false },
  { id: 'q3', type: 'ai_interaction', text: 'Hỏi Gia sư AI 3 câu hỏi', target: 3, current: 0, reward: 50, gems: 10, isClaimed: false }
];

const App: React.FC = () => {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FEED);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [levelUpModal, setLevelUpModal] = useState<string | null>(null); // Stores new title if leveled up

  // --- TOAST SYSTEM ---
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // --- DATA PERSISTENCE ---
  useEffect(() => {
    const saved = localStorage.getItem('studygram_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Streak Logic Check
        const lastLogin = parsed.lastLogin ? new Date(parsed.lastLogin).toDateString() : '';
        const today = new Date().toDateString();
        
        let welcomeMsg = "";
        
        if (lastLogin !== today) {
           const d1 = new Date(parsed.lastLogin || 0);
           const d2 = new Date();
           const diff = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
           
           // New Day Reset Logic
           parsed.dailyQuests = INITIAL_QUESTS; 
           welcomeMsg = "Nhiệm vụ ngày mới đã sẵn sàng! ☀️";
           
           if (diff > 1 && diff < 30000) { // Lost streak
              parsed.streak = 1;
              welcomeMsg = "Rất tiếc, bạn đã mất chuỗi Streak! Hãy bắt đầu lại!";
           } else if (diff === 1) { // Keep streak
              parsed.streak += 1;
              welcomeMsg = `Tuyệt vời! Chuỗi Streak ${parsed.streak} ngày rực lửa! 🔥`;
           }
           parsed.lastLogin = Date.now();
        }
        setUserData(parsed);
        if (welcomeMsg) setTimeout(() => showToast(welcomeMsg, 'success'), 1000);
      } catch (e) { console.error("Data error", e); }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userData) {
      localStorage.setItem('studygram_user', JSON.stringify(userData));
      checkBadges(userData);
    }
  }, [userData]);

  const handleAuth = (name: string) => {
    const newUser: UserProfile = {
      uid: 'u-' + Math.random().toString(36).slice(2, 7),
      name: name || 'Học giả Ẩn danh',
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${name}${Date.now()}`,
      exp: 0, 
      gems: 50, // Starting gems
      bio: 'Sẵn sàng chinh phục tri thức!', joinedAt: Date.now(),
      streak: 1, lives: 5, streakShields: 0, completedQuizzes: 0,
      dailyQuests: INITIAL_QUESTS,
      badges: [],
      skills: { criticalThinking: 10, focus: 10, creativity: 10, knowledge: 10, discipline: 10 },
      weakPoints: [],
      lastLogin: Date.now()
    };
    setUserData(newUser);
    showToast(`Chào mừng ${newUser.name}!`, 'success');
  };

  const checkLevelUp = (oldExp: number, newExp: number) => {
    const oldLevel = getLevelInfo(oldExp);
    const newLevel = getLevelInfo(newExp);
    if (newLevel.title !== oldLevel.title) {
      setLevelUpModal(newLevel.title);
      // Play sound or confetti here
      if (window.confetti) window.confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
    }
  };

  const addExp = (amount: number) => {
    if (userData) {
      const newExp = userData.exp + amount;
      checkLevelUp(userData.exp, newExp);
      setUserData(prev => prev ? { ...prev, exp: newExp } : null);
      if (amount > 0) showToast(`+${amount} EXP`, 'success');
    }
  };

  const handleQuestProgress = (type: QuestType, amount: number) => {
    if (!userData) return;
    setUserData(prev => {
      if (!prev) return null;
      const newQuests = prev.dailyQuests.map(q => {
        if (q.type === type && !q.isClaimed) {
          const newCurrent = Math.min(q.current + amount, q.target);
          if (newCurrent === q.target && q.current < q.target) {
            showToast("Nhiệm vụ hoàn thành! Nhận thưởng ngay!", "success");
          }
          return { ...q, current: newCurrent };
        }
        return q;
      });
      return { ...prev, dailyQuests: newQuests };
    });
  };

  const checkBadges = (u: UserProfile) => {
    const newBadges = [...u.badges];
    let added = false;
    BADGES.forEach(badge => {
      if (!newBadges.includes(badge.id) && badge.condition(u)) {
        newBadges.push(badge.id);
        added = true;
        showToast(`Mở khóa huy hiệu: ${badge.name}`, 'success');
      }
    });
    if (added) {
      setUserData(prev => prev ? { ...prev, badges: newBadges } : null);
    }
  };

  // --- RENDER LOADING / AUTH ---
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FDFCF8]">
       <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl"></div>
          <div className="text-xl font-black text-slate-300 tracking-widest uppercase">StudyGram Loading...</div>
       </div>
    </div>
  );

  if (!userData) return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
      
      <div className="glass p-10 rounded-[3.5rem] w-full max-w-md text-center relative z-10 border-2 border-white/50 shadow-2xl animate-slide-up">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] mx-auto mb-8 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
           <Rocket size={40} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tighter">StudyGram</h1>
        <p className="text-slate-500 font-bold mb-8 text-sm uppercase tracking-widest">Kỷ nguyên học tập sinh tồn</p>
        
        <input id="name-input" placeholder="Nhập biệt danh..." className="w-full p-6 bg-slate-50 rounded-[1.5rem] mb-4 font-black text-center text-lg outline-none border-2 border-transparent focus:border-indigo-200 transition-all placeholder:text-slate-300" />
        
        <button onClick={() => {
          const input = document.getElementById('name-input') as HTMLInputElement;
          if (input.value.trim()) handleAuth(input.value);
          else showToast("Hãy nhập tên để bắt đầu!", "error");
        }} className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all">
          BẮT ĐẦU NGAY 🚀
        </button>
      </div>
    </div>
  );

  // --- MAIN APP RENDER ---
  return (
    <div className="min-h-screen bg-[#FDFCF8] text-slate-800 font-sans selection:bg-indigo-100 pb-20">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 h-24 bg-white/80 backdrop-blur-xl z-40 flex items-center justify-between px-6 border-b border-slate-100">
         <div className="flex items-center gap-3" onClick={() => setActiveTab(AppTab.FEED)}>
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 cursor-pointer">
               <Bot size={22} />
            </div>
            <div>
               <h1 className="font-black text-xl tracking-tighter text-slate-800 leading-none">STUDYGRAM</h1>
               <div className="flex items-center gap-2">
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">Supreme Edition</span>
                 <div className="bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                    <Gem size={8} className="text-amber-600" />
                    <span className="text-[9px] font-black text-amber-700">{userData.gems}</span>
                 </div>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-2" onClick={() => setActiveTab(AppTab.PROFILE)}>
             <div className="text-right hidden md:block">
                <div className="text-xs font-black text-slate-800">{userData.name}</div>
                <div className="flex items-center justify-end gap-1">
                  <div className="text-[9px] font-black text-slate-400 uppercase">LV.{Math.floor(userData.exp/100)}</div>
                  <div className="flex items-center text-[9px] font-black text-orange-500"><Flame size={10} fill="currentColor"/> {userData.streak}</div>
                </div>
             </div>
             <img src={userData.avatar} className="w-11 h-11 rounded-[1rem] bg-slate-100 border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform" />
         </div>
      </header>

      {/* BODY CONTENT */}
      <main className="pt-28 px-4 max-w-2xl mx-auto w-full min-h-screen">
         {activeTab === AppTab.FEED && <Feed userData={userData} onExp={addExp} showToast={showToast} />}
         {activeTab === AppTab.TUTOR && <AITutor userData={userData} onExp={addExp} onQuestProgress={handleQuestProgress} />}
         {activeTab === AppTab.MISSION && <MissionControl userData={userData} onUpdate={setUserData} onQuestProgress={handleQuestProgress} onExp={addExp} />}
         {activeTab === AppTab.RANK && <Leaderboard currentUid={userData.uid} userData={userData} />}
         {activeTab === AppTab.PROFILE && <Profile userData={userData} onUpdate={setUserData} onToast={showToast} />}
         {activeTab === AppTab.TOOLS && <StudyTools onExp={addExp} />}
         {activeTab === AppTab.QUIZ && <QuizArena onExp={addExp} showToast={showToast} onQuestProgress={handleQuestProgress} />}
         {activeTab === AppTab.FOCUS && <FocusZone onExp={addExp} showToast={showToast} onQuestProgress={handleQuestProgress} />}
      </main>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-28 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[100] font-black text-xs uppercase tracking-widest flex items-center gap-3 animate-bounce ${toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-rose-500 text-white'}`}>
           {toast.type === 'success' ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
           {toast.message}
        </div>
      )}

      {/* LEVEL UP MODAL */}
      {levelUpModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setLevelUpModal(null)}>
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center animate-slide-up relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 animate-pulse"></div>
             <div className="relative z-10">
                <Crown size={64} className="mx-auto text-amber-500 mb-4 animate-bounce drop-shadow-lg" fill="currentColor"/>
                <h2 className="text-3xl font-black text-slate-800 mb-2">LEVEL UP!</h2>
                <p className="text-slate-500 font-bold mb-6">Bạn đã đạt danh hiệu:</p>
                <div className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-200 mb-8 uppercase tracking-widest">
                   {levelUpModal}
                </div>
                <button onClick={() => setLevelUpModal(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all">TIẾP TỤC</button>
             </div>
          </div>
        </div>
      )}

      {/* SUPER MENU OVERLAY */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col justify-end" onClick={() => setShowMenu(false)}>
           <div className="bg-[#FDFCF8] rounded-t-[3rem] p-8 pb-32 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8 px-2">
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight">Menu Mở Rộng</h3>
                 <button onClick={() => setShowMenu(false)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"><X size={24}/></button>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                 {[
                    { id: AppTab.TOOLS, icon: LayoutGrid, label: 'Công cụ', color: 'bg-emerald-500' },
                    { id: AppTab.QUIZ, icon: BrainCircuit, label: 'Đấu trường', color: 'bg-rose-500' },
                    { id: AppTab.FOCUS, icon: Clock, label: 'Tập trung', color: 'bg-amber-500' },
                    { id: AppTab.PROFILE, icon: User, label: 'Hồ sơ', color: 'bg-indigo-500' },
                 ].map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setShowMenu(false); }} className="flex flex-col items-center gap-3 group">
                       <div className={`w-16 h-16 ${item.color} rounded-[1.5rem] flex items-center justify-center text-white shadow-xl transition-transform group-active:scale-90 group-hover:scale-110`}>
                          <item.icon size={28} />
                       </div>
                       <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{item.label}</span>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-40">
        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-2 flex justify-between shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-white/50 ring-1 ring-slate-900/5">
          {[
            { id: AppTab.FEED, icon: Home },
            { id: AppTab.MISSION, icon: Target },
            { id: AppTab.TUTOR, icon: Bot },
            { id: AppTab.RANK, icon: Trophy },
          ].map(t => (
            <button 
               key={t.id} 
               onClick={() => setActiveTab(t.id)} 
               className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center transition-all duration-300 ${
                  activeTab === t.id 
                  ? 'bg-slate-900 text-white shadow-lg scale-110 -translate-y-2' 
                  : 'text-slate-400 hover:bg-slate-100'
               }`}
            >
              <t.icon size={24} strokeWidth={activeTab === t.id ? 3 : 2} />
            </button>
          ))}
          
          <button 
             onClick={() => setShowMenu(true)} 
             className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center transition-all duration-300 ${
                showMenu || ![AppTab.FEED, AppTab.MISSION, AppTab.TUTOR, AppTab.RANK].includes(activeTab)
                ? 'bg-indigo-600 text-white shadow-lg scale-110 -translate-y-2' 
                : 'text-slate-400 hover:bg-slate-100'
             }`}
          >
             <Grid3X3 size={24} strokeWidth={2.5} />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
