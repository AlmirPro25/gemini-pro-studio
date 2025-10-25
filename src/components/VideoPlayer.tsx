import React from 'react';
import { Message } from '../types';

interface VideoPlayerProps {
  message: Message;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ message }) => {
  if (message.videoState === 'completed' && message.videoUri) {
    return (
      <div className="my-4">
        <video controls src={message.videoUri} className="w-full max-w-md rounded-lg" />
      </div>
    );
  }

  return (
    <div className="my-4 p-4 bg-bg-tertiary rounded-lg max-w-md border border-border-color">
      <div className="flex items-center gap-3 text-text-secondary">
        <div className="w-4 h-4 border-2 border-t-blue-400 border-r-blue-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div>
            <p className="text-sm font-semibold">Generating Video...</p>
            {message.generationProgress && <p className="text-xs text-text-tertiary">{message.generationProgress}</p>}
        </div>
      </div>
      {message.videoState === 'failed' && (
        <p className="text-red-400 text-sm mt-2">{message.error || "Video generation failed."}</p>
      )}
    </div>
  );
};
