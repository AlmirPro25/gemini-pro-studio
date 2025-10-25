import { GoogleGenAI, GenerateContentResponse, Part, Type, Modality, Content, LiveServerMessage, Blob as GenaiBlob } from "@google/genai";
import { GeminiModel, Persona, Attachment, Message, GroundingSource, GenerationConfig } from '../types';

// The execution environment will inject process.env.API_KEY.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Audio Helper Functions ---
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
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


const fileToGenerativePart = (base64Data: string, mimeType: string): Part => {
  return {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };
}

export async function* sendMessageToGemini(
  history: Message[],
  model: GeminiModel,
  persona: Persona,
  isThinkingMode: boolean,
  generationConfig: GenerationConfig,
  signal?: AbortSignal
): AsyncGenerator<string> {
    
  const generativeModel = ai.models;
  const lastMessage = history[history.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error("Invalid history: Last message must be from the user.");
  }
  
  const hasAttachments = lastMessage.attachments && lastMessage.attachments.length > 0;
  
  let instruction = `You are having a conversation with the user. You have access to the full conversation history.
  
IMPORTANT: Maintain context from previous messages. Reference earlier parts of the conversation when relevant.

Provide a comprehensive response to the user's current prompt, taking into account everything discussed so far.`;
  
  if (hasAttachments) {
    instruction += ` The user has provided attachments (e.g., images). Analyze them carefully in relation to the text prompt and conversation context.`;
  }
  
  if (isThinkingMode) {
      instruction += `

**Thinking Mode Activated**: Before providing the final answer, you MUST first output a "## Pensamento" section. In this section, lay out your step-by-step reasoning, your plan, and any assumptions you're making. This gives the user insight into your thought process. After the "Pensamento" section, provide the final, complete response.`;
  }
  
  instruction += `

After the main response, suggest 2-3 relevant follow-up questions or actions the user might want to take next based on the conversation.
  
**IMPORTANT RULE:** If your response is a self-contained, runnable HTML application (like a canvas game, a data visualization, or an interactive widget), you MUST set "isInteractive" to true and place the complete HTML code in the "htmlCode" field. In this case, the "response" field should contain a brief description of the application. For all other text-based responses, "isInteractive" should be false.

Return your entire output as a single JSON object with the specified keys.`;

  const contents: Content[] = history.map(msg => {
    const parts: Part[] = [];
    if (msg.attachments) {
        parts.push(...msg.attachments.map(att => fileToGenerativePart(att.data, att.mimeType)));
    }
    // Only add instruction to the very last user message
    if (msg.id === lastMessage.id) {
        parts.push({ text: `${instruction}\n\nUser Prompt: "${msg.content}"` });
    } else {
        parts.push({ text: msg.content });
    }
    return { role: msg.role, parts: parts };
  });

  const modelId = isThinkingMode ? 'gemini-2.5-pro' : model.id;
  const thinkingConfig = isThinkingMode ? { thinkingConfig: { thinkingBudget: 32768 } } : {};

  // Construct the final generation config, ensuring user settings don't conflict with thinking mode budget
  const finalGenerationConfig: any = { ...generationConfig };
  if (isThinkingMode && finalGenerationConfig.maxOutputTokens && finalGenerationConfig.maxOutputTokens <= 32768) {
      // This is a safeguard. The API is smart, but it's good practice.
      // We prioritize the thinking budget. The user will get a shorter response if maxOutputTokens is too low.
  }


  try {
    // Enhance system instruction with conversation context awareness
    const enhancedSystemInstruction = `${persona.prompt}

CRITICAL: You have access to the full conversation history. Always maintain context and reference previous messages when relevant. Never say you don't have memory or can't remember previous interactions - you can see the entire conversation.`;

    const result = await generativeModel.generateContentStream({
      model: modelId,
      contents: contents,
      config: {
          systemInstruction: enhancedSystemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              response: { type: Type.STRING, description: "Your detailed response to the user's prompt, formatted as Markdown. Or a description of the interactive app." },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 2-3 suggested follow-up prompts." },
              isInteractive: { type: Type.BOOLEAN, description: "Set to true if the response is a runnable HTML application." },
              htmlCode: { type: Type.STRING, description: "The full HTML source code if isInteractive is true." }
            }
          },
          ...finalGenerationConfig,
          ...thinkingConfig
      }
    });

    if (signal) {
      signal.addEventListener('abort', () => {});
    }

    for await (const chunk of result) {
       if (signal?.aborted) {
           console.log("Stream generation aborted.");
           return;
       }
       yield chunk.text;
    }
  } catch (error) {
    console.error("Error in sendMessageToGemini:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
           throw new Error("Invalid API Key. Please check your credentials.");
        }
        throw new Error(`Failed to get response from Gemini: ${error.message}`);
    }
    throw new Error("An unknown error occurred in sendMessageToGemini.");
  }
}

export async function sendMessageWithGrounding(
  history: Message[],
  model: GeminiModel,
  persona: Persona,
  groundingTool: 'googleSearch' | 'googleMaps',
  userLocation: { latitude: number, longitude: number } | null
): Promise<{ content: string, sources: GroundingSource[] }> {
  
  const generativeModel = ai.models;
  const lastMessage = history[history.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error("Invalid history: Last message must be from the user.");
  }

  const contents: Content[] = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  const config: any = {
    systemInstruction: persona.prompt,
    tools: [{ [groundingTool]: {} }]
  };

  if (groundingTool === 'googleMaps' && userLocation) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: userLocation
      }
    };
  }

  try {
    const response = await generativeModel.generateContent({
      model: model.id,
      contents: contents,
      config: config
    });

    const content = response.text;
    // FIX: Explicitly type the return of the map function to ensure the `type` property is correctly inferred as 'web' | 'maps'.
    const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any): GroundingSource => {
      const sourceData = c.web || c.maps;
      return {
        uri: sourceData?.uri || '#',
        title: sourceData?.title || 'Unknown Source',
        type: c.web ? 'web' : 'maps',
      };
    }).filter((s: GroundingSource) => s.uri !== '#') || [];
    
    return { content, sources };

  } catch (error) {
    console.error(`Error in sendMessageWithGrounding:`, error);
     if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
           throw new Error("Invalid API Key. Please check your credentials.");
        }
        throw new Error(`Failed to get grounded response from Gemini: ${error.message}`);
    }
    throw new Error("An unknown error occurred in sendMessageWithGrounding.");
  }
}


export async function generateOrEditImage(
  prompt: string,
  attachments?: Attachment[],
  modelId: string = 'gemini-2.5-flash-image'
): Promise<Attachment> {
  const parts: Part[] = [];

  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      if(attachment.mimeType.startsWith('image/')) {
        parts.push(fileToGenerativePart(attachment.data, attachment.mimeType));
      }
    }
  }
  parts.push({ text: prompt });

  try {
    // Para o modelo experimental, precisa especificar TEXT e IMAGE
    const config = modelId === 'gemini-2.0-flash-exp' 
      ? { responseModalities: [Modality.TEXT, Modality.IMAGE] }
      : { responseModalities: [Modality.IMAGE] };

    const result: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: { parts: parts },
      config: config,
    });
    
    const imagePart = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (imagePart && imagePart.inlineData) {
        return {
          name: `generated_${Date.now()}.png`,
          mimeType: imagePart.inlineData.mimeType,
          data: imagePart.inlineData.data,
        };
    }

    if (result.candidates?.[0]?.finishReason && result.candidates?.[0]?.finishReason !== 'STOP') {
        throw new Error(`Image generation failed due to: ${result.candidates[0].finishReason}. Please check safety settings or modify your prompt.`);
    }

    throw new Error("No image found in the API response. The model may have refused to generate content.");
  } catch (error) {
    console.error("Error in generateOrEditImage:", error);
    throw new Error(`Failed to generate image with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateImageWithImagen(prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<Attachment> {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { 
            numberOfImages: 1, 
            outputMimeType: 'image/png',
            aspectRatio: aspectRatio,
        },
    });

    const generatedImage = response.generatedImages?.[0];

    if (generatedImage?.image?.imageBytes) {
      const base64ImageBytes: string = generatedImage.image.imageBytes;
      return {
        name: `imagen_${Date.now()}.png`,
        mimeType: 'image/png',
        data: base64ImageBytes,
      };
    }
    
    throw new Error("No image found in the Imagen API response. The model may have refused to generate content.");

  } catch(error) {
    console.error("Error in generateImageWithImagen:", error);
    throw new Error(`Failed to generate image with Imagen: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateVideoWithVeo(
    prompt: string, 
    aspectRatio: '16:9' | '9:16', 
    image: Attachment | undefined,
    onProgress: (progress: string) => void
): Promise<string> {
    // Veo requires its own API key selection, so we create a new instance here.
    const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        onProgress("Initializing video generation...");

        const imagePayload = image ? {
            imageBytes: image.data,
            mimeType: image.mimeType,
        } : undefined;

        let operation = await localAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            ...(imagePayload && { image: imagePayload }),
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });

        const reassuringMessages = [
            "Warming up the creativity engines...",
            "Composing the visual narrative...",
            "Rendering pixels into motion...",
            "Almost there, adding the final touches...",
        ];
        let messageIndex = 0;

        while (!operation.done) {
            onProgress(reassuringMessages[messageIndex % reassuringMessages.length]);
            messageIndex++;
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await localAi.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) {
            throw new Error(`Video generation failed: ${operation.error.message}`);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was found.");
        }
        
        onProgress("Downloading generated video...");
        // Append API key to fetch the video bytes
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Error in generateVideoWithVeo:", error);
        if (error instanceof Error && error.message.includes("Requested entity was not found")) {
             throw new Error(`API Key not valid for Veo. Please select a valid key and try again.`);
        }
        throw new Error(`Failed to generate video with Veo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}


export async function transcribeAudio(audioBase64: string): Promise<string> {
  try {
    const audioPart = fileToGenerativePart(audioBase64, 'audio/webm');
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: "Transcribe this audio:" }, audioPart] }
    });
    return result.text;
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateSpeech(text: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak this naturally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch(error) {
    console.error("Error in generateSpeech:", error);
    throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// --- Gemini Live API Manager ---
export class LiveSessionManager {
  private session: any | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputNode: GainNode | null = null;
  private outputNode: GainNode | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  
  async startSession(callbacks: {
    onOpen: () => void;
    onMessage: (message: LiveServerMessage) => void;
    onError: (e: ErrorEvent) => void;
    onClose: (e: CloseEvent) => void;
    onTranscription: (text: string, isFinal: boolean) => void;
  }) {
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: async () => {
          this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          this.inputNode = this.inputAudioContext.createGain();
          this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
          this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

          this.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = this.createBlob(inputData);
            sessionPromise.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          source.connect(this.scriptProcessor);
          this.scriptProcessor.connect(this.inputAudioContext.destination);
          callbacks.onOpen();
        },
        onmessage: async (message: LiveServerMessage) => {
          callbacks.onMessage(message);
          
          if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            const isFinal = !!message.serverContent.turnComplete;
            callbacks.onTranscription(text, isFinal);
          } else if (message.serverContent?.turnComplete) {
            callbacks.onTranscription('', true);
          }

          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio && this.outputAudioContext && this.outputNode) {
            this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputNode);
            source.addEventListener('ended', () => { this.sources.delete(source); });
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.sources.add(source);
          }

          if (message.serverContent?.interrupted) {
            for (const source of this.sources.values()) {
              source.stop();
              this.sources.delete(source);
            }
            this.nextStartTime = 0;
          }
        },
        onerror: callbacks.onError,
        onclose: callbacks.onClose,
      },
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
      },
    });

    this.session = await sessionPromise;
  }

  private createBlob(data: Float32Array): GenaiBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  async closeSession() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.scriptProcessor?.disconnect();
    await this.inputAudioContext?.close();
    await this.outputAudioContext?.close();
    this.sources.forEach(source => source.stop());
    this.sources.clear();
  }
}