import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Play, Pause, RotateCcw, Music, Youtube, Search, Zap, 
  Sparkles, Heart, X, Flame, Award, ChevronRight, Wind, CloudRain, 
  Coffee, Volume2, VolumeX, SkipForward, BarChart
} from 'lucide-react';
import { QuestType } from '../types';
import { getMotivationQuote } from '../services/geminiService';

const PET_STAGES = [
  { icon: '🥚', label: 'Mầm Non', color: 'from-slate-200 to-slate-400', glow: 'bg-slate-400' },
  { icon: '🐣', label: 'Tân Binh', color: 'from-yellow-200 to-orange-300', glow: 'bg-orange-300' },
  { icon: '🐥', label: 'Chiến Thần', color: 'from-orange-300 to-rose-400', glow: 'bg-rose-400' },
  { icon: '🦅', label: 'Học Giả', color: 'from-blue-400 to-indigo-600', glow: 'bg-indigo-600' },
  { icon: '🐲', label: 'Rồng Thần', color: 'from-indigo-600 via-purple-600 to-amber-500', glow: 'bg-purple-600' }
];

const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Mưa Rơi', icon: CloudRain, url: 'https://www.soundjay.com/nature/rain-01.mp3' },
  { id: 'wind', name: 'Gió Ngàn', icon: Wind, url: 'https://www.soundjay.com/nature/wind-01.mp3' },
  { id: 'cafe', name: 'Phố Thị', icon: Coffee, url: 'https://www.soundjay.com/misc/restaurant-ambience-1.mp3' },
  { id: 'fire', name: 'Lửa Trại', icon: Flame, url: 'https://www.soundjay.com/nature/fire-1.mp3' }
];

interface FocusZoneProps {
  onExp: (amount: number) => void;
  showToast: (m: string) => void;
  onQuestProgress?: (type: QuestType, amount: number) => void;
}

const FocusZone: React.FC<FocusZoneProps> = ({ onExp, showToast, onQuestProgress }) => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [petStage, setPetStage] = useState(0);
  const [showMusic, setShowMusic] = useState(false);
  const [activeAmbient, setActiveAmbient] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visualizerBars = Array.from({ length: 12 });

  const ensureAudioEnabled = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        if (!activeAmbient) audioRef.current?.pause();
      }).catch(() => {});
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
      const elapsed = (25 * 60) - seconds;
      const stage = Math.min(Math.floor(elapsed / 300), 4);
      if (mode === 'study') setPetStage(stage);
    } else if (seconds === 0) {
      setIsActive(false);
      
      const finishFocus = async () => {
        onExp(mode === 'study' ? 120 : 30);
        if (mode === 'study') {
            if (onQuestProgress) onQuestProgress('focus_time', 25);
            // AI Motivation
            const quote = await getMotivationQuote();
            showToast(`🔥 ${quote}`);
        } else {
            showToast("Đã hết giờ nghỉ!");
        }
        setMode(mode === 'study' ? 'break' : 'study');
        setSeconds(mode === 'study' ? 5 * 60 : 25 * 60);
        if (window.confetti) window.confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
      };
      finishFocus();

    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggleAmbient = (sound: any) => {
    ensureAudioEnabled();
    if (activeAmbient === sound.id) {
      audioRef.current?.pause();
      setActiveAmbient(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = sound.url;
        audioRef.current.loop = true;
        audioRef.current.volume = volume;
        audioRef.current.play();
        setActiveAmbient(sound.id);
      }
    }
  };

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="flex flex-col items-center gap-10 py-6 max-w-2xl mx-auto w-full animate-slide-up">
      <audio ref={audioRef} />
      
      <div className="relative group w-full flex flex-col items-center">
        {/* Holographic Glow */}
        <div className={`absolute -inset-20 blur-[120px] opacity-30 transition-all duration-1000 ${PET_STAGES[petStage].glow} ${isActive ? 'animate-pulse scale-150' : 'opacity-10'}`}></div>
        
        <div className="relative glass p-14 rounded-[5.5rem] border-white shadow-2xl flex flex-col items-center gap-6 bg-white/40 w-full max-w-sm border-2 overflow-hidden">
          {/* Visualizer Bars */}
          <div className="flex items-end gap-1.5 h-10 absolute top-8">
            {visualizerBars.map((_, i) => (
              <div 
                key={i} 
                className={`w-1 rounded-full transition-all duration-300 ${isActive ? 'bg-indigo-500 animate-music-bar' : 'bg-slate-200 h-1'}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              ></div>
            ))}
          </div>

          <div className="relative mt-10">
            <div className={`text-[11rem] animate-float transition-all duration-700 ${isActive ? 'scale-110 drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]' : 'scale-100 grayscale-[20%]'}`}>
                {PET_STAGES[petStage].icon}
            </div>
          </div>
          
          <div className="text-center space-y-3 z-10">
            <div className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] bg-gradient-to-r text-white shadow-xl ${PET_STAGES[petStage].color}`}>
                {PET_STAGES[petStage].label}
            </div>
            <div className="text-8xl font-black text-slate-800 font-mono tracking-tighter tabular-nums drop-shadow-sm">
                {formatTime(seconds)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 z-10">
        <button 
          onClick={() => {setIsActive(false); setSeconds(mode === 'study' ? 25*60 : 5*60); setPetStage(0);}} 
          className="p-6 bg-white rounded-[2.2rem] border-2 border-slate-50 shadow-xl text-slate-300 hover:text-rose-500 transition-all active:scale-90"
        >
          <RotateCcw size={32} />
        </button>
        
        <button 
          onClick={() => { ensureAudioEnabled(); setIsActive(!isActive); }} 
          className={`px-14 py-7 rounded-[3rem] font-black text-white shadow-2xl transition-all active:scale-95 flex items-center gap-4 text-2xl group ${
            isActive ? 'bg-slate-800 shadow-slate-200' : 'bg-indigo-600 shadow-indigo-300 hover:bg-indigo-700'
          }`}
        >
          {isActive ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor"/>}
          {isActive ? 'DỪNG' : 'HỌC NGAY'}
        </button>
        
        <button 
          onClick={() => setShowMusic(!showMusic)} 
          className={`p-6 rounded-[2.2rem] border-2 transition-all active:scale-90 ${showMusic ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-300 border-slate-50 shadow-xl'}`}
        >
          <Music size={32} />
        </button>
      </div>

      {showMusic && (
        <div className="glass w-full p-10 rounded-[4.5rem] border-white shadow-2xl space-y-8 animate-slide-up bg-white/95 border-2">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-2xl text-slate-800 tracking-tighter italic">Concise Ambient</h3>
            <button onClick={() => setShowMusic(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-800"><X size={20}/></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
             {AMBIENT_SOUNDS.map(sound => (
               <button 
                 key={sound.id}
                 onClick={() => toggleAmbient(sound)}
                 className={`p-6 rounded-[2.5rem] border-2 transition-all flex items-center gap-4 group ${activeAmbient === sound.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-white hover:border-indigo-100'}`}
               >
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeAmbient === sound.id ? 'bg-white/20' : 'bg-white shadow-sm group-hover:rotate-12'}`}>
                    <sound.icon size={24} />
                 </div>
                 <span className="font-black text-[11px] uppercase tracking-widest">{sound.name}</span>
               </button>
             ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 bg-indigo-50/80 backdrop-blur-sm px-8 py-3.5 rounded-full border border-indigo-100 shadow-sm animate-pulse">
        <Sparkles size={18} className="text-indigo-600"/>
        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Tiến độ tri thức: {Math.round((((mode === 'study' ? 25*60 : 5*60) - seconds) / (mode === 'study' ? 25*60 : 5*60)) * 100)}%</span>
      </div>

      <style>{`
        @keyframes music-bar {
          0%, 100% { height: 8px; }
          50% { height: 100%; }
        }
        .animate-music-bar { animation: music-bar 0.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default FocusZone;