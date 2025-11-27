import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LeapManifest, ModelNames } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Helper Functions (from Guidelines)
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// 1. Generate Manifest (Text + Data + Prompts)
export const generateManifest = async (topic: string): Promise<LeapManifest> => {
  const response = await ai.models.generateContent({
    model: ModelNames.TEXT,
    contents: `Perform a "Quantum Leap" analysis on the topic: "${topic}".
    I need a structured JSON response containing:
    1. A concise, high-level summary of the concept (max 2 sentences).
    2. Data for a bar chart that represents a key metric related to this topic (e.g., speed, growth, energy, size comparisons). Provide 4-6 data points.
    3. A highly creative, detailed, and artistic prompt to generate a futuristic or hyper-realistic image representing this concept.
    4. A short, engaging script (approx 20-30 words) for a voice narrator to introduce this topic with a "Did you know?" style fact.
    5. A color palette of 2 hex codes that fits the mood of the topic.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          chartTitle: { type: Type.STRING },
          chartData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.NUMBER },
                unit: { type: Type.STRING }
              }
            }
          },
          imagePrompt: { type: Type.STRING },
          audioScript: { type: Type.STRING },
          colors: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          }
        },
        required: ["summary", "chartTitle", "chartData", "imagePrompt", "audioScript", "colors"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No text returned from Gemini");
  return JSON.parse(text) as LeapManifest;
};

// 2. Generate Image
export const generateLeapImage = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: ModelNames.IMAGE,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
        // Image generation doesn't use standard responseMimeType
    }
  });

  // Iterate to find the image part
  for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
              return part.inlineData.data;
          }
      }
  }
  throw new Error("No image generated");
};

// 3. Generate Audio
export const generateLeapAudio = async (script: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const response = await ai.models.generateContent({
    model: ModelNames.AUDIO,
    contents: {
      parts: [{ text: script }]
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, authoritative voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  // Decode using the provided helper functions for PCM data
  return await decodeAudioData(
    decode(base64Audio),
    audioContext,
    24000, // Gemini TTS sample rate
    1, // Mono
  );
};
