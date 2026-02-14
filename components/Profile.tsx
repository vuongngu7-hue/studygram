import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getLevelInfo, BADGES } from '../constants';
import { Flame, BrainCircuit, ShieldCheck, Crown, Key, X, CheckCircle2, Share2, BarChart3, Sparkles, Medal, Gem, Wifi, WifiOff, Loader2, Save } from 'lucide-react';
import { roastOrToast, checkConnection } from '../services/geminiService';

const Profile: React.FC<{ userData: UserProfile; onUpdate: (u: UserProfile) => void; onToast: (m: string, t: 'success' | 'error') => void }> = ({ userData, onUpdate, onToast }) => {
  const level = getLevelInfo(userData.exp);
  const [aiOpinion, setAiOpinion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [connStatus, setConnStatus] = useState<'unknown' | 'checking' | 'connected' | 'disconnected'>('unknown');
  
  // Custom API Key State
  const [customKey, setCustomKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleAIJudge = async (mode: 'roast' | 'toast') => {
    setLoading(true);
    try {
      const res = await roastOrToast(userData, mode);
      setAiOpinion(res);
    } catch (e) {
      setAiOpinion("AI bận rồi!");
    } finally {
      setLoading(false);
    }
  };

  const verifyAdmin = () => {
    // Hidden Master Key
    if (adminCode === 'SUPREME_2025' || adminCode === 'ADMIN_FIX') {
      onUpdate({ ...userData, isAdmin: true });
      setShowAdminModal(false);
      onToast("Chào mừng Admin! 👑", "success");
    } else {
      onToast("Sai mã bí mật!", "error");
    }
  };

  const testConnection = async () => {
    setConnStatus('checking');
    const isOk = await checkConnection();
    setConnStatus(isOk ? 'connected' : 'disconnected');
    onToast(isOk ? "Kết nối AI ổn định! 🚀" : "Không kết nối được AI! Hãy nhập Key mới.", isOk ? 'success' : 'error');
    if (!isOk) setShowKeyInput(true);
  };

  const saveCustomKey = () => {
    if (!customKey.trim()) return;
    localStorage.setItem('custom_api_key', customKey.trim());
    onToast("Đã lưu API Key mới! Đang kiểm tra...", "success");
    setCustomKey('');
    setShowKeyInput(false);
    testConnection();
  };

  return (
    <div className="animate-slide-up pb-32 max-w-2xl mx-auto w-full px-4">
      <div className="flex flex-col items-center text-center mt-10 mb-10">
        <div className="relative mb-6 group">
          <div className={`absolute -inset-4 rounded-[3rem] blur-2xl opacity-20 ${userData.isAdmin ? 'bg-amber-400' : 'bg-indigo-600'}`}></div>
          <img src={userData.avatar} className={`relative w-40 h-40 rounded-[3rem] bg-white border-4 shadow-2xl ${userData.isAdmin ? 'border-amber-400' : 'border-white'}`} />
          <button onClick={() => setShowAdminModal(true)} className={`absolute -bottom-2 -right-2 text-white p-4 rounded-2xl shadow-xl transition-all active:scale-90 ${userData.isAdmin ? 'bg-amber-500' : 'bg-indigo-600'}`}>
              {userData.isAdmin ? <Crown size={24} fill="currentColor"/> : <ShieldCheck size={24} fill="currentColor"/>}
          </button>
        </div>
        
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{userData.name}</h2>
        <div className="flex items-center gap-2 mb-8">
            <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">LV. {Math.floor(userData.exp/100)} {level.title}</span>
            <span className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1"><Gem size={10}/> {userData.gems} GEMS</span>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                <Flame size={24} className="mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-black text-slate-800">{userData.streak}</div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Streak Day</div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                <BrainCircuit size={24} className="mx-auto mb-2 text-indigo-500" />
                <div className="text-2xl font-black text-slate-800">{userData.completedQuizzes}</div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Win Quizzes</div>
            </div>
        </div>
      </div>

      {/* SYSTEM CHECK */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <button 
          onClick={testConnection} 
          disabled={connStatus === 'checking'}
          className={`px-6 py-3 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${
            connStatus === 'connected' ? 'bg-green-100 text-green-700 border border-green-200' : 
            connStatus === 'disconnected' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 
            'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {connStatus === 'checking' ? <Loader2 size={14} className="animate-spin"/> : 
           connStatus === 'connected' ? <Wifi size={14}/> : 
           connStatus === 'disconnected' ? <WifiOff size={14}/> : <Wifi size={14}/>}
          
          {connStatus === 'checking' ? 'Đang kiểm tra...' : 
           connStatus === 'connected' ? 'AI Online' : 
           connStatus === 'disconnected' ? 'AI Mất kết nối' : 'Kiểm tra kết nối AI'}
        </button>

        {/* API KEY INPUT IF NEEDED */}
        {showKeyInput && (
          <div className="w-full max-w-sm bg-white p-4 rounded-3xl border-2 border-slate-100 animate-slide-up shadow-lg">
             <div className="text-center mb-3">
               <span className="text-[10px] font-black text-rose-500 uppercase">Cập nhật API Key</span>
             </div>
             <div className="flex gap-2">
               <input 
                 value={customKey}
                 onChange={e => setCustomKey(e.target.value)}
                 placeholder="Dán API Key mới vào đây..."
                 className="flex-1 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold outline-none border focus:border-indigo-400"
               />
               <button onClick={saveCustomKey} className="bg-indigo-600 text-white p-2 rounded-xl shadow-md active:scale-95"><Save size={18}/></button>
             </div>
          </div>
        )}
      </div>

      {/* BADGES COLLECTION */}
      <div className="mb-10">
         <h3 className="text-lg font-black text-slate-800 mb-4 px-2 flex items-center gap-2">
            <Medal size={20} className="text-amber-500"/> Bộ Sưu Tập Huy Hiệu
         </h3>
         <div className="grid grid-cols-4 gap-3">
            {BADGES.map(badge => {
                const isUnlocked = userData.badges.includes(badge.id);
                return (
                    <div key={badge.id} className={`aspect-square rounded-[1.5rem] flex flex-col items-center justify-center p-2 border-2 text-center transition-all ${isUnlocked ? 'bg-white border-slate-100 shadow-md' : 'bg-slate-50 border-transparent opacity-50 grayscale'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2 ${isUnlocked ? badge.color + ' text-white shadow-sm' : 'bg-slate-200'}`}>
                            {badge.icon}
                        </div>
                        <span className="text-[8px] font-bold text-slate-500 leading-tight">{badge.name}</span>
                    </div>
                )
            })}
         </div>
      </div>

      <div className={`p-8 rounded-[3rem] border-white shadow-2xl mb-10 relative overflow-hidden text-white transition-all ${userData.isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-[#1a1c2c] to-[#4a192c]'}`}>
        <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Sparkles size={20} className="text-amber-400 animate-pulse"/> AI Perfect Judge</h3>
        {aiOpinion ? (
          <div className="p-6 bg-white/10 rounded-3xl border border-white/20 animate-slide-up relative">
            <p className="text-sm font-bold leading-relaxed italic">"{aiOpinion}"</p>
            <button onClick={() => setAiOpinion(null)} className="absolute -top-3 -right-3 bg-white text-indigo-900 p-2 rounded-full shadow-lg"><X size={16}/></button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleAIJudge('roast')} disabled={loading} className="py-4 bg-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Roast me!</button>
            <button onClick={() => handleAIJudge('toast')} disabled={loading} className="py-4 bg-indigo-500 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Toast me!</button>
          </div>
        )}
      </div>

      <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-5 bg-rose-50 text-rose-500 rounded-3xl font-black text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-500 hover:text-white transition-all mb-4">Đăng xuất & Xóa dữ liệu</button>
      
      {showAdminModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center relative border border-slate-100 shadow-2xl">
            <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl mb-6 mx-auto flex items-center justify-center shadow-lg"><Key size={30} /></div>
            <h2 className="text-2xl font-black text-slate-800 mb-6">Mã Quyền Lực</h2>
            <input type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-center font-black outline-none mb-6 border-2 border-transparent focus:border-amber-200" placeholder="••••••••" />
            <div className="flex gap-3">
              <button onClick={() => setShowAdminModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest">Hủy</button>
              <button onClick={verifyAdmin} className="flex-[2] py-4 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;