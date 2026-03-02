import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import PlatformIcon from '../ui/PlatformIcon';

const analysisSteps = [
  { id: 'chatgpt', label: 'Querying ChatGPT', platform: 'chatgpt', duration: 15 },
  { id: 'gemini', label: 'Querying Gemini', platform: 'gemini', duration: 15 },
  { id: 'perplexity', label: 'Querying Perplexity', platform: 'perplexity', duration: 15 },
  { id: 'google', label: 'Searching Google AI Overviews', platform: 'google', duration: 20 },
  { id: 'analyzing', label: 'Analyzing responses', platform: null, duration: 15 },
  { id: 'sources', label: 'Extracting sources', platform: null, duration: 10 },
  { id: 'competitors', label: 'Validating competitors', platform: null, duration: 5 },
  { id: 'calculating', label: 'Calculating scores', platform: null, duration: 5 }
];

// Precompute cumulative percentage thresholds from duration weights
// durations: 15,15,15,20,15,10,5,5 = 100 total
// thresholds: [0, 15, 30, 45, 65, 80, 90, 95]
const totalWeight = analysisSteps.reduce((sum, step) => sum + step.duration, 0);
const stepThresholds = [];
let _cumWeight = 0;
analysisSteps.forEach(step => {
  stepThresholds.push((_cumWeight / totalWeight) * 100);
  _cumWeight += step.duration;
});

export default function EnhancedAnalysisProgress({ progress = 0 }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Determine which step we're on using weighted thresholds
    let newStepIndex = 0;
    for (let i = stepThresholds.length - 1; i >= 0; i--) {
      if (progress >= stepThresholds[i]) {
        newStepIndex = i;
        break;
      }
    }
    setCurrentStepIndex(newStepIndex);
  }, [progress]);

  const getStepStatus = (index) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="relative">
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#df1d29] to-[#c51923]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="mt-2 text-center">
          <span className="text-2xl font-bold text-[#344547]">{Math.round(progress)}%</span>
          <span className="text-sm text-slate-500 ml-2">Complete</span>
        </div>
      </div>

      {/* Steps list */}
      <div className="space-y-3">
        {analysisSteps.map((step, index) => {
          const status = getStepStatus(index);
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                status === 'active' 
                  ? 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 shadow-md' 
                  : status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-slate-50 border border-slate-200'
              }`}
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {status === 'completed' && (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                )}
                {status === 'active' && (
                  <Loader2 className="w-6 h-6 text-[#df1d29] animate-spin" />
                )}
                {status === 'pending' && (
                  <Circle className="w-6 h-6 text-slate-300" />
                )}
              </div>

              {/* Platform icon (if applicable) */}
              {step.platform && (
                <PlatformIcon platform={step.platform} size="sm" />
              )}

              {/* Step label */}
              <div className="flex-1">
                <p className={`font-medium ${
                  status === 'active' 
                    ? 'text-[#344547]' 
                    : status === 'completed'
                    ? 'text-green-700'
                    : 'text-slate-400'
                }`}>
                  {step.label}
                </p>
              </div>

              {/* Pulse animation for active step */}
              {status === 'active' && (
                <motion.div
                  className="w-2 h-2 bg-[#df1d29] rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
