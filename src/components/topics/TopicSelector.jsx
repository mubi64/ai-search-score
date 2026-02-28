
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Package, Plus } from "lucide-react";

export default function TopicSelector({ 
  products, 
  selectedTopics, 
  setSelectedTopics,
  includeGeneral,
  setIncludeGeneral 
}) {
  const [allProducts, setAllProducts] = useState(products);
  const [newTopic, setNewTopic] = useState("");

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      // Deselecting a topic
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      // Selecting a topic - deselect General if it's selected
      if (includeGeneral) {
        setIncludeGeneral(false);
      }
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const toggleGeneral = () => {
    if (!includeGeneral) {
      // Selecting General - clear all individual topics
      setSelectedTopics([]);
      setIncludeGeneral(true);
    } else {
      // Deselecting General
      setIncludeGeneral(false);
    }
  };

  const selectAll = () => {
    // Selecting all individual topics deselects General
    setIncludeGeneral(false);
    setSelectedTopics(allProducts);
  };

  const deselectAll = () => {
    setSelectedTopics([]);
    setIncludeGeneral(false);
  };

  const addCustomTopic = () => {
    if (newTopic.trim() && !allProducts.includes(newTopic.trim())) {
      const trimmedTopic = newTopic.trim();
      setAllProducts([...allProducts, trimmedTopic]);
      // Adding a custom topic deselects General if it's selected
      if (includeGeneral) {
        setIncludeGeneral(false);
      }
      setSelectedTopics([...selectedTopics, trimmedTopic]);
      setNewTopic("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={selectAll}
          className="text-sm text-slate-600 hover:text-slate-700 font-medium"
        >
          Select All
        </button>
        <span className="text-slate-300">|</span>
        <button
          onClick={deselectAll}
          className="text-sm text-slate-600 hover:text-slate-700 font-medium"
        >
          Deselect All
        </button>
      </div>

      <Card 
        className={`p-4 cursor-pointer transition-all duration-200 border-2 ${
          includeGeneral 
            ? 'border-slate-600 bg-slate-50 shadow-md' 
            : 'border-slate-200 hover:border-slate-300'
        }`}
        onClick={toggleGeneral}
      >
        <div className="flex items-center gap-4">
          <Checkbox
            checked={includeGeneral}
            onCheckedChange={toggleGeneral}
            className="w-5 h-5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#344547] to-[#2a3638] rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[#344547]">General Company Presence</h3>
                <p className="text-sm text-slate-600">Overall brand visibility and mentions</p>
              </div>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-700">Recommended</Badge>
        </div>
      </Card>

      <div className="space-y-3">
        {allProducts.map((product) => (
          <Card
            key={product}
            className={`p-4 cursor-pointer transition-all duration-200 border-2 ${
              selectedTopics.includes(product)
                ? 'border-slate-600 bg-slate-50 shadow-md'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            onClick={() => toggleTopic(product)}
          >
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedTopics.includes(product)}
                onCheckedChange={() => toggleTopic(product)}
                className="w-5 h-5"
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#344547] to-[#2a3638] rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#344547]">{product}</h3>
                  <p className="text-sm text-slate-600">Product-specific visibility tracking</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-slate-50 border-2 border-dashed border-slate-300">
        <div className="flex gap-3">
          <Input
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomTopic()}
            placeholder="Add a custom topic (e.g., a service, use case, or category)..."
            className="flex-1 placeholder:text-slate-400"
          />
          <Button
            onClick={addCustomTopic}
            disabled={!newTopic.trim()}
            className="bg-[#df1d29] hover:bg-[#c51923]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Topic
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Add custom topics to track specific products, services, or categories beyond what was auto-discovered
        </p>
      </Card>

      {selectedTopics.length > 0 || includeGeneral ? (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            Selected {selectedTopics.length + (includeGeneral ? 1 : 0)} topic{selectedTopics.length + (includeGeneral ? 1 : 0) !== 1 ? 's' : ''} for analysis
          </p>
        </div>
      ) : null}
    </div>
  );
}
