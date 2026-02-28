import React from 'react';
import { motion } from 'framer-motion';

export default function ScoreCircle({ 
  score = 0, 
  size = 'lg', 
  showLabel = true,
  label = 'Overall Score',
  animated = true 
}) {
  const sizeConfig = {
    sm: { width: 80, stroke: 6, fontSize: 'text-2xl' },
    md: { width: 120, stroke: 8, fontSize: 'text-3xl' },
    lg: { width: 160, stroke: 10, fontSize: 'text-5xl' },
    xl: { width: 200, stroke: 12, fontSize: 'text-6xl' }
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = (score) => {
    if (score >= 75) return { stroke: '#10b981', bg: 'bg-green-50', text: 'text-green-600' };
    if (score >= 50) return { stroke: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-600' };
    return { stroke: '#ef4444', bg: 'bg-red-50', text: 'text-red-600' };
  };

  const colors = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative ${config.width}px`} style={{ width: config.width, height: config.width }}>
        {/* Background circle */}
        <svg className="transform -rotate-90" width={config.width} height={config.width}>
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={config.stroke}
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={config.stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className={`${config.fontSize} font-bold ${colors.text}`}
            initial={animated ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {Math.round(score)}
          </motion.div>
        </div>
      </div>
      
      {showLabel && (
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">{label}</p>
        </div>
      )}
    </div>
  );
}
