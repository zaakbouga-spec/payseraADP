import React from 'react';

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon, colorClass, onClick }) => (
  <div 
    className={`rounded-xl shadow-lg p-6 flex flex-col items-center justify-between text-center transform hover:scale-105 transition-transform duration-300 group ${colorClass}`}
  >
    <div className="flex-grow flex flex-col items-center justify-center">
        <div className="relative">
            <div className="absolute -inset-2 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
                {icon}
            </div>
        </div>
        <h3 className="text-2xl font-bold text-white mt-4">{title}</h3>
        <p className="text-white/80 mt-2">{description}</p>
    </div>
    <button
      onClick={onClick}
      className="mt-6 bg-white text-gray-800 font-semibold py-2 px-8 rounded-full shadow-md hover:bg-gray-200 transition-colors duration-300 group-hover:shadow-xl"
    >
      Launch Tool
    </button>
  </div>
);

export default ToolCard;
