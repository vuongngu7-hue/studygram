
import React, { useState } from 'react';
import { 
  Wand2, BookOpen, ListChecks, CalendarDays, 
  ChevronRight, ArrowLeft, Loader2, Sparkles, 
  Copy, Check, LayoutGrid, RotateCw, Download, FileText,
  Smile, ImageIcon, Network, ChevronDown, GraduationCap, Map,
  CheckCircle2, AlertCircle, Search, Globe, Filter,
  Gem, Eye, Moon, PenTool, Calendar, ThumbsUp, ThumbsDown, Edit3, ExternalLink
} from 'lucide-react';
import { 
  summarizeText, generateFlashcards, downloadAsFile, 
  generateMindMap,
  getOfficialExamLinks, generateExamPaper, getOracleReading,
  gradeEssay, generateStudyPlan, upgradeContent
} from '../services/geminiService';
import MarkdownText from './MarkdownText';

const StudyTools: React.FC<{ onExp: (amount: number) => void }> = ({ onExp }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [examLinks, setExamLinks] = useState<any[]>([]);
  const [filters, setFilters] = useState({ year: '2024', subject: 'Toán học', province: 'Hà Nội', grade: '12' });

  // Oracle State
  const [isFlipped, setIsFlipped] = useState(false);
  const [oracleCard, setOracleCard] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const tools = [
    { 
      id: 'content_upgrader', 
      name: 'Biên tập & Nâng cấp', 
      desc: 'Sửa lỗi chính tả, ngữ pháp và nâng cấp diễn đạt chuyên nghiệp.', 
      icon: Edit3, 
      color: 'bg-violet-600', 
      gradient: 'from-violet-500 to-purple-600',
      placeholder: 'Dán nội dung cần biên tập vào đây...'
    },
    { 
      id: 'exam_bank', 
      name: 'Kho Đề Sở GD', 
      desc: 'Truy tìm đề thi chính thức từ Google Search Grounding.', 
      icon: Search, 
      color: 'bg-indigo-600', 
      gradient: 'from-indigo-500 to-blue-600',
      placeholder: 'Tìm kiếm đề thi (VD: Đề Toán 2024 Hà Nội)...'
    },
    { 
      id: 'quiz_creator', 
      name: 'AI Quiz Gen', 
      desc: 'Tự động tạo bộ đề trắc nghiệm theo chuẩn Sở GD.', 
      icon: GraduationCap, 
      color: 'bg-rose-500', 
      gradient: 'from-rose-500 to-pink-600',
      placeholder: 'Chủ đề ôn thi...'
    },
    { 
      id: 'essay_grader', 
      name: 'Chấm Văn AI', 
      desc: 'Chấm điểm bài văn bởi Gemini AI.', 
      icon: PenTool, 
      color: 'bg-orange-500', 
      gradient: 'from-orange-500 to-amber-600',
      placeholder: 'Dán bài văn của bạn vào đây để AI chấm điểm...'
    },
    { 
      id: 'scheduler', 
      name: 'Lập Kế Hoạch', 
      desc: 'Tạo thời khóa biểu học tập thông minh, cân bằng.', 
      icon: Calendar, 
      color: 'bg-cyan-500', 
      gradient: 'from-cyan-500 to-teal-600',
      placeholder: 'VD: Tôi rảnh tối 2-4-6 từ 7h-9h, muốn ôn Toán và Lý...'
    },
    { 
      id: 'mindmap', 
      name: 'Sơ đồ tư duy', 
      desc: 'Phân tích chủ đề thành sơ đồ tư duy logic.', 
      icon: Network, 
      color: 'bg-emerald-500', 
      gradient: 'from-emerald-500 to-green-600',
      placeholder: 'Nhập chủ đề bạn muốn lập sơ đồ...'
    }
  ];

  const handleRunTool = async () => {
    if (!input.trim() && activeTool !== 'exam_bank') return;
    setLoading(true);
    setResult(null);
    setExamLinks([]);
    setError(null);

    try {
      if (activeTool === 'content_upgrader') {
        const res = await upgradeContent(input);
        setResult(res);
        onExp(25);
      } else if (activeTool === 'exam_bank') {
        const links = await getOfficialExamLinks(filters.subject, filters.year, filters.province, filters.grade);
        setExamLinks(links);
        onExp(15);
      } else if (activeTool === 'quiz_creator') {
        const res = await generateExamPaper(input || filters.subject, filters.grade, "practice", 10);
        setResult(res);
        onExp(30);
      } else if (activeTool === 'essay_grader') {
        const res = await gradeEssay(input, filters.grade);
        setResult(res);
        onExp(40);
      } else if (activeTool === 'scheduler') {
        const res = await generateStudyPlan(input);
        setResult(res);
        onExp(20);
      } else if (activeTool === 'mindmap') {
        const res = await generateMindMap(input);
        setResult(res);
        onExp(20);
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Không thể thực hiện tác vụ này.';
      setError(msg);
      setResult(msg);
    } finally {
      setLoading(false);
    }
  };

  const summonOracle = async () => {
    if (loading) return;
    setLoading(true);
    setIsFlipped(false);
    setOracleCard(null);
    try {
      const data = await getOracleReading();
      setOracleCard(data);
      setTimeout(() => {
        setIsFlipped(true);
        onExp(50);
      }, 500);
    } catch (e: any) {
       setOracleCard({ cardName: "Lỗi", rarity: "Common", message: e.message || "Lỗi kết nối", luckyItem: "F5" });
       setTimeout(() => setIsFlipped(true), 500);
    } finally {
      setLoading(false);
    }
  };

  const currentTool = tools.find(t => t.id === activeTool);

  return (
    <div className="space-y-8 animate-slide-up max-w-2xl mx-auto w-full pb-32 px-2">
      {/* The Academic Oracle Section */}
      <div className="relative group overflow-hidden rounded-[3rem] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 animate-pulse"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        
        <div className="glass p-8 relative z-10 bg-slate-900/40 text-white border-white/10">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.6)]">
                    <Eye size={24} className="text-white" />
                 </div>
                 <div>
                    <h3 className="font-black text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-200">The Academic Oracle</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-300 opacity-80">Góc tâm linh học đường</p>
                 </div>
              </div>
              <button 
                onClick={summonOracle}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-purple-400/30"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Moon size={12} />}
                {loading ? 'Đang kết nối...' : 'Rút bài (50 EXP)'}
              </button>
           </div>

           <div className="h-64 perspective-1000 flex justify-center items-center">
              {!oracleCard && !loading ? (
                <div className="text-center opacity-40 space-y-3">
                   <Gem size={56} className="mx-auto text-purple-300" />
                   <p className="text-xs font-bold text-purple-200">Hãy đặt một câu hỏi trong tâm trí...</p>
                </div>
              ) : (
                <div className={`relative w-48 h-full transition-all duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`} onClick={() => isFlipped && setIsFlipped(!isFlipped)}>
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-purple-950 rounded-2xl border-2 border-purple-500/50 flex items-center justify-center backface-hidden shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                      <Eye size={48} className="text-purple-400 animate-pulse" />
                   </div>
                   <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-indigo-50 rounded-2xl border-4 border-amber-300 flex flex-col items-center justify-between p-4 rotate-y-180 backface-hidden shadow-[0_0_50px_rgba(255,255,255,0.4)] overflow-hidden">
                      <div className="text-center pt-2">
                         <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                           oracleCard?.rarity === 'Legendary' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500'
                         }`}>{oracleCard?.rarity || 'Common'}</span>
                         <h4 className="font-black text-slate-800 text-base mt-2 leading-tight line-clamp-2">{oracleCard?.cardName}</h4>
                      </div>
                      <div className="text-center flex-1 flex flex-col justify-center gap-2 my-2 overflow-y-auto no-scrollbar">
                         <p className="text-xs font-bold text-indigo-900 leading-relaxed italic">"{oracleCard?.message}"</p>
                      </div>
                      <div className="w-full bg-indigo-100/50 rounded-xl p-2 text-center mt-auto">
                         <div className="flex items-center justify-center gap-1 text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                            <Sparkles size={10} /> Lucky Item
                         </div>
                         <p className="text-xs font-black text-indigo-600 truncate">{oracleCard?.luckyItem}</p>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>

      {activeTool ? (
        <div className="animate-slide-in">
          <button onClick={() => { setActiveTool(null); setResult(null); setInput(''); setExamLinks([]); setError(null); }} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-6 font-black text-[10px] uppercase tracking-widest transition-colors bg-white px-4 py-2 rounded-full w-fit shadow-sm"><ArrowLeft size={14} /> Quay lại</button>
          
          <div className="glass rounded-[3rem] p-8 mb-8 border-2 border-white shadow-xl bg-white/60">
            <h3 className="font-black text-2xl mb-2 text-slate-800 flex items-center gap-3">
               <div className={`p-2 rounded-xl text-white ${currentTool?.color}`}>
                  {currentTool && <currentTool.icon size={24} />}
               </div>
               {currentTool?.name}
            </h3>
            <p className="text-slate-500 font-bold text-sm mb-6 pl-14">{currentTool?.desc}</p>

            {(activeTool === 'exam_bank' || activeTool === 'quiz_creator' || activeTool === 'essay_grader') && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="bg-white p-3 rounded-xl font-bold text-xs outline-none border border-slate-200 focus:border-indigo-400 transition-all">
                  {['2024', '2023', '2022', '2021', '2020'].map(y => <option key={y} value={y}>Năm {y}</option>)}
                </select>
                <select value={filters.subject} onChange={e => setFilters({...filters, subject: e.target.value})} className="bg-white p-3 rounded-xl font-bold text-xs outline-none border border-slate-200 focus:border-indigo-400 transition-all">
                  {['Toán học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filters.grade} onChange={e => setFilters({...filters, grade: e.target.value})} className="bg-white p-3 rounded-xl font-bold text-xs outline-none border border-slate-200 focus:border-indigo-400 transition-all">
                  {['10', '11', '12'].map(g => <option key={g} value={g}>Lớp {g}</option>)}
                </select>
              </div>
            )}

            <textarea 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder={currentTool?.placeholder} 
              className="w-full h-48 bg-slate-50 rounded-2xl p-5 outline-none border-2 border-transparent focus:border-indigo-200 focus:bg-white transition-all mb-4 font-bold text-sm leading-relaxed placeholder:text-slate-300 resize-none"
            />
            
            <button onClick={handleRunTool} disabled={loading} className={`w-full py-5 rounded-[1.8rem] text-white font-black shadow-lg transition-all flex items-center justify-center gap-3 bg-gradient-to-r ${currentTool?.gradient} hover:scale-[1.01] active:scale-95 disabled:opacity-50`}>
               {loading ? <RotateCw className="animate-spin"/> : <Sparkles size={20}/>} {loading ? 'AI đang xử lý...' : 'KÍCH HOẠT CÔNG CỤ'}
            </button>
            
            {error && (
              <div className="mt-4 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100 flex items-center gap-2">
                 <AlertCircle size={16}/> {error}
              </div>
            )}
          </div>

          {(result || examLinks.length > 0) && (
            <div className="animate-slide-up space-y-4">
               {activeTool === 'exam_bank' ? (
                  <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-lg">
                     <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Globe size={18} className="text-indigo-600"/> Kết quả tìm kiếm</h4>
                     <div className="space-y-3">
                        {examLinks.map((link, i) => (
                           <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="block p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all group">
                              <div className="font-bold text-sm text-indigo-700 mb-1 group-hover:underline">{link.title}</div>
                              <div className="text-[10px] text-slate-400 truncate">{link.uri}</div>
                           </a>
                        ))}
                        {examLinks.length === 0 && <p className="text-sm text-slate-500 italic">Không tìm thấy đề thi phù hợp.</p>}
                     </div>
                  </div>
               ) : activeTool === 'quiz_creator' && Array.isArray(result) ? (
                  <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-lg space-y-6">
                     <div className="flex justify-between items-center">
                        <h4 className="font-black text-slate-800">Đề thi đã tạo ({result.length} câu)</h4>
                        <button onClick={() => downloadAsFile('quiz.txt', JSON.stringify(result, null, 2))} className="text-indigo-600 font-bold text-xs flex items-center gap-1"><Download size={14}/> Lưu JSON</button>
                     </div>
                     {result.map((q: any, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="font-bold text-slate-700 mb-3"><span className="text-indigo-600">Câu {i+1}:</span> {q.question}</p>
                           <div className="grid grid-cols-1 gap-2 pl-4">
                              {q.options?.map((opt: string, idx: number) => (
                                 <div key={idx} className={`text-sm ${opt === q.answer ? 'text-green-600 font-bold' : 'text-slate-500'}`}>
                                    {String.fromCharCode(65+idx)}. {opt}
                                 </div>
                              ))}
                           </div>
                           <div className="mt-3 text-xs bg-indigo-100/50 p-3 rounded-xl text-indigo-800 italic">
                              💡 {q.explanation}
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-lg relative overflow-hidden">
                     <div className="flex justify-between items-start mb-4">
                        <h4 className="font-black text-slate-800 flex items-center gap-2"><Sparkles size={18} className="text-amber-500"/> Kết quả AI</h4>
                        <button onClick={() => { navigator.clipboard.writeText(typeof result === 'string' ? result : JSON.stringify(result)); }} className="text-slate-400 hover:text-indigo-600"><Copy size={18}/></button>
                     </div>
                     <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-medium">
                        {typeof result === 'string' ? <MarkdownText text={result} /> : <pre className="whitespace-pre-wrap font-mono text-xs bg-slate-50 p-4 rounded-xl">{JSON.stringify(result, null, 2)}</pre>}
                     </div>
                  </div>
               )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
           {tools.map(tool => (
              <button 
                key={tool.id} 
                onClick={() => setActiveTool(tool.id)}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group relative overflow-hidden"
              >
                 <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${tool.gradient} group-hover:scale-150 transition-transform duration-500`}></div>
                 <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg mb-4 bg-gradient-to-br ${tool.gradient}`}>
                    <tool.icon size={26} />
                 </div>
                 <h4 className="font-black text-slate-800 text-sm mb-1">{tool.name}</h4>
                 <p className="text-[10px] font-bold text-slate-400 leading-tight">{tool.desc}</p>
              </button>
           ))}
        </div>
      )}
    </div>
  );
};

export default StudyTools;
