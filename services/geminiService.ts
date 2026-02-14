import { GoogleGenAI, Type } from "@google/genai";

const FLASH_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview';

const getAIInstance = () => {
  let apiKey = '';
  try {
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || '';
    }
  } catch (e) {
    // process is not defined
  }

  if (!apiKey) {
    throw new Error("Chưa cấu hình API_KEY. Vui lòng thêm API_KEY vào file .env của bạn.");
  }

  return new GoogleGenAI({ apiKey });
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
        const firstOpen = text.indexOf('{');
        const firstArray = text.indexOf('[');
        let startIdx = -1;
        let endIdx = -1;

        if (firstOpen !== -1 && (firstArray === -1 || firstOpen < firstArray)) {
           startIdx = firstOpen;
           endIdx = text.lastIndexOf('}');
        } else if (firstArray !== -1) {
           startIdx = firstArray;
           endIdx = text.lastIndexOf(']');
        }

        if (startIdx !== -1 && endIdx !== -1) {
            const jsonStr = text.substring(startIdx, endIdx + 1);
            return JSON.parse(jsonStr);
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
    await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: "Ping",
    });
    return true;
  } catch (e: any) {
    console.error("❌ [GeminiService] Connection Failed:", e);
    return false;
  }
};

export const upgradeContent = async (content: string) => {
  const ai = getAIInstance();
  const systemInstruction = `Hãy đóng vai một chuyên gia biên tập và nâng cấp nội dung.
Nhiệm vụ của bạn:
1. Tự động phát hiện tất cả lỗi chính tả, ngữ pháp, dấu câu và diễn đạt chưa tự nhiên.
2. Sửa lại cho đúng và mượt hơn.
3. Nâng cấp nội dung theo hướng:
   - Rõ ràng hơn
   - Chuyên nghiệp hơn
   - Ấn tượng hơn
   - Có chiều sâu hơn

Sau khi chỉnh sửa:
- Hiển thị bản đã chỉnh hoàn chỉnh dưới định dạng Markdown đẹp mắt.
- Sau đó liệt kê các lỗi đã sửa và giải thích ngắn gọn trong một bảng hoặc danh sách.`;

  const res = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: content,
    config: { 
      systemInstruction: systemInstruction,
      temperature: 0.7 
    }
  });
  return res.text || "Không có phản hồi từ chuyên gia biên tập.";
};

export const getTutorResponse = async (msg: string, mode: 'teen' | 'academic' = 'teen') => {
  const instructions = {
    teen: `Bạn là Gia sư AI Gen Z "hệ tư tưởng" siêu lầy lội và cực kỳ thân thiện.
    
    IDENTITY (Nhân diện):
    - Xưng hô: "Tui" - "Fen" (hoặc "Mấy ní", "Bồ tèo", "Đằng ấy").
    - Tone giọng: Hài hước, năng lượng, dùng nhiều icon 🤣🔥✨.
    - Ngôn ngữ: BẮT BUỘC dùng slang Gen Z tự nhiên (khum, u là trời, keo lỳ, chấn động, ét o ét, mãi mận, 10 điểm không nhưng, over hợp...).

    NHIỆM VỤ:
    - Giải thích kiến thức học đường cực dễ hiểu, ví dụ thực tế, đời thường.
    - Nếu người dùng sai: Đừng chê, hãy nói kiểu "Xém đúng rùi, check lại chút nè fen".
    - Nếu người dùng đúng: Khen "nức mũi" kiểu "Đỉnh chóp", "Out trình".

    QUY TẮC BẮT BUỘC VỀ FORMAT:
    1. Mọi công thức Toán/Lý/Hóa/Tin PHẢI viết bằng LaTeX đặt trong dấu $ (Ví dụ: $E = mc^2$).
    2. Trình bày ngắn gọn, có gạch đầu dòng cho dễ đọc.`,
    
    academic: "Bạn là giáo sư học thuật uyên bác. Phong cách: Trang trọng, gãy gọn, chuyên sâu. Yêu cầu BẮT BUỘC về toán học: Mọi công thức PHẢI viết bằng LaTeX đặt trong dấu $ hoặc $$."
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
    // Re-throw if key missing so UI can handle, otherwise return friendly error
    if (e.message && (e.message.includes('API_KEY') || e.message.includes('API key'))) {
       throw new Error("Chưa cấu hình API Key");
    }
    return `AI đang nghỉ giải lao: ${e.message}`;
  }
};

export const generateExamRoadmap = async (grade: string, subject: string): Promise<any> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Lập lộ trình 5 bước học Lớp ${grade} môn ${subject}. Ngôn ngữ: Tiếng Việt.`,
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
    contents: `Tạo ${count} câu trắc nghiệm Lớp ${grade} ${subject}, độ khó: ${difficulty}. Ngôn ngữ: Tiếng Việt chuẩn. Dùng LaTeX trong dấu $.`,
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
  return res.text || "Hình mờ quá fen ơi, chụp lại đi.";
};

export const getDailyBlitzQuiz = async (subject: string = "Kiến thức tổng hợp"): Promise<any[]> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Tạo 5 câu trắc nghiệm nhanh chủ đề ${subject}. Ngôn ngữ: Tiếng Việt.`,
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
    config: { systemInstruction: `Bạn là một Debater Gen Z Việt Nam cực gắt, chuyên gia 'phản dame'. Chủ đề: "${topic}". Phản biện ngắn gọn dưới 100 từ.` }
  });
  return res.text || "Đang loading lý lẽ...";
};

export const checkVibePost = async (content: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Đóng vai học sinh Gen Z Việt Nam, bình luận ngắn về nội dung: "${content}".`,
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
    contents: `Bói bài Tarot học đường phong cách Gen Z.`,
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
    contents: `Tóm tắt nội dung sau bằng Tiếng Việt:\n\n${text}`,
    config: { systemInstruction: "Bạn là chuyên gia tóm tắt tài liệu." }
  });
  return res.text || "Không có phản hồi.";
};

export const generateFlashcards = async (text: string) => {
  const ai = getAIInstance();
  const res = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Tạo bộ flashcards giúp ghi nhớ nội dung này.`,
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
    contents: `Tạo sơ đồ tư duy cho chủ đề: "${topic}".`,
    config: { systemInstruction: "Bạn là chuyên gia về sơ đồ tư duy." }
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
    contents: `Tạo thời khóa biểu học tập dựa trên: "${input}".`,
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
        ? `Roast hồ sơ học tập này phong cách Gen Z Việt Nam: Tên ${user.name}, Streak ${user.streak}. Ngắn dưới 30 từ.`
        : `Toast khen ngợi hồ sơ học tập này phong cách Gen Z Việt Nam: Tên ${user.name}, Streak ${user.streak}. Ngắn dưới 30 từ.`;
        
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
            contents: `Cho lời khuyên học tập ngắn gọn cho ${name}.`
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
    contents: `Gợi ý 5 nguồn tài liệu môn ${s} lớp ${g} năm ${y} tại ${p}. Trả về JSON.`,
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
      contents: "Một câu nói động lực ngắn gọn, cực chất cho người vừa học xong 25 phút. Phong cách Gen Z.",
    });
    return res.text;
  } catch (e) {
    return "Bạn đã làm rất tốt! Tiếp tục phát huy nhé!";
  }
};