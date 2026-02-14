
import React, { useState, useEffect } from 'react';
import { 
  Crown, Medal, Flame, Zap, Trophy, Globe, ShieldCheck, Star, Ghost, Share2, Users, School, Sparkles, TrendingUp
} from 'lucide-react';
import { getChampionTip } from '../services/geminiService';
import { UserProfile } from '../types';

interface LeaderboardProps {
  currentUid: string;
  userData: UserProfile;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentUid, userData }) => {
  const [championQuote, setChampionQuote] = useState("Vị thế này chỉ dành cho những người không bao giờ bỏ cuộc! 🌌");
  const [students, setStudents] = useState<any[]>([]);
  const [tab, setTab] = useState<'global' | 'class' | 'friends'>('global');

  useEffect(() => {
    // Optimized: Run heavy processing in useEffect
    const savedPosts = localStorage.getItem('studygram_posts');
    const posts = savedPosts ? JSON.parse(savedPosts) : [];
    
    const uniqueUsersMap = new Map();
    uniqueUsersMap.set(userData.uid, {
      uid: userData.uid,
      name: userData.name,
      avatar: userData.avatar,
      exp: userData.exp,
      streak: userData.streak,
      isVerified: userData.isVerified,
      isStudentOfWeek: userData.exp > 500
    });

    // Mock Data based on posts + some fakes for Class/Friends
    posts.forEach((p: any) => {
      if (!uniqueUsersMap.has(p.uid)) {
        uniqueUsersMap.set(p.uid, {
          uid: p.uid,
          name: p.userName,
          avatar: p.avatar,
          exp: Math.floor(Math.random() * 5000) + 500,
          streak: Math.floor(Math.random() * 20),
          isVerified: false,
          isStudentOfWeek: false
        });
      }
    });

    // Add fake users for demo if list is small
    if (uniqueUsersMap.size < 5) {
        ['Alice', 'Bob', 'Charlie', 'David', 'Eve'].forEach(name => {
             if (!uniqueUsersMap.has(name)) {
                 uniqueUsersMap.set(name, {
                     uid: name,
                     name: name,
                     avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${name}`,
                     exp: Math.floor(Math.random() * 8000),
                     streak: Math.floor(Math.random() * 30),
                     isVerified: Math.random() > 0.8
                 });
             }
        });
    }

    let allStudents = Array.from(uniqueUsersMap.values());

    // Filter Logic
    if (tab === 'class') {
        allStudents = allStudents.filter((_, i) => i % 2 === 0 || _.uid === userData.uid); // Mock logic
    } else if (tab === 'friends') {
        allStudents = [allStudents.find(s => s.uid === userData.uid), ...allStudents.slice(0, 3)].filter(Boolean); // Mock logic
    }

    const sortedStudents = allStudents
      .sort((a, b) => b.exp - a.exp)
      .map((s, idx) => ({ ...s, rank: idx + 1 }));

    setStudents(sortedStudents);
  }, [userData, tab]);

  useEffect(() => {
    const fetchTip = async () => {
      if (students.length > 0 && students[0].uid === userData.uid) {
        try {
          const tip = await getChampionTip(userData.name);
          setChampionQuote(tip);
        } catch (e) {}
      }
    };
    fetchTip();
  }, [students, userData.name, userData.uid]);

  const studentOfWeek = students[0];

  return (
    <div className="space-y-8 animate-slide-up pb-32 max-w-2xl mx-auto w-full px-4 pt-6">
      {/* Header with improved styling */}
      <div className="text-center space-y-2">
         <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200">
            <Trophy size={14} className="animate-bounce" /> Season 7: Era of Survival
         </div>
         <h2 className="text-4xl font-black text-slate-800 tracking-tighter drop-shadow-sm uppercase">
            Bảng Phong Thần
         </h2>
         <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Vinh danh những học giả kiệt xuất nhất</p>
      </div>

      {/* Tabs */}
      <div className="glass p-1.5 rounded-[2rem] mx-auto max-w-sm flex bg-white/60 backdrop-blur-md border border-white/50 shadow-sm">
         {[
           { id: 'global', label: 'Toàn cầu', icon: Globe },
           { id: 'class', label: 'Lớp học', icon: School },
           { id: 'friends', label: 'Bạn bè', icon: Users }
         ].map((t) => (
            <button 
              key={t.id}
              onClick={() => setTab(t.id as any)} 
              className={`flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${tab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-white/50'}`}
            >
              <t.icon size={14} /> {t.label}
            </button>
         ))}
      </div>

      {/* Champion Spotlight - Dynamic Card */}
      {tab === 'global' && studentOfWeek && (
        <div className="relative w-full aspect-[4/3] max-h-[400px] rounded-[3rem] shadow-2xl overflow-hidden group transform-gpu">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-amber-500 animate-gradient-xy"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
            
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>

            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8 text-white">
                <div className="mb-4 relative">
                   <div className="absolute -inset-4 bg-amber-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                   <div className="relative">
                      <img src={studentOfWeek.avatar} className="w-28 h-28 rounded-[2rem] border-4 border-amber-300 shadow-2xl object-cover bg-white" />
                      <div className="absolute -top-6 -right-4">
                         <Crown size={40} className="text-amber-300 drop-shadow-lg transform rotate-12" fill="currentColor" />
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 shadow-lg whitespace-nowrap">
                         #1 Champion
                      </div>
                   </div>
                </div>

                <h3 className="text-3xl font-black tracking-tight mb-2 drop-shadow-md">{studentOfWeek.name}</h3>
                
                <div className="flex gap-3 mb-6">
                    <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/20 text-xs font-black flex items-center gap-2">
                       <Zap size={14} className="text-amber-300" fill="currentColor"/> {studentOfWeek.exp.toLocaleString()} XP
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/20 text-xs font-black flex items-center gap-2">
                       <Flame size={14} className="text-orange-300" fill="currentColor"/> {studentOfWeek.streak} Days
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-xs">
                   <p className="text-xs font-bold italic leading-relaxed text-indigo-100 line-clamp-2">
                      "{championQuote}"
                   </p>
                </div>
            </div>
        </div>
      )}

      {/* Ranking List */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden relative">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
           <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600"/>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Bảng Xếp Hạng</span>
           </div>
           <span className="text-[10px] font-bold text-slate-400">Cập nhật: Vừa xong</span>
        </div>
        
        <div className="divide-y divide-slate-50">
          {students.map((student, idx) => {
            // Styling for Top 3
            let rankStyle = "bg-white";
            let rankIcon = <span className="font-black text-slate-400 text-sm">#{idx + 1}</span>;
            let borderClass = "border-transparent";

            if (idx === 0) {
                rankStyle = "bg-gradient-to-r from-amber-50 to-white";
                rankIcon = <Crown size={24} className="text-amber-500" fill="currentColor" />;
                borderClass = "border-amber-200";
            } else if (idx === 1) {
                rankStyle = "bg-gradient-to-r from-slate-50 to-white";
                rankIcon = <Medal size={24} className="text-slate-400" fill="currentColor" />;
                borderClass = "border-slate-200";
            } else if (idx === 2) {
                rankStyle = "bg-gradient-to-r from-orange-50 to-white";
                rankIcon = <Medal size={24} className="text-orange-700" fill="currentColor" />;
                borderClass = "border-orange-200";
            }

            const isMe = student.uid === currentUid;

            return (
              <div 
                key={student.uid} 
                className={`flex items-center gap-4 p-5 transition-all hover:bg-slate-50 ${rankStyle} ${isMe ? 'bg-indigo-50/60 ring-1 ring-indigo-100' : ''}`}
              >
                <div className="w-8 flex justify-center shrink-0">
                   {rankIcon}
                </div>

                <div className={`relative shrink-0 p-0.5 rounded-[1.2rem] bg-gradient-to-br ${idx === 0 ? 'from-amber-400 to-orange-500' : idx === 1 ? 'from-slate-300 to-slate-400' : idx === 2 ? 'from-orange-600 to-amber-700' : 'from-transparent to-transparent'}`}>
                    <img src={student.avatar} className="w-12 h-12 rounded-[1rem] bg-white object-cover border-2 border-white" loading="lazy" />
                    {isMe && <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full border-2 border-white"><Sparkles size={10}/></div>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                     <h4 className={`font-black text-sm truncate ${isMe ? 'text-indigo-700' : 'text-slate-700'}`}>
                        {student.name}
                     </h4>
                     {student.isVerified && <ShieldCheck size={12} className="text-blue-500" fill="currentColor"/>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                         <Flame size={10} className="text-orange-500" fill="currentColor"/> {student.streak}
                      </div>
                  </div>
                </div>

                <div className="text-right">
                    <div className="font-black text-slate-800 text-base">
                      {student.exp.toLocaleString()}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">EXP</div>
                </div>
              </div>
            );
          })}
          
          {students.length === 0 && (
            <div className="p-16 text-center space-y-3">
               <Ghost size={48} className="mx-auto text-slate-200 animate-bounce" />
               <p className="text-slate-300 font-black text-xs uppercase tracking-[0.2em]">Chưa có dữ liệu...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
