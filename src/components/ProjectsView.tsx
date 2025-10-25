import React from 'react';
import { Project } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  onCreateProject: () => void;
  onSelectProject: (projectId: string) => void;
}

const ProjectCard: React.FC<{ project: Project; onSelect: () => void }> = ({ project, onSelect }) => (
  <div 
    onClick={onSelect}
    className="bg-bg-secondary hover:bg-bg-tertiary border border-border-color rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
  >
    <div className="flex items-center gap-3 mb-2">
        <i className="fa-solid fa-folder text-blue-400"></i>
        <h3 className="font-semibold text-text-primary truncate">{project.name}</h3>
    </div>
    <p className="text-sm text-text-secondary line-clamp-2 mb-3">{project.description}</p>
    <div className="text-xs text-text-tertiary">
      <span>{project.files.length} arquivos, {project.chats.length} chats</span>
    </div>
  </div>
);

export const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, onCreateProject, onSelectProject }) => {
  return (
    <div className="p-8 bg-bg-primary h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Projetos</h1>
        <button 
            onClick={onCreateProject} 
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
            <i className="fa-solid fa-plus"></i>
            <span>Criar Novo Projeto</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary">
            <i className="fa-solid fa-folder-open text-5xl mb-4"></i>
            <p>Você ainda não tem projetos.</p>
            <p>Clique em "Criar Novo Projeto" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map(project => (
                <ProjectCard key={project.id} project={project} onSelect={() => onSelectProject(project.id)} />
            ))}
        </div>
      )}
    </div>
  );
};
