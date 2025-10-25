import React from 'react';

interface ComingSoonProps {
  title: string;
  icon: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-tertiary text-center p-8 bg-bg-primary">
      <div className="p-6 bg-bg-tertiary rounded-full mb-6">
        <i className={`fa-solid ${icon} text-5xl text-text-secondary`}></i>
      </div>
      <h1 className="text-3xl font-bold text-text-primary mb-2">{title}</h1>
      <p className="max-w-md">
        Esta funcionalidade está em desenvolvimento e estará disponível em breve. Estamos trabalhando para trazer a melhor experiência para você.
      </p>
    </div>
  );
};