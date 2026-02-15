
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
  RefreshCw, AlertTriangle, Grid3X3, Gem, Wifi, WifiOff
} from 'lucide-react';
import { UserProfile, AppTab, LoginMethod, DailyQuest, QuestType } from './types';
import { getLevelInfo, BADGES } from './constants';
import { checkConnection } from './services/geminiService';
import Feed from './components/Feed';
import AITutor from './components/AITutor';
import FocusZone from './components/FocusZone';
import QuizArena from './components/QuizArena';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import StudyTools from './components/StudyTools';
import MissionControl from './components/MissionControl';

const INITIAL_QUESTS: DailyQuest[] = [
  { id: 'q1', type: 'focus_time', text: 'Học tập trung 15 phút', target: 15, current: 0, reward: 100, gems: 20, isClaimed: false },
  { id: 'q2', type: 'quiz_correct', text: 'Giải đúng 10 câu trắc nghiệm', target: 10, current: 0, reward: 150, gems: 30, isClaimed: false },
  { id: 'q3', type: 'ai_interaction', text: 'Hỏi Gia sư AI 3 câu hỏi', target: 3, current: 0, reward: 50, gems: 10, isClaimed: false }
];

const App: React.FC = () => {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FEED);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isAIOnline, setIsAIOnline] = useState<boolean | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && window.aistudio.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      
      setIsAIOnline(true);
      setLastError(null);
      showToast("Đang kích hoạt API Key mới...", "success");
      
      setTimeout(verifyAI, 1500);
    } else {
        showToast("Trình duyệt không hỗ trợ chọn Key", "error");
    }
  };

  const verifyAI = async () => {
    try {
      const status = await checkConnection();
      setIsAIOnline(status.success);
      if (!status.success) {
        setLastError(status.message);
      } else {
        setLastError(null);
        if (status.message.includes("fallback")) {
            showToast("Đang dùng chế độ dự phòng (Model cũ)", "success");
        }
      }
    } catch (e: any) {
      setIsAIOnline(false);
      setLastError(e.message || "Lỗi không xác định");
    }
  };

  useEffect(() => {
    const checkInitialKey = async () => {
      // @ts-ignore
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        verifyAI();
      } else {
        setIsAIOnline(false);
        setLastError("Chưa chọn API Key");
      }
    };
    checkInitialKey();

    const saved = localStorage.getItem('studygram_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const lastLogin = parsed.lastLogin ? new Date(parsed.lastLogin).toDateString() : '';
        const today = new Date().toDateString();
        
        if (lastLogin !== today) {
           parsed.dailyQuests = INITIAL_QUESTS; 
           parsed.lastLogin = Date.now();
        }
        setUserData(parsed);
      } catch (e) { console.error("Data error", e); }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userData) {
      localStorage.setItem('studygram_user', JSON.stringify(userData));
    }
  }, [userData]);

  const handleAuth = (name: string) => {
    const newUser: UserProfile = {
      uid: 'u-' + Math.random().toString(36).slice(2, 7),
      name: name || 'Học giả Ẩn danh',
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${name}${Date.now()}`,
      exp: 0, gems: 50, bio: 'Sẵn sàng chinh phục tri thức!', joinedAt: Date.now(),
      streak: 1, lives: 5, streakShields: 0, completedQuizzes: 0,
      dailyQuests: INITIAL_QUESTS, badges: [],
      skills: { criticalThinking: 10, focus: 10, creativity: 10, knowledge: 10, discipline: 10 },
      weakPoints: [], lastLogin: Date.now()
    };
    setUserData(newUser);
  };

  const addExp = (amount: number) => {
    if (userData) {
      setUserData(prev => prev ? { ...prev, exp: prev.exp + amount } : null);
      if (amount > 0) showToast(`+${amount} EXP`, 'success');
    }
  };

  const handleQuestProgress = (type: QuestType, amount: number) => {
    if (!userData) return;
    setUserData(prev => {
      if (!prev) return null;
      const newQuests = prev.dailyQuests.map(q => {
        if (q.type === type && !q.isClaimed) {
          return { ...q, current: Math.min(q.current + amount, q.target) };
        }
        return q;
      });
      return { ...prev, dailyQuests: newQuests };
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FDFCF8] font-black animate-pulse">STUDYGRAM...</div>;

  if (!userData) return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6">
      <div className="glass p-10 rounded-[3.5rem] w-full max-w-md text-center border-2 border-white shadow-2xl animate-slide-up">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto mb-8 flex items-center justify-center text-white shadow-lg"><Rocket size={40} /></div>
        <h1 className="text-3xl font-black mb-2">StudyGram V7</h1>
        <p className="text-slate-400 font-bold mb-8">Supreme Edition</p>
        <input id="name-input" placeholder="Tên của bạn..." className="w-full p-5 bg-slate-50 rounded-2xl mb-4 font-black text-center outline-none border-2 border-transparent focus:border-indigo-200 transition-all" />
        <button onClick={() => {
          const input = document.getElementById('name-input') as HTMLInputElement;
          if (input.value.trim()) handleAuth(input.value);
        }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] transition-transform">BẮT ĐẦU 🚀</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-24">
      <header className="fixed top-0 inset-x-0 h-20 bg-white/80 backdrop-blur-xl z-40 flex items-center justify-between px-6 border-b border-slate-100 transition-all">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Bot size={20} /></div>
            <div>
               <h1 className="font-black text-lg leading-none tracking-tight">STUDYGRAM</h1>
               <button onClick={handleSelectKey} className="flex items-center gap-1 mt-1 group">
                  {isAIOnline ? <Wifi size={10} className="text-green-500"/> : <WifiOff size={10} className="text-rose-500"/>}
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isAIOnline ? 'text-green-600' : 'text-rose-600 animate-pulse'}`}>
                    {isAIOnline ? 'AI Online' : 'Chọn Key'}
                  </span>
               </button>
            </div>
         </div>
         <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveTab(AppTab.PROFILE)}>
             <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">LV.{Math.floor(userData.exp/100)}</div>
                <div className="flex items-center justify-end text-[10px] font-black text-orange-500"><Flame size={12} fill="currentColor"/> {userData.streak}</div>
             </div>
             <img src={userData.avatar} className="w-10 h-10 rounded-xl border-2 border-white shadow-md bg-slate-200" />
         </div>
      </header>

      <main className="pt-24 px-4 max-w-2xl mx-auto">
         {/* AI ERROR BANNER - Chỉ hiện khi cả model chính và fallback đều lỗi */}
         {isAIOnline === false && activeTab !== AppTab.PROFILE && (
           <div className="mb-6 bg-rose-50 border border-rose-100 p-6 rounded-[2rem] text-center animate-in shadow-sm">
              <AlertTriangle size={32} className="mx-auto text-rose-500 mb-2"/>
              <h4 className="font-black text-rose-700 text-sm mb-1 uppercase tracking-tight">KẾT NỐI AI THẤT BẠI</h4>
              <p className="text-[10px] font-bold text-rose-500 mb-4 px-4 leading-relaxed">
                {lastError && (lastError.includes("not found") || lastError.includes("404"))
                  ? "API Key hiện tại không tương thích. Hãy thử đổi Key khác." 
                  : "Mất kết nối với máy chủ AI. Vui lòng kiểm tra lại mạng hoặc chọn Key khác."}
              </p>
              <button onClick={handleSelectKey} className="px-8 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-colors flex items-center gap-2 mx-auto active:scale-95">
                <Key size={14}/> Chọn API Key Mới
              </button>
           </div>
         )}
         
         {activeTab === AppTab.FEED && <Feed userData={userData} onExp={addExp} showToast={showToast} />}
         {activeTab === AppTab.TUTOR && <AITutor userData={userData} onExp={addExp} onQuestProgress={handleQuestProgress} />}
         {activeTab === AppTab.MISSION && <MissionControl userData={userData} onUpdate={setUserData} onQuestProgress={handleQuestProgress} onExp={addExp} />}
         {activeTab === AppTab.RANK && <Leaderboard currentUid={userData.uid} userData={userData} />}
         {activeTab === AppTab.PROFILE && <Profile userData={userData} onUpdate={setUserData} onToast={showToast} />}
         {activeTab === AppTab.TOOLS && <StudyTools onExp={addExp} />}
         {activeTab === AppTab.QUIZ && <QuizArena onExp={addExp} showToast={showToast} onQuestProgress={handleQuestProgress} />}
         {activeTab === AppTab.FOCUS && <FocusZone onExp={addExp} showToast={showToast} onQuestProgress={handleQuestProgress} />}
      </main>

      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[100] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 animate-bounce ${toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-rose-500 text-white'}`}>
           {toast.message}
        </div>
      )}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-2 flex justify-between shadow-2xl border border-white/50">
          {[
            { id: AppTab.FEED, icon: Home },
            { id: AppTab.MISSION, icon: Target },
            { id: AppTab.TUTOR, icon: Bot },
            { id: AppTab.RANK, icon: Trophy },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === t.id ? 'bg-slate-900 text-white shadow-lg scale-105' : 'text-slate-400 hover:bg-slate-50'}`}>
              <t.icon size={20} />
            </button>
          ))}
          <button onClick={() => setShowMenu(true)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"><Grid3X3 size={20}/></button>
        </div>
      </nav>

      {showMenu && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col justify-end" onClick={() => setShowMenu(false)}>
           <div className="bg-white rounded-t-[3rem] p-8 pb-32 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="grid grid-cols-4 gap-4">
                 {[
                    { id: AppTab.TOOLS, icon: LayoutGrid, label: 'Công cụ', color: 'bg-emerald-500' },
                    { id: AppTab.QUIZ, icon: BrainCircuit, label: 'Arena', color: 'bg-rose-500' },
                    { id: AppTab.FOCUS, icon: Clock, label: 'Focus', color: 'bg-amber-500' },
                    { id: AppTab.PROFILE, icon: User, label: 'Hồ sơ', color: 'bg-indigo-500' },
                 ].map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setShowMenu(false); }} className="flex flex-col items-center gap-2 group">
                       <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}><item.icon size={24} /></div>
                       <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-slate-800">{item.label}</span>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
