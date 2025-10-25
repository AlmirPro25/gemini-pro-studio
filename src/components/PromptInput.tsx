import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Attachment } from '../types';
import { compressImage, getBase64SizeMB, formatSize } from '../utils/imageCompression';

interface PromptInputProps {
  onSend: (prompt: string, attachments?: Attachment[]) => void;
  isLoading: boolean;
  onCameraClick: () => void;
  onTranscribe: (audioBase64: string) => void;
  onOpenLibrary: () => void;
  appendToPromptRef: React.MutableRefObject<(text: string) => void>;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const AttachmentPreview: React.FC<{ file: File, onRemove: () => void }> = ({ file, onRemove }) => {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (file.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [file]);

    return (
         <div className="relative bg-[color:var(--bg-secondary)] rounded-md p-1 text-xs flex items-center gap-1.5">
            {preview ? (
                <img src={preview} alt={file.name} className="w-8 h-8 rounded object-cover"/>
            ) : (
                <div className="w-8 h-8 bg-[color:var(--bg-tertiary)] rounded flex items-center justify-center">
                    <i className="fa-solid fa-file text-text-tertiary text-xs"></i>
                </div>
            )}
            <span className="truncate max-w-24 text-text-secondary">{file.name}</span>
            <button onClick={onRemove} className="absolute -top-1 -right-1 bg-bg-secondary rounded-full w-4 h-4 flex items-center justify-center text-text-tertiary hover:text-white hover:bg-red-500 transition-all">
                <i className="fa-solid fa-times text-[10px]"></i>
            </button>
        </div>
    );
};


export const PromptInput: React.FC<PromptInputProps> = ({ onSend, isLoading, onCameraClick, onTranscribe, onOpenLibrary, appendToPromptRef }) => {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    appendToPromptRef.current = (text: string) => {
        setPrompt(prev => prev ? `${prev}\n${text}` : text);
        textareaRef.current?.focus();
    };
  }, [appendToPromptRef]);

  const handleSendClick = async () => {
    if ((prompt.trim() || attachments.length > 0) && !isLoading) {
      setIsCompressing(true);
      
      try {
        const attachmentData: Attachment[] = await Promise.all(
          attachments.map(async (file) => {
            const base64 = await fileToBase64(file);
            
            // Comprime imagens automaticamente
            if (file.type.startsWith('image/')) {
              const originalSize = getBase64SizeMB(base64);
              
              // Só comprime se for maior que 2MB
              if (originalSize > 2) {
                const compressed = await compressImage(base64, file.type, {
                  maxWidth: 1920,
                  maxHeight: 1920,
                  quality: 0.85,
                  maxSizeMB: 5,
                });
                
                console.log(`Compressed ${file.name}: ${formatSize(originalSize)} → ${formatSize(compressed.compressedSize)}`);
                
                return {
                  name: file.name,
                  mimeType: compressed.mimeType,
                  data: compressed.data,
                };
              }
            }
            
            return {
              name: file.name,
              mimeType: file.type,
              data: base64,
            };
          })
        );
        
        onSend(prompt.trim(), attachmentData);
        setPrompt('');
        setAttachments([]);
      } catch (error) {
        console.error('Error processing attachments:', error);
      } finally {
        setIsCompressing(false);
      }
    }
  };
  
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendClick();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [prompt, attachments]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          onTranscribe(base64data);
        };
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setMicError(null);
    } catch (err) {
        console.error("Mic error", err);
        setMicError("Permissão para microfone negada.");
        setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };
  
  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = '';
    }
  };
  
  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (imageFiles.length > 0) {
      setAttachments(prev => [...prev, ...imageFiles]);
    }
  };

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            if (file) imageFiles.push(file);
          }
        }
        if (imageFiles.length > 0) {
          setAttachments(prev => [...prev, ...imageFiles]);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div 
      className={`bg-bg-tertiary border rounded-xl p-1 flex flex-col shadow-lg transition-all ${
        isDragging ? 'border-blue-500 border-2 bg-blue-500/10' : 'border-border-color'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-2xl pointer-events-none z-10">
            <div className="text-blue-400 text-lg font-semibold">
              <i className="fa-solid fa-cloud-arrow-up mr-2"></i>
              Solte os arquivos aqui
            </div>
          </div>
        )}
        {attachments.length > 0 && (
            <div className="px-2 pt-2 pb-1 flex flex-wrap gap-1.5 border-b border-border-color">
                {attachments.map((file, index) => (
                    <AttachmentPreview key={index} file={file} onRemove={() => removeAttachment(index)} />
                ))}
            </div>
        )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.txt,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex items-center gap-1 px-2 py-1">
        <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors" data-tooltip="Anexar arquivo">
          <i className="fa-solid fa-paperclip text-sm"></i>
        </button>
        <button onClick={onCameraClick} className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors" data-tooltip="Usar câmera">
          <i className="fa-solid fa-camera text-sm"></i>
        </button>
         <button onClick={onOpenLibrary} className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors" data-tooltip="Usar da Biblioteca">
          <i className="fa-solid fa-book-bookmark text-sm"></i>
        </button>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte qualquer coisa"
          className="flex-1 bg-transparent text-text-primary placeholder-text-tertiary resize-none focus:outline-none max-h-32 overflow-y-auto py-2 text-sm leading-5"
          rows={1}
          disabled={isLoading}
        />
        <button 
            onClick={handleMicClick} 
            className={`p-1.5 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-text-tertiary hover:text-text-primary'} ${micError ? 'text-yellow-500 cursor-not-allowed' : ''}`}
            data-tooltip={micError || (isRecording ? "Parar gravação" : "Usar microfone")}
        >
          <i className="fa-solid fa-microphone text-sm"></i>
        </button>
        <button 
          onClick={handleSendClick} 
          disabled={isLoading || isCompressing || (!prompt.trim() && attachments.length === 0)} 
          className="w-7 h-7 rounded-full bg-gray-700 text-white flex items-center justify-center disabled:bg-[color:var(--bg-secondary)] disabled:text-text-tertiary hover:bg-gray-600 transition-colors flex-shrink-0"
        >
          {isCompressing ? (
            <i className="fa-solid fa-spinner fa-spin text-xs"></i>
          ) : (
            <i className="fa-solid fa-arrow-up text-xs"></i>
          )}
        </button>
      </div>
    </div>
  );
};