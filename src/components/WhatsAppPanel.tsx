/**
 * 📱 WHATSAPP PANEL
 * 
 * Painel de integração com WhatsApp
 * Permite gerenciar conversas e enviar mensagens via WhatsApp
 */

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface WhatsAppMessage {
  id: string;
  from: string;
  fromName: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  type: string;
  media?: {
    mimetype: string;
    data: string;
    filename?: string;
  };
}

interface WhatsAppChat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
}

const BRIDGE_URL = (import.meta as any).env?.VITE_WHATSAPP_BRIDGE_URL || 'http://localhost:3001';

export const WhatsAppPanel: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isWhatsAppReady, setIsWhatsAppReady] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conecta ao Socket.IO
  useEffect(() => {
    const socket = io(BRIDGE_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Conectado ao WhatsApp Bridge');
      setIsConnected(true);
      loadChats();
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado do WhatsApp Bridge');
      setIsConnected(false);
    });

    socket.on('whatsapp:qr', (qr: string) => {
      console.log('📱 QR Code recebido');
      setQrCode(qr);
      setIsWhatsAppReady(false);
    });

    socket.on('whatsapp:ready', () => {
      console.log('✅ WhatsApp pronto');
      setIsWhatsAppReady(true);
      setQrCode(null);
      loadChats();
    });

    socket.on('whatsapp:message', (msg: WhatsAppMessage) => {
      console.log('📨 Nova mensagem:', msg);
      
      // Adiciona mensagem se for do chat selecionado
      if (selectedChat && msg.from === selectedChat.id) {
        setMessages(prev => [...prev, msg]);
      }
      
      // Atualiza lista de chats
      loadChats();
    });

    socket.on('whatsapp:status', (status: { ready: boolean; hasQR: boolean }) => {
      setIsWhatsAppReady(status.ready);
      if (!status.ready && status.hasQR) {
        loadQRCode();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Carrega lista de chats
  const loadChats = async () => {
    try {
      const response = await fetch(`${BRIDGE_URL}/api/chats`);
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
    }
  };

  // Carrega QR Code
  const loadQRCode = async () => {
    try {
      const response = await fetch(`${BRIDGE_URL}/api/qr`);
      if (response.ok) {
        const data = await response.json();
        if (data.qr) {
          setQrCode(data.qr);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar QR:', error);
    }
  };

  // Seleciona um chat
  const handleSelectChat = async (chat: WhatsAppChat) => {
    setSelectedChat(chat);
    setMessages([]);
    
    try {
      // Carrega mensagens do banco de dados (inclui enviadas e recebidas)
      const response = await fetch(`${BRIDGE_URL}/api/db/messages/${encodeURIComponent(chat.id)}?limit=100`);
      if (response.ok) {
        const data = await response.json();
        // Converte formato do banco para formato de mensagem
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.message_id,
          from: msg.is_from_me ? 'me' : msg.from,
          fromName: msg.is_from_me ? 'Você' : chat.name,
          body: msg.content,
          timestamp: new Date(msg.timestamp).getTime() / 1000,
          hasMedia: !!msg.media_url,
          type: msg.type,
          isFromMe: msg.is_from_me
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  // Envia mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !selectedChat || isSending) return;
    
    setIsSending(true);
    
    try {
      const response = await fetch(`${BRIDGE_URL}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedChat.id,
          message: inputMessage
        })
      });
      
      if (response.ok) {
        setInputMessage('');
        // Adiciona mensagem localmente
        const newMsg: WhatsAppMessage = {
          id: `temp_${Date.now()}`,
          from: 'me',
          fromName: 'Você',
          body: inputMessage,
          timestamp: Date.now() / 1000,
          hasMedia: false,
          type: 'chat'
        };
        setMessages(prev => [...prev, newMsg]);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Renderiza QR Code
  if (!isWhatsAppReady && qrCode) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-bg-primary">
        <div className="max-w-md w-full bg-bg-secondary rounded-2xl p-8 shadow-xl border border-border-color">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-brands fa-whatsapp text-3xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Conectar WhatsApp</h2>
            <p className="text-text-secondary">Escaneie o QR Code com seu WhatsApp</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl mb-6">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`}
              alt="QR Code"
              className="w-full h-auto"
            />
          </div>
          
          <div className="space-y-2 text-sm text-text-tertiary">
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
              Abra o WhatsApp no seu celular
            </p>
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
              Toque em Menu ou Configurações
            </p>
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
              Toque em Aparelhos conectados
            </p>
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">4</span>
              Escaneie este código QR
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Renderiza painel principal
  return (
    <div className="flex h-full bg-[#111b21]">
      {/* Lista de Chats - 30% */}
      <div className="w-[30%] bg-[#111b21] border-r border-[#2a3942] flex flex-col">
        {/* Header */}
        <div className="h-[60px] px-4 bg-[#202c33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6b7c85] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#7c8d96] transition-colors">
              <i className="fa-solid fa-user text-[#111b21] text-lg"></i>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-[#aebac1] hover:text-white transition-colors">
              <i className="fa-solid fa-users text-xl"></i>
            </button>
            <button className="text-[#aebac1] hover:text-white transition-colors">
              <i className="fa-solid fa-circle-notch text-xl"></i>
            </button>
            <button className="text-[#aebac1] hover:text-white transition-colors">
              <i className="fa-solid fa-message text-xl"></i>
            </button>
            <button className="text-[#aebac1] hover:text-white transition-colors">
              <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
            </button>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div className="px-3 py-2 bg-[#111b21]">
          <div className="bg-[#202c33] rounded-lg px-4 py-2 flex items-center gap-3">
            <i className="fa-solid fa-magnifying-glass text-[#aebac1] text-sm"></i>
            <input
              type="text"
              placeholder="Pesquisar ou começar uma nova conversa"
              className="flex-1 bg-transparent text-[#e9edef] text-sm placeholder-[#667781] outline-none"
            />
          </div>
        </div>

        {/* Lista de Chats */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#374045] scrollbar-track-transparent">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <i className="fa-solid fa-comments text-4xl text-[#667781] mb-4"></i>
              <p className="text-[#8696a0] text-sm">Nenhuma conversa ainda</p>
            </div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`px-4 py-3 cursor-pointer transition-colors border-b border-[#2a3942] ${
                  selectedChat?.id === chat.id
                    ? 'bg-[#2a3942]'
                    : 'hover:bg-[#202c33]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#6b7c85] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#111b21] font-semibold text-lg">
                      {chat.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-medium text-[#e9edef] text-[15px] truncate">{chat.name}</h3>
                      <span className="text-[#667781] text-xs">
                        {new Date(chat.timestamp * 1000).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] text-[#8696a0] truncate flex-1">{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <span className="bg-[#25d366] text-[#111b21] text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área de Mensagens - 70% */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Header do Chat */}
            <div className="h-[60px] px-4 bg-[#202c33] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6b7c85] rounded-full flex items-center justify-center">
                  <span className="text-[#111b21] font-semibold text-lg">
                    {selectedChat.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-[#e9edef] text-[15px]">{selectedChat.name}</h3>
                  <p className="text-xs text-[#8696a0]">online</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button className="text-[#aebac1] hover:text-white transition-colors">
                  <i className="fa-solid fa-magnifying-glass text-xl"></i>
                </button>
                <button className="text-[#aebac1] hover:text-white transition-colors">
                  <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div 
              className="flex-1 overflow-y-auto px-16 py-6 space-y-2 scrollbar-thin scrollbar-thumb-[#374045] scrollbar-track-transparent"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: '#0b141a'
              }}
            >
              {messages.map((msg, idx) => {
                const isFromMe = msg.from === 'me' || msg.fromName === 'Você' || (msg as any).isFromMe;
                
                return (
                  <div key={msg.id || idx} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                    <div className={`max-w-[65%] rounded-lg px-3 py-2 shadow-md ${
                      isFromMe
                        ? 'bg-[#005c4b] rounded-br-none'
                        : 'bg-[#202c33] rounded-bl-none'
                    }`}>
                      {msg.hasMedia && msg.media && (
                        <div className="mb-2">
                          {msg.media.mimetype.startsWith('image/') && (
                            <img 
                              src={`data:${msg.media.mimetype};base64,${msg.media.data}`}
                              alt="Imagem"
                              className="rounded-md max-w-full"
                            />
                          )}
                        </div>
                      )}
                      
                      <p className="text-[14.2px] text-[#e9edef] leading-[19px] whitespace-pre-wrap break-words">
                        {msg.body}
                      </p>
                      
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[11px] text-[#8696a0]">
                          {new Date(msg.timestamp * 1000).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {isFromMe && (
                          <i className="fa-solid fa-check-double text-[#53bdeb] text-xs"></i>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="px-4 py-3 bg-[#202c33]">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <button type="button" className="text-[#aebac1] hover:text-white transition-colors p-2">
                  <i className="fa-solid fa-face-smile text-2xl"></i>
                </button>
                <button type="button" className="text-[#aebac1] hover:text-white transition-colors p-2">
                  <i className="fa-solid fa-paperclip text-xl"></i>
                </button>
                <div className="flex-1 bg-[#2a3942] rounded-lg px-4 py-2.5 flex items-center">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Escreva uma mensagem"
                    className="flex-1 bg-transparent text-[#e9edef] text-[15px] placeholder-[#8696a0] outline-none"
                    disabled={isSending}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSending || !inputMessage.trim()}
                  className="text-[#aebac1] hover:text-white transition-colors p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fa-solid fa-paper-plane text-xl"></i>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div 
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: '#0b141a'
            }}
          >
            <div className="w-32 h-32 border-[6px] border-[#2a3942] rounded-full flex items-center justify-center mb-8">
              <i className="fa-brands fa-whatsapp text-7xl text-[#667781]"></i>
            </div>
            <h3 className="text-[32px] font-light text-[#e9edef] mb-4">WhatsApp Web</h3>
            <p className="text-[14px] text-[#8696a0] max-w-md leading-relaxed">
              Envie e receba mensagens sem precisar manter seu celular conectado à internet.
            </p>
            <div className="mt-8 flex items-center gap-2 text-[#8696a0] text-sm">
              <i className="fa-solid fa-lock text-xs"></i>
              <span>Suas mensagens pessoais são protegidas com criptografia de ponta a ponta</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
