
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Trash2, Camera, X, Zap, FastForward, UserCheck, GraduationCap, Sparkles, AlertCircle, BrainCircuit, MessageSquare, Image } from 'lucide-react';
import { Message, UserProfile, QuestType } from '../types';
import { getChatResponse, analyzeStudyImage } from '../services/geminiService';
import MarkdownText from './MarkdownText';

interface AITutorProps {
  userData: UserProfile;
  onExp: (amount: number) => void;
  onQuestProgress?: (type: QuestType, amount: number) => void;
}

// Hướng dẫn hệ thống duy nhất, tập trung vào giải bài
const SYSTEM_INSTRUCTION = "Bạn là StudyGram AI - Trợ lý học tập thông minh. Nhiệm vụ của bạn là giải quyết mọi thắc mắc học tập của học sinh. Phong cách: Ngắn gọn, súc tích, đi thẳng vào vấn đề. Nếu là bài tập, hãy giải chi tiết từng bước (Step-by-step). Luôn sử dụng định dạng LaTeX cho các công thức toán/lý/hóa ($...$). Không lan man.";

const AITutor: React.FC<AITutorProps> = ({ userData, onExp, onQuestProgress }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

    // Thêm tin nhắn user vào UI ngay lập tức
    const newHistory = [...messages, { role: 'user', text: imageToProcess ? `[Gửi ảnh] ${userText}` : userText, timestamp: Date.now() }];
    setMessages(newHistory as Message[]);
    setIsTyping(true);

    if (onQuestProgress) onQuestProgress('ai_interaction', 1);

    try {
      let replyText = "";
      
      if (imageToProcess) {
        // Xử lý ảnh
        replyText = await analyzeStudyImage(imageToProcess, userText || "Giải chi tiết bài này giúp mình (dùng LaTeX)");
      } else {
        // Chat thông thường (có nhớ lịch sử)
        replyText = await getChatResponse(userText, messages, SYSTEM_INSTRUCTION);
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: replyText, timestamp: Date.now() }]);
      onExp(25);
    } catch (e: any) {
      console.error("Chat Error:", e);
      let errorMsg = e.message || "Mất kết nối với AI";
      if (e.message?.includes("404") || e.message?.includes("not found")) {
          errorMsg = "Server đang quá tải hoặc Model không khả dụng. Đang thử lại...";
      }
      setMessages(prev => [...prev, { role: 'ai', text: `⚠️ **Lỗi:** ${errorMsg}`, timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFCF8] relative overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20 transition-all">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-indigo-600 to-purple-600">
               <Bot size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-1">
                  Gia Sư AI
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Hỗ trợ giải bài tập 24/7
              </p>
            </div>
        </div>
        <button onClick={() => setMessages([])} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all" title="Xóa lịch sử chat"><Trash2 size={16} /></button>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-32 bg-slate-50/30">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60%] opacity-60 animate-in">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                    <BrainCircuit size={32} className="text-indigo-300" />
                </div>
                <h4 className="text-slate-400 font-black text-sm uppercase tracking-widest mb-1">StudyGram AI Solver</h4>
                <p className="text-slate-300 text-xs font-bold text-center max-w-[200px]">Gửi ảnh bài tập hoặc câu hỏi để nhận lời giải chi tiết.</p>
            </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex w-full animate-slide-up ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] p-4 md:p-5 rounded-[1.5rem] text-sm leading-relaxed shadow-sm font-medium ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
            }`}>
              {m.role === 'ai' ? <MarkdownText text={m.text} /> : m.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
            <div className="flex justify-start w-full animate-pulse">
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-[1.5rem] rounded-tl-sm shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 sticky bottom-0 z-30">
        {selectedImage && (
          <div className="mb-3 relative inline-block animate-slide-up group">
            <img src={selectedImage} className="w-16 h-16 rounded-xl border-2 border-indigo-100 shadow-md object-cover"/>
            <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-md hover:scale-110 transition-transform"><X size={10}/></button>
          </div>
        )}
        
        <div className={`flex items-center gap-2 bg-slate-50 p-1.5 rounded-[2rem] border transition-all ${isTyping ? 'opacity-50 pointer-events-none' : 'opacity-100'} focus-within:bg-white focus-within:border-indigo-300 focus-within:shadow-md focus-within:ring-4 focus-within:ring-indigo-50 border-slate-200`}>
          <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex-shrink-0">
             {selectedImage ? <Image size={20} className="text-indigo-600"/> : <Camera size={20}/>}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if(file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result as string); reader.readAsDataURL(file); }
          }}/>
          
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            placeholder="Nhập câu hỏi hoặc gửi ảnh..." 
            className="flex-1 bg-transparent px-2 py-2.5 outline-none font-bold text-sm text-slate-700 placeholder:text-slate-400"
            autoFocus
          />
          
          <button 
            onClick={handleSend} 
            disabled={(!input.trim() && !selectedImage) || isTyping} 
            className={`w-11 h-11 text-white rounded-full shadow-lg flex items-center justify-center transition-all flex-shrink-0 ${
               (!input.trim() && !selectedImage) ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            <Send size={18} className={(!input.trim() && !selectedImage) ? '' : 'ml-0.5'}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
