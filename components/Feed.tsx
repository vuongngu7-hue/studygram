
import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Plus, Heart, Sparkles, MessageSquare, X, Send, ShieldCheck, Share2, Loader2 } from 'lucide-react';
import { Post, UserProfile, PostType } from '../types';
import { checkVibePost, suggestHashtags } from '../services/geminiService';
import MarkdownText from './MarkdownText';

const Feed: React.FC<{ userData: UserProfile; onExp: (n: number) => void; showToast: (m: string, t: 'success' | 'error') => void }> = ({ userData, onExp, showToast }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PostType | 'all'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Optimization: Lazy Loading / Infinite Scroll
  const [visibleCount, setVisibleCount] = useState(8);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('studygram_posts');
    if (saved) {
      try {
        const parsedPosts = JSON.parse(saved);
        // Ensure comments array exists for all posts (legacy data support)
        const sanitizedPosts = parsedPosts.map((p: any) => ({
          ...p,
          comments: Array.isArray(p.comments) ? p.comments : [],
          likes: Array.isArray(p.likes) ? p.likes : [],
          hashtags: Array.isArray(p.hashtags) ? p.hashtags : []
        }));
        setPosts(sanitizedPosts);
      } catch (e) {
        console.error("Error loading posts", e);
      }
    } else {
      setPosts([{
        id: 'p1', uid: 'admin', userName: 'Hệ thống StudyGram 🛡️', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Admin',
        content: 'Chào mừng các học giả tới **StudyGram V7 Supreme**! 🚀\n\nĐã tích hợp Gia sư đa chế độ và fix sạch lỗi cũ. Cùng học thôi!', category: 'Hệ thống', type: 'event', mood: '🚀', createdAt: Date.now(), likes: [], comments: [], isPinned: true, aiAnalysis: 'Hệ thống đang hoạt động với hiệu suất tối đa!'
      }]);
    }
  }, []);

  // Infinite Scroll Logic
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 5);
      }
    }, { rootMargin: '200px' });

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [loadMoreRef, activeTab]); // Dependencies ensure observer is recreated if ref changes (rare) or logic changes

  // Reset pagination on tab change
  useEffect(() => {
    setVisibleCount(8);
  }, [activeTab]);

  const handleAddPost = async (content: string) => {
    setIsAnalyzing(true);
    try {
      const vibe = await checkVibePost(content);
      const hashtags = await suggestHashtags(content);
      const newPost: Post = {
        id: Date.now().toString(), uid: userData.uid, userName: userData.name, avatar: userData.avatar,
        content, category: 'Kiến thức', type: 'knowledge', mood: '📚',
        createdAt: Date.now(), likes: [], comments: [], hashtags, aiAnalysis: vibe.comment
      };
      const updated = [newPost, ...posts];
      setPosts(updated);
      localStorage.setItem('studygram_posts', JSON.stringify(updated));
      onExp(25);
      setIsModalOpen(false);
      // Scroll to top when adding new post
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLike = useCallback((id: string) => {
    setPosts(prev => {
        const updated = prev.map(p => p.id === id ? { ...p, likes: p.likes.includes(userData.uid) ? p.likes.filter(u => u !== userData.uid) : [...p.likes, userData.uid] } : p);
        localStorage.setItem('studygram_posts', JSON.stringify(updated));
        return updated;
    });
  }, [userData.uid]);

  const handleComment = useCallback((id: string, text: string) => {
    if (!text.trim()) return;
    setPosts(prev => {
        const updated = prev.map(p => p.id === id ? { 
            ...p, 
            comments: [...(p.comments || []), { id: Date.now().toString(), userName: userData.name, avatar: userData.avatar, content: text.trim(), createdAt: Date.now() }] 
        } : p);
        localStorage.setItem('studygram_posts', JSON.stringify(updated));
        return updated;
    });
  }, [userData]);

  const filteredPosts = posts.filter(p => activeTab === 'all' || p.type === activeTab);
  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl mx-auto pb-40 px-1">
      <div className="bg-white p-6 rounded-[3rem] shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all border border-slate-100" onClick={() => setIsModalOpen(true)}>
        <img src={userData.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm" />
        <span className="text-slate-400 font-bold">Hôm nay fen học được gì hay?...</span>
      </div>

      <div className="flex gap-2 p-1.5 bg-white/60 backdrop-blur-md rounded-full w-fit border border-white/50 shadow-sm sticky top-24 z-20">
        {['all', 'knowledge', 'meme', 'event'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{t === 'all' ? 'Feed' : t}</button>
        ))}
      </div>

      <div className="space-y-6 min-h-[50vh]">
        {visiblePosts.map(post => (
          <PostCard key={post.id} post={post} userData={userData} onLike={handleLike} onComment={handleComment} showToast={showToast} />
        ))}
        
        {/* Infinite Scroll Trigger */}
        {hasMore && (
            <div ref={loadMoreRef} className="py-8 flex justify-center items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                <Loader2 className="animate-spin" size={16} /> Đang tải thêm...
            </div>
        )}
        
        {!hasMore && filteredPosts.length > 5 && (
            <div className="py-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
                Đã hiển thị toàn bộ bài viết
            </div>
        )}

        {filteredPosts.length === 0 && (
            <div className="py-20 text-center opacity-50">
                <p className="text-slate-400 font-black uppercase tracking-widest">Chưa có bài viết nào</p>
            </div>
        )}
      </div>

      {isModalOpen && <CreatePostModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddPost} isAnalyzing={isAnalyzing} />}
    </div>
  );
};

const PostCard = memo(({ post, userData, onLike, onComment, showToast }: any) => {
    const [commenting, setCommenting] = useState(false);
    const [txt, setTxt] = useState('');
    const hasLiked = (post.likes || []).includes(userData.uid);

    const handleShare = async () => {
        const shareData = {
            title: `Bài viết của ${post.userName} trên StudyGram`,
            text: post.content,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                showToast("Đã chia sẻ thành công!", "success");
            } catch (err) {
                console.log("Share cancelled");
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${post.content}\n\n- ${post.userName} @StudyGram`);
                showToast("Đã sao chép vào clipboard!", "success");
            } catch (e) {
                showToast("Lỗi chia sẻ", "error");
            }
        }
    };

    const submitComment = () => {
        if (!txt.trim()) return;
        onComment(post.id, txt);
        setTxt('');
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-xl relative overflow-hidden group">
            <div className="flex gap-4 mb-4">
                <img src={post.avatar} className="w-12 h-12 rounded-2xl border-2 border-slate-50" />
                <div>
                    <h4 className="font-black text-slate-800 text-sm flex items-center gap-1">{post.userName} {post.type === 'event' && <ShieldCheck size={14} className="text-amber-500" />}</h4>
                    <span className="text-[9px] font-black uppercase text-indigo-500">#{post.category}</span>
                </div>
            </div>
            <div className="text-sm md:text-base leading-relaxed mb-4 font-bold text-slate-700 whitespace-pre-wrap"><MarkdownText text={post.content} /></div>
            
            {post.aiAnalysis && (
                <div className="p-4 bg-indigo-50/50 rounded-2xl mb-4 border border-indigo-100/50 flex gap-3 items-start">
                    <Sparkles size={16} className="text-indigo-600 shrink-0 mt-1" />
                    <p className="text-[10px] font-bold text-indigo-900 italic leading-relaxed">{post.aiAnalysis}</p>
                </div>
            )}

            <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                <button onClick={() => onLike(post.id)} className={`flex items-center gap-1.5 text-[10px] font-black ${hasLiked ? 'text-rose-500' : 'text-slate-400'}`}><Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} /> {(post.likes || []).length}</button>
                <button onClick={() => setCommenting(!commenting)} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400"><MessageSquare size={18} /> {(post.comments || []).length}</button>
                <button onClick={handleShare} className="ml-auto text-slate-300 hover:text-indigo-600 transition-colors"><Share2 size={16}/></button>
            </div>

            {commenting && (
                <div className="mt-4 animate-slide-up space-y-3">
                    <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-2xl no-scrollbar">
                        {(post.comments || []).map((c: any) => (
                            <div key={c.id} className="flex gap-2 text-[10px] font-bold text-slate-600"><span className="text-indigo-600">{c.userName}:</span> {c.content}</div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitComment()} className="flex-1 bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-bold outline-none" placeholder="Viết bình luận..." />
                        <button onClick={submitComment} className="p-2 bg-indigo-600 text-white rounded-xl"><Send size={14}/></button>
                    </div>
                </div>
            )}
        </div>
    );
});

const CreatePostModal = ({ onClose, onSubmit, isAnalyzing }: any) => {
    const [c, setC] = useState('');
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-6 animate-slide-up">
                <div className="flex justify-between items-center"><h3 className="text-xl font-black text-slate-800">Đăng bài</h3><button onClick={onClose}><X size={20}/></button></div>
                <textarea value={c} onChange={e => setC(e.target.value)} placeholder="Hôm nay có gì hay?" className="w-full h-32 bg-slate-50 rounded-2xl p-4 text-sm font-bold outline-none resize-none" />
                <button onClick={() => onSubmit(c)} disabled={!c.trim() || isAnalyzing} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl flex justify-center items-center gap-2">
                    {isAnalyzing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'ĐĂNG NGAY'}
                </button>
            </div>
        </div>
    );
};

export default Feed;
    