import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquare, CheckCircle2, XCircle, Search, X, ExternalLink, ChevronDown, ChevronUp, Package } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Custom link renderer for markdown
const MarkdownLink = ({ href, children }) => {
  // Extract domain from URL for display
  const getDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 hover:underline"
    >
      {getDomain(href)}
    </a>
  );
};

export default function PromptBreakdown({ promptResults, companyName, companyId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [expandedPrompts, setExpandedPrompts] = useState(new Set([0])); // First prompt expanded by default

  const filteredResults = promptResults.filter((result) => {
    const matchesSearch = result.prompt.toLowerCase().includes(searchTerm.toLowerCase());

    const chatgptMentioned = result.brand_mentions?.chatgpt?.includes(companyId);
    const geminiMentioned = result.brand_mentions?.gemini?.includes(companyId);
    const perplexityMentioned = result.brand_mentions?.perplexity?.includes(companyId);
    const googleMentioned = result.brand_mentions?.google_ai_overview?.includes(companyId);

    const matchesPlatform = filterPlatform === "all" ||
      filterPlatform === "chatgpt" && chatgptMentioned ||
      filterPlatform === "gemini" && geminiMentioned ||
      filterPlatform === "perplexity" && perplexityMentioned ||
      filterPlatform === "google" && googleMentioned;

    return matchesSearch && matchesPlatform;
  });

  // Group filtered results by topic
  const groupedByTopic = {};
  filteredResults.forEach(result => {
    const topic = result.topic || 'Uncategorized';
    if (!groupedByTopic[topic]) {
      groupedByTopic[topic] = [];
    }
    groupedByTopic[topic].push(result);
  });

  const getScoreColor = (score) => {
    if (score >= 66) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 33) return 'text-slate-600 bg-slate-50 border-slate-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const togglePrompt = (index) => {
    setExpandedPrompts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handlePlatformClick = (result, platform, promptIndex) => {
    let response = '';
    let platformName = '';
    let mentioned = false;
    let searchResults = null;
    let notPresent = false;
    let isRankings = false;

    if (platform === 'chatgpt') {
      response = result.chatgpt_response;
      platformName = 'ChatGPT';
      mentioned = result.brand_mentions?.chatgpt?.includes(companyId);
    } else if (platform === 'gemini') {
      response = result.gemini_response;
      platformName = 'Gemini';
      mentioned = result.brand_mentions?.gemini?.includes(companyId);
    } else if (platform === 'perplexity') {
      response = result.perplexity_response;
      platformName = 'Perplexity';
      mentioned = result.brand_mentions?.perplexity?.includes(companyId);
    } else if (platform === 'google_ai_overview') {
      if (!result.google_ai_overview_present) {
        response = null;
        platformName = 'Google AI Overview';
        mentioned = false;
        notPresent = true;
      } else {
        response = result.google_ai_overview_response || 'AI Overview present but no text captured';
        platformName = 'Google AI Overview';
        mentioned = result.brand_mentions?.google_ai_overview?.includes(companyId);
        notPresent = false;
      }
    } else if (platform === 'google_rankings') {
      platformName = 'Google Rankings';
      searchResults = result.google_search_results;
      isRankings = true;
    }

    setSelectedResponse({
      prompt: result.prompt,
      platform: platformName,
      response: response,
      mentioned: mentioned,
      notPresent: notPresent,
      searchResults: searchResults,
      promptIndex: promptIndex + 1,
      isRankings: isRankings
    });
  };

  return (
    <>
      <Card className="border-0 shadow-xl backdrop-blur-xl bg-white mb-8">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="font-semibold tracking-tight flex items-center gap-2 text-2xl text-[#344547]">Prompt Analysis</CardTitle>
            <Tabs defaultValue="all" onValueChange={setFilterPlatform}>
              <TabsList>
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:font-bold data-[state=active]:text-[#344547] text-slate-500">
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="chatgpt"
                  className="data-[state=active]:font-bold data-[state=active]:text-[#344547] text-slate-500">
                  ChatGPT
                </TabsTrigger>
                <TabsTrigger
                  value="gemini"
                  className="data-[state=active]:font-bold data-[state=active]:text-[#344547] text-slate-500">
                  Gemini
                </TabsTrigger>
                <TabsTrigger
                  value="perplexity"
                  className="data-[state=active]:font-bold data-[state=active]:text-[#344547] text-slate-500">
                  Perplexity
                </TabsTrigger>
                <TabsTrigger
                  value="google"
                  className="data-[state=active]:font-bold data-[state=active]:text-[#344547] text-slate-500">
                  Google AI
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search prompts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 placeholder:text-slate-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {Object.keys(groupedByTopic).length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No prompts match your filters
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedByTopic).map(([topic, topicResults]) => (
                <div key={topic} className="space-y-4">
                  {/* Topic Header */}
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#344547] to-[#2a3638] rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#344547]">{topic}</h3>
                      <p className="text-sm text-slate-500">{topicResults.length} prompt{topicResults.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Prompts for this topic */}
                  <div className="space-y-4 pl-2">
                    {topicResults.map((result, topicIndex) => {
                      const globalIndex = promptResults.findIndex(r => r.id === result.id);
                      const chatgptMentioned = result.brand_mentions?.chatgpt?.includes(companyId);
                      const geminiMentioned = result.brand_mentions?.gemini?.includes(companyId);
                      const perplexityMentioned = result.brand_mentions?.perplexity?.includes(companyId);
                      const googleAIMentioned = result.brand_mentions?.google_ai_overview?.includes(companyId);
                      const isExpanded = expandedPrompts.has(globalIndex);

                      return (
                        <div key={result.id} className="bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
                          {/* Collapsed Header - Always Visible */}
                          <div
                            className="p-6 cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => togglePrompt(globalIndex)}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#344547] to-[#2a3638] rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold text-white">{topicIndex + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-[#344547] mb-2">{result.prompt}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className={`px-4 py-2 rounded-lg border-2 font-bold text-xl ${getScoreColor(result.overall_score)}`}>
                                  {result.overall_score || 0}
                                </div>
                                {isExpanded ?
                                  <ChevronUp className="w-5 h-5 text-slate-400" /> :
                                  <ChevronDown className="w-5 h-5 text-slate-400" />
                                }
                              </div>
                            </div>
                          </div>

                          {/* Expanded Content - Platform Grid */}
                          {isExpanded &&
                            <div className="px-6 pb-6">
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div
                                  className="bg-white p-4 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlatformClick(result, 'chatgpt', globalIndex);
                                  }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-slate-600">ChatGPT</p>
                                    {chatgptMentioned ?
                                      <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                                      <XCircle className="w-5 h-5 text-red-400" />
                                    }
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {chatgptMentioned ?
                                      `Mentioned ${companyName}` :
                                      'No mention'}
                                  </p>
                                  <p className="text-xs text-blue-600 mt-2">Click to view response</p>
                                </div>

                                <div
                                  className="bg-white p-4 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlatformClick(result, 'gemini', globalIndex);
                                  }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-slate-600">Gemini</p>
                                    {geminiMentioned ?
                                      <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                                      <XCircle className="w-5 h-5 text-red-400" />
                                    }
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {geminiMentioned ?
                                      `Mentioned ${companyName}` :
                                      'No mention'}
                                  </p>
                                  <p className="text-xs text-blue-600 mt-2">Click to view response</p>
                                </div>

                                <div
                                  className="bg-white p-4 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlatformClick(result, 'perplexity', globalIndex);
                                  }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-slate-600">Perplexity</p>
                                    {perplexityMentioned ?
                                      <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                                      <XCircle className="w-5 h-5 text-red-400" />
                                    }
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {perplexityMentioned ?
                                      `Mentioned ${companyName}` :
                                      'No mention'}
                                  </p>
                                  <p className="text-xs text-blue-600 mt-2">Click to view response</p>
                                </div>

                                <div
                                  className="bg-white p-4 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlatformClick(result, 'google_ai_overview', globalIndex);
                                  }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-slate-600">Google AI</p>
                                    {!result.google_ai_overview_present ?
                                      <span className="text-xs text-slate-400">N/A</span> :
                                      googleAIMentioned ?
                                        <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    }
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {!result.google_ai_overview_present ?
                                      'Not present' :
                                      googleAIMentioned ?
                                        `Mentioned ${companyName}` :
                                        'No mention'}
                                  </p>
                                  <p className="text-xs text-blue-600 mt-2">Click to view</p>
                                </div>

                                {/* <div
                                  className="bg-white p-4 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-shadow col-span-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlatformClick(result, 'google_rankings', globalIndex);
                                  }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-slate-600">Google Rankings</p>
                                    <Search className="w-5 h-5 text-slate-400" />
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    View top 10 organic search results
                                  </p>
                                  <p className="text-xs text-blue-600 mt-2">Click to view</p>
                                </div> */}
                              </div>
                            </div>
                          }
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedResponse?.promptIndex &&
                  <span className="text-sm font-bold text-slate-500 mr-1">#{selectedResponse.promptIndex}</span>
                }
                <span className="text-lg font-bold text-slate-900">{selectedResponse?.platform}</span>
                {!selectedResponse?.isRankings && (
                  selectedResponse?.notPresent ?
                    <Badge className="bg-slate-100 text-slate-700">Not Present</Badge> :
                    selectedResponse?.mentioned ?
                      <Badge className="bg-green-100 text-green-700">Brand Mentioned</Badge> :
                      <Badge className="bg-red-100 text-red-700">No Mention</Badge>)
                }
              </div>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Prompt:</h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedResponse?.prompt}</p>
              </div>

              {selectedResponse?.isRankings && selectedResponse?.searchResults ?
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Top Search Results:</h4>
                  <div className="space-y-3">
                    {selectedResponse.searchResults.length > 0 ?
                      selectedResponse.searchResults.map((result, index) =>
                        <a
                          key={index}
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 bg-slate-50 rounded-lg hover:bg-blue-50 hover:border-blue-300 border border-slate-200 transition-all group">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-[#344547] to-[#2a3638] rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-slate-900 group-hover:text-blue-700 mb-1">
                                {result.title}
                              </p>
                              <p className="text-xs text-green-700 mb-2 truncate">
                                {result.link}
                              </p>
                              <p className="text-sm text-slate-600 line-clamp-2">
                                {result.snippet}
                              </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0 mt-1" />
                          </div>
                        </a>
                      ) :
                      <p className="text-slate-500 text-center py-4">No search results available</p>
                    }
                  </div>
                </div> :
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Response:</h4>
                  <div className={`p-4 rounded-lg ${selectedResponse?.notPresent ? 'bg-slate-100 text-slate-500 italic' : 'bg-slate-50 text-slate-900'}`
                  }>
                    {selectedResponse?.response ? (
                      <ReactMarkdown
                        components={{
                          a: MarkdownLink,
                          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-4">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-3">{children}</h3>,
                          h4: ({ children }) => <h4 className="text-base font-bold mb-2 mt-3">{children}</h4>,
                        }}
                      >
                        {selectedResponse.response}
                      </ReactMarkdown>
                    ) : (
                      'No response available'
                    )}
                  </div>
                </div>
              }
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}