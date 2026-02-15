
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Trash2, Camera, X, Zap, FastForward, UserCheck, GraduationCap, Sparkles, AlertCircle, BrainCircuit } from 'lucide-react';
import { Message, UserProfile, QuestType } from '../types';
import { getTutorResponse, analyzeStudyImage, getChatResponse } from '../services/geminiService';
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
  const [tutorMode, setTutorMode] = useState<'teen' | 'academic' | 'pro'>('teen');
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
      let replyText = "";
      if (imageToProcess) {
        replyText = await analyzeStudyImage(imageToProcess, userText || "Giải thích ảnh này");
      } else if (tutorMode === 'pro') {
        replyText = await getChatResponse(userText, messages);
      } else {
        const promptSuffix = isFastMode ? " (Trả lời cực ngắn gọn)" : "";
        replyText = await getTutorResponse(userText + promptSuffix, tutorMode);
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: replyText, timestamp: Date.now() }]);
      onExp(tutorMode === 'pro' ? 25 : 15);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `⚠️ Lỗi: ${e.message || "Mất kết nối với AI"}`, timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7FF]/30 relative overflow-hidden">
      {/* Header Nâng Cấp */}
      <div className={`bg-white/95 backdrop-blur-xl p-4 border-b flex flex-col gap-3 shadow-sm z-10 sticky top-0 transition-all duration-500 ${tutorMode === 'pro' ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors ${tutorMode === 'pro' ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-indigo-600'}`}>
                {tutorMode === 'pro' ? <BrainCircuit size={22} /> : <Bot size={22} />}
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm tracking-tight">{tutorMode === 'pro' ? 'Gemini 3 Pro AI' : 'AI Tutor Supreme'}</h3>
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${tutorMode === 'pro' ? 'bg-indigo-500' : 'bg-green-500'}`}></span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Sẵn sàng hỗ trợ</span>
                </div>
              </div>
            </div>
            <button onClick={() => setMessages([])} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
        </div>
        
        {/* Mode Selector */}
        <div className="flex gap-2">
            {[
              { id: 'teen', icon: Sparkles, label: 'Teen' },
              { id: 'academic', icon: GraduationCap, label: 'Academic' },
              { id: 'pro', icon: BrainCircuit, label: 'Pro Mode' }
            ].map((mode) => (
              <button 
                  key={mode.id}
                  onClick={() => setTutorMode(mode.id as any)}
                  className={`flex-1 py-2 px-1 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all border-2 ${
                      tutorMode === mode.id 
                        ? (mode.id === 'pro' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-800 border-slate-800 text-white') 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'
                  }`}
              >
                  <mode.icon size={10} /> {mode.label}
              </button>
            ))}
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
                <div className={`p-4 rounded-full shadow-sm flex gap-1.5 animate-pulse ${tutorMode === 'pro' ? 'bg-indigo-50' : 'bg-white'}`}>
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
        <div className={`flex items-center gap-2 bg-slate-50 p-1.5 rounded-[2rem] border-2 transition-all shadow-inner ${tutorMode === 'pro' ? 'focus-within:border-indigo-500 ring-indigo-100 ring-offset-2' : 'focus-within:border-indigo-400 border-slate-100'}`}>
          <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"><Camera size={20}/></button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if(file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result as string); reader.readAsDataURL(file); }
          }}/>
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            placeholder={tutorMode === 'pro' ? "Hỏi vấn đề phức tạp nhất..." : "Hỏi gì lẹ đi fen..."} 
            className="flex-1 bg-transparent px-2 py-2.5 outline-none font-bold text-sm"
          />
          <button 
            onClick={handleSend} 
            disabled={(!input.trim() && !selectedImage) || isTyping} 
            className={`w-10 h-10 text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-all disabled:opacity-30 ${tutorMode === 'pro' ? 'bg-indigo-600' : 'bg-slate-900'}`}
          >
            <Send size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
