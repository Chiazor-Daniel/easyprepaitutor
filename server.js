const express = require('express');
const cors = require('cors');
const { GoogleGenAI, Type } = require('@google/genai');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const SYSTEM_INSTRUCTION = `
You are Easy PrepAI, an elite STEM tutor. Your goal is to simulate a real whiteboard experience.

BOARD RULES:
1. NEVER write complex equations on a single line. 
2. Use VERTICAL progression (one step per line).
3. 'write' actions are for the board (use clean text or LaTeX).
4. 'explain' actions must be exactly 1 concise sentence.
5. If solving an integral or complex equation, break it down into at least 4-5 steps.

You must output ONLY valid JSON.
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
            description: "The text/LaTeX for the board or the verbal explanation.",
          },
          position: {
            type: Type.STRING,
            description: "Position: top, center, below.",
          }
        },
        required: ["action", "content"]
      }
    }
  },
  required: ["lesson"]
};

app.post('/api/lesson', async (req, res) => {
  const { prompt, files } = req.body;

  try {
    // Guidelines: Initialize with named parameter and use process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts = [{ text: prompt || "Solve the problem shown." }];

    if (files && files.length > 0) {
      files.forEach(file => {
        parts.push({
          inlineData: {
            data: file.data,
            mimeType: file.type
          }
        });
      });
    }

    // Guidelines: Use ai.models.generateContent and gemini-3-pro-preview for STEM
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

    // Guidelines: Access response.text property directly
    const text = response.text;
    res.json(JSON.parse(text));

  } catch (error) {
    console.error("Backend Error Details:", error);
    res.status(500).json({ 
      error: "Easy PrepAI encountered a problem.", 
      message: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Easy PrepAI Server running at http://localhost:${port}`);
});