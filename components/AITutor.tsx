import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Trash2, Camera, X, Zap, FastForward, UserCheck, GraduationCap, Sparkles, AlertCircle } from 'lucide-react';
import { Message, UserProfile, QuestType } from '../types';
import { getTutorResponse, analyzeStudyImage } from '../services/geminiService';
import MarkdownText from './MarkdownText';

interface AITutorProps {
  userData: UserProfile;
  onExp: (amount: number) => void;
  onQuestProgress?: (type: QuestType, amount: number) => void;
}

const AITutor: React.FC<AITutorProps> = ({ userData, onExp, onQuestProgress }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [tutorMode, setTutorMode] = useState<'teen' | 'academic'>('teen');
  const [isFastMode, setIsFastMode] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isTyping) return;
    
    const userText = input.trim();
    const imageToProcess = selectedImage;
    setInput('');
    setSelectedImage(null);

    setMessages(prev => [...prev, { role: 'user', text: imageToProcess ? `[Gửi ảnh] ${userText}` : userText, timestamp: Date.now() }]);
    setIsTyping(true);

    if (onQuestProgress) onQuestProgress('ai_interaction', 1);

    try {
      const promptSuffix = isFastMode ? " (Trả lời cực ngắn gọn)" : "";
      const replyText = imageToProcess 
        ? await analyzeStudyImage(imageToProcess, (userText || "Giải thích ảnh này") + promptSuffix)
        : await getTutorResponse(userText + promptSuffix, tutorMode);
      setMessages(prev => [...prev, { role: 'ai', text: replyText, timestamp: Date.now() }]);
      onExp(15);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `⚠️ Lỗi: ${e.message || "Mất kết nối với AI"}`, timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7FF]/30 relative overflow-hidden">
      {/* Header Nâng Cấp */}
      <div className="bg-white/95 backdrop-blur-xl p-4 border-b flex flex-col gap-3 shadow-sm z-10 sticky top-0">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Bot size={22} /></div>
              <div>
                <h3 className="font-black text-slate-800 text-sm tracking-tight">AI Tutor Supreme</h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Sẵn sàng hỗ trợ</span>
                </div>
              </div>
            </div>
            <button onClick={() => setMessages([])} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
        </div>
        
        {/* Mode Selector */}
        <div className="flex gap-2">
            <button 
                onClick={() => setTutorMode('teen')}
                className={`flex-1 py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 ${
                    tutorMode === 'teen' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'
                }`}
            >
                <Sparkles size={12} /> Teen Mode
            </button>
            <button 
                onClick={() => setTutorMode('academic')}
                className={`flex-1 py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 ${
                    tutorMode === 'academic' ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
            >
                <GraduationCap size={12} /> Academic
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar pb-32">
        {messages.length === 0 && (
            <div className="text-center py-10 opacity-40">
                <AlertCircle size={40} className="mx-auto mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">Hỏi gì đi fen, tui đang rảnh...</p>
            </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-sm font-bold ${
              m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border-b-2 border-slate-100'
            }`}>
              {m.role === 'ai' ? <MarkdownText text={m.text} /> : m.text}
            </div>
          </div>
        ))}
        {isTyping && (
            <div className="flex justify-start">
                <div className="bg-white p-4 rounded-full shadow-sm flex gap-1.5 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 bg-white/95 border-t backdrop-blur-xl sticky bottom-0 z-20">
        {selectedImage && (
          <div className="mb-3 relative inline-block animate-slide-up">
            <img src={selectedImage} className="w-16 h-16 rounded-xl border-2 border-white shadow-lg object-cover"/>
            <button onClick={() => setSelectedImage(null)} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-1 rounded-full shadow-md"><X size={10}/></button>
          </div>
        )}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[2rem] border-2 border-slate-100 focus-within:bg-white focus-within:border-indigo-400 transition-all shadow-inner">
          <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"><Camera size={20}/></button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if(file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result as string); reader.readAsDataURL(file); }
          }}/>
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            placeholder={tutorMode === 'teen' ? "Hỏi gì lẹ đi fen..." : "Vấn đề của bạn là gì?"} 
            className="flex-1 bg-transparent px-2 py-2.5 outline-none font-bold text-sm"
          />
          <button 
            onClick={handleSend} 
            disabled={(!input.trim() && !selectedImage) || isTyping} 
            className="w-10 h-10 bg-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
          >
            <Send size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;