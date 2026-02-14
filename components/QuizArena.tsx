
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Target, Stars, ArrowRight, BrainCircuit, Users, Zap, 
  ShieldCheck, MessageSquare, Send, X, Bot, Award, Sparkles,
  ChevronLeft, Loader2, Info, Gavel, Timer, Swords
} from 'lucide-react';
import { getDebateResponse, getDailyBlitzQuiz } from '../services/geminiService';
import { QuestType } from '../types';
import MarkdownText from './MarkdownText';

interface QuizArenaProps {
  onExp: (amount: number) => void;
  showToast: (message: string) => void;
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
      handleAnswer(''); // Auto fail if time runs out
    }
    return () => clearInterval(timer);
  }, [timeLeft, quizState, mode]);

  const startDebate = (topic: string) => {
    setActiveTopic(topic);
    setMode('debate');
    setMessages([{ role: 'ai', text: `Tôi đã sẵn sàng. Chủ đề là: "${topic}". Bạn ủng hộ hay phản đối quan điểm này? Hãy đưa ra luận điểm đầu tiên của bạn.` }]);
  };

  const handleSendDebate = async () => {
    if (!input.trim() || isTyping) return;
    const userText = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsTyping(true);
    if (onQuestProgress) onQuestProgress('ai_interaction', 1);

    try {
      const response = await getDebateResponse(newMessages, activeTopic);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      onExp(5);
    } catch (error) {
      showToast("AI đang suy ngẫm quá sâu, hãy thử lại nhé!");
    } finally {
      setIsTyping(false);
    }
  };

  const startQuizMatch = async () => {
    setMode('quiz_match');
    setQuizState('matching');
    setQuestions([]);
    setScore(0);
    setOpponentScore(0);
    
    // Simulate matching
    setTimeout(async () => {
        setOpponentInfo({
            name: ['Học Bá 2k7', 'Thánh Toán', 'Sát Thủ Lý', 'Master English'][Math.floor(Math.random() * 4)],
            avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${Math.random()}`
        });
        
        try {
            const qs = await getDailyBlitzQuiz("Kiến thức tổng hợp THPT");
            if (qs.length > 0) {
                setQuestions(qs);
                setQuizState('playing');
                setCurrentQ(0);
                setTimeLeft(15);
            } else {
                setMode('lobby');
                showToast("Không tìm thấy đối thủ, thử lại sau!");
            }
        } catch (e) {
            setMode('lobby');
            showToast("Lỗi kết nối đấu trường!");
        }
    }, 2000);
  };

  const handleAnswer = (option: string) => {
    const q = questions[currentQ];
    const isCorrect = option === q.answer || option.startsWith(q.answer);
    
    if (isCorrect) {
        setScore(s => s + 100 + timeLeft * 5);
        showToast("Chính xác! +Exp");
    }

    // Simulate opponent (60% win rate)
    if (Math.random() > 0.4) {
        setOpponentScore(s => s + 100 + Math.floor(Math.random() * 50));
    }

    if (currentQ < questions.length - 1) {
        setCurrentQ(c => c + 1);
        setTimeLeft(15);
    } else {
        setQuizState('result');
        const finalScore = score + (isCorrect ? 100 : 0);
        if (finalScore > opponentScore) {
            onExp(200);
            if (onQuestProgress) onQuestProgress('quiz_correct', questions.length);
        } else {
            onExp(50);
        }
    }
  };

  if (mode === 'quiz_match') {
      return (
        <div className="flex flex-col h-full animate-slide-in p-4 pb-32">
            {quizState === 'matching' && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <Loader2 size={64} className="text-indigo-600 animate-spin mb-6" />
                    <h3 className="text-2xl font-black text-slate-800 animate-pulse">ĐANG TÌM ĐỐI THỦ...</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest mt-2">Hệ thống đang quét server</p>
                </div>
            )}

            {quizState === 'playing' && questions.length > 0 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-lg border border-slate-100">
                        <div className="text-center w-20">
                            <span className="block text-[10px] font-black uppercase text-indigo-500">Bạn</span>
                            <span className="text-xl font-black text-slate-800">{score}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="text-3xl font-black text-amber-500 animate-pulse">{timeLeft}s</div>
                            <span className="text-[9px] font-bold text-slate-300 uppercase">Câu {currentQ + 1}/{questions.length}</span>
                        </div>
                        <div className="text-center w-20 opacity-70">
                            <span className="block text-[10px] font-black uppercase text-rose-500">{opponentInfo?.name}</span>
                            <span className="text-xl font-black text-slate-800">{opponentScore}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border-2 border-slate-50 shadow-xl">
                         <div className="text-lg font-bold text-slate-800 mb-6 leading-relaxed">
                             <MarkdownText text={questions[currentQ].question} />
                         </div>
                         <div className="grid grid-cols-1 gap-3">
                             {questions[currentQ].options.map((opt: string, i: number) => (
                                 <button key={i} onClick={() => handleAnswer(opt)} className="p-4 rounded-2xl border-2 border-slate-100 font-bold text-sm text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all text-left">
                                     <MarkdownText text={opt} />
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>
            )}

            {quizState === 'result' && (
                <div className="text-center space-y-6 pt-10 animate-slide-up">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-amber-400 blur-3xl opacity-30"></div>
                        {score > opponentScore ? <Trophy size={100} className="text-amber-500 relative z-10" /> : <ShieldCheck size={100} className="text-slate-400 relative z-10" />}
                    </div>
                    
                    <div>
                        <h2 className="text-4xl font-black text-slate-800 mb-2 uppercase">{score > opponentScore ? 'CHIẾN THẮNG!' : 'THẤT BẠI'}</h2>
                        <p className="text-slate-500 font-bold">{score > opponentScore ? 'Bạn đã hủy diệt đối thủ!' : 'Hãy phục thù vào lần sau!'}</p>
                    </div>

                    <div className="flex justify-center gap-8 items-end h-32">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 bg-indigo-500 rounded-t-2xl relative" style={{ height: '80%' }}>
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 font-black text-indigo-600">{score}</span>
                            </div>
                            <span className="font-black text-xs uppercase">Bạn</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 bg-rose-400 rounded-t-2xl relative opacity-50" style={{ height: `${Math.min(100, (opponentScore/score)*80)}%` }}>
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 font-black text-rose-400">{opponentScore}</span>
                            </div>
                            <span className="font-black text-xs uppercase">Đối thủ</span>
                        </div>
                    </div>

                    <button onClick={() => setMode('lobby')} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black shadow-xl uppercase tracking-widest">
                        Quay về sảnh
                    </button>
                </div>
            )}
        </div>
      );
  }

  if (mode === 'debate') {
    return (
      <div className="flex flex-col h-full animate-slide-in">
        <div className="bg-white/80 backdrop-blur-md p-4 border-b flex items-center justify-between shadow-sm sticky top-0 z-20">
          <button onClick={() => setMode('lobby')} className="p-2 text-slate-400 hover:text-indigo-600 transition-all">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">Đấu Trường Tranh Biện</h3>
            <p className="text-[10px] text-indigo-500 font-bold truncate max-w-[200px]">{activeTopic}</p>
          </div>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Gavel size={20} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-sm transition-all ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none font-medium'
              }`}>
                {m.text.includes('BẢNG ĐIỂM') ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 font-black text-indigo-600 border-b pb-2 mb-2">
                            <Award size={18} /> ĐÁNH GIÁ TỪ TRỌNG TÀI AI
                        </div>
                        <pre className="whitespace-pre-wrap font-sans">{m.text}</pre>
                    </div>
                ) : (
                   <MarkdownText text={m.text} />
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 p-5 rounded-[2rem] rounded-tl-none shadow-sm flex gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100 safe-area-bottom">
          <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-[2rem] focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50 transition-all border border-transparent focus-within:border-indigo-200">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendDebate()}
              placeholder="Nhập luận điểm của bạn..."
              className="flex-1 bg-transparent px-4 py-3 outline-none text-sm font-bold"
            />
            <button 
              onClick={handleSendDebate}
              disabled={!input.trim() || isTyping}
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                input.trim() && !isTyping ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
          <div className="flex justify-center mt-3 gap-4">
             <button onClick={() => setInput('Tóm tắt lại cuộc tranh biện và chấm điểm cho tôi.')} className="text-[10px] font-black text-slate-400 uppercase hover:text-indigo-600 transition-colors">Kết thúc & Chấm điểm</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 animate-slide-in max-w-2xl mx-auto pb-10">
      <div className="bg-gradient-to-br from-indigo-800 via-indigo-600 to-purple-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:scale-125 transition-transform duration-700"><BrainCircuit size={160}/></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">V3 Pro Edition</span>
          </div>
          <h2 className="text-4xl font-black mb-3 tracking-tighter">Arena Lobby</h2>
          <p className="text-indigo-100 text-sm max-w-[320px] font-semibold leading-relaxed mb-8 opacity-90">
            Nơi tri thức va chạm. Thách thức AI Siêu Trí Tuệ trong những cuộc tranh luận nảy lửa.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
                onClick={startQuizMatch}
                className="px-8 py-4 bg-white text-indigo-600 rounded-[1.5rem] font-black text-sm shadow-xl active:scale-95 transition-all flex items-center gap-3 hover:gap-5"
            >
                GHÉP TRẬN QUIZ <Swords size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Debate Mode Section */}
      <div className="glass rounded-[2.5rem] border-white shadow-xl p-8 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <MessageSquare size={24} />
            </div>
            <div>
                <h3 className="font-black text-slate-800 text-lg tracking-tight">Tranh Biện Với AI</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nâng tầm tư duy phản biện</p>
            </div>
            <div className="ml-auto flex items-center gap-1 bg-amber-100 text-amber-600 px-3 py-1 rounded-full">
                <Sparkles size={12} />
                <span className="text-[10px] font-black">PRO</span>
            </div>
        </div>

        <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 mb-4 px-1">Chọn một chủ đề để bắt đầu màn đối đầu:</p>
            {DEBATE_TOPICS.map((topic, i) => (
                <button 
                    key={i}
                    onClick={() => startDebate(topic)}
                    className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.8rem] hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50 transition-all group text-left"
                >
                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 pr-4">{topic}</span>
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowRight size={18} />
                    </div>
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
            { icon: Trophy, label: "Hạng", val: "Vàng I", color: "text-amber-500", bg: "bg-amber-50" },
            { icon: Zap, label: "Win Rate", val: "68%", color: "text-indigo-500", bg: "bg-indigo-50" },
            { icon: Gavel, label: "Debate", val: "Level 5", color: "text-teal-500", bg: "bg-teal-50" }
        ].map((item, i) => (
            <div key={i} className="glass p-5 rounded-[2rem] border-white shadow-sm text-center">
                <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-3 mx-auto`}>
                    <item.icon size={20} />
                </div>
                <h4 className="font-bold text-slate-800 text-xs mb-1 tracking-tight">{item.val}</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.label}</p>
            </div>
        ))}
      </div>
    </div>
  );
};

export default QuizArena;
