import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PROMPT_1, PROMPT_2, PROMPT_3, CHAT_SYSTEM_INSTRUCTION, PROMPT_4 } from '../constants';
import { ChatMessage } from '../types';

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


// This is a non-streaming helper for initial enhancement and chat, which don't have a streaming UI.
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

/**
 * Extracts a specific section from a larger text block based on a markdown heading.
 * @param text The full text to search within.
 * @param title The heading of the section to extract (e.g., "Prompt", "Critique").
 * @param isCodeBlock Whether the content is expected to be in a markdown code block.
 * @returns The trimmed content of the section, or null if not found.
 */
const extractSection = (text: string, title: string, isCodeBlock: boolean): string | null => {
    const pattern = isCodeBlock
        ? `\\*\\*${title}:\\*\\*\\s*\\\`\\\`\\\`([\\s\\S]+?)\\\`\\\`\\\``
        : `\\*\\*${title}:\\*\\*([\\s\\S]*?)(?=\\s*\\*\\*|$)`;
    
    const regex = new RegExp(pattern, 'm');
    const match = text.match(regex);
    
    return match && match[1] ? match[1].trim() : null;
};


export const initialEnhance = async (userPrompt: string): Promise<{ enhancedPrompt: string; initialBotMessage: string; }> => {
    const prompt = PROMPT_1.replace('{{USER_PROMPT}}', userPrompt);
    const fullResponse = await generate(prompt);

    const enhancedPrompt = extractSection(fullResponse, 'Prompt', true);
    const critique = extractSection(fullResponse, 'Critique', false);
    const questions = extractSection(fullResponse, 'Questions to Improve', false);

    if (!enhancedPrompt) {
        console.error("Could not parse enhanced prompt from Gemini response:", fullResponse);
        return {
            enhancedPrompt: "Sorry, I had trouble generating a prompt. Your original prompt has been saved.",
            initialBotMessage: `I failed to structure my response correctly, so I couldn't extract the enhanced prompt. Here is my raw output, please try refining it in the chat:\n\n${fullResponse}`
        };
    }
    
    let initialBotMessage = '';
    if (critique) {
        initialBotMessage += `**Critique:**\n${critique}\n\n`;
    }
    if (questions) {
        initialBotMessage += `**Questions to Improve:**\n${questions}`;
    }

    // Fallback if both critique and questions are missing
    if (!critique && !questions) {
        initialBotMessage = "My apologies, I generated an enhanced prompt but failed to provide the usual critique and questions. We can refine it together here in the chat. What would you like to improve?";
    }

    return { enhancedPrompt, initialBotMessage: initialBotMessage.trim() };
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


export const generateCritiqueAndQuestions = async (promptToAnalyze: string): Promise<string> => {
    const prompt = PROMPT_4.replace('{{PROMPT_TO_ANALYZE}}', promptToAnalyze);
    const fullResponse = await generate(prompt);

    if (!fullResponse.includes('**Critique:**') || !fullResponse.includes('**Questions to Improve:**')) {
        let helpfulMessage = "My apologies, I had trouble analyzing the new prompt. Here's what I came up with:\n\n" + fullResponse;
        helpfulMessage += "\n\nHow would you like to refine this new 10x prompt?";
        return helpfulMessage;
    }

    return fullResponse;
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
    const prompt = `You are an AI assistant that finds trending content. Your task is to find 5 of the most popular and trending AI art or text generation prompts that people are currently using online. Use your search capabilities to find up-to-date examples. The prompts should be diverse and interesting. IMPORTANT: Return ONLY a valid JSON array of strings. Do not include any other text, explanation, or markdown. The output must be parsable by JSON.parse(). Example format: ["A photorealistic portrait of a futuristic cyborg ninja", "Create a short story in the style of Edgar Allan Poe about a haunted lighthouse"]`;
    
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
