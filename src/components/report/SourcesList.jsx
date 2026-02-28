import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link as LinkIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SourcesList({ topicAnalyses }) {
  const [selectedSource, setSelectedSource] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState("all");

  // Aggregate all sources from all topics
  const allSources = {};
  
  topicAnalyses.forEach(analysis => {
    ['chatgpt_sources', 'gemini_sources', 'perplexity_sources', 'google_ai_overview_sources'].forEach(sourceType => {
      const sources = analysis[sourceType] || {};
      const platform = sourceType.replace('_sources', '').replace('google_ai_overview', 'google');

      Object.entries(sources).forEach(([sourceName, urls]) => {
        if (!allSources[sourceName]) {
          allSources[sourceName] = {
            platforms: new Set(),
            urls: { chatgpt: [], gemini: [], perplexity: [], google: [] }
          };
        }
        allSources[sourceName].platforms.add(platform);

        // Handle both old format (array of strings) and new format (array of objects)
        const urlArray = Array.isArray(urls) ? urls : (urls ? [urls] : []);

        urlArray.forEach(item => {
          if (!item) return;

          // Handle both formats: string URLs and {url, context} objects
          const urlData = typeof item === 'string'
            ? { url: item, context: 'Referenced in response' }
            : item;

          // Check if URL already exists
          const exists = allSources[sourceName].urls[platform].some(
            existing => existing.url === urlData.url
          );

          if (!exists) {
            allSources[sourceName].urls[platform].push(urlData);
          }
        });
      });
    });
  });

  // Filter sources by platform
  const filteredSources = Object.entries(allSources).filter(([sourceName, data]) => {
    if (filterPlatform === "all") return true;
    return data.platforms.has(filterPlatform);
  });

  // Sort sources by number of platforms that cited them, then by total URL count
  const sortedSources = filteredSources.sort(([, a], [, b]) => {
    const platformDiff = b.platforms.size - a.platforms.size;
    if (platformDiff !== 0) return platformDiff;

    const aUrlCount = Object.values(a.urls).flat().length;
    const bUrlCount = Object.values(b.urls).flat().length;
    return bUrlCount - aUrlCount;
  });

  const displayedSources = showAll ? sortedSources : sortedSources.slice(0, 10);
  const hasMore = sortedSources.length > 10;

  const getPlatformColor = (platform) => {
    const colors = {
      chatgpt: 'bg-blue-100 text-blue-700',
      gemini: 'bg-teal-100 text-teal-700',
      perplexity: 'bg-green-100 text-green-700',
      google: 'bg-indigo-100 text-indigo-700'
    };
    return colors[platform] || 'bg-slate-100 text-slate-700';
  };

  const handleSourceClick = (sourceName, sourceData) => {
    setSelectedSource({ name: sourceName, ...sourceData });
  };

  return (
    <>
      <Card className="border-0 shadow-xl backdrop-blur-xl bg-white">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl text-[#344547]">
                <ExternalLink className="w-6 h-6 text-[#df1d29]" />
                Sources
              </CardTitle>
              <p className="text-slate-600 mt-2">
                All sources cited by AI platforms across your analysis
              </p>
            </div>
            {/* <Tabs defaultValue="all" value={filterPlatform} onValueChange={setFilterPlatform}>
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
            </Tabs> */}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {displayedSources.map(([source, data]) => {
                const totalUrls = Object.values(data.urls).flat().length;

                return (
                  <div
                    key={source}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md hover:border-[#df1d29] transition-all cursor-pointer"
                    onClick={() => handleSourceClick(source, data)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#344547] to-[#2a3638] rounded-lg flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#344547] mb-2">{source}</p>
                        <div className="flex gap-2 flex-wrap">
                          {Array.from(data.platforms).map(platform => (
                            <Badge key={platform} className={getPlatformColor(platform)}>
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#df1d29]">{totalUrls}</div>
                      <div className="text-xs text-slate-500">citation{totalUrls !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show All ({sortedSources.length - 10} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </ScrollArea>

          {sortedSources.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No sources found {filterPlatform !== "all" && `for ${filterPlatform}`}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedSource} onOpenChange={() => setSelectedSource(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <LinkIcon className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold">{selectedSource?.name}</span>
            </DialogTitle>
            <p className="text-sm text-slate-600 mt-2">
              All citations from this source across AI platforms
            </p>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {selectedSource && ['chatgpt', 'gemini', 'perplexity', 'google'].map(platform => {
                const urls = selectedSource.urls[platform] || [];
                if (urls.length === 0) return null;

                return (
                  <div key={platform}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getPlatformColor(platform)}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Badge>
                      <span className="text-sm text-slate-600">
                        {urls.length} citation{urls.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {urls.map((urlData, index) => (
                        <a
                          key={index}
                          href={urlData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 bg-slate-50 rounded-lg hover:bg-blue-50 hover:border-blue-300 border border-slate-200 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0 mt-1" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 group-hover:text-blue-700 break-all mb-2">
                                {urlData.url}
                              </p>
                              <p className="text-xs text-slate-500 line-clamp-2">
                                {urlData.context}
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}

              {selectedSource &&
                Object.values(selectedSource.urls).flat().length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No direct links available for this source
                  </div>
                )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}