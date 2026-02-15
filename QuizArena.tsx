
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Target, Stars, ArrowRight, BrainCircuit, Users, Zap, 
  ShieldCheck, MessageSquare, Send, X, Bot, Award, Sparkles,
  ChevronLeft, Loader2, Info, Gavel, Timer, Swords, Key
} from 'lucide-react';
import { getDebateResponse, getDailyBlitzQuiz } from '../services/geminiService';
import { QuestType } from '../types';
import MarkdownText from './MarkdownText';

interface QuizArenaProps {
  onExp: (amount: number) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  onQuestProgress?: (type: QuestType, amount: number) => void;
}

const DEBATE_TOPICS = [
  "Trí tuệ nhân tạo sẽ thay thế giáo viên trong tương lai.",
  "Mạng xã hội đang làm thế hệ trẻ cô đơn hơn.",
  "Điểm số không phản ánh đúng thực lực của một học sinh.",
  "Học đại học không còn là con đường duy nhất để thành công.",
  "Việc làm thêm khi đi học lợi bất cập hại."
];

const QuizArena: React.FC<QuizArenaProps> = ({ onExp, showToast, onQuestProgress }) => {
  const [mode, setMode] = useState<'lobby' | 'debate' | 'quiz_match'>('lobby');
  const [activeTopic, setActiveTopic] = useState('');
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Quiz Match States
  const [quizState, setQuizState] = useState<'matching' | 'playing' | 'result'>('matching');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [opponentInfo, setOpponentInfo] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    let timer: any;
    if (mode === 'quiz_match' && quizState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && mode === 'quiz_match' && quizState === 'playing') {
      handleAnswer('');
    }
    return () => clearInterval(timer);
  }, [timeLeft, quizState, mode]);

  const startDebate = (topic: string) => {
    setActiveTopic(topic);
    setMode('debate');
    setMessages([{ role: 'ai', text: `Tôi đã sẵn sàng. Chủ đề là: "${topic}". Bạn ủng hộ hay phản đối quan điểm này? Hãy đưa ra luận điểm đầu tiên của bạn.` }]);
  };

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && window.aistudio.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      showToast("Đang kích hoạt API Key mới...");
    }
  };

  const handleSendDebate = async () => {
    if (!input.trim() || isTyping) return;
    const userText = input.trim();
    setInput('');
    
    // Thêm tin nhắn người dùng vào giao diện trước
    const newHistory = [...messages, { role: 'user', text: userText }];
    setMessages(newHistory);
    setIsTyping(true);
    
    if (onQuestProgress) onQuestProgress('ai_interaction', 1);

    try {
      const response = await getDebateResponse(newHistory, activeTopic);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      onExp(15);
    } catch (error: any) {
      console.error("Debate Error:", error);
      let errorMsg = "Lỗi tranh biện. Vui lòng thử lại!";
      
      if (error.message.includes("Requested entity was not found")) {
        errorMsg = "API Key không hợp lệ hoặc không có quyền truy cập Gemini 3 Pro.";
      } else if (error.message.includes("API Key")) {
        errorMsg = "Thiếu API Key hoặc Key hết hạn.";
      }
      
      showToast(errorMsg, "error");
      setMessages(prev => [...prev, { role: 'ai', text: `⚠️ **Lỗi hệ thống:** ${errorMsg}\n\nBạn có thể thử chọn lại API Key bằng nút bên dưới.` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startQuizMatch = async () => {
    setMode('quiz_match');
    setQuizState('matching');
    setTimeout(async () => {
        setOpponentInfo({
            name: 'Học Bá 2k7',
            avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=hb`
        });
        try {
            const qs = await getDailyBlitzQuiz("Kiến thức tổng hợp");
            if (qs.length > 0) {
                setQuestions(qs);
                setQuizState('playing');
                setCurrentQ(0);
                setTimeLeft(15);
            } else {
                setMode('lobby');
                showToast("Không tìm thấy đối thủ!", "error");
            }
        } catch (e) {
            setMode('lobby');
            showToast("Lỗi kết nối AI!", "error");
        }
    }, 1500);
  };

  const handleAnswer = (option: string) => {
    const q = questions[currentQ];
    const isCorrect = option === q.answer || option.startsWith(q.answer);
    if (isCorrect) setScore(s => s + 150);
    if (Math.random() > 0.5) setOpponentScore(s => s + 150);

    if (currentQ < questions.length - 1) {
        setCurrentQ(c => c + 1);
        setTimeLeft(15);
    } else {
        setQuizState('result');
        if (score > opponentScore) onExp(200);
    }
  };

  if (mode === 'quiz_match') {
      return (
        <div className="flex flex-col h-full animate-in p-4 pb-20">
            {quizState === 'matching' && (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                    <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                    <h3 className="text-xl font-black">ĐANG TÌM ĐỐI THỦ...</h3>
                </div>
            )}
            {quizState === 'playing' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                        <div className="text-center"><span className="text-[8px] font-black uppercase text-indigo-500">Bạn</span><div className="font-black">{score}</div></div>
                        <div className="text-2xl font-black text-amber-500 animate-pulse">{timeLeft}s</div>
                        <div className="text-center"><span className="text-[8px] font-black uppercase text-rose-500">{opponentInfo?.name}</span><div className="font-black">{opponentScore}</div></div>
                    </div>
                    <div className="bg-white rounded-[2.5rem] p-8 border-2 border-slate-50 shadow-xl">
                         <div className="text-lg font-bold text-slate-800 mb-6 leading-relaxed">
                             <MarkdownText text={questions[currentQ].question} />
                         </div>
                         <div className="grid grid-cols-1 gap-3">
                             {questions[currentQ].options.map((opt: string, i: number) => (
                                 <button key={i} onClick={() => handleAnswer(opt)} className="p-4 rounded-2xl border-2 border-slate-100 font-bold text-sm text-slate-600 hover:bg-indigo-600 hover:text-white transition-all text-left">
                                     <MarkdownText text={opt} />
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>
            )}
            {quizState === 'result' && (
                <div className="text-center space-y-6 pt-10">
                    <Trophy size={80} className={score > opponentScore ? "text-amber-500 mx-auto" : "text-slate-300 mx-auto"} />
                    <h2 className="text-3xl font-black">{score > opponentScore ? 'CHIẾN THẮNG!' : 'THẤT BẠI'}</h2>
                    <button onClick={() => setMode('lobby')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black">Quay về sảnh</button>
                </div>
            )}
        </div>
      );
  }

  if (mode === 'debate') {
    return (
      <div className="flex flex-col h-full animate-in -mx-4">
        <div className="bg-white/80 backdrop-blur-md p-4 border-b flex items-center justify-between sticky top-20 z-20">
          <button onClick={() => setMode('lobby')} className="p-2 text-slate-400 hover:text-indigo-600"><ChevronLeft size={24} /></button>
          <div className="text-center">
            <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Tranh Biện Với AI Pro</h3>
            <p className="text-xs font-black text-indigo-600 truncate max-w-[200px]">{activeTopic}</p>
          </div>
          <Gavel size={20} className="text-indigo-600" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-[1.8rem] text-xs leading-relaxed shadow-sm font-bold ${
                m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
              }`}>
                <MarkdownText text={m.text} />
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
          
          {/* Nút sửa lỗi API nhanh khi gặp lỗi */}
          {messages.some(m => m.text.includes("Lỗi hệ thống")) && !isTyping && (
            <div className="flex justify-center py-4">
              <button onClick={handleSelectKey} className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg animate-bounce">
                <Key size={14} /> Chọn Lại API Key
              </button>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-full">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendDebate()}
              placeholder="Nhập luận điểm..."
              className="flex-1 bg-transparent px-4 py-2 outline-none text-xs font-bold"
            />
            <button onClick={handleSendDebate} disabled={!input.trim() || isTyping} className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg disabled:opacity-50"><Send size={18} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 animate-in">
      <div className="bg-gradient-to-br from-indigo-800 to-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <BrainCircuit size={100} className="absolute right-[-10px] bottom-[-10px] opacity-10" />
        <h2 className="text-3xl font-black mb-2">Arena Lobby</h2>
        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-6">Nơi tri thức va chạm</p>
        <button onClick={startQuizMatch} className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-xs shadow-lg flex items-center gap-2">GHÉP TRẬN QUIZ <Swords size={18} /></button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2"><MessageSquare size={18} className="text-indigo-600"/> Tranh Biện Với AI Pro</h3>
        <div className="space-y-2">
            {DEBATE_TOPICS.map((topic, i) => (
                <button key={i} onClick={() => startDebate(topic)} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all text-left">
                    <span className="text-xs font-bold text-slate-700 pr-4">{topic}</span>
                    <ArrowRight size={16} className="text-indigo-400" />
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default QuizArena;
