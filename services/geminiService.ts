import { GoogleGenAI, Type } from "@google/genai";
import type { ChatMessage, PromptConfig } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this environment, we'll show an alert.
  console.error("API_KEY environment variable not set!");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const model = "gemini-2.5-flash";

function fileToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

export async function* generateChatResponseStream(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: ChatMessage
): AsyncGenerator<string> {
  
  if(!API_KEY) {
    yield "Error: API key is not configured. Please set the process.env.API_KEY environment variable.";
    return;
  }
  
  try {
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemPrompt,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
    });

    const parts: any[] = [{ text: userMessage.text }];
    if (userMessage.image) {
        // Assuming image is `data:mime/type;base64,.....`
        const [meta, data] = userMessage.image.split(',');
        const mimeType = meta.split(':')[1].split(';')[0];
        parts.unshift(fileToGenerativePart(data, mimeType));
    }

    const result = await chat.sendMessageStream({ message: parts });

    for await (const chunk of result) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    yield `Error: Could not get response from AI. Details: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function getPromptSuggestion(field: string, currentContent: string): Promise<string> {
    if(!API_KEY) {
        return "Error: API key is not configured.";
    }
    
    try {
        const prompt = `You are a world-class prompt engineering expert. Your task is to provide a concise, actionable suggestion to improve a specific part of a system prompt.
        
        Field to improve: "${field}"
        Current content: "${currentContent || '(empty)'}"
        
        Based on best practices, provide one clear suggestion for improvement. Be specific and helpful. Frame your response as a direct suggestion.`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Gemini suggestion error:", error);
        return `Error getting suggestion: ${error instanceof Error ? error.message : String(error)}`;
    }
}

const promptConfigSchema = {
    type: Type.OBJECT,
    properties: {
        persona: { type: Type.STRING, description: "The agent's identity or role. e.g., 'You are a senior data scientist named Dr. Anya Sharma.'" },
        mission: { type: Type.STRING, description: "The agent's primary goal or objective." },
        skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the agent's capabilities or tools." },
        boundaries: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of critical 'do nots' or constraints." },
        personality: { type: Type.STRING, description: "The desired interaction style or tone (e.g., Professional, Casual, Enthusiastic, Formal)." },
        format: { type: Type.STRING, description: "Strict instructions on the desired output format (e.g., 'Always respond in valid JSON with keys `explanation` and `code`')." },
        reference: { type: Type.STRING, description: "Any context, few-shot examples, or specific data the agent must use. If not present, this will be an empty string." },
    },
    required: ["persona", "mission", "skills", "boundaries", "personality", "format", "reference"],
};

export async function parsePromptWithAI(promptText: string): Promise<PromptConfig> {
    if(!API_KEY) {
        throw new Error("API key is not configured.");
    }

    try {
        const instruction = `Analyze the following system prompt and extract its core components into a JSON object. Follow the provided schema precisely. If a section is missing, provide a reasonable default or an empty value (e.g., empty string or empty array).

System Prompt to analyze:
---
${promptText}
---`;

        const response = await ai.models.generateContent({
            model: model,
            contents: instruction,
            config: {
                responseMimeType: "application/json",
                responseSchema: promptConfigSchema,
            }
        });

        const jsonString = response.text;
        const parsedConfig = JSON.parse(jsonString) as PromptConfig;
        
        // Ensure personality is one of the allowed values, default if not.
        const allowedPersonalities: PromptConfig['personality'][] = ['Professional', 'Casual', 'Enthusiastic', 'Formal'];
        if (!allowedPersonalities.includes(parsedConfig.personality)) {
            parsedConfig.personality = 'Professional';
        }

        return parsedConfig;

    } catch (error) {
        console.error("Gemini parsing error:", error);
        throw new Error(`Failed to parse prompt with AI. Details: ${error instanceof Error ? error.message : String(error)}`);
    }
}