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

export const enhanceInitialPrompt = async (userPrompt: string): Promise<{ enhancedPrompt: string; initialBotMessage: string; }> => {
    const prompt = PROMPT_1.replace('{{USER_PROMPT}}', userPrompt);
    const fullResponse = await generate(prompt);

    // Regex to capture content within ``` for the prompt
    const promptRegex = /\*\*Prompt:\*\*\s*\`\`\`\s*([\s\S]+?)\s*\`\`\`/m;
    const promptMatch = fullResponse.match(promptRegex);
    const enhancedPrompt = promptMatch ? promptMatch[1].trim() : '';

    let initialBotMessage = '';
    if (promptMatch) {
        // The rest of the message after the prompt block is the bot message
        const restOfMessage = fullResponse.substring(promptMatch[0].length).trim();
        initialBotMessage = restOfMessage;
    }

    // Fallback logic
    if (!enhancedPrompt) {
        console.error("Could not parse prompt from PROMPT_1 response:", fullResponse);
        // If parsing fails, the model might have just returned the prompt. Treat the whole response as the prompt.
        return {
            enhancedPrompt: fullResponse,
            initialBotMessage: "I've generated a first draft of your prompt. How can we refine it to better suit your needs?"
        };
    }
    
    if (!initialBotMessage) {
       initialBotMessage = "I've generated the prompt above. Please review it and let me know your thoughts so we can refine it together!";
    }

    return { enhancedPrompt, initialBotMessage };
};


export const critiquePrompt = async (promptToCritique: string): Promise<string> => {
    const prompt = PROMPT_2.replace('{{PROMPT_TO_CRITIQUE}}', promptToCritique);
    return generate(prompt);
};

export const improvePrompt = async (promptToImprove: string, critique: string): Promise<string> => {
    const prompt = PROMPT_3.replace('{{PROMPT_TO_IMPROVE}}', promptToImprove)
                            .replace('{{CRITIQUE}}', critique);
    const fullResponse = await generate(prompt);

    const promptRegex = /```([\s\S]*?)```/m;
    const match = fullResponse.match(promptRegex);
    
    if (match && match[1]) {
        return match[1].trim();
    }
    
    // Fallback: if no markdown block is found, return the whole response.
    console.warn("Could not find a markdown code block in the improved prompt response. Returning full response.");
    return fullResponse;
};

export const continueChat = async (currentPrompt: string, chatHistory: ChatMessage[]): Promise<{ response: string; newPrompt: string | null }> => {
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

    // Regex to find a prompt inside ```...```
    const promptRegex = /```([\s\S]*?)```/;
    const match = responseText.match(promptRegex);

    const newPrompt = match ? match[1].trim() : null;

    return { response: responseText, newPrompt };
};