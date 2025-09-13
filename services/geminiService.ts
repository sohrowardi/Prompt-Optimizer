import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PROMPT_1, PROMPT_2, PROMPT_3, CHAT_SYSTEM_INSTRUCTION, PROMPT_4 } from '../constants';
import { ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

// This is a non-streaming helper for initial enhancement and chat, which don't have a streaming UI.
const generate = async (prompt: string): Promise<string> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Failed to communicate with the Gemini API.");
    }
};

export const initialEnhance = async (userPrompt: string): Promise<{ enhancedPrompt: string; initialBotMessage: string; }> => {
    const prompt = PROMPT_1.replace('{{USER_PROMPT}}', userPrompt);
    const fullResponse = await generate(prompt);

    const promptRegex = /\*\*Prompt:\*\*\s*\`\`\`\s*([\s\S]+?)\s*\`\`\`/m;
    const match = fullResponse.match(promptRegex);
    
    if (!match || !match[1]) {
        console.error("Could not parse prompt from PROMPT_1 response:", fullResponse);
        return {
            enhancedPrompt: "Sorry, I had trouble generating a prompt. Please try a different input.",
            initialBotMessage: `I failed to structure my response correctly. Here is my raw output:\n\n${fullResponse}`
        };
    }
    
    const enhancedPrompt = match[1].trim();
    const promptBlock = match[0];

    // The rest of the message is everything after the full prompt block.
    const promptBlockEndIndex = fullResponse.indexOf(promptBlock) + promptBlock.length;
    let initialBotMessage = fullResponse.substring(promptBlockEndIndex).trim();
    
    // Check if the model followed instructions. If not, build a helpful message.
    if (!initialBotMessage.includes('**Critique:**') || !initialBotMessage.includes('**Questions to Improve:**')) {
        let helpfulMessage = initialBotMessage;
        if (!helpfulMessage) {
            helpfulMessage = "My apologies, I generated a prompt but failed to provide the critique and questions.";
        }
        helpfulMessage += "\n\nLet's refine it together. What is the primary goal for this prompt?";
        return { enhancedPrompt, initialBotMessage: helpfulMessage };
    }

    return { enhancedPrompt, initialBotMessage };
};


export const refineInChat = async (currentPrompt: string, chatHistory: ChatMessage[]): Promise<{ response: string; newPrompt: string | null }> => {
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
    const result = await chat.sendMessage({ message: lastMessage.content });

    const responseText = result.text.trim();
    const promptRegex = /```([\s\S]*?)```/;
    const match = responseText.match(promptRegex);
    const newPrompt = match ? match[1].trim() : null;

    return { response: responseText, newPrompt };
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
        console.error("Gemini API stream call for evaluation:", error);
        throw new Error("Failed to stream evaluation from the Gemini API.");
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
        console.error("Gemini API stream call for refinement:", error);
        throw new Error("Failed to stream refinement from the Gemini API.");
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