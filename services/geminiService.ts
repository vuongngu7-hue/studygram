
import { GoogleGenAI, Type } from "@google/genai";

const FLASH_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview';

// Khởi tạo AI Instance theo hướng dẫn mới nhất
const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

const parseGeminiJSON = (text: string, defaultValue: any) => {
  if (!text) return defaultValue;
  try {
    return JSON.parse(text);
  } catch (e1) {
    try {
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
      contents: "Hi",
    });
    return { success: true, message: "Kết nối ổn định" };
  } catch (e: any) {
    console.error("❌ [GeminiService] Connection Failed:", e);
    return { success: false, message: e.message || "Lỗi kết nối" };
  }
};

// --- CHATBOT FEATURE (PRO MODEL) ---
export const getChatResponse = async (message: string, history: any[] = []) => {
  const ai = getAIInstance();
  const chat = ai.chats.create({
    model: PRO_MODEL,
    config: {
      systemInstruction: 'Bạn là StudyGram AI, một trợ lý học tập thông minh và thân thiện dành cho học sinh Việt Nam. Bạn có khả năng tư duy logic cực cao, giải quyết các bài tập khó và đưa ra lời khuyên học tập sâu sắc.',
      temperature: 0.8,
    }
  });

  // Chuyển đổi lịch sử chat sang định dạng của Gemini
  // Lưu ý: Gemini API chats.create hiện tại hỗ trợ gửi tin nhắn trực tiếp qua sendMessage
  const response = await chat.sendMessage({ message });
  return response.text;
};

// --- SEARCH GROUNDING FEATURE (FLASH MODEL + SEARCH TOOL) ---
export const searchEducationalResources = async (query: string) => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Tìm kiếm và liệt kê 5 nguồn tài liệu uy tín nhất cho: ${query}. Trình bày ngắn gọn và khách quan.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  // Trích xuất URLs từ groundingChunks
  const links = sources
    .filter((chunk: any) => chunk.web && chunk.web.uri)
    .map((chunk: any) => ({
      title: chunk.web.title,
      uri: chunk.web.uri
    }));

  return { text, links };
};

export const upgradeContent = async (content: string) => {
  const ai = getAIInstance();
  const systemInstruction = `Bạn là chuyên gia biên tập nội dung chuyên nghiệp. Hãy nâng cấp văn bản sau lên tầm cao mới, sửa lỗi và làm cho nó ấn tượng hơn. Trả về kết quả bằng Markdown.`;

  const res = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: content,
    config: { systemInstruction, temperature: 0.7 }
  });
  return res.text || "Không có phản hồi.";
};

export const getTutorResponse = async (msg: string, mode: 'teen' | 'academic' | 'pro' = 'teen') => {
  const instructions = {
    teen: `Bạn là Gia sư AI Gen Z lầy lội, dùng slang (fen, khum, kẹ kẹ), xưng hô "tui - fen".`,
    academic: `Bạn là Giáo sư học thuật, phong cách trang trọng, chính xác.`,
    pro: `Bạn là Siêu trí tuệ AI, có khả năng giải quyết các vấn đề logic và toán học cực kỳ phức tạp. Hãy giải thích chi tiết từng bước.`
  };

  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: mode === 'pro' ? PRO_MODEL : FLASH_MODEL,
    contents: msg,
    config: { 
      systemInstruction: instructions[mode === 'pro' ? 'pro' : mode] + " Luôn dùng LaTeX cho công thức Toán.",
      temperature: mode === 'teen' ? 0.9 : 0.5 
    }
  });
  return res.text;
};

// Nâng cấp hàm lấy link đề thi sử dụng Search Grounding thật
export const getOfficialExamLinks = async (s: string, y: string, p: string, g: string) => {
  const query = `Đề thi chính thức môn ${s} lớp ${g} năm ${y} tại ${p}`;
  const searchResult = await searchEducationalResources(query);
  return searchResult.links;
};

export const generateExamPaper = async (subject: string, grade: string, difficulty: string, count: number = 10): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Tạo ${count} câu trắc nghiệm Lớp ${grade} ${subject}, độ khó: ${difficulty}. Dùng LaTeX $...$.`,
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
  return parseGeminiJSON(response.text, []);
};

/**
 * Generates a study roadmap for a specific subject and grade.
 * Fixes the missing export for MissionControl.tsx.
 */
export const generateExamRoadmap = async (grade: string, subject: string) => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Tạo lộ trình ôn thi môn ${subject} lớp ${grade} gồm 5 chương chính (roadmap). Mỗi chương bao gồm tiêu đề, danh sách chủ đề nhỏ và độ khó (theory, practice, hoặc hardcore).`,
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
                topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                difficulty: { type: Type.STRING, description: 'theory, practice, hoặc hardcore' }
              },
              required: ['title', 'topics', 'difficulty']
            }
          }
        },
        required: ['roadmap']
      }
    }
  });
  return parseGeminiJSON(response.text, { roadmap: [] });
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
  return res.text;
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
    config: { systemInstruction: `Bạn là chuyên gia phản biện sắc sảo về chủ đề: "${topic}".` }
  });
  return res.text;
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
  return res.text;
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
  return res.text;
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
  return res.text;
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
    return res.text;
};

export const getChampionTip = async (name: string) => {
    const ai = getAIInstance();
    const res = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `Lời khuyên học tập cho ${name}. Ngắn gọn.`
    });
    return res.text;
};

export const getMotivationQuote = async () => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: "Câu nói động lực ngắn gọn style Gen Z cho người vừa học xong.",
  });
  return res.text;
};
