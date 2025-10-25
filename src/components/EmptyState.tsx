import React from 'react';

interface EmptyStateProps {
    onSend: (prompt: string) => void;
}

const EmptyStateCard: React.FC<{ icon: string, title: string, subtitle: string, onClick: () => void }> = ({ icon, title, subtitle, onClick }) => (
    <div onClick={onClick} className="p-4 bg-bg-secondary hover:bg-bg-tertiary rounded-lg cursor-pointer transition-colors border border-border-color">
        <i className={`fa-solid ${icon} text-text-secondary mb-2`}></i>
        <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
        <p className="text-text-tertiary text-xs">{subtitle}</p>
    </div>
);

export const EmptyState: React.FC<EmptyStateProps> = ({ onSend }) => {
    return (
        <div className="flex flex-col justify-between h-full text-text-tertiary p-4">
            <div className="flex-grow flex flex-col items-center justify-center">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="text-5xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">Olá, Almir</span>
                    </div>
                    <p className="text-2xl text-text-secondary mb-12">Como posso te ajudar hoje?</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
                        <EmptyStateCard 
                            icon="fa-code" 
                            title="Criar um site"
                            subtitle="em um único arquivo HTML"
                            onClick={() => onSend('Crie uma página de portfólio para um desenvolvedor web, usando um design moderno e minimalista.')}
                        />
                        <EmptyStateCard 
                            icon="fa-feather-pointed" 
                            title="Escrever um e-mail"
                            subtitle="para uma proposta de negócio"
                            onClick={() => onSend('Escreva um e-mail profissional para um potencial cliente, apresentando meus serviços de desenvolvimento de software e propondo uma reunião.')}
                        />
                        <EmptyStateCard 
                            icon="fa-lightbulb" 
                            title="Brainstorm de ideias"
                            subtitle="para um novo projeto"
                            onClick={() => onSend('Me dê 5 ideias de nomes e conceitos para um novo aplicativo de produtividade focado em estudantes.')}
                        />
                        <EmptyStateCard 
                            icon="fa-image" 
                            title="Gerar uma imagem"
                            subtitle="de um astronauta em um cavalo"
                            onClick={() => onSend('Um astronauta cavalgando em um cavalo, fotorrealista')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};