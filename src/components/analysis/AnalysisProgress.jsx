import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

export default function AnalysisProgress({ progress, totalPrompts }) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    "Querying ChatGPT",
    "Querying Gemini",
    "Querying Perplexity",
    "Searching Google",
    "Analyzing responses",
    "Extracting sources",
    "Validating competitors",
    "Calculating visibility scores",
    "Finalizing report"
  ];

  useEffect(() => {
    // Change active step every 12 seconds
    const stepInterval = setInterval(() => {
      setActiveStep(prev => {
        // Stop at the last step instead of looping
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 12000);

    return () => clearInterval(stepInterval);
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="text-6xl font-bold text-[#df1d29] mb-2">
          {progress}%
        </div>
        <p className="text-lg text-slate-600 mb-2">
          {progress < 99 ? 'Analysis in progress...' : 'Almost there...'}
        </p>
        <p className="text-sm text-slate-500">
          Analyzing {totalPrompts} prompt{totalPrompts !== 1 ? 's' : ''} across multiple AI platforms
        </p>
      </div>

      <div className="px-4">
        <div className="w-full bg-white rounded-full h-4 overflow-hidden border border-slate-200">
          <div 
            className="h-full bg-[#344547] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function AnalysisSteps() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    "Querying ChatGPT",
    "Querying Gemini",
    "Querying Perplexity",
    "Searching Google",
    "Analyzing responses",
    "Extracting sources",
    "Validating competitors",
    "Calculating visibility scores",
    "Finalizing report"
  ];

  useEffect(() => {
    // Change active step every 12 seconds
    const stepInterval = setInterval(() => {
      setActiveStep(prev => {
        // Stop at the last step instead of looping
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 12000);

    return () => clearInterval(stepInterval);
  }, []);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[#344547] mb-4 text-center">Analysis Steps:</h3>
      {steps.map((step, index) => {
        const isActive = index === activeStep;
        const isCompleted = index < activeStep;
        
        return (
          <div 
            key={index} 
            className={`flex items-center gap-3 transition-all duration-500 ${
              isActive ? 'text-[#344547] scale-105' : isCompleted ? 'text-green-600' : 'text-slate-400'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
              isActive ? 'bg-slate-200' : isCompleted ? 'bg-green-100' : 'bg-slate-100'
            }`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                isActive ? 'bg-[#344547] animate-pulse' : isCompleted ? 'bg-green-600' : 'bg-slate-400'
              }`} />
            </div>
            <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}