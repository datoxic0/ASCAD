import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function askGemini(prompt: string, schematicData: any) {
  try {
    const ai = getGenAI();
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are an expert electrical engineer.
        Current Schematic Data: ${JSON.stringify(schematicData)}
        
        User Question/Request: ${prompt}
        
        Please provide technical advice, potential improvements, or explanations for the circuit layout and connections.
        Keep answers concise but professional.
      `,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to get a response from AI.";
  }
}
