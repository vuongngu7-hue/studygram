import { GoogleGenAI, Type } from "@google/genai";

const FLASH_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview';

// Fallback key provided by user for immediate fix
const FALLBACK_KEY = 'AIzaSyAFcxaPCkftO0f6U9fxosZugd4K9wv0SVU';

const getAIInstance = () => {
  let apiKey = '';
  try {
    // Attempt to access process.env.API_KEY
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || '';
    }
  } catch (e) {
    console.warn("[Gemini] process.env access failed, using fallback.");
  }

  // Use fallback if env var is missing or invalid
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    apiKey = FALLBACK_KEY;
  }

  if (!apiKey) {
    throw new Error("MISSING_API_KEY: Vui lòng kiểm tra cấu hình API Key.");
  }

  return new GoogleGenAI({ apiKey });
};

const parseGeminiJSON = (text: string, defaultValue: any) => {
  if (!text) return defaultValue;
  try {
    return JSON.parse(text);
  } catch (e1) {
    try {
      // Clean markdown code blocks if present
      let cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleaned);
    } catch (e2) {
      return defaultValue;
    }
  }
};

export const checkConnection = async () => {
  try {
    const ai = getAIInstance();
    await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: "Ping",
    });
    return { success: true, message: "Kết nối ổn định" };
  } catch (e: any) {
    console.error("❌ [GeminiService] Connection Failed:", e);
    let msg = "Lỗi không xác định";
    if (e.message?.includes('MISSING_API_KEY')) msg = "Thiếu API Key";
    else if (e.message?.includes('404')) msg = "Model không tồn tại (404)";
    else if (e.message?.includes('403')) msg = "Sai API Key hoặc bị chặn (403)";
    else if (e.message?.includes('fetch')) msg = "Lỗi mạng / CORS";
    else msg = e.message;
    return { success: false, message: msg };
  }
};

export const upgradeContent = async (content: string) => {
  try {
    const ai = getAIInstance();
    const systemInstruction = `Bạn là chuyên gia biên tập nội dung.
Nhiệm vụ:
1. Sửa lỗi chính tả, ngữ pháp, dấu câu.
2. Nâng cấp diễn đạt cho chuyên nghiệp và ấn tượng hơn.
3. Giữ nguyên ý nghĩa gốc.
Trả về: Nội dung đã sửa (Markdown) + Bảng tóm tắt các thay đổi.`;

    const res = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: content,
      config: { 
        systemInstruction: systemInstruction,
        temperature: 0.7 
      }
    });
    return res.text || "Không có phản hồi từ chuyên gia biên tập.";
  } catch (e) {
    throw e;
  }
};

export const getTutorResponse = async (msg: string, mode: 'teen' | 'academic' = 'teen') => {
  const instructions = {
    teen: `Bạn là Gia sư AI Gen Z siêu lầy lội.
    - Xưng hô: "Tui" - "Fen".
    - Tone: Hài hước, dùng slang Gen Z (khum, keo lỳ, chấn động).
    - Nhiệm vụ: Giải thích ngắn gọn, dễ hiểu.
    - Format: Công thức Toán/Lý/Hóa bắt buộc dùng LaTeX trong dấu $.`,
    
    academic: `Bạn là Giáo sư học thuật.
    - Phong cách: Trang trọng, gãy gọn, chuyên sâu.
    - Format: Công thức Toán/Lý/Hóa bắt buộc dùng LaTeX trong dấu $.`
  };

  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
      model: mode === 'academic' ? PRO_MODEL : FLASH_MODEL,
      contents: msg,
      config: { 
        systemInstruction: instructions[mode],
        temperature: mode === 'teen' ? 0.9 : 0.4 
      }
    });
    return res.text || "Mạng lag quá fen ơi, hỏi lại đi!";
  } catch (e: any) {
    console.error("Tutor Error:", e);
    if (e.message?.includes('MISSING_API_KEY')) throw new Error("Chưa cấu hình API Key");
    throw e;
  }
};

export const generateExamRoadmap = async (grade: string, subject: string): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Lập lộ trình 5 bước học Lớp ${grade} môn ${subject}.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          roadmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                topics: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    }
  });
  return parseGeminiJSON(response.text, { roadmap: [] });
};

export const generateExamPaper = async (subject: string, grade: string, difficulty: string, count: number = 10): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Tạo ${count} câu trắc nghiệm Lớp ${grade} ${subject}, độ khó: ${difficulty}. Ngôn ngữ: Tiếng Việt. Dùng LaTeX trong dấu $.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          }
        }
      }
    }
  });
  const data = parseGeminiJSON(response.text, []);
  return Array.isArray(data) ? data : [];
};

export const analyzeStudyImage = async (base64Image: string, prompt: string) => {
  const ai = getAIInstance();
  const mimeType = base64Image.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
  const base64Data = base64Image.split(',')[1];

  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: prompt + " (Trả lời bằng tiếng Việt, dùng LaTeX $...$)" }
      ]
    }
  });
  return res.text || "Không thể phân tích ảnh này.";
};

export const getDailyBlitzQuiz = async (subject: string = "Kiến thức tổng hợp"): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Tạo 5 câu trắc nghiệm nhanh chủ đề ${subject}.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING }
          }
        }
      }
    }
  });
  return parseGeminiJSON(response.text, []);
};

export const getDebateResponse = async (history: any[], topic: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: history.map(h => ({ role: h.role === 'ai' ? 'model' : 'user', parts: [{ text: h.text }] })),
    config: { systemInstruction: `Bạn là Debater Gen Z chuyên phản biện gắt gao về chủ đề: "${topic}". Ngắn gọn dưới 100 từ.` }
  });
  return res.text || "Đang loading lý lẽ...";
};

export const checkVibePost = async (content: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Bình luận ngắn vibe Gen Z về: "${content}".`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          comment: { type: Type.STRING }
        }
      }
    }
  });
  return parseGeminiJSON(res.text, {comment: "Vibe check ổn áp!"});
};

export const getOracleReading = async () => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Bói bài Tarot học đường.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cardName: { type: Type.STRING },
          rarity: { type: Type.STRING },
          message: { type: Type.STRING },
          luckyItem: { type: Type.STRING }
        }
      }
    }
  });
  return parseGeminiJSON(res.text, {});
};

export const summarizeText = async (text: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Tóm tắt nội dung sau:\n\n${text}`,
  });
  return res.text || "Không có phản hồi.";
};

export const generateFlashcards = async (text: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Tạo flashcards từ nội dung này.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          }
        }
      }
    }
  });
  return parseGeminiJSON(res.text, []);
};

export const generateMindMap = async (topic: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `Tạo sơ đồ tư duy text cho chủ đề: "${topic}".`,
  });
  return res.text || "Không tạo được sơ đồ.";
};

export const gradeEssay = async (essay: string, grade: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `Chấm bài văn lớp ${grade} sau:\n\n${essay}`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          goodPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          badPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestion: { type: Type.STRING }
        }
      }
    }
  });
  return parseGeminiJSON(res.text, { score: 0, goodPoints: [], badPoints: [], suggestion: "Lỗi chấm bài." });
};

export const generateStudyPlan = async (input: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Tạo thời khóa biểu học tập từ: "${input}".`,
  });
  return res.text || "Không tạo được lịch.";
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
    const ai = getAIInstance();
    const prompt = mode === 'roast' 
        ? `Roast (cà khịa) hồ sơ này: Tên ${user.name}, Streak ${user.streak}. Ngắn gọn.`
        : `Toast (khen ngợi) hồ sơ này: Tên ${user.name}, Streak ${user.streak}. Ngắn gọn.`;
        
    const res = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: prompt
    });
    return res.text || (mode === 'roast' ? "Gà quá fen ơi!" : "Đỉnh chóp!");
};

export const getChampionTip = async (name: string) => {
    try {
        const ai = getAIInstance();
        const res = await ai.models.generateContent({
            model: FLASH_MODEL,
            contents: `Lời khuyên học tập cho ${name}. Ngắn gọn.`
        });
        return res.text;
    } catch (e) {
        return "Bí kíp là đừng có ngủ khi đang học.";
    }
};

export const getOfficialExamLinks = async (s: string, y: string, p: string, g: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `Gợi ý 5 nguồn tài liệu môn ${s} lớp ${g} năm ${y} tại ${p}. JSON.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            web: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                uri: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return parseGeminiJSON(res.text, []);
};

export const getMotivationQuote = async () => {
  try {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: "Câu nói động lực ngắn gọn style Gen Z cho người vừa học xong.",
    });
    return res.text;
  } catch (e) {
    return "Bạn đã làm rất tốt! Tiếp tục phát huy nhé!";
  }
};