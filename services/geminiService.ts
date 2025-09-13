
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PROMPT_1, PROMPT_2, PROMPT_3, CHAT_SYSTEM_INSTRUCTION } from '../constants';
import { ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

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
    const promptMatch = fullResponse.match(promptRegex);
    const enhancedPrompt = promptMatch ? promptMatch[1].trim() : '';

    let initialBotMessage = promptMatch ? fullResponse.substring(promptMatch[0].length).trim() : '';

    if (!enhancedPrompt) {
        console.error("Could not parse prompt from PROMPT_1 response:", fullResponse);
        return {
            enhancedPrompt: fullResponse || "Sorry, I couldn't generate a prompt. Please try a different input.",
            initialBotMessage: "I had trouble structuring my response. How can we refine this to better suit your needs?"
        };
    }
    
    if (!initialBotMessage) {
       initialBotMessage = "I've generated the prompt above. Please review it and let me know your thoughts so we can refine it together!";
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

export const runEvaluation = async (promptToCritique: string): Promise<string> => {
    const prompt = PROMPT_2.replace('{{PROMPT_TO_CRITIQUE}}', promptToCritique);
    return generate(prompt);
};

export const runRefinement = async (promptToImprove: string, critique: string): Promise<{ improvedPrompt: string; fullResponse: string; }> => {
    const prompt = PROMPT_3.replace('{{PROMPT_TO_IMPROVE}}', promptToImprove)
                            .replace('{{CRITIQUE}}', critique);
    const fullResponse = await generate(prompt);

    const promptRegex = /```([\s\S]*?)```/m;
    const match = fullResponse.match(promptRegex);
    
    let improvedPrompt = fullResponse;
    if (match && match[1]) {
        improvedPrompt = match[1].trim();
    } else {
        console.warn("Could not find a markdown code block in the refinement response. Using full response as the prompt.");
    }
    
    return { improvedPrompt, fullResponse };
};
