import { ChatMessage, CritiqueAndQuestions } from '../types';

export const initialEnhance = async (userPrompt: string): Promise<{ enhancedPrompt: string; initialBotMessage: ChatMessage; }> => {
    try {
        const response = await fetch("/api/gemini/initial-enhance", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userPrompt }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error during initial enhance:", error);
        throw error;
    }
};

export const refineInChatStream = async (
    currentPrompt: string,
    chatHistory: ChatMessage[],
    onChunk: (chunk: string) => void
): Promise<{ newPrompt: string | null }> => {
    try {
        const response = await fetch("/api/gemini/refine-chat-stream", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ currentPrompt, chatHistory }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Body of response is not readable");

        const decoder = new TextDecoder();
        let buffer = "";
        let newPrompt: string | null = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === "[DONE]") {
                        continue;
                    }
                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.error) {
                            throw new Error(parsed.error);
                        }
                        if (parsed.chunk) {
                            onChunk(parsed.chunk);
                        }
                        if (parsed.newPrompt !== undefined) {
                            newPrompt = parsed.newPrompt;
                        }
                    } catch (e) {
                        // Silent catch for any SSE formatting variance
                    }
                }
            }
        }

        return { newPrompt };
    } catch (error) {
        console.error("Error during streaming chat refinement:", error);
        throw error;
    }
};

export const generateCritiqueAndQuestions = async (promptToAnalyze: string): Promise<{ structuredResponse: CritiqueAndQuestions; rawResponse: string }> => {
    try {
        const response = await fetch("/api/gemini/critique", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ promptToAnalyze }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error during critique generation:", error);
        throw error;
    }
};

export const runEvaluationStream = async (
    promptToCritique: string,
    onChunk: (chunk: string) => void
): Promise<string> => {
    try {
        const response = await fetch("/api/gemini/evaluation-stream", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ promptToCritique }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Body of response is not readable");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === "[DONE]") {
                        continue;
                    }
                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.error) {
                            throw new Error(parsed.error);
                        }
                        if (parsed.chunk) {
                            fullResponse += parsed.chunk;
                            onChunk(parsed.chunk);
                        }
                    } catch (e) {
                    }
                }
            }
        }

        return fullResponse;
    } catch (error) {
        console.error("Error during streaming evaluation:", error);
        throw error;
    }
};

export const runRefinementStream = async (
    promptToImprove: string,
    critique: string,
    onChunk: (chunk: string) => void
): Promise<{ improvedPrompt: string; fullResponse: string }> => {
    try {
        const response = await fetch("/api/gemini/refinement-stream", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ promptToImprove, critique }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Body of response is not readable");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullResponse = "";
        let improvedPrompt = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === "[DONE]") {
                        continue;
                    }
                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.error) {
                            throw new Error(parsed.error);
                        }
                        if (parsed.chunk) {
                            fullResponse += parsed.chunk;
                            onChunk(parsed.chunk);
                        }
                        if (parsed.fullResponse !== undefined) {
                            fullResponse = parsed.fullResponse;
                        }
                        if (parsed.improvedPrompt !== undefined) {
                            improvedPrompt = parsed.improvedPrompt;
                        }
                    } catch (e) {
                    }
                }
            }
        }

        if (!improvedPrompt) {
            const promptRegex = /```([\s\S]*?)```/m;
            const match = fullResponse.match(promptRegex);
            if (match && match[1]) {
                improvedPrompt = match[1].trim();
            } else {
                improvedPrompt = fullResponse;
            }
        }

        return { improvedPrompt, fullResponse };
    } catch (error) {
        console.error("Error during streaming refinement:", error);
        throw error;
    }
};

export const fetchTrendingPrompts = async (): Promise<string[]> => {
    try {
        const response = await fetch("/api/gemini/trending");

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return Array.isArray(data.prompts) ? data.prompts : [];
    } catch {
        return [];
    }
};
