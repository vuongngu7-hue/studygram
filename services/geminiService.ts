import { GoogleGenAI, Type } from "@google/genai";

const FLASH_MODEL = 'gemini-3-flash-preview';

// Initialize Gemini AI client safely
const getAIInstance = () => {
  let apiKey = '';
  
  // 1. Try process.env (System Requirement)
  try {
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || '';
    }
  } catch (e) {
    // Ignore ReferenceError
  }

  // 2. Try import.meta.env (Vite/User Environment Fallback)
  if (!apiKey) {
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
      }
    } catch (e) {
      // Ignore
    }
  }

  return new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });
};

const parseGeminiJSON = (text: string, defaultValue: any) => {
  try {
    if (!text) return defaultValue;
    // Remove markdown code blocks
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // Find the first '{' or '[' and the last '}' or ']'
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    // Determine if we are looking for an object or an array
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx !== -1) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
    
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Fail:", e, text);
    return defaultValue;
  }
};

export const getTutorResponse = async (msg: string, mode: 'teen' | 'academic' = 'teen') => {
  const instructions = {
    teen: "Bạn là một gia sư AI người Việt Nam chính hiệu, thuộc thế hệ Gen Z (2k). Phong cách nói chuyện: Lầy lội, hài hước, thân thiện, hay dùng teencode và slang giới trẻ (như 'fen', 'khum', 'u là trời', 'xỉu up xỉu down', 'keo lỳ', 'ét o ét'). Xưng hô: 'Tui' - 'Fen' hoặc 'Bạn iu'. Nhiệm vụ: Giải thích kiến thức học đường một cách dễ hiểu nhất, ví dụ thực tế, không giáo điều. Yêu cầu BẮT BUỘC về format: Mọi công thức Toán/Lý/Hóa PHẢI viết bằng LaTeX đặt trong dấu $ (ví dụ: $\\int x^2 dx$). Trình bày thoáng, icon tung tóe.",
    academic: "Bạn là giáo sư học thuật uyên bác. Phong cách: Trang trọng, gãy gọn, chuyên sâu. Yêu cầu BẮT BUỘC về toán học: Mọi công thức (tích phân, đạo hàm, phân số...) PHẢI viết bằng LaTeX đặt trong dấu $ cho nội dung dòng (ví dụ $\\frac{a}{b}$) và $$ cho công thức riêng dòng. Giải thích từng bước logic."
  };

  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: msg,
      config: { 
        systemInstruction: instructions[mode],
        temperature: mode === 'teen' ? 0.85 : 0.4 
      }
    });
    return res.text || "Mạng lag quá fen ơi, hỏi lại đi!";
  } catch (e: any) {
    console.error(e);
    if (e.message?.includes('API key')) return "Lỗi API Key rồi fen! Kiểm tra file .env nhé.";
    return "Hic, AI đang sập nguồn, chờ xíu nha fen!";
  }
};

export const generateExamRoadmap = async (grade: string, subject: string): Promise<any> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Lập lộ trình 5 bước học Lớp ${grade} môn ${subject}. Ngôn ngữ: Tiếng Việt. Trả về JSON format: {"roadmap": [{"id": "1", "title": "Tên chương", "difficulty": "theory", "topics": ["Chủ đề 1", "Chủ đề 2"]}]}`,
      config: { responseMimeType: "application/json" }
    });
    return parseGeminiJSON(response.text, { roadmap: [] });
  } catch (e) {
    console.error(e);
    return { roadmap: [] };
  }
};

export const generateExamPaper = async (subject: string, grade: string, difficulty: string, count: number = 10): Promise<any[]> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo ${count} câu trắc nghiệm Lớp ${grade} ${subject}, độ khó: ${difficulty}. Ngôn ngữ: Tiếng Việt chuẩn. Nếu có công thức toán, BẮT BUỘC dùng LaTeX trong dấu $. Trả về JSON Array: [{"question": "Nội dung câu hỏi", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "explanation": "Giải thích ngắn gọn với LaTeX"}]`,
      config: { responseMimeType: "application/json" }
    });
    const data = parseGeminiJSON(response.text, []);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const analyzeStudyImage = async (base64Image: string, prompt: string) => {
  try {
    const ai = getAIInstance();
    // Extract real mime type if possible, default to jpeg
    const mimeType = base64Image.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
    const base64Data = base64Image.split(',')[1];

    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: prompt + " (Trả lời bằng tiếng Việt phong cách Gen Z thân thiện, ngắn gọn, dễ hiểu. Nếu có toán, dùng LaTeX $...$)" }
        ]
      }
    });
    return res.text || "Hình mờ quá fen ơi, chụp lại đi.";
  } catch (e) {
    console.error(e);
    return "Lỗi xử lý ảnh rùi fen.";
  }
};

export const getDailyBlitzQuiz = async (subject: string = "Kiến thức tổng hợp"): Promise<any[]> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo 5 câu trắc nghiệm nhanh chủ đề ${subject}, kiến thức cấp 3 THPT. Ngôn ngữ: Tiếng Việt. JSON: [{"question": "...", "options": ["A...", "B...", "C...", "D..."], "answer": "Đáp án đúng (chỉ ghi nội dung hoặc ký tự)"}]`,
      config: { responseMimeType: "application/json" }
    });
    return parseGeminiJSON(response.text, []);
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const getDebateResponse = async (history: any[], topic: string) => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: history.map(h => ({ role: h.role === 'ai' ? 'model' : 'user', parts: [{ text: h.text }] })),
      config: { systemInstruction: `Bạn là một Debater Gen Z Việt Nam cực gắt, chuyên gia 'phản dame'. Chủ đề tranh biện: "${topic}". Phong cách: Sắc sảo, dùng từ ngữ giới trẻ (như 'out trình', 'ao chình', 'chấn động', 'flex'), lập luận chặt chẽ nhưng giọng điệu đời thường, không sách vở. Nhiệm vụ: Phản biện lại ý kiến người dùng một cách ngắn gọn, súc tích (dưới 100 từ).` }
    });
    return res.text || "Đang loading lý lẽ...";
  } catch (e) {
    console.error(e);
    return "AI đang suy ngẫm...";
  }
};

export const checkVibePost = async (content: string) => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Đóng vai một học sinh Gen Z Việt Nam vui tính, lầy lội. Hãy đọc nội dung sau: "${content}". Trả về JSON chứa một câu bình luận ngắn (comment) dưới 15 từ, dùng slang tiếng Việt tự nhiên (như 'đỉnh nóc', 'chấn động', 'keo lỳ', '10 điểm', 'xỉu up xỉu down', 'ét o ét', 'mãi mận') để nhận xét về nội dung đó. JSON format: {"comment": "Nội dung bình luận"}`,
      config: { responseMimeType: "application/json" }
    });
    return parseGeminiJSON(res.text, {comment: "Vibe check ổn áp!"});
  } catch (e) {
    console.error(e);
    return {comment: "Vibe này lạ quá!"};
  }
};

export const getOracleReading = async () => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Bói bài Tarot học đường phong cách Gen Z Việt Nam hài hước. JSON format: {"cardName": "Tên lá bài (Tiếng Việt chế, vd: 'Kẻ Hủy Diệt Deadline')", "rarity": "Độ hiếm (Common/Rare/Legendary)", "message": "Lời tiên tri ngắn gọn, lầy lội, dùng teencode", "luckyItem": "Vật phẩm may mắn (đồ dùng học tập hoặc đồ ăn vặt)"}`,
      config: { responseMimeType: "application/json" }
    });
    return parseGeminiJSON(res.text, {});
  } catch (e) {
    console.error(e);
    return { cardName: "Lá bài 404", rarity: "Common", message: "Mất kết nối vũ trụ rồi fen.", luckyItem: "Nút F5" };
  }
};

export const summarizeText = async (text: string) => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tóm tắt nội dung sau một cách súc tích, logic và dễ hiểu nhất bằng Tiếng Việt. Sử dụng Markdown để trình bày:\n\n${text}`,
      config: { systemInstruction: "Bạn là một chuyên gia tóm tắt tài liệu học thuật cho học sinh Việt Nam." }
    });
    return res.text || "Không có phản hồi từ AI.";
  } catch (e) {
    console.error(e);
    return "Lỗi tóm tắt văn bản.";
  }
};

export const generateFlashcards = async (text: string) => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo bộ flashcards giúp ghi nhớ từ nội dung này. Ngôn ngữ: Tiếng Việt. JSON: [{"front": "Câu hỏi/Khái niệm", "back": "Câu trả lời/Giải thích"}]\n\nNội dung: ${text}`,
      config: { responseMimeType: "application/json" }
    });
    return parseGeminiJSON(res.text, []);
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const generateMindMap = async (topic: string) => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo sơ đồ tư duy phân cấp cho chủ đề: "${topic}". Trình bày bằng Markdown sử dụng các cấp độ tiêu đề (#, ##, ###) và danh sách gạch đầu dòng lồng nhau. Hãy làm cho nó thật logic và bao quát. Ngôn ngữ: Tiếng Việt.`,
      config: { systemInstruction: "Bạn là chuyên gia về sơ đồ tư duy (Mind Map) chuyên sâu." }
    });
    return res.text || "Không tạo được sơ đồ.";
  } catch (e) {
    console.error(e);
    return "Lỗi tạo sơ đồ tư duy.";
  }
};

export const gradeEssay = async (essay: string, grade: string) => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Bạn là giám khảo chấm văn khó tính nhưng công tâm. Hãy chấm bài văn sau (Lớp ${grade}) theo thang điểm 10.
      Yêu cầu trả về JSON: {
        "score": number (ví dụ 8.5),
        "goodPoints": ["điểm tốt 1", "điểm tốt 2"],
        "badPoints": ["cần khắc phục 1", "cần khắc phục 2"],
        "suggestion": "Lời khuyên tổng quát để cải thiện (dùng giọng văn khích lệ)"
      }
      
      Bài văn: ${essay}`,
      config: { responseMimeType: "application/json" }
    });
    return parseGeminiJSON(res.text, { score: 0, goodPoints: [], badPoints: [], suggestion: "Lỗi chấm bài." });
  } catch (e) {
    console.error(e);
    return { score: 0, goodPoints: [], badPoints: [], suggestion: "AI đang bận, thử lại sau nhé." };
  }
};

export const generateStudyPlan = async (input: string) => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Tạo một thời khóa biểu học tập hợp lý dựa trên thông tin: "${input}". 
      Trình bày dưới dạng bảng Markdown. Bao gồm cả thời gian nghỉ ngơi (Pomodoro). 
      Thêm lời khuyên động viên ở cuối. Ngôn ngữ: Tiếng Việt.`,
    });
    return res.text || "Không tạo được lịch.";
  } catch (e) {
    console.error(e);
    return "Lỗi tạo lịch học.";
  }
};

export const downloadAsFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const suggestHashtags = async (content: string) => ["#study", "#learn", "#studygram"];

export const roastOrToast = async (user: any, mode: string) => {
    try {
        const ai = getAIInstance();
        const prompt = mode === 'roast' 
            ? `Roast (chê bai phũ phàng nhưng hài hước) hồ sơ học tập này theo phong cách Gen Z Việt Nam. Tên: ${user.name}, Level: ${Math.floor(user.exp/100)}, Streak: ${user.streak} ngày. Ngắn dưới 30 từ, dùng slang như 'quê chữ ê kéo dài', 'ố dề', 'xu cà na', 'ảo ma canada'.`
            : `Toast (khen ngợi tâng bốc tận mây xanh) hồ sơ học tập này theo phong cách Gen Z Việt Nam. Tên: ${user.name}, Level: ${Math.floor(user.exp/100)}, Streak: ${user.streak} ngày. Ngắn dưới 30 từ, dùng slang như 'đỉnh nóc', '10 điểm không có nhưng', 'mãi mận'.`;
            
        const res = await ai.models.generateContent({
            model: FLASH_MODEL,
            contents: prompt
        });
        return res.text || (mode === 'roast' ? "Gà quá fen ơi!" : "Đỉnh chóp!");
    } catch (e) {
        console.error(e);
        return mode === 'roast' ? "Học thế này thì chỉ có đi chăn vịt!" : "Đỉnh cao trí tuệ Việt!";
    }
};

export const getChampionTip = async (name: string) => {
    try {
        const ai = getAIInstance();
        const res = await ai.models.generateContent({
            model: FLASH_MODEL,
            contents: `Cho một lời khuyên học tập "bá đạo", hài hước cho bạn ${name}, phong cách Gen Z Việt Nam ngắn gọn.`
        });
        return res.text;
    } catch (e) {
        console.error(e);
        return "Bí kíp là đừng có ngủ khi đang học.";
    }
};

export const getOfficialExamLinks = async (s: string, y: string, p: string, g: string) => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Gợi ý 5 nguồn tài liệu hoặc từ khóa tìm kiếm uy tín cho đề thi môn ${s} lớp ${g} năm ${y} tại ${p}. Trả về JSON: [{"web": {"title": "Tên nguồn", "uri": "https://google.com/search?q=đề+thi+${s}+${g}+${y}+${p}"}}]`,
      config: { responseMimeType: "application/json" }
    });
    return parseGeminiJSON(res.text, []);
  } catch (e) {
    console.error(e);
    return [];
  }
};