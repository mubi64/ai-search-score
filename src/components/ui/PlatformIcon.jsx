import React from 'react';
import { Bot, Sparkles, Search, Brain } from 'lucide-react';

const platformConfig = {
  chatgpt: {
    name: 'ChatGPT',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    icon: Bot
  },
  gemini: {
    name: 'Gemini',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    icon: Sparkles
  },
  perplexity: {
    name: 'Perplexity',
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    icon: Search
  },
  google: {
    name: 'Google AI',
    color: 'from-red-500 to-orange-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    icon: Brain
  }
};

export default function PlatformIcon({ platform, size = 'md', showLabel = false, className = '' }) {
  const config = platformConfig[platform?.toLowerCase()] || platformConfig.chatgpt;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
        <Icon className={`${iconSizes[size]} text-white`} />
      </div>
      {showLabel && (
        <span className={`font-semibold ${config.textColor}`}>
          {config.name}
        </span>
      )}
    </div>
  );
}

export { platformConfig };
