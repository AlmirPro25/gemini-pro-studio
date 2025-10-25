/**
 * 🔗 WHATSAPP INTEGRATION SERVICE
 * 
 * Integra funcionalidades do Gemini Pro Studio com WhatsApp
 * Permite usar documentos, imagens, personas via WhatsApp
 */

import { sendMessageToGemini, generateOrEditImage } from './geminiService';
import { processUserMessage } from './resumeDocumentService';
import { PERSONAS } from '../constants';
import { Message, Persona } from '../types';

// ==================== COMANDOS DISPONÍVEIS ====================

export const WHATSAPP_COMMANDS = {
    '/help': 'Mostra lista de comandos',
    '/persona [nome]': 'Muda a persona ativa',
    '/curriculo': 'Inicia criação de currículo',
    '/documento': 'Inicia criação de documento',
    '/imagem [prompt]': 'Gera uma imagem',
    '/analisar': 'Analisa imagem enviada',
    '/status': 'Mostra status do sistema'
};

// ==================== PROCESSADOR DE MENSAGENS ====================

export class WhatsAppMessageProcessor {
    private conversationHistory: Map<string, Message[]> = new Map();
    private userPersonas: Map<string, Persona> = new Map();
    private documentSessions: Map<string, any> = new Map();

    /**
     * Processa mensagem recebida do WhatsApp
     */
    async processMessage(
        userId: string,
        message: string,
        media?: { mimetype: string; data: string }
    ): Promise<string> {
        // Verifica se é comando
        if (message.startsWith('/')) {
            return await this.handleCommand(userId, message);
        }

        // Verifica se está em sessão de documento
        if (this.documentSessions.has(userId)) {
            return await this.handleDocumentSession(userId, message);
        }

        // Conversa normal com persona ativa
        return await this.handleConversation(userId, message, media);
    }

    /**
     * Manipula comandos
     */
    private async handleCommand(userId: string, command: string): Promise<string> {
        const [cmd, ...args] = command.split(' ');
        const arg = args.join(' ');

        switch (cmd.toLowerCase()) {
            case '/help':
                return this.getHelpMessage();

            case '/persona':
                return this.changePersona(userId, arg);

            case '/curriculo':
                return this.startResumeSession(userId);

            case '/documento':
                return this.startDocumentSession(userId);

            case '/imagem':
                return await this.generateImage(arg);

            case '/status':
                return this.getStatus(userId);

            default:
                return `❌ Comando desconhecido. Use /help para ver comandos disponíveis.`;
        }
    }

    /**
     * Mensagem de ajuda
     */
    private getHelpMessage(): string {
        return `📱 *Comandos Disponíveis:*\n\n${Object.entries(WHATSAPP_COMMANDS)
            .map(([cmd, desc]) => `${cmd} - ${desc}`)
            .join('\n')}\n\n💡 *Dica:* Você também pode conversar normalmente comigo!`;
    }

    /**
     * Muda persona ativa
     */
    private changePersona(userId: string, personaName: string): string {
        if (!personaName) {
            const current = this.userPersonas.get(userId) || PERSONAS[0];
            const list = PERSONAS.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
            return `🎭 *Persona Atual:* ${current.name}\n\n*Personas Disponíveis:*\n${list}\n\nUse: /persona [número ou nome]`;
        }

        // Busca por número ou nome
        const index = parseInt(personaName) - 1;
        let persona: Persona | undefined;

        if (!isNaN(index) && index >= 0 && index < PERSONAS.length) {
            persona = PERSONAS[index];
        } else {
            persona = PERSONAS.find(p =>
                p.name.toLowerCase().includes(personaName.toLowerCase())
            );
        }

        if (persona) {
            this.userPersonas.set(userId, persona);
            return `✅ Persona alterada para: *${persona.name}*\n\n${persona.prompt.substring(0, 150)}...`;
        }

        return `❌ Persona não encontrada. Use /persona para ver a lista.`;
    }

    /**
     * Inicia sessão de criação de currículo
     */
    private startResumeSession(userId: string): string {
        this.documentSessions.set(userId, {
            type: 'resume',
            messages: [],
            documentHtml: ''
        });

        return `📄 *Criação de Currículo Iniciada!*\n\nVou te ajudar a criar um currículo profissional.\n\nQual template você prefere?\n1. Modern (moderno)\n2. Elegant (elegante)\n3. Creative (criativo)\n\nResponda com o número ou nome.`;
    }

    /**
     * Inicia sessão de documento
     */
    private startDocumentSession(userId: string): string {
        this.documentSessions.set(userId, {
            type: 'document',
            messages: [],
            documentHtml: ''
        });

        return `📝 *Criação de Documento Iniciada!*\n\nQue tipo de documento você precisa?\n1. Contrato de Locação\n2. Declaração Simples\n3. Proposta Comercial\n\nResponda com o número ou descreva o documento.`;
    }

    /**
     * Manipula sessão de documento
     */
    private async handleDocumentSession(userId: string, message: string): Promise<string> {
        const session = this.documentSessions.get(userId);
        if (!session) return 'Sessão não encontrada. Use /curriculo ou /documento para iniciar.';

        // Adiciona mensagem ao histórico da sessão
        session.messages.push({ sender: 'user', text: message });

        try {
            // Processa com o serviço de documentos
            const result = await processUserMessage(
                session.messages,
                session.documentHtml,
                false
            );

            if (result.action === 'document') {
                session.documentHtml = result.data.documentHtml || '';

                // Finaliza sessão
                this.documentSessions.delete(userId);

                return `✅ *Documento criado com sucesso!*\n\n${result.data.aiResponse}\n\n📥 Acesse o painel web para visualizar e exportar o documento.\n\n💡 Use /curriculo ou /documento para criar outro.`;
            } else {
                // Continua coletando informações
                session.messages.push({ sender: 'ai', text: result.data.aiResponse || '' });
                return result.data.aiResponse || 'Continue...';
            }
        } catch (error) {
            console.error('Erro na sessão de documento:', error);
            this.documentSessions.delete(userId);
            return '❌ Erro ao processar documento. Tente novamente com /curriculo ou /documento.';
        }
    }

    /**
     * Gera imagem
     */
    private async generateImage(prompt: string): Promise<string> {
        if (!prompt) {
            return '❌ Forneça uma descrição para a imagem.\nExemplo: /imagem um gato astronauta no espaço';
        }

        try {
            const image = await generateOrEditImage(prompt);
            // Retorna mensagem (a imagem será enviada separadamente)
            return `🎨 *Imagem gerada!*\n\nPrompt: ${prompt}\n\n📥 A imagem será enviada em seguida.`;
        } catch (error) {
            console.error('Erro ao gerar imagem:', error);
            return '❌ Erro ao gerar imagem. Tente novamente.';
        }
    }

    /**
     * Conversa normal com persona
     */
    private async handleConversation(
        userId: string,
        message: string,
        media?: { mimetype: string; data: string }
    ): Promise<string> {
        // Obtém ou cria histórico
        if (!this.conversationHistory.has(userId)) {
            this.conversationHistory.set(userId, []);
        }

        const history = this.conversationHistory.get(userId)!;
        const persona = this.userPersonas.get(userId) || PERSONAS[0];

        // Cria mensagem do usuário
        const userMessage: Message = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: message
        };

        // Se tem mídia (imagem)
        if (media && media.mimetype.startsWith('image/')) {
            userMessage.attachments = [{
                name: 'image.jpg',
                mimeType: media.mimetype,
                data: media.data
            }];
        }

        // Adiciona ao histórico
        history.push(userMessage);

        // Limita histórico a últimas 10 mensagens
        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }

        try {
            // Gera resposta com Gemini
            let fullResponse = '';
            const stream = sendMessageToGemini(
                history,
                { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', type: 'text' },
                persona,
                false,
                {},
                new AbortController().signal
            );

            for await (const chunk of stream) {
                fullResponse += chunk;
            }

            // Parse resposta JSON
            const parsed = JSON.parse(fullResponse);
            const responseText = parsed.response || 'Sem resposta';

            // Adiciona resposta ao histórico
            history.push({
                id: `ai_${Date.now()}`,
                role: 'model',
                content: responseText
            });

            return responseText;
        } catch (error) {
            console.error('Erro na conversa:', error);
            return '❌ Desculpe, ocorreu um erro. Tente novamente.';
        }
    }

    /**
     * Status do sistema
     */
    private getStatus(userId: string): string {
        const persona = this.userPersonas.get(userId) || PERSONAS[0];
        const historySize = this.conversationHistory.get(userId)?.length || 0;
        const hasSession = this.documentSessions.has(userId);

        return `📊 *Status do Sistema*\n\n🎭 Persona: ${persona.name}\n💬 Mensagens no histórico: ${historySize}\n📄 Sessão ativa: ${hasSession ? 'Sim' : 'Não'}\n\n✅ Sistema operacional!`;
    }

    /**
     * Limpa histórico de um usuário
     */
    clearHistory(userId: string) {
        this.conversationHistory.delete(userId);
        this.documentSessions.delete(userId);
    }

    /**
     * Obtém histórico de um usuário
     */
    getHistory(userId: string): Message[] {
        return this.conversationHistory.get(userId) || [];
    }
}

// Instância singleton
export const whatsappProcessor = new WhatsAppMessageProcessor();

export default whatsappProcessor;
