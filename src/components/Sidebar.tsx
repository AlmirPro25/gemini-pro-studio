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
  onSelectSecurity?: () => void;
  onSelectDesktop?: () => void;
  // New props for project context
  activeProjectId: string | null;
  onExitProject: () => void;
  projectFiles: ProjectFile[];
}

// SVG Icons Components
const DocumentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GalleryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LibraryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ProjectIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AdminIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SecurityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const AgentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 21V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.22 4.22L5.64 5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18.36 18.36L19.78 19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M1 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M21 12H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.22 19.78L5.64 18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const AutomationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DesktopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const SidebarLink: React.FC<{ 
  icon: string; 
  text: string; 
  onClick?: () => void; 
  isActive?: boolean;
  gradient?: string;
  IconComponent?: React.FC;
}> = ({ icon, text, onClick, isActive, gradient, IconComponent }) => (
  <button 
    onClick={onClick} 
    className={`group flex items-center gap-3 p-3 rounded-xl hover:bg-[color:var(--bg-tertiary)] transition-all duration-200 w-full text-left ${isActive ? 'bg-[color:var(--bg-tertiary)]' : ''}`}
  >
    <div className={`w-9 h-9 rounded-lg ${gradient || 'bg-gradient-to-br from-gray-500 to-gray-600'} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
      {IconComponent ? <IconComponent /> : <i className={`fa-solid ${icon} text-white text-sm`}></i>}
    </div>
    <span className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">{text}</span>
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
        <div className="relative mb-4">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"></i>
            <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[color:var(--bg-tertiary)] border border-transparent focus:border-indigo-500 rounded-xl pl-10 pr-3 py-2.5 text-sm placeholder-text-tertiary focus:outline-none transition-all duration-200 focus:shadow-lg focus:shadow-indigo-500/20"
            />
        </div>

        <div className="flex flex-col gap-2 mb-4">
            <SidebarLink 
              icon="fa-file-lines" 
              text="Documents" 
              onClick={props.onSelectDocuments}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              IconComponent={DocumentIcon}
            />
            <SidebarLink 
              icon="fa-images" 
              text="Gallery" 
              onClick={props.onSelectGallery}
              gradient="bg-gradient-to-br from-purple-500 to-pink-500"
              IconComponent={GalleryIcon}
            />
            <SidebarLink 
              icon="fa-book-bookmark" 
              text="Library" 
              onClick={props.onSelectLibrary}
              gradient="bg-gradient-to-br from-amber-500 to-orange-500"
              IconComponent={LibraryIcon}
            />
            <SidebarLink 
              icon="fa-folder" 
              text="Projects" 
              onClick={props.onSelectProjects}
              gradient="bg-gradient-to-br from-cyan-500 to-teal-500"
              IconComponent={ProjectIcon}
            />
            <SidebarLink 
              icon="fa-brands fa-whatsapp" 
              text="WhatsApp" 
              onClick={props.onSelectWhatsApp}
              gradient="bg-gradient-to-br from-green-500 to-emerald-600"
              IconComponent={WhatsAppIcon}
            />
            <SidebarLink 
              icon="fa-user-shield" 
              text="Admin" 
              onClick={props.onSelectAdmin}
              gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
              IconComponent={AdminIcon}
            />
            {props.onSelectSecurity && (
              <SidebarLink 
                icon="fa-video" 
                text="Security AI" 
                onClick={props.onSelectSecurity}
                gradient="bg-gradient-to-br from-red-500 to-rose-600"
                IconComponent={SecurityIcon}
              />
            )}
            {props.onSelectDesktop && (
              <SidebarLink 
                icon="fa-desktop" 
                text="Desktop Control" 
                onClick={props.onSelectDesktop}
                gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
                IconComponent={DesktopIcon}
              />
            )}
        </div>

        <div className="flex-1 overflow-y-auto sidebar-scroll pr-1">
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <div className="w-1 h-4 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider">Recent Chats</p>
            </div>
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
        <div className="flex justify-between items-center mb-4 gap-2">
          <button 
            onClick={props.onNewChat}
            className="flex-grow flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <i className="fa-solid fa-plus"></i>
            <span>New Chat</span>
          </button>
          <button 
            onClick={props.onToggle} 
            className="p-3 rounded-xl hover:bg-[color:var(--bg-tertiary)] flex-shrink-0 transition-all duration-200 hover:scale-110"
          >
            <i className="fa-solid fa-bars-staggered text-text-secondary"></i>
          </button>
        </div>

        {props.activeProjectId ? <ProjectView {...props} /> : <GlobalView {...props} />}
        
        <div className="border-t border-[color:var(--border-color)] mt-auto pt-4">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[color:var(--bg-tertiary)] cursor-pointer transition-all duration-200 group">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
                      A
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-text-primary">Almir Junior</span>
                      <span className="text-xs text-text-tertiary">Premium User</span>
                    </div>
                </div>
                <button 
                  onClick={() => alert('Funcionalidade "Atualizar Perfil" a ser implementada.')} 
                  className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-lg hover:from-indigo-500 hover:to-purple-500 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Update
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
