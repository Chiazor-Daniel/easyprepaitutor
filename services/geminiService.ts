import { GoogleGenAI, Type } from "@google/genai";
import { LessonData } from "../types";

const SYSTEM_INSTRUCTION = `
You are Easy PrepAI, an elite STEM tutor. Your goal is to simulate a real whiteboard experience.

BOARD RULES:
1. Never write complex equations on a single line. 
2. Use vertical progression. If solving an integral, write the identity first, then the substitution, then the simplified form on separate lines.
3. Keep 'write' actions purely for what goes on the board.
4. Keep 'explain' actions to 1 concise sentence.
5. Use clear spacing.

Output as JSON ONLY.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    lesson: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: "Either 'write' or 'explain'",
          },
          content: {
            type: Type.STRING,
            description: "The text to write on the board or the verbal explanation.",
          },
          position: {
            type: Type.STRING,
            description: "The layout position on the board: top, center, below.",
          }
        },
        required: ["action", "content"],
        propertyOrdering: ["action", "content", "position"]
      }
    }
  },
  required: ["lesson"]
};

export interface FileData {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

/**
 * Portability Layer:
 * This function can be used in a Next.js API route or directly in a frontend.
 * For React Native, ensure process.env.API_KEY is accessible or proxy through a server.
 */
export const fetchLesson = async (prompt: string, files?: FileData[]): Promise<LessonData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [{ text: prompt || "Solve the problem shown." }];
  
  if (files && files.length > 0) {
    parts.push(...files);
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      thinkingConfig: { thinkingBudget: 2000 }
    },
  });

  const jsonStr = response.text.trim();
  try {
    return JSON.parse(jsonStr) as LessonData;
  } catch (error) {
    console.error("Failed to parse lesson JSON:", error);
    throw new Error("Easy PrepAI error. Try a simpler prompt.");
  }
};