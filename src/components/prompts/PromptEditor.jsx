
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package } from "lucide-react";

export default function PromptEditor({ topic, prompts, maxPrompts = 20, onChange }) {
  const [newPrompt, setNewPrompt] = useState("");

  const addPrompt = () => {
    if (newPrompt.trim() && prompts.length < maxPrompts) {
      onChange([...prompts, newPrompt.trim()]);
      setNewPrompt("");
    }
  };

  const removePrompt = (index) => {
    onChange(prompts.filter((_, i) => i !== index));
  };

  const updatePrompt = (index, value) => {
    const updated = [...prompts];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <Card className="border-0 shadow-xl backdrop-blur-xl bg-white">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#344547] to-[#2a3638] rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-[#344547]">{topic}</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3 mb-4">
          {prompts.map((prompt, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-[#344547]">{index + 1}</span>
              </div>
              <Input
                value={prompt}
                onChange={(e) => updatePrompt(index, e.target.value)}
                className="flex-1"
                placeholder="Customer question..."
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removePrompt(index)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {prompts.length < maxPrompts && (
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Input
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPrompt()}
              placeholder="Add a new prompt..."
              className="flex-1 placeholder:text-slate-400"
            />
            <Button
              onClick={addPrompt}
              disabled={!newPrompt.trim()}
              className="bg-[#df1d29] hover:bg-[#c51923]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
