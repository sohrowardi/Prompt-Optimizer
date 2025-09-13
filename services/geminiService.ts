
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { PROMPT_1_LEGACY, PROMPT_2, PROMPT_3, CHAT_SYSTEM_INSTRUCTION, PROMPT_4_LEGACY, PROMPT_1_SYSTEM_INSTRUCTION, PROMPT_4_SYSTEM_INSTRUCTION } from '../constants';
import { ChatMessage, CritiqueAndQuestions, InitialEnhancement } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const handleGeminiError = (error: unknown, context: string): Error => {
    console.error(`Gemini API call failed during ${context}:`, error);
    let message = `An unexpected error occurred during ${context}. Please try again.`;
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            message = "Your API Key is invalid or missing. Please ensure it is configured correctly in your environment.";
        } else if (error.message.includes('400')) {
            message = `The request was invalid (${context}). Please check the prompt content and try again.`;
        } else if (error.message.includes('500') || error.message.includes('503')) {
            message = `The AI model service is currently unavailable or overloaded (${context}). Please try again later.`;
        } else if (error.message.toLowerCase().includes('network error')) {
            message = `A network error occurred. Please check your internet connection and try again.`;
        } else {
             // Keep a generic but contextual message for other errors
            message = `An error occurred while trying to ${context.toLowerCase()}. Please see the console for details.`;
        }
    }
    return new Error(message);
};

// Non-streaming helper for legacy prompts
const generate = async (prompt: string): Promise<string> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        throw handleGeminiError(error, "content generation");
    }
};

const extractSection = (text: string, title: string, isCodeBlock: boolean): string | null => {
    const pattern = isCodeBlock
        ? `\\*\\*${title}:\\*\\*\\s*\\\`\\\`\\\`([\\s\\S]+?)\\\`\\\`\\\``
        : `\\*\\*${title}:\\*\\*([\\s\\S]*?)(?=\\s*\\*\\*|$)`;
    
    const regex = new RegExp(pattern, 'm');
    const match = text.match(regex);
    
    return match && match[1] ? match[1].trim() : null;
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


export const initialEnhance = async (userPrompt: string): Promise<{ enhancedPrompt: string; initialBotMessage: ChatMessage; }> => {
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
        
        const rawResponse = response.text.trim();
        const structuredData: InitialEnhancement = JSON.parse(rawResponse);
        
        const botMessageContent = `Here is the first version of your prompt. You can refine it with me below.\n\n**Critique:**\n${structuredData.critique}`;

        const initialBotMessage: ChatMessage = {
            role: 'model',
            content: botMessageContent,
            structuredContent: {
                critique: structuredData.critique,
                questions: structuredData.questions,
            },
        };
        
        return { enhancedPrompt: structuredData.enhancedPrompt, initialBotMessage };

    } catch (error) {
        console.error("JSON generation for initial enhance failed, falling back.", error);
        
        const fallbackPrompt = PROMPT_1_LEGACY.replace('{{USER_PROMPT}}', userPrompt);
        const fullResponse = await generate(fallbackPrompt);

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

        return { enhancedPrompt, initialBotMessage };
    }
};

export const refineInChatStream = async (currentPrompt: string, chatHistory: ChatMessage[], onChunk: (chunk: string) => void): Promise<{ newPrompt: string | null }> => {
    const systemInstruction = CHAT_SYSTEM_INSTRUCTION.replace('{{CURRENT_PROMPT}}', currentPrompt);

    const chat = ai.chats.create({
        model,
        config: { systemInstruction },
        history: chatHistory.slice(0, -1).map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }))
    });
    
    const lastMessage = chatHistory[chatHistory.length - 1];
    let fullResponse = '';

    try {
        const result = await chat.sendMessageStream({ message: lastMessage.content });

        for await (const chunk of result) {
            const textChunk = chunk.text;
            if (textChunk) {
                fullResponse += textChunk;
                onChunk(textChunk);
            }
        }

        const promptRegex = /```([\s\S]*?)```/;
        const match = fullResponse.match(promptRegex);
        const newPrompt = match ? match[1].trim() : null;
        return { newPrompt };

    } catch (error) {
        throw handleGeminiError(error, 'streaming chat refinement');
    }
};

export const generateCritiqueAndQuestions = async (promptToAnalyze: string): Promise<{ structuredResponse: CritiqueAndQuestions; rawResponse: string }> => {
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

        const rawResponse = response.text.trim();
        const structuredResponse = JSON.parse(rawResponse);
        return { structuredResponse, rawResponse };

    } catch (error) {
        console.error("JSON generation for critique failed, falling back to text-based generation.", error);
        
        const fallbackPrompt = PROMPT_4_LEGACY.replace('{{PROMPT_TO_ANALYZE}}', promptToAnalyze);
        const fallbackRawResponse = await generate(fallbackPrompt);

        const critique = extractSection(fallbackRawResponse, 'Critique', false) || "I had trouble analyzing the prompt. How can we improve it?";
        const questionsText = extractSection(fallbackRawResponse, 'Questions to Improve', false) || "What is the main goal for this prompt?";
        
        const questions: string[] = questionsText.split('\n').map(q => q.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);

        return {
            structuredResponse: { critique, questions },
            rawResponse: fallbackRawResponse,
        };
    }
};

// --- Streaming Functions for 10x Improvement Hub ---

export const runEvaluationStream = async (promptToCritique: string, onChunk: (chunk: string) => void): Promise<string> => {
    const prompt = PROMPT_2.replace('{{PROMPT_TO_CRITIQUE}}', promptToCritique);
    let fullText = '';
    try {
        const response = await ai.models.generateContentStream({
            model,
            contents: prompt,
        });
        for await (const chunk of response) {
            const textChunk = chunk.text;
            if (textChunk) {
                fullText += textChunk;
                onChunk(textChunk);
            }
        }
    } catch (error) {
        throw handleGeminiError(error, "streaming evaluation");
    }
    return fullText;
};

export const runRefinementStream = async (promptToImprove: string, critique: string, onChunk: (chunk: string) => void): Promise<{ improvedPrompt: string; fullResponse: string; }> => {
    const prompt = PROMPT_3.replace('{{PROMPT_TO_IMPROVE}}', promptToImprove)
                            .replace('{{CRITIQUE}}', critique);
    let fullResponse = '';
     try {
        const response = await ai.models.generateContentStream({
            model,
            contents: prompt,
        });
        for await (const chunk of response) {
            const textChunk = chunk.text;
            if (textChunk) {
                fullResponse += textChunk;
                onChunk(textChunk);
            }
        }
    } catch (error) {
        throw handleGeminiError(error, "streaming refinement");
    }

    const promptRegex = /```([\s\S]*?)```/m;
    const match = fullResponse.match(promptRegex);
    
    let improvedPrompt = fullResponse;
    if (match && match[1]) {
        improvedPrompt = match[1].trim();
    } else {
        console.warn("Could not find a markdown code block in the streamed refinement response. Using full response as the prompt.");
    }
    
    return { improvedPrompt, fullResponse };
};

export const fetchTrendingPrompts = async (): Promise<string[]> => {
    const prompt = `You are an AI assistant that finds trending content. Your task is to find 5 of the most popular and trending AI art or text generation prompts that people are currently using online. Use your search capabilities to find up-to-date examples. The prompts must be diverse, interesting, SHORT, and fit on a single line (under 10 words). IMPORTANT: Return ONLY a valid JSON array of strings. Do not include any other text, explanation, or markdown. The output must be parsable by JSON.parse(). Example format: ["Photorealistic cyborg ninja", "Haunted lighthouse story, Poe style", "Logo for a futuristic tech company"]`;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const textResponse = response.text.trim();
        
        const jsonMatch = textResponse.match(/\[([\s\S]*)\]/);
        if (jsonMatch && jsonMatch[0]) {
            try {
                const prompts = JSON.parse(jsonMatch[0]);
                if (Array.isArray(prompts) && prompts.every(p => typeof p === 'string')) {
                    return prompts.slice(0, 5);
                }
            } catch (e) {
                console.error("Failed to parse JSON from Gemini response for trending prompts, falling back to regex.", e);
            }
        }

        const regex = /"([^"]+)"/g;
        const matches = textResponse.match(regex);
        if (matches) {
            return matches.map(match => match.replace(/"/g, '')).slice(0, 5);
        }

        console.warn("Could not extract any trending prompts from response:", textResponse);
        return [];

    } catch (error) {
        throw handleGeminiError(error, "fetching trending prompts");
    }
};