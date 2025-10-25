import React from 'react';

interface LiveTranscriptOverlayProps {
    state: 'connecting' | 'active';
    transcript: string;
    onClose: () => void;
}

export const LiveTranscriptOverlay: React.FC<LiveTranscriptOverlayProps> = ({ state, transcript, onClose }) => {
    
    const getStatusIndicator = () => {
        if (state === 'connecting') {
            return (
                <div className="flex items-center gap-2 text-yellow-300">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Conectando...</span>
                </div>
            );
        }
        // In a more advanced version, we could differentiate between listening and speaking
        return (
             <div className="flex items-center gap-2 text-green-300">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <span>Sessão Ativa. Fale agora.</span>
            </div>
        )
    }
    
    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-8 text-white">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">
                <i className="fa-solid fa-times"></i>
            </button>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Conversa ao Vivo com Gemini</h1>
                {getStatusIndicator()}
            </div>

            <div className="w-full max-w-3xl flex-grow bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                <p className="text-lg leading-relaxed text-gray-200">{transcript}<span className="animate-pulse">▍</span></p>
            </div>
             <p className="text-xs text-gray-500 mt-4">
                Pressione o botão "Sessão Ativa" novamente para encerrar a conversa.
            </p>
        </div>
    )
}