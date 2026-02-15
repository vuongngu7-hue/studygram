
import { GoogleGenAI, Type } from "@google/genai";

const PRIMARY_FLASH_MODEL = 'gemini-2.0-flash-exp';
const PRIMARY_PRO_MODEL = 'gemini-2.0-flash-exp';
const FALLBACK_MODEL = 'gemini-2.0-flash-exp';

let activeFlashModel = PRIMARY_FLASH_MODEL;
let activeProModel = PRIMARY_PRO_MODEL;

const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

const safeGenerateContent = async (ai: GoogleGenAI, params: any, isPro = false) => {
  try {
    const model = isPro ? activeProModel : activeFlashModel;
    return await ai.models.generateContent({ ...params, model });
  } catch (error: any) {
    if (error.message?.includes("not found") || error.message?.includes("404") || error.message?.includes("not supported")) {
      console.warn(`Model failed. Switching to fallback: ${FALLBACK_MODEL}`);
      if (isPro) activeProModel = FALLBACK_MODEL;
      else activeFlashModel = FALLBACK_MODEL;
      return await ai.models.generateContent({ ...params, model: FALLBACK_MODEL });
    }
    throw error;
  }
};

const parseGeminiJSON = (text: string, defaultValue: any) => {
  if (!text) return defaultValue;
  try {
    return JSON.parse(text);
  } catch (e1) {
    try {
      let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e2) {
      try {
        const firstOpenBrace = text.indexOf('{');
        const lastCloseBrace = text.lastIndexOf('}');
        if (firstOpenBrace !== -1 && lastCloseBrace !== -1) {
            return JSON.parse(text.substring(firstOpenBrace, lastCloseBrace + 1));
        }
        return defaultValue;
      } catch (e3) {
        return defaultValue;
      }
    }
  }
};

export const checkConnection = async () => {
  try {
    const ai = getAIInstance();
    await safeGenerateContent(ai, { contents: "Ping" });
    return { success: true, message: `Đã kết nối (${activeFlashModel})` };
  } catch (e: any) {
    if (e.message === "MISSING_KEY") return { success: false, message: "Chưa nhập API Key" };
    return { success: false, message: e.message || "Lỗi kết nối mạng" };
  }
};

export const getChatResponse = async (message: string, history: any[], systemInstruction?: string) => {
  const ai = getAIInstance();
  
  // Format history correctly for Gemini API
  const formattedHistory = history.map(h => ({ 
    role: h.role === 'ai' ? 'model' : 'user', 
    parts: [{ text: h.text }] 
  }));

  const chatConfig = {
    model: activeProModel, 
    history: formattedHistory,
    config: { 
      temperature: 0.8, 
      systemInstruction: systemInstruction || 'Bạn là trợ lý học tập StudyGram. Trả lời ngắn gọn, trực tiếp, không dùng JSON.' 
    }
  };

  try {
    const chat = ai.chats.create(chatConfig);
    const res = await chat.sendMessage({ message });
    let text = res.text;

    // FIX: Nếu AI lỡ trả về JSON như trong ảnh lỗi, ta sẽ cố gắng parse lấy nội dung
    if (text.trim().startsWith('{') && text.includes("phan_hoi")) {
        try {
            const json = JSON.parse(text);
            if (json.phan_hoi) return json.phan_hoi;
            if (json.response) return json.response;
        } catch (e) {
            // Nếu parse lỗi thì trả về text gốc
        }
    }
    
    return text;
  } catch (error: any) {
     if (error.message?.includes("not found") || error.message?.includes("404")) {
        activeProModel = FALLBACK_MODEL;
        const fallbackChat = ai.chats.create({ ...chatConfig, model: FALLBACK_MODEL });
        const res = await fallbackChat.sendMessage({ message });
        return res.text;
     }
     throw error;
  }
};

export const searchEducationalResources = async (query: string) => {
  const ai = getAIInstance();
  try {
      const response = await ai.models.generateContent({
        model: PRIMARY_FLASH_MODEL, 
        contents: `Tìm 5 nguồn tài liệu học tập uy tín cho: ${query}.`,
        config: { tools: [{ googleSearch: {} }] },
      });
      const text = response.text;
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = sources.filter((chunk: any) => chunk.web && chunk.web.uri).map((chunk: any) => ({ title: chunk.web.title, uri: chunk.web.uri }));
      return { text, links };
  } catch (e) {
      const res = await safeGenerateContent(ai, {
          contents: `Gợi ý 5 nguồn tài liệu hoặc từ khóa tìm kiếm cho: ${query}`
      });
      return { text: res.text, links: [] };
  }
};

export const upgradeContent = async (content: string) => {
  const ai = getAIInstance();
  const res = await safeGenerateContent(ai, {
    contents: content,
    config: { 
      systemInstruction: "Bạn là biên tập viên chuyên nghiệp. Sửa lỗi và nâng cấp văn phong. Chỉ trả về kết quả.", 
      temperature: 0.7 
    }
  }, true); 
  return res.text;
};

export const getTutorResponse = async (msg: string) => {
  return getChatResponse(msg, [], ""); 
};

export const getDebateResponse = async (history: any[], topic: string) => {
  const ai = getAIInstance();
  const formattedHistory = history.map(h => ({ 
      role: h.role === 'ai' ? 'model' : 'user', 
      parts: [{ text: h.text }] 
  }));

  const res = await safeGenerateContent(ai, {
    contents: [...formattedHistory, { role: 'user', parts: [{ text: "Phản hồi luận điểm của tôi." }] }],
    config: { 
        systemInstruction: `Bạn là chuyên gia phản biện về: "${topic}".`,
        temperature: 0.9
    }
  }, true);
  return res.text;
};

export const getOfficialExamLinks = async (s: string, y: string, p: string, g: string) => {
  return (await searchEducationalResources(`Đề thi môn ${s} lớp ${g} năm ${y} tỉnh ${p}`)).links;
};

export const generateExamRoadmap = async (grade: string, subject: string) => {
  const ai = getAIInstance();
  const res = await safeGenerateContent(ai, {
    contents: `Tạo lộ trình ôn thi môn ${subject} lớp ${grade} gồm 5 chương. Trả về JSON: { roadmap: [{ id, title, topics: [], difficulty: "theory"|"practice"|"hardcore" }] }`,
    config: { responseMimeType: "application/json" }
  });
  return parseGeminiJSON(res.text, { roadmap: [] });
};

export const generateExamPaper = async (subject: string, grade: string, difficulty: string, count: number = 10) => {
  const ai = getAIInstance();
  const res = await safeGenerateContent(ai, {
    contents: `Tạo ${count} câu trắc nghiệm ${subject} lớp ${grade} độ khó ${difficulty}. Trả về JSON: [{ question, options: [], answer, explanation }]`,
    config: { responseMimeType: "application/json" }
  });
  return parseGeminiJSON(res.text, []);
};

export const analyzeStudyImage = async (base64Image: string, prompt: string) => {
  const ai = getAIInstance();
  const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
  const mimeType = base64Image.match(/data:([^;]+);/)?.[1] || 'image/jpeg';

  const res = await safeGenerateContent(ai, {
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: prompt + " (Giải thích chi tiết, dùng LaTeX)" }
      ]
    }
  });
  return res.text;
};

export const getDailyBlitzQuiz = async (subject: string) => {
  const ai = getAIInstance();
  const res = await safeGenerateContent(ai, {
    contents: `Tạo 5 câu trắc nghiệm nhanh chủ đề ${subject}. Trả về JSON: [{ question, options: [], answer }]`,
    config: { responseMimeType: "application/json" }
  });
  return parseGeminiJSON(res.text, []);
};

export const checkVibePost = async (content: string) => {
  const ai = getAIInstance();
  const res = await safeGenerateContent(ai, {
    contents: `Bình luận ngắn vibe Gen Z về: "${content}". Trả về JSON { comment: string }`,
    config: { responseMimeType: "application/json" }
  });
  return parseGeminiJSON(res.text, {comment: "Vibe check ổn áp! ✨"});
};

export const getOracleReading = async () => {
  const ai = getAIInstance();
  const res = await safeGenerateContent(ai, {
    contents: `Bói Tarot học đường vui vẻ. Trả về JSON { cardName, rarity, message, luckyItem }`,
    config: { responseMimeType: "application/json" }
  });
  return parseGeminiJSON(res.text, {});
};

export const gradeEssay = async (essay: string, grade: string) => {
  const ai = getAIInstance();
  const res = await safeGenerateContent(ai, {
    contents: `Chấm bài văn lớp ${grade}: ${essay}. Trả về JSON { score, goodPoints:[], badPoints:[], suggestion }`,
    config: { responseMimeType: "application/json" }
  }, true);
  return parseGeminiJSON(res.text, { score: 0, suggestion: "Lỗi chấm bài." });
};

export const generateStudyPlan = async (input: string) => {
  const ai = getAIInstance();
  const res = await safeGenerateContent(ai, { contents: `Tạo thời khóa biểu Markdown từ: "${input}".` });
  return res.text;
};

export const summarizeText = async (text: string) => {
  const ai = getAIInstance();
  const res = await safeGenerateContent(ai, { contents: `Tóm tắt: ${text}` });
  return res.text;
};

export const generateFlashcards = async (text: string) => {
  const ai = getAIInstance();
  const res = await safeGenerateContent(ai, {
    contents: `Tạo flashcards từ: ${text}. JSON format: [{front, back}]`,
    config: { responseMimeType: "application/json" }
  });
  return parseGeminiJSON(res.text, []);
};

export const generateMindMap = async (topic: string) => {
  const ai = getAIInstance();
  const res = await safeGenerateContent(ai, { contents: `Sơ đồ tư duy Markdown cho: ${topic}` }, true);
  return res.text;
};

export const downloadAsFile = (filename: string, text: string) => {
  const element = document.createElement("a");
  const file = new Blob([text], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const suggestHashtags = async (content: string) => ["#studygram", "#hoctap", "#genz"];

export const roastOrToast = async (user: any, mode: string) => {
    const ai = getAIInstance();
    const prompt = mode === 'roast' ? `Roast profile này: ${user.name}, Streak ${user.streak}` : `Toast profile này: ${user.name}, Streak ${user.streak}`;
    const res = await safeGenerateContent(ai, { contents: prompt });
    return res.text;
};

export const getChampionTip = async (name: string) => {
    const ai = getAIInstance();
    const res = await safeGenerateContent(ai, { contents: `Lời khuyên học tập ngắn cho ${name}` });
    return res.text;
};

export const getMotivationQuote = async () => {
  const ai = getAIInstance();
  const res = await safeGenerateContent(ai, { contents: "Câu nói động lực học tập ngắn." });
  return res.text;
};
