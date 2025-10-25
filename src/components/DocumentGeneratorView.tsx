/**
 * 📄 DOCUMENT GENERATOR VIEW - INTERFACE REFINADA
 * Design System profissional com dimensões corretas
 */

import React, { useState, useRef, useEffect } from 'react';
import { processUserMessage, ChatMessage } from '../services/resumeDocumentService';

export const DocumentGeneratorView: React.FC = () => {
  const [documentHtml, setDocumentHtml] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [documentKey, setDocumentKey] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;
    setIsProcessing(true);
    setInputValue('');

    const newHistory: ChatMessage[] = [...chatHistory, { sender: 'user', text: message }];
    setChatHistory(newHistory);

    try {
      const result = await processUserMessage(newHistory, documentHtml, false);
      if (result.action === 'document') {
        setDocumentHtml(result.data.documentHtml || '');
        setDocumentKey(prev => prev + 1);
        setChatHistory([...newHistory, { sender: 'ai', text: result.data.aiResponse || 'Documento criado!' }]);
      } else if (result.action === 'chat') {
        setChatHistory([...newHistory, { sender: 'ai', text: result.data.aiResponse || '' }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setChatHistory([...newHistory, { sender: 'ai', text: 'Erro ao processar. Tente novamente.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAction = (action: string) => {
    const actions: Record<string, string> = {
      'modern-blue': 'Crie um currículo Modern com cor blue',
      'elegant-indigo': 'Crie um currículo Elegant com cor indigo',
      'classic-gray': 'Crie um currículo Classic com cor gray',
      'creative-teal': 'Crie um currículo Creative com cor teal',
      'minimal-rose': 'Crie um currículo Minimal com cor rose',
      'executive-purple': 'Crie um currículo Executive com cor purple'
    };
    handleSendMessage(actions[action] || action);
  };

  const exportToPDF = () => {
    const element = document.getElementById('document-preview');
    if (!element) return;

    // Criar janela para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Currículo</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              @page { size: A4; margin: 0; }
            }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          ${documentHtml}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Aguardar Tailwind carregar e então imprimir
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  };

  const clearDocument = () => {
    if (confirm('Limpar documento?')) {
      setDocumentHtml('');
      setChatHistory([]);
      setUserPhoto('');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const photoData = event.target?.result as string;
      setUserPhoto(photoData);
      setShowPhotoEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const handleEditPhoto = async () => {
    if (!userPhoto) return;
    setIsEditingPhoto(true);

    try {
      console.log('🎨 Iniciando edição de foto...');
      const base64Data = userPhoto.split(',')[1];
      const mimeType = userPhoto.split(';')[0].split(':')[1];
      console.log('📸 MimeType:', mimeType);

      const { editUserPhoto } = await import('../services/resumeDocumentService');

      const prompt = `Transform into professional headshot: remove background, enhance lighting, improve clarity, professional appearance`;

      const editedPhotoBase64 = await editUserPhoto(base64Data, mimeType, prompt);
      console.log('✅ Foto editada retornada:', editedPhotoBase64 ? 'SIM' : 'NÃO');

      if (editedPhotoBase64) {
        const editedPhotoData = `data:${mimeType};base64,${editedPhotoBase64}`;
        console.log('💾 Salvando foto editada no estado...');
        setUserPhoto(editedPhotoData);
        console.log('📄 Inserindo foto no documento...');
        insertPhotoInDocument(editedPhotoData);
        setShowPhotoEditor(false);
        console.log('✅ Processo completo!');
      } else {
        console.warn('⚠️ Foto editada não retornou dados');
        alert('Não foi possível editar a foto. Usando original.');
        insertPhotoInDocument(userPhoto);
        setShowPhotoEditor(false);
      }
    } catch (error) {
      console.error('❌ Erro ao editar foto:', error);
      alert('Erro ao editar. Usando original.');
      insertPhotoInDocument(userPhoto);
      setShowPhotoEditor(false);
    } finally {
      setIsEditingPhoto(false);
    }
  };

  const insertPhotoInDocument = (photoData: string) => {
    if (!documentHtml) {
      console.warn('⚠️ Nenhum documento HTML para inserir foto');
      return;
    }

    console.log('🔍 Procurando elemento resume-photo no HTML...');
    const hasPhotoElement = documentHtml.includes('id="resume-photo"');
    console.log('📍 Elemento encontrado:', hasPhotoElement);

    if (!hasPhotoElement) {
      console.error('❌ Elemento resume-photo não encontrado no template!');
      alert('Este template não suporta foto. Tente outro template.');
      return;
    }

    // Substituir o elemento img completo, removendo hidden e adicionando src
    const updatedHtml = documentHtml.replace(
      /<img id="resume-photo"[^>]*>/g,
      (match) => {
        console.log('🔧 Match encontrado:', match.substring(0, 100));
        // Manter as classes originais mas remover 'hidden'
        const classMatch = match.match(/class="([^"]*)"/);
        if (classMatch) {
          const originalClasses = classMatch[1];
          const classes = originalClasses.replace(/\bhidden\b/g, '').replace(/\s+/g, ' ').trim();
          console.log('🎨 Classes originais:', originalClasses);
          console.log('🎨 Classes novas:', classes);
          const newTag = match
            .replace(/class="[^"]*"/, `class="${classes}"`)
            .replace(/src="[^"]*"/, `src="${photoData}"`);
          console.log('✨ Nova tag:', newTag.substring(0, 100));
          return newTag;
        }
        return match.replace(/src="[^"]*"/, `src="${photoData}"`);
      }
    );

    console.log('💾 Atualizando HTML do documento...');
    setDocumentHtml(updatedHtml);
    setDocumentKey(prev => prev + 1);
    console.log('✅ Foto inserida com sucesso!');
  };

  const handleUseOriginalPhoto = () => {
    if (userPhoto) {
      insertPhotoInDocument(userPhoto);
      setShowPhotoEditor(false);
    }
  };

  return (
    <div className="flex h-full bg-bg-primary">
      {/* PREVIEW - 70% da tela */}
      <div className="w-[70%] bg-gray-50 dark:bg-gray-900 overflow-auto">
        <div className="h-full flex flex-col">
          {documentHtml ? (
            <>
              <div className="flex-1 p-6 flex items-start justify-center overflow-auto">
                <div key={documentKey} className="bg-white shadow-2xl" style={{
                  width: '210mm',
                  minHeight: '297mm',
                  transform: 'scale(0.75)',
                  transformOrigin: 'top center',
                  marginBottom: '-25%'
                }}>
                  <div id="document-preview" dangerouslySetInnerHTML={{ __html: documentHtml }} />
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-border-color flex justify-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium shadow-sm"
                >
                  <i className="fa-solid fa-camera"></i>
                  Adicionar Foto
                </button>
                <button onClick={exportToPDF} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium shadow-sm">
                  <i className="fa-solid fa-download"></i>
                  Exportar PDF
                </button>
                <button onClick={clearDocument} className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium">
                  <i className="fa-solid fa-trash"></i>
                  Limpar
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <i className="fa-solid fa-file-lines text-4xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Crie Seu Documento</h3>
                  <p className="text-gray-600 dark:text-gray-400">Use o chat para gerar currículos profissionais instantaneamente</p>
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">6 Templates</span>
                  <span className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">Exportação PDF</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CHAT - 30% da tela */}
      <div className="w-[30%] bg-bg-secondary border-l border-border-color flex flex-col">
        {/* Header Minimalista */}
        <div className="px-4 py-3 border-b border-border-color bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-robot text-white text-sm"></i>
            </div>
            <span className="text-white font-semibold">Assistente IA</span>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>

        {/* Templates Grid Compacto */}
        <div className="p-3 border-b border-border-color bg-bg-primary/50">
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={() => handleQuickAction('modern-blue')} className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-all">Moderno</button>
            <button onClick={() => handleQuickAction('elegant-indigo')} className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-all">Elegante</button>
            <button onClick={() => handleQuickAction('classic-gray')} className="px-2 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded transition-all">Clássico</button>
            <button onClick={() => handleQuickAction('creative-teal')} className="px-2 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded transition-all">Criativo</button>
            <button onClick={() => handleQuickAction('minimal-rose')} className="px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded transition-all">Mínimo</button>
            <button onClick={() => handleQuickAction('executive-purple')} className="px-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-all">Executivo</button>
          </div>
        </div>

        {/* Chat Messages - ÁREA PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-comments text-2xl text-blue-600 dark:text-blue-400"></i>
              </div>
              <div>
                <p className="text-sm font-medium text-text-secondary mb-2">Comece sua conversa</p>
                <p className="text-xs text-text-tertiary">Clique em um template ou digite sua mensagem</p>
              </div>
            </div>
          )}

          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.sender === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-bg-tertiary text-text-primary border border-border-color'
                }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-bg-tertiary border border-border-color rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border-color bg-bg-primary/50">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-bg-tertiary border border-border-color rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-text-primary placeholder-text-tertiary transition-all"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing || !inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <i className="fa-solid fa-lightbulb text-yellow-500"></i>
              <span>Ex: "Crie um currículo para desenvolvedor sênior"</span>
            </div>
          </form>
        </div>
      </div>

      {/* Photo Editor Modal */}
      {showPhotoEditor && userPhoto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Foto com IA</h3>
              <button onClick={() => setShowPhotoEditor(false)} className="text-gray-500 hover:text-gray-700">
                <i className="fa-solid fa-times text-2xl"></i>
              </button>
            </div>

            <div className="flex gap-6">
              <div className="flex-1 space-y-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Foto Original:</p>
                <img src={userPhoto} alt="Original" className="w-full h-64 object-cover rounded-xl border-4 border-gray-200" />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                <strong>A IA vai:</strong>
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-6">
                <li>• Remover o fundo e adicionar fundo profissional</li>
                <li>• Melhorar iluminação e clareza</li>
                <li>• Ajustar para aparência profissional</li>
                <li>• Otimizar para currículo</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEditPhoto}
                disabled={isEditingPhoto}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isEditingPhoto ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Editando com IA...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    Editar com IA
                  </>
                )}
              </button>
              <button
                onClick={handleUseOriginalPhoto}
                disabled={isEditingPhoto}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                Usar Original
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
