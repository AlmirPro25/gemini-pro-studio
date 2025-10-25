/**
 * 📄 RESUME & DOCUMENT GENERATOR - SISTEMA COMPLETO
 * Todos os templates profissionais do sistema original
 */

import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY not found in resumeDocumentService");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// ==================== INTERFACES ====================

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface ProcessResult {
  action: 'document' | 'photo' | 'chat';
  data: {
    documentHtml?: string;
    documentType?: 'resume' | 'generic';
    aiResponse?: string;
    photoPrompt?: string;
  };
}

// ==================== RESUME TEMPLATES ====================
// TODOS os 6 templates profissionais

export const RESUME_TEMPLATES = {
  Modern: '', // Será preenchido via append
  Elegant: '',
  Classic: '',
  Creative: '',
  Minimal: '',
  Executive: ''
};

// ==================== DOCUMENT TEMPLATES ====================

export const DOCUMENT_TEMPLATES = {
  rentalContract: { name: 'Contrato de Locação', template: '' },
  simpleDeclaration: { name: 'Declaração Simples', template: '' }
};

// Preencher templates
RESUME_TEMPLATES.Modern = `<div class="font-sans bg-white flex" style="min-height: 297mm; width: 210mm;"><aside class="w-1/3 bg-{{THEME}}-800 text-gray-200 p-8"><div class="text-center mb-10"><img id="resume-photo" src="" class="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-{{THEME}}-600 hidden" /><h1 class="text-3xl font-bold text-white">{{NOME}}</h1><p class="text-lg text-{{THEME}}-300 mt-1">{{CARGO}}</p></div><div class="space-y-6 text-sm"><section><h2 class="text-sm font-bold uppercase text-{{THEME}}-400 mb-3">CONTATO</h2><ul class="space-y-3"><li>{{EMAIL}}</li><li>{{TELEFONE}}</li><li>{{LINKEDIN}}</li></ul></section><section><h2 class="text-sm font-bold uppercase text-{{THEME}}-400 mb-3">HABILIDADES</h2><div class="flex flex-wrap gap-2">{{HABILIDADES}}</div></section></div></aside><main class="w-2/3 p-10 bg-gray-100 text-gray-700"><section class="mb-8"><h2 class="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-4">Resumo Profissional</h2><p class="leading-relaxed">{{RESUMO}}</p></section><section class="mb-8"><h2 class="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-4">Experiência Profissional</h2>{{EXPERIENCIAS}}</section><section><h2 class="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-4">Formação Acadêmica</h2>{{FORMACAO}}</section></main></div>`;

RESUME_TEMPLATES.Elegant = `<div class="font-sans bg-white p-10 text-gray-800" style="min-height: 297mm; width: 210mm;"><header class="text-center mb-10 border-b-2 pb-6 border-{{THEME}}-200"><img id="resume-photo" src="" class="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-{{THEME}}-300 hidden" /><h1 class="text-5xl font-bold tracking-tight">{{NOME}}</h1><p class="text-xl text-{{THEME}}-600 mt-2">{{CARGO}}</p></header><div class="flex gap-10"><main class="w-2/3"><section class="mb-8"><h2 class="text-xl font-bold uppercase text-{{THEME}}-700 tracking-wider mb-4">Resumo</h2><p class="leading-relaxed">{{RESUMO}}</p></section><section class="mb-8"><h2 class="text-xl font-bold uppercase text-{{THEME}}-700 tracking-wider mb-4">Experiência</h2>{{EXPERIENCIAS}}</section></main><aside class="w-1/3"><section class="mb-8"><h2 class="text-xl font-bold uppercase text-{{THEME}}-700 tracking-wider mb-4">Contato</h2><ul class="space-y-2"><li>{{EMAIL}}</li><li>{{TELEFONE}}</li></ul></section><section class="mb-8"><h2 class="text-xl font-bold uppercase text-{{THEME}}-700 tracking-wider mb-4">Habilidades</h2><div>{{HABILIDADES}}</div></section></aside></div></div>`;

RESUME_TEMPLATES.Classic = `<div class="font-sans bg-white p-10 text-gray-800" style="min-height: 297mm; width: 210mm;"><header class="mb-8 flex items-center gap-6"><div class="flex-shrink-0"><img id="resume-photo" src="" class="w-28 h-28 rounded-lg object-cover border-4 border-{{THEME}}-500 hidden" /></div><div class="flex-1"><h1 class="text-5xl font-bold">{{NOME}}</h1><p class="text-xl text-gray-500 mt-2">{{CARGO}}</p></div></header><div class="border-t-4 border-{{THEME}}-500 pt-6"><section class="mb-6"><h2 class="text-lg font-bold uppercase text-{{THEME}}-600 mb-3">Resumo</h2><p>{{RESUMO}}</p></section><section class="mb-6"><h2 class="text-lg font-bold uppercase text-{{THEME}}-600 mb-3">Contato</h2><ul class="flex space-x-6"><li>{{EMAIL}}</li><li>{{TELEFONE}}</li></ul></section><section class="mb-6"><h2 class="text-lg font-bold uppercase text-{{THEME}}-600 mb-3">Experiência</h2>{{EXPERIENCIAS}}</section></div></div>`;

RESUME_TEMPLATES.Creative = `<div class="font-sans bg-gradient-to-br from-{{THEME}}-50 to-white" style="min-height: 297mm; width: 210mm;"><div class="relative p-8"><div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-{{THEME}}-600 to-{{THEME}}-400"></div><div class="relative z-10 flex items-center gap-6 mb-8"><img id="resume-photo" src="" class="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg hidden" /><div class="text-white"><h1 class="text-4xl font-bold mb-2">{{NOME}}</h1><p class="text-xl opacity-90">{{CARGO}}</p></div></div><div class="grid grid-cols-3 gap-8 mt-16"><div class="col-span-2 space-y-6"><section class="bg-white rounded-lg p-6 shadow-md"><h2 class="text-xl font-bold text-{{THEME}}-700 mb-4">Resumo Profissional</h2><p class="text-gray-700 leading-relaxed">{{RESUMO}}</p></section><section class="bg-white rounded-lg p-6 shadow-md"><h2 class="text-xl font-bold text-{{THEME}}-700 mb-4">Experiência</h2>{{EXPERIENCIAS}}</section></div><div class="space-y-6"><section class="bg-{{THEME}}-700 text-white rounded-lg p-6"><h2 class="text-lg font-bold mb-4">Contato</h2><ul class="space-y-2 text-sm"><li>{{EMAIL}}</li><li>{{TELEFONE}}</li></ul></section><section class="bg-white rounded-lg p-6 shadow-md"><h2 class="text-lg font-bold text-{{THEME}}-700 mb-4">Habilidades</h2>{{HABILIDADES}}</section></div></div></div></div>`;

RESUME_TEMPLATES.Minimal = `<div class="font-sans bg-white text-gray-800" style="min-height: 297mm; width: 210mm; padding: 60px;"><header class="text-center mb-16 pb-8 border-b border-gray-200"><img id="resume-photo" src="" class="w-24 h-24 rounded-full object-cover mx-auto mb-6 border-2 border-{{THEME}}-300 hidden" /><h1 class="text-4xl font-light tracking-wide mb-2">{{NOME}}</h1><p class="text-lg text-gray-500 font-light">{{CARGO}}</p></header><div class="space-y-12"><section><h2 class="text-sm uppercase tracking-widest text-{{THEME}}-600 font-medium mb-6">Resumo</h2><p class="text-gray-700 leading-relaxed font-light">{{RESUMO}}</p></section><section><h2 class="text-sm uppercase tracking-widest text-{{THEME}}-600 font-medium mb-6">Contato</h2><div class="grid grid-cols-2 gap-4 text-sm"><div>{{EMAIL}}</div><div>{{TELEFONE}}</div></div></section><section><h2 class="text-sm uppercase tracking-widest text-{{THEME}}-600 font-medium mb-6">Experiência</h2>{{EXPERIENCIAS}}</section></div></div>`;

RESUME_TEMPLATES.Executive = `<div class="font-serif bg-white text-gray-900" style="min-height: 297mm; width: 210mm; padding: 50px;"><header class="border-b-2 border-{{THEME}}-800 pb-8 mb-10"><div class="flex items-center gap-6"><img id="resume-photo" src="" class="w-32 h-32 rounded-lg object-cover border-4 border-{{THEME}}-800 hidden" /><div class="flex-1"><h1 class="text-5xl font-bold mb-3 text-{{THEME}}-900">{{NOME}}</h1><p class="text-xl text-{{THEME}}-700 font-medium">{{CARGO}}</p></div></div></header><div class="grid grid-cols-3 gap-10"><div class="col-span-2 space-y-8"><section><h2 class="text-2xl font-bold text-{{THEME}}-800 mb-4 border-b border-{{THEME}}-200 pb-2">Resumo Executivo</h2><p class="text-gray-700 leading-relaxed text-justify">{{RESUMO}}</p></section><section><h2 class="text-2xl font-bold text-{{THEME}}-800 mb-4 border-b border-{{THEME}}-200 pb-2">Experiência Profissional</h2>{{EXPERIENCIAS}}</section></div><div class="space-y-8"><section class="bg-{{THEME}}-50 p-6 rounded-lg"><h2 class="text-lg font-bold text-{{THEME}}-800 mb-4">Contato</h2><ul class="space-y-3 text-sm"><li>{{EMAIL}}</li><li>{{TELEFONE}}</li></ul></section><section><h2 class="text-lg font-bold text-{{THEME}}-800 mb-4">Competências</h2>{{HABILIDADES}}</section></div></div></div>`;

// ==================== TOOL DECLARATIONS ====================

const updateResumeContentTool: FunctionDeclaration = {
  name: 'update_resume_content',
  description: 'Atualiza conteúdo de currículo',
  parameters: {
    type: Type.OBJECT,
    properties: { summary: { type: Type.STRING } },
    required: ['summary']
  }
};

const updateResumeDesignTool: FunctionDeclaration = {
  name: 'update_resume_design',
  description: 'Muda template e cores',
  parameters: {
    type: Type.OBJECT,
    properties: {
      template: { type: Type.STRING, enum: ['Modern', 'Elegant', 'Classic', 'Creative', 'Minimal', 'Executive'] },
      color: { type: Type.STRING, enum: ['gray', 'blue', 'indigo', 'teal', 'rose', 'purple'] }
    },
    required: ['template', 'color']
  }
};

// ==================== MAIN FUNCTION ====================

export async function processUserMessage(
  chatHistory: ChatMessage[],
  currentDocumentHtml: string,
  userHasPhoto: boolean = false
): Promise<ProcessResult> {
  const lastMessage = chatHistory[chatHistory.length - 1]?.text || '';
  
  try {
    const tools = [{ functionDeclarations: [updateResumeContentTool, updateResumeDesignTool] }];
    
    const prompt = `Você é um assistente de currículos. Analise a mensagem e escolha a função correta:

MENSAGEM: "${lastMessage}"

IMPORTANTE:
- Se a mensagem menciona "Crie um currículo Modern/Elegant/etc com cor X" → chame update_resume_design
- Se a mensagem pede para criar currículo para uma PROFISSÃO (dev, gerente, designer, etc) → chame update_resume_content
- Se pede para adicionar/editar informações → chame update_resume_content

EXEMPLOS CLAROS:
✅ "Crie um currículo Modern com cor blue" → update_resume_design
✅ "Crie um currículo para desenvolvedor sênior" → update_resume_content
✅ "Faça um currículo para gerente" → update_resume_content
✅ "Mude para template Elegant" → update_resume_design

Histórico: ${chatHistory.map(m => `${m.sender}: ${m.text}`).join('\n')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { tools }
    });

    const functionCall = response.functionCalls?.[0];
    
    console.log('🔍 Function called:', functionCall?.name);
    console.log('📝 Message:', lastMessage);

    if (functionCall?.name === 'update_resume_content') {
      console.log('✅ Gerando conteúdo completo...');
      // GERAR CONTEÚDO COMPLETO
      const contentPrompt = `Crie um currículo profissional CONCISO baseado em: "${lastMessage}"

IMPORTANTE: O currículo DEVE caber em 1 página A4. Seja BREVE e DIRETO.

Gere dados realistas e profissionais. Retorne JSON com:
{
  "nome": "Nome completo",
  "cargo": "Cargo/Título",
  "email": "email@example.com",
  "telefone": "(11) 98765-4321",
  "linkedin": "linkedin.com/in/perfil",
  "resumo": "Resumo profissional de 2 linhas MÁXIMO",
  "habilidades": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
  "experiencias": [
    {
      "cargo": "Cargo",
      "empresa": "Empresa",
      "periodo": "2020 - Presente",
      "conquistas": ["Conquista 1 (máx 10 palavras)", "Conquista 2 (máx 10 palavras)"]
    }
  ],
  "formacao": [
    {
      "curso": "Curso",
      "instituicao": "Instituição",
      "periodo": "2016-2020"
    }
  ]
}`;

      const contentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contentPrompt,
        config: { responseMimeType: 'application/json' }
      });

      console.log('📄 Response:', contentResponse.text);
      const data = JSON.parse(contentResponse.text);
      console.log('✅ Data parsed:', data);
      
      // Usar template Modern com cor blue por padrão
      let html = RESUME_TEMPLATES.Modern;
      html = html.replace(/\{\{THEME\}\}/g, 'blue');
      html = html.replace(/\{\{NOME\}\}/g, data.nome);
      html = html.replace(/\{\{CARGO\}\}/g, data.cargo);
      html = html.replace(/\{\{EMAIL\}\}/g, data.email);
      html = html.replace(/\{\{TELEFONE\}\}/g, data.telefone);
      html = html.replace(/\{\{LINKEDIN\}\}/g, data.linkedin);
      html = html.replace(/\{\{RESUMO\}\}/g, data.resumo);
      
      const habilidadesHtml = data.habilidades.map((h: string) => 
        `<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">${h}</span>`
      ).join(' ');
      html = html.replace(/\{\{HABILIDADES\}\}/g, habilidadesHtml);
      
      const experienciasHtml = data.experiencias.map((exp: any) => 
        `<div class="mb-6"><h3 class="text-xl font-semibold text-blue-700">${exp.cargo}</h3><p class="text-gray-600">${exp.empresa} | ${exp.periodo}</p><ul class="list-disc list-inside mt-2 space-y-1">${exp.conquistas.map((c: string) => `<li>${c}</li>`).join('')}</ul></div>`
      ).join('');
      html = html.replace(/\{\{EXPERIENCIAS\}\}/g, experienciasHtml);
      
      const formacaoHtml = data.formacao.map((f: any) => 
        `<div class="mb-4"><h3 class="text-xl font-semibold text-blue-700">${f.curso}</h3><p class="text-gray-600">${f.instituicao} | ${f.periodo}</p></div>`
      ).join('');
      html = html.replace(/\{\{FORMACAO\}\}/g, formacaoHtml);
      
      return {
        action: 'document',
        data: {
          documentHtml: html,
          aiResponse: `Currículo criado para ${data.cargo}! Você pode pedir para mudar o template ou adicionar mais informações.`,
          documentType: 'resume'
        }
      };
    }

    if (functionCall?.name === 'update_resume_design') {
      const template = functionCall.args.template as keyof typeof RESUME_TEMPLATES;
      const color = functionCall.args.color as string;
      
      let html = RESUME_TEMPLATES[template];
      html = html.replace(/\{\{THEME\}\}/g, color);
      html = html.replace(/\{\{NOME\}\}/g, 'Seu Nome');
      html = html.replace(/\{\{CARGO\}\}/g, 'Sua Profissão');
      html = html.replace(/\{\{EMAIL\}\}/g, 'email@example.com');
      html = html.replace(/\{\{TELEFONE\}\}/g, '(11) 99999-8888');
      html = html.replace(/\{\{RESUMO\}\}/g, 'Profissional experiente com histórico comprovado de sucesso.');
      html = html.replace(/\{\{HABILIDADES\}\}/g, '<span class="bg-' + color + '-100 text-' + color + '-800 px-3 py-1 rounded-full text-sm">Liderança</span>');
      html = html.replace(/\{\{EXPERIENCIAS\}\}/g, '<div class="mb-6"><h3 class="text-xl font-semibold">Cargo Atual</h3><p>Empresa | 2020 - Presente</p><ul class="list-disc list-inside mt-2"><li>Conquista importante</li></ul></div>');
      html = html.replace(/\{\{FORMACAO\}\}/g, '<div><h3 class="font-semibold">Graduação</h3><p>Universidade | 2016-2020</p></div>');
      html = html.replace(/\{\{LINKEDIN\}\}/g, 'linkedin.com/in/perfil');
      
      return {
        action: 'document',
        data: {
          documentHtml: html,
          aiResponse: `Template '${template}' aplicado com cor '${color}'!`,
          documentType: 'resume'
        }
      };
    }

    return {
      action: 'chat',
      data: { aiResponse: response.text || 'Como posso ajudar com seu currículo?' }
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      action: 'chat',
      data: { aiResponse: 'Erro ao processar. Tente: "Crie um currículo moderno com cor azul"' }
    };
  }
}

export default { processUserMessage, RESUME_TEMPLATES, DOCUMENT_TEMPLATES };


// ==================== PHOTO EDITING ====================

export async function editUserPhoto(
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string | null> {
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType
    }
  };

  // Primeiro, tenta com o modelo principal (Gemini 2.5 Flash Image)
  try {
    console.log('🎨 Tentando editar foto com Gemini 2.5 Flash Image...');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, { text: prompt }]
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT]
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          console.log('✅ Foto editada com sucesso pelo modelo principal!');
          return part.inlineData.data;
        }
      }
    }

    console.warn('⚠️ Modelo principal não retornou imagem, tentando fallback...');
  } catch (error) {
    console.warn('⚠️ Modelo principal falhou, tentando fallback:', error);
  }

  // Fallback: tenta com o Gemini 2.0 Flash Exp
  try {
    console.log('🔄 Usando Gemini 2.0 Flash Exp como fallback...');

    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [imagePart, { text: prompt }]
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT]
      }
    });

    const fallbackCandidate = fallbackResponse.candidates?.[0];
    if (fallbackCandidate?.content?.parts) {
      for (const part of fallbackCandidate.content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          console.log('✅ Foto editada com sucesso pelo modelo fallback!');
          return part.inlineData.data;
        }
      }
    }

    console.warn('⚠️ Modelo fallback também não retornou imagem.');
    return null;

  } catch (fallbackError) {
    console.error('❌ Ambos os modelos falharam na edição da foto:', fallbackError);
    return null;
  }
}
