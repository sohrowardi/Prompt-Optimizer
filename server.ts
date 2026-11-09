import express from "express";
import path from "path";
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import {
  PROMPT_1_LEGACY,
  PROMPT_2,
  PROMPT_3,
  CHAT_SYSTEM_INSTRUCTION,
  PROMPT_4_LEGACY,
  PROMPT_1_SYSTEM_INSTRUCTION,
  PROMPT_4_SYSTEM_INSTRUCTION
} from './constants';
import { ChatMessage, CritiqueAndQuestions, InitialEnhancement } from './types';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Set up JSON body parser with comfortable limit
  app.use(express.json({ limit: '10mb' }));

  // Initialize GoogleGenAI server-side securely
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY environment variable is not defined!");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const model = 'gemini-3.8-flash';

  const formatApiError = (error: unknown): string => {
    const raw = error instanceof Error ? error.message : String(error);
    if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota")) {
      return "Gemini API rate limit or quota exceeded. Please wait a moment and try again. If you have a billing-enabled key, you can configure it in the Settings > Secrets panel.";
    }
    if (raw.includes("403") || raw.includes("PERMISSION_DENIED") || raw.includes("API_KEY_INVALID")) {
      return "Gemini API key is invalid or lacks permissions. Please check your API key in the Settings > Secrets panel.";
    }
    return raw;
  };

  const extractSection = (text: string, title: string, isCodeBlock: boolean): string | null => {
      const pattern = isCodeBlock
          ? `\\*\\*${title}:\\*\\*\\s*\\\`\\\`\\\`([\\s\\S]+?)\\\`\\\`\\\` `
          : `\\*\\*${title}:\\*\\*([\\s\\S]*?)(?=\\s*\\*\\*|$)`;
      
      const regex = new RegExp(pattern, 'm');
      const match = text.match(regex);
      
      return match && match[1] ? match[1].trim() : null;
  };

  const generateFallback = async (prompt: string): Promise<string> => {
      const response: GenerateContentResponse = await ai.models.generateContent({
          model,
          contents: prompt,
      });
      return (response.text || "").trim();
  };

  const questionsSchema = {
      type: Type.ARRAY,
      description: "A list of up to 4 clarifying questions to help the user refine the prompt.",
      items: {
          type: Type.STRING,
          description: "A single, clear, and straightforward question.",
      },
      maxItems: 4
  };

  // API ROUTES

  app.get("/api/health", (req, res) => {
      res.json({ status: "ok" });
  });

  const CURATED_TRENDING_PROMPTS = [
      "Photorealistic cyberpunk city at sunset, 8k octane render",
      "Draft a concise product launch email for enterprise clients",
      "Explain quantum entanglement with intuitive analogies",
      "Python script for async web scraping with rate limiting",
      "Sci-fi short story about an AI discovering forgotten music",
      "Interactive dashboard layout in React and Tailwind CSS",
      "Technical architecture doc for event-driven microservices",
      "Creative brand storytelling campaign for an eco-friendly brand",
      "Comprehensive code review rubric for senior engineers",
      "Step-by-step roadmap to learning Rust systems programming"
  ];

  const getCuratedTrending = (count = 5): string[] => {
      const shuffled = [...CURATED_TRENDING_PROMPTS].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
  };

  // fetchTrendingPrompts API
  app.get("/api/gemini/trending", async (req, res) => {
      // By default, serve curated prompts instantly to avoid burning user quota on page load
      if (req.query.live !== 'true') {
          return res.json({ prompts: getCuratedTrending(5) });
      }

      const prompt = `You are an AI assistant that finds trending content. Your task is to find 5 of the most popular and trending AI art or text generation prompts that people are currently using online. Use your search capabilities to find up-to-date examples. The prompts must be diverse, interesting, SHORT, and fit on a single line (under 10 words). IMPORTANT: Return ONLY a valid JSON array of strings. Do not include any other text, explanation, or markdown. The output must be parsable by JSON.parse(). Example format: ["Photorealistic cyborg ninja", "Haunted lighthouse story, Poe style", "Logo for a futuristic tech company"]`;
      
      try {
          const response: GenerateContentResponse = await ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                  tools: [{ googleSearch: {} }],
              },
          });

          const textResponse = (response.text || "").trim();
          const jsonMatch = textResponse.match(/\[([\s\S]*)\]/);
          
          if (jsonMatch && jsonMatch[0]) {
              try {
                  const prompts = JSON.parse(jsonMatch[0]);
                  if (Array.isArray(prompts) && prompts.every(p => typeof p === 'string') && prompts.length > 0) {
                      return res.json({ prompts: prompts.slice(0, 5) });
                  }
              } catch {
                  // Fall through to regex or curated
              }
          }

          const regex = /"([^"]+)"/g;
          const matches = textResponse.match(regex);
          if (matches) {
              const prompts = matches.map(match => match.replace(/"/g, '')).slice(0, 5);
              if (prompts.length > 0) {
                  return res.json({ prompts });
              }
          }

          return res.json({ prompts: getCuratedTrending(5) });
      } catch {
          // Gracefully fallback to curated prompts without error log spam
          return res.json({ prompts: getCuratedTrending(5) });
      }
  });

  // initialEnhance API
  app.post("/api/gemini/initial-enhance", async (req, res) => {
      try {
          const { userPrompt } = req.body;
          const contents = `User's basic idea:\n\n\`\`\`\n${userPrompt}\n\`\`\``;
          const schema = {
              type: Type.OBJECT,
              properties: {
                  enhancedPrompt: {
                      type: Type.STRING,
                      description: "The generated, professional prompt based on the user's idea."
                  },
                  critique: {
                      type: Type.STRING,
                      description: "An analysis of the generated prompt's effectiveness, strengths, and suggestions for improvement."
                  },
                  questions: questionsSchema,
              },
              required: ["enhancedPrompt", "critique", "questions"]
          };

          try {
              const response = await ai.models.generateContent({
                  model,
                  contents,
                  config: {
                      systemInstruction: PROMPT_1_SYSTEM_INSTRUCTION,
                      responseMimeType: "application/json",
                      responseSchema: schema,
                  },
              });
              
              const rawResponse = (response.text || "").trim();
              const structuredData: InitialEnhancement = JSON.parse(rawResponse);
              
              let cleanPrompt = structuredData.enhancedPrompt;
              const codeBlockMatch = cleanPrompt.match(/^```(?:[a-zA-Z]+)?\s*([\s\S]*?)\s*```$/);
              if (codeBlockMatch) {
                  cleanPrompt = codeBlockMatch[1].trim();
              }

              const botMessageContent = `Here is the first version of your prompt. You can refine it with me below.\n\n**Critique:**\n${structuredData.critique}`;

              const initialBotMessage: ChatMessage = {
                  role: 'model',
                  content: botMessageContent,
                  structuredContent: {
                      critique: structuredData.critique,
                      questions: structuredData.questions,
                  },
              };
              
              return res.json({ enhancedPrompt: cleanPrompt, initialBotMessage });
          } catch (innerError) {
              console.warn("JSON generation for initial enhance failed, trying fallback generation.", innerError);
              
              const fallbackPrompt = PROMPT_1_LEGACY.replace('{{USER_PROMPT}}', userPrompt);
              const fullResponse = await generateFallback(fallbackPrompt);

              const enhancedPrompt = extractSection(fullResponse, 'Prompt', true) || `Your original prompt has been saved as I had trouble enhancing it: ${userPrompt}`;
              const critique = extractSection(fullResponse, 'Critique', false) || "I had trouble generating a critique.";
              const questionsText = extractSection(fullResponse, 'Questions to Improve', false) || "How would you like to improve this prompt?";

              const questions: string[] = questionsText.split('\n').map(q => q.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
              
              const content = `I had some trouble with my usual structured analysis. Here is the enhanced prompt and my thoughts:\n\n**Critique:**\n${critique}`;

              const initialBotMessage: ChatMessage = {
                  role: 'model',
                  content: content,
                  structuredContent: { critique, questions }
              };

              return res.json({ enhancedPrompt, initialBotMessage });
          }
      } catch (error) {
          console.error("Error in initial enhance:", error);
          res.status(500).json({ error: formatApiError(error) });
      }
  });

  // critique API
  app.post("/api/gemini/critique", async (req, res) => {
      try {
          const { promptToAnalyze } = req.body;
          const contents = `Analyze the following prompt:\n\n\`\`\`\n${promptToAnalyze}\n\`\`\``;
          const schema = {
              type: Type.OBJECT,
              properties: {
                  critique: {
                      type: Type.STRING,
                      description: "A brief critique of the prompt's strengths and weaknesses."
                  },
                  questions: questionsSchema,
              },
              required: ["critique", "questions"]
          };

          try {
              const response = await ai.models.generateContent({
                  model,
                  contents,
                  config: {
                      systemInstruction: PROMPT_4_SYSTEM_INSTRUCTION,
                      responseMimeType: "application/json",
                      responseSchema: schema,
                  },
              });

              const rawResponse = (response.text || "").trim();
              const structuredResponse = JSON.parse(rawResponse);
              return res.json({ structuredResponse, rawResponse });
          } catch (innerError) {
              console.warn("JSON generation for critique failed, trying fallback generation.", innerError);
              
              const fallbackPrompt = PROMPT_4_LEGACY.replace('{{PROMPT_TO_ANALYZE}}', promptToAnalyze);
              const fallbackRawResponse = await generateFallback(fallbackPrompt);

              const critique = extractSection(fallbackRawResponse, 'Critique', false) || "I had trouble analyzing the prompt. How can we improve it?";
              const questionsText = extractSection(fallbackRawResponse, 'Questions to Improve', false) || "What is the main goal for this prompt?";
              
              const questions: string[] = questionsText.split('\n').map(q => q.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);

              return res.json({
                  structuredResponse: { critique, questions },
                  rawResponse: fallbackRawResponse,
              });
          }
      } catch (error) {
          console.error("Error in critique generation:", error);
          res.status(500).json({ error: formatApiError(error) });
      }
  });

  // refine-chat-stream API (SSE)
  app.post("/api/gemini/refine-chat-stream", async (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
          const { currentPrompt, chatHistory } = req.body;
          const systemInstruction = CHAT_SYSTEM_INSTRUCTION.replace('{{CURRENT_PROMPT}}', currentPrompt);

          const chat = ai.chats.create({
              model,
              config: { systemInstruction },
              history: chatHistory.slice(0, -1).map((msg: any) => ({
                  role: msg.role,
                  parts: [{ text: msg.content }]
              }))
          });
          
          const lastMessage = chatHistory[chatHistory.length - 1];
          let fullResponse = '';

          const result = await chat.sendMessageStream({ message: lastMessage.content });

          for await (const chunk of result) {
              const textChunk = chunk.text;
              if (textChunk) {
                  fullResponse += textChunk;
                  res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
              }
          }

          const promptRegex = /```([\s\S]*?)```/;
          const match = fullResponse.match(promptRegex);
          const newPrompt = match ? match[1].trim() : null;

          res.write(`data: ${JSON.stringify({ newPrompt })}\n\n`);
          res.write(`data: [DONE]\n\n`);
          res.end();
      } catch (error) {
          console.error("Error in chat refinement stream:", error);
          res.write(`data: ${JSON.stringify({ error: formatApiError(error) })}\n\n`);
          res.end();
      }
  });

  // evaluation-stream API (SSE)
  app.post("/api/gemini/evaluation-stream", async (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
          const { promptToCritique } = req.body;
          const prompt = PROMPT_2.replace('{{PROMPT_TO_CRITIQUE}}', promptToCritique);

          const response = await ai.models.generateContentStream({
              model,
              contents: prompt,
          });

          for await (const chunk of response) {
              const textChunk = chunk.text;
              if (textChunk) {
                  res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
              }
          }
          res.write(`data: [DONE]\n\n`);
          res.end();
      } catch (error) {
          console.error("Error in evaluation stream:", error);
          res.write(`data: ${JSON.stringify({ error: formatApiError(error) })}\n\n`);
          res.end();
      }
  });

  // refinement-stream API (SSE)
  app.post("/api/gemini/refinement-stream", async (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
          const { promptToImprove, critique } = req.body;
          const prompt = PROMPT_3.replace('{{PROMPT_TO_IMPROVE}}', promptToImprove)
                                  .replace('{{CRITIQUE}}', critique);

          const response = await ai.models.generateContentStream({
              model,
              contents: prompt,
          });

          let fullResponse = '';
          for await (const chunk of response) {
              const textChunk = chunk.text;
              if (textChunk) {
                  fullResponse += textChunk;
                  res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
              }
          }

          const promptRegex = /```([\s\S]*?)```/m;
          const match = fullResponse.match(promptRegex);
          
          let improvedPrompt = fullResponse;
          if (match && match[1]) {
              improvedPrompt = match[1].trim();
          }

          res.write(`data: ${JSON.stringify({ improvedPrompt, fullResponse })}\n\n`);
          res.write(`data: [DONE]\n\n`);
          res.end();
      } catch (error) {
          console.error("Error in refinement stream:", error);
          res.write(`data: ${JSON.stringify({ error: formatApiError(error) })}\n\n`);
          res.end();
      }
  });

  // Vite development middleware vs Static Production files serving
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
