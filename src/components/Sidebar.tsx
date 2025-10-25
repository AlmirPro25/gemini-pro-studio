import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Chat, ProjectFile } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  chatHistory: Chat[];
  currentChatId: string;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onUpdateChatTitle: (chatId: string, newTitle: string) => void;
  onSelectLibrary: () => void;
  onSelectProjects: () => void;
  onSelectGallery: () => void;
  onSelectDocuments: () => void;
  onSelectWhatsApp: () => void;
  onSelectAdmin: () => void;
  // New props for project context
  activeProjectId: string | null;
  onExitProject: () => void;
  projectFiles: ProjectFile[];
}

const SidebarLink: React.FC<{ icon: string; text: string; onClick?: () => void, isActive?: boolean }> = ({ icon, text, onClick, isActive }) => (
  <button onClick={onClick} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-[color:var(--bg-tertiary)] transition-colors duration-200 w-full text-left text-sm text-text-primary ${isActive ? 'bg-[color:var(--bg-tertiary)]' : ''}`}>
    <i className={`fa-solid ${icon} w-5 text-center text-text-secondary`}></i>
    <span>{text}</span>
  </button>
);

const ChatHistoryItem: React.FC<{
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateTitle: (newTitle: string) => void;
}> = ({ chat, isActive, onSelect, onDelete, onUpdateTitle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (title.trim()) {
      onUpdateTitle(title.trim());
    } else {
      setTitle(chat.title); // Revert if empty
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setTitle(chat.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      onClick={() => !isEditing && onSelect()}
      className={`group relative px-3 py-2 rounded-lg truncate text-sm text-left transition-colors duration-200 w-full cursor-pointer ${
        isActive ? 'bg-[color:var(--bg-tertiary)] text-text-primary' : 'hover:bg-[color:var(--bg-tertiary)] text-text-secondary hover:text-text-primary'
      }`}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-0 focus:outline-none w-full text-text-primary"
        />
      ) : (
        <span className="block truncate">{chat.title}</span>
      )}
      {!isEditing && (
        <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'bg-[color:var(--bg-tertiary)]' : 'bg-[color:var(--bg-secondary)]'} rounded-md`}>
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1.5 hover:text-white text-gray-300"><i className="fa-solid fa-pencil text-xs"></i></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 hover:text-white text-gray-300"><i className="fa-solid fa-trash-can text-xs"></i></button>
        </div>
      )}
    </div>
  );
};

const ProjectFileItem: React.FC<{ file: ProjectFile }> = ({ file }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary cursor-pointer hover:bg-[color:var(--bg-tertiary)] rounded-md">
        <i className="fa-solid fa-file-code w-4 text-center"></i>
        <span>{file.path}</span>
    </div>
);


const GlobalView: React.FC<Omit<SidebarProps, 'activeProjectId' | 'onExitProject' | 'projectFiles'>> = (props) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredChatHistory = props.chatHistory.filter(chat =>
        chat.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return <>
        <div className="relative mb-2">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"></i>
            <input
                type="text"
                placeholder="Procurar chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[color:var(--bg-tertiary)] border border-transparent focus:border-[color:var(--border-color)] rounded-lg pl-9 pr-3 py-2 text-sm placeholder-text-tertiary focus:outline-none transition-colors"
            />
        </div>

        <div className="flex flex-col gap-2 mb-4">
            <SidebarLink icon="fa-file-lines" text="📄 Documentos & Currículos" onClick={props.onSelectDocuments} />
            <SidebarLink icon="fa-images" text="Galeria de Imagens" onClick={props.onSelectGallery} />
            <SidebarLink icon="fa-book-bookmark" text="Biblioteca" onClick={props.onSelectLibrary} />
            <SidebarLink icon="fa-folder" text="Projetos" onClick={props.onSelectProjects} />
            <SidebarLink icon="fa-brands fa-whatsapp" text="💬 WhatsApp" onClick={props.onSelectWhatsApp} />
            <SidebarLink icon="fa-user-shield" text="⚙️ Admin WhatsApp" onClick={props.onSelectAdmin} />
        </div>

        <div className="flex-1 overflow-y-auto sidebar-scroll pr-1">
            <p className="text-xs text-text-tertiary font-semibold px-3 py-2">Chats Recentes</p>
            <div className="flex flex-col gap-1">
            {filteredChatHistory.map((chat) => (
                <ChatHistoryItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === props.currentChatId}
                  onSelect={() => props.onSelectChat(chat.id)}
                  onDelete={() => props.onDeleteChat(chat.id)}
                  onUpdateTitle={(newTitle) => props.onUpdateChatTitle(chat.id, newTitle)}
                />
            ))}
            </div>
        </div>
    </>;
};

const ProjectView: React.FC<Omit<SidebarProps, 'onSelectLibrary' | 'onSelectProjects'>> = (props) => {
    return <>
        <button onClick={props.onExitProject} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4">
            <i className="fa-solid fa-arrow-left"></i>
            <span>Todos os Projetos</span>
        </button>
        <div className="flex-1 overflow-y-auto sidebar-scroll pr-1">
             <div>
                <p className="text-xs text-text-tertiary font-semibold px-3 py-2">Arquivos</p>
                <div className="flex flex-col gap-1">
                    {props.projectFiles.map(file => <ProjectFileItem key={file.path} file={file} />)}
                    {props.projectFiles.length === 0 && <p className="px-3 text-xs text-text-tertiary italic">Nenhum arquivo ainda.</p>}
                </div>
            </div>
            <div className="mt-4">
                <p className="text-xs text-text-tertiary font-semibold px-3 py-2">Chats do Projeto</p>
                 <div className="flex flex-col gap-1">
                    {props.chatHistory.map((chat) => (
                        <ChatHistoryItem
                        key={chat.id}
                        chat={chat}
                        isActive={chat.id === props.currentChatId}
                        onSelect={() => props.onSelectChat(chat.id)}
                        onDelete={() => props.onDeleteChat(chat.id)}
                        onUpdateTitle={(newTitle) => props.onUpdateChatTitle(chat.id, newTitle)}
                        />
                    ))}
                </div>
            </div>
        </div>
    </>;
};

export const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <div className={`flex flex-col bg-[color:var(--bg-secondary)] text-text-primary transition-all duration-300 flex-shrink-0 ${props.isOpen ? 'w-64 p-3' : 'w-0'} h-full relative`}>
      <div className={`overflow-hidden transition-opacity duration-200 ${props.isOpen ? 'opacity-100' : 'opacity-0'} flex flex-col h-full`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex-grow">
             <SidebarLink icon="fa-plus" text="Novo chat" onClick={props.onNewChat} />
          </div>
          <button onClick={props.onToggle} className="p-2 rounded-lg hover:bg-[color:var(--bg-tertiary)] flex-shrink-0">
            <i className="fa-solid fa-bars-staggered"></i>
          </button>
        </div>

        {props.activeProjectId ? <ProjectView {...props} /> : <GlobalView {...props} />}
        
        <div className="border-t border-[color:var(--border-color)] mt-auto pt-4">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[color:var(--bg-tertiary)] cursor-pointer">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">A</div>
                    <span className="text-sm">Almir junior</span>
                </div>
                <button onClick={() => alert('Funcionalidade "Atualizar Perfil" a ser implementada.')} className="text-xs bg-blue-600 px-3 py-1 rounded-full hover:bg-blue-500">Atualizar</button>
            </div>
        </div>
      </div>
    </div>
  );
};
