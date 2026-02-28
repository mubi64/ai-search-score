import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Sparkles } from "lucide-react";

const slides = [
  { type: "fact", content: "AI search engines scan multiple sites before giving one clean answer." },
  { type: "tip", content: "Use schema markup to tell AI exactly what your content means." },
  { type: "fact", content: "ChatGPT searches the web using Bing—not Google." },
  { type: "fact", content: "Ranking #1 on Google doesn't guarantee showing up in AI results." },
  { type: "tip", content: "Include original research, stats, or insights to stand out." },
  { type: "fact", content: "Brand mentions in articles can boost your visibility in AI answers." },
  { type: "tip", content: "Write short, clear answers to make your site easier for AI to quote." },
  { type: "fact", content: "Perplexity lists every source it reads, like built-in citations." },
  { type: "fact", content: "AI tools read your site's schema, headings, and metadata like a roadmap." },
  { type: "fact", content: "Small blogs can outrank big brands in AI results with strong structure." },
  { type: "tip", content: "Display author names and credentials to build AI trust." },
  { type: "fact", content: "Google's \"AI Overviews\" rewrite search results with generative AI." },
  { type: "tip", content: "Refresh older pages regularly to keep content feeling new." },
  { type: "fact", content: "ChatGPT and Gemini can give totally different answers to the same query." },
  { type: "tip", content: "Earn backlinks from credible, topic-relevant websites." },
  { type: "fact", content: "AI search favors content that's both accurate and recently updated." },
  { type: "tip", content: "Write conversational titles that match real user questions." },
  { type: "tip", content: "Get mentioned in media or niche blogs for extra AI visibility." },
  { type: "tip", content: "Organize clean internal links so AI understands your site's hierarchy." },
  { type: "fact", content: "AI search tools read multiple signals—not just keywords—to decide what to show." }
];

export default function DidYouKnow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startIndex] = useState(() => Math.floor(Math.random() * slides.length));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 8000); // Change slide every 8 seconds

    return () => clearInterval(timer);
  }, []);

  // Get the current slide based on the rotating index plus the random start
  const displayIndex = (startIndex + currentIndex) % slides.length;
  const currentSlide = slides[displayIndex];
  const isTip = currentSlide.type === "tip";

  return (
    <Card className={`border-2 ${isTip ? 'border-blue-200 bg-gradient-to-br from-white to-blue-50/30' : 'border-[#df1d29]/20 bg-gradient-to-br from-white to-red-50/30'}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isTip 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
              : 'bg-gradient-to-br from-[#df1d29] to-[#c51923]'
          }`}>
            {isTip ? (
              <Sparkles className="w-5 h-5 text-white" />
            ) : (
              <Lightbulb className="w-5 h-5 text-white" />
            )}
          </div>
          <h3 className="text-lg font-bold text-[#344547] mt-1">
            {isTip ? 'Helpful Tip' : 'Did You Know?'}
          </h3>
        </div>
        <p className="text-slate-700 leading-relaxed min-h-[60px]">
          {currentSlide.content}
        </p>
        <div className="flex gap-1 mt-4 justify-center">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === displayIndex
                  ? `w-8 ${isTip ? 'bg-blue-500' : 'bg-[#df1d29]'}`
                  : 'w-1.5 bg-slate-300'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}