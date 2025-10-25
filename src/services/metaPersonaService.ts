/**
 * Meta-Persona Service
 * Sistema de criação dinâmica de especialistas sob demanda
 * O Master AI analisa o contexto e cria o especialista perfeito
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Persona } from '../types';

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Prompt do Master AI - O criador de especialistas
 */
const MASTER_SYSTEM_PROMPT = `You are the MASTER AI - an expert in creating specialized AI personas.

Your role is to analyze user requests and CREATE the perfect specialist persona for that specific task.

When creating a specialist, you must:
1. Identify the EXACT domain of expertise needed
2. Define the specialist's knowledge boundaries
3. Craft a system prompt that activates the most relevant neural pathways in the AI model
4. Include specific terminology, frameworks, and methodologies the specialist should use
5. Define the specialist's communication style and approach

Return a JSON object with:
{
  "specialist_name": "Short, professional name (e.g., 'Quantum Physics Expert')",
  "specialist_id": "snake_case_id (e.g., 'quantum_physics_expert')",
  "icon": "Font Awesome icon class (e.g., 'fa-solid fa-atom')",
  "domain": "Primary domain of expertise",
  "system_prompt": "Detailed system prompt that will activate the specialist (minimum 200 words)",
  "key_capabilities": ["capability1", "capability2", "capability3"],
  "communication_style": "How the specialist communicates",
  "reasoning": "Why this specialist is perfect for the user's request"
}

IMPORTANT: The system_prompt must be HIGHLY SPECIFIC and include:
- Role definition with credentials/experience
- Specific methodologies and frameworks to use
- Technical terminology and jargon appropriate to the field
- Problem-solving approach
- Output format preferences
- Constraints and boundaries

Make the specialist DEEPLY knowledgeable and PRECISELY targeted to the user's needs.`;

/**
 * Analisa a solicitação do usuário e cria um especialista sob demanda
 */
export async function createSpecialistOnDemand(
  userRequest: string,
  conversationContext?: string[]
): Promise<Persona> {
  
  const contextPrompt = conversationContext && conversationContext.length > 0
    ? `\n\nConversation context:\n${conversationContext.join('\n')}`
    : '';

  const prompt = `USER REQUEST: "${userRequest}"${contextPrompt}

Analyze this request and CREATE the perfect specialist persona to handle it.
Consider:
- What specific expertise is needed?
- What depth of knowledge is required?
- What communication style would be most effective?
- What frameworks/methodologies should the specialist use?

Return the specialist definition as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{ 
        role: 'user', 
        parts: [{ text: prompt }] 
      }],
      config: {
        systemInstruction: MASTER_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.9, // Alta criatividade para gerar especialistas únicos
        topP: 0.95,
      }
    });

    const specialistData = JSON.parse(response.text);
    
    // Converte para o formato Persona
    const specialist: Persona = {
      id: specialistData.specialist_id || `specialist_${Date.now()}`,
      name: specialistData.specialist_name || 'Specialist',
      prompt: specialistData.system_prompt,
      icon: specialistData.icon || 'fa-solid fa-user-tie',
      // Campos extras para exibição
      domain: specialistData.domain,
      capabilities: specialistData.key_capabilities,
      communicationStyle: specialistData.communication_style,
      reasoning: specialistData.reasoning,
      isGenerated: true,
      createdAt: Date.now(),
    };

    return specialist;

  } catch (error) {
    console.error('Error creating specialist:', error);
    throw new Error('Failed to create specialist. Please try again.');
  }
}

/**
 * Refina um especialista existente com base em feedback
 */
export async function refineSpecialist(
  currentSpecialist: Persona,
  feedback: string,
  conversationHistory: string[]
): Promise<Persona> {
  
  const prompt = `CURRENT SPECIALIST:
Name: ${currentSpecialist.name}
System Prompt: ${currentSpecialist.prompt}

USER FEEDBACK: "${feedback}"

CONVERSATION HISTORY:
${conversationHistory.join('\n')}

The user is not satisfied with the current specialist. REFINE the specialist to better meet their needs.
Adjust the system prompt, capabilities, and approach based on the feedback.

Return the IMPROVED specialist definition as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{ 
        role: 'user', 
        parts: [{ text: prompt }] 
      }],
      config: {
        systemInstruction: MASTER_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.8,
      }
    });

    const refinedData = JSON.parse(response.text);
    
    return {
      ...currentSpecialist,
      name: refinedData.specialist_name || currentSpecialist.name,
      prompt: refinedData.system_prompt,
      domain: refinedData.domain,
      capabilities: refinedData.key_capabilities,
      communicationStyle: refinedData.communication_style,
      reasoning: refinedData.reasoning,
      refinedAt: Date.now(),
    };

  } catch (error) {
    console.error('Error refining specialist:', error);
    throw new Error('Failed to refine specialist. Please try again.');
  }
}

/**
 * Sugere especialistas com base no histórico de conversas
 */
export async function suggestSpecialists(
  conversationHistory: string[]
): Promise<Persona[]> {
  
  const prompt = `CONVERSATION HISTORY:
${conversationHistory.join('\n')}

Based on this conversation, suggest 3 DIFFERENT specialists that could help the user with related topics or deeper exploration.

Return an array of 3 specialist definitions as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ 
        role: 'user', 
        parts: [{ text: prompt }] 
      }],
      config: {
        systemInstruction: MASTER_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              specialist_name: { type: Type.STRING },
              specialist_id: { type: Type.STRING },
              icon: { type: Type.STRING },
              domain: { type: Type.STRING },
              system_prompt: { type: Type.STRING },
              key_capabilities: { type: Type.ARRAY, items: { type: Type.STRING } },
              communication_style: { type: Type.STRING },
              reasoning: { type: Type.STRING },
            }
          }
        },
        temperature: 1.0,
      }
    });

    const specialistsData = JSON.parse(response.text);
    
    return specialistsData.map((data: any) => ({
      id: data.specialist_id || `specialist_${Date.now()}_${Math.random()}`,
      name: data.specialist_name || 'Specialist',
      prompt: data.system_prompt,
      icon: data.icon || 'fa-solid fa-user-tie',
      domain: data.domain,
      capabilities: data.key_capabilities,
      communicationStyle: data.communication_style,
      reasoning: data.reasoning,
      isGenerated: true,
      createdAt: Date.now(),
    }));

  } catch (error) {
    console.error('Error suggesting specialists:', error);
    return [];
  }
}

/**
 * Cria um "Team" de especialistas para problemas complexos
 */
export async function createSpecialistTeam(
  problemDescription: string,
  teamSize: number = 3
): Promise<Persona[]> {
  
  const prompt = `COMPLEX PROBLEM: "${problemDescription}"

This problem requires a TEAM of ${teamSize} different specialists working together.
Create ${teamSize} complementary specialists, each covering a different aspect of the problem.

The specialists should:
1. Have distinct but complementary expertise
2. Cover different angles of the problem
3. Work together synergistically

Return an array of ${teamSize} specialist definitions as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{ 
        role: 'user', 
        parts: [{ text: prompt }] 
      }],
      config: {
        systemInstruction: MASTER_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.95,
      }
    });

    const teamData = JSON.parse(response.text);
    
    return teamData.map((data: any, index: number) => ({
      id: data.specialist_id || `team_member_${Date.now()}_${index}`,
      name: data.specialist_name || `Specialist ${index + 1}`,
      prompt: data.system_prompt,
      icon: data.icon || 'fa-solid fa-user-tie',
      domain: data.domain,
      capabilities: data.key_capabilities,
      communicationStyle: data.communication_style,
      reasoning: data.reasoning,
      isGenerated: true,
      isTeamMember: true,
      teamRole: `Member ${index + 1} of ${teamSize}`,
      createdAt: Date.now(),
    }));

  } catch (error) {
    console.error('Error creating specialist team:', error);
    throw new Error('Failed to create specialist team. Please try again.');
  }
}
