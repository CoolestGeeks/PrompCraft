
import React, { useState, useEffect, useCallback } from 'react';
import type { Prompt, PromptConfig, PromptVersion } from '../../types';
import { getPromptSuggestion, parsePromptWithAI } from '../../services/geminiService';
import { SparklesIcon } from '../icons/SparklesIcon';


interface WizardViewProps {
  prompt: Prompt;
  updatePrompt: (prompt: Prompt) => void;
  saveNewVersion: (prompt: Prompt, promptText: string) => Promise<PromptVersion | null>;
}

const Section: React.FC<{ title: string; description: string; children: React.ReactNode; onSuggest?: () => void; suggestion?: string; loadingSuggestion?: boolean; }> = 
  ({ title, description, children, onSuggest, suggestion, loadingSuggestion }) => (
  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
    <div className="flex justify-between items-start">
        <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        {onSuggest && (
            <button 
                onClick={onSuggest} 
                disabled={loadingSuggestion}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-wait flex-shrink-0 ml-4">
                <SparklesIcon/>
                <span>{loadingSuggestion ? 'Thinking...' : 'Suggest'}</span>
            </button>
        )}
    </div>
    {suggestion && (
        <div className="mt-4 p-3 bg-gray-700/50 border border-accent/30 rounded-md text-sm text-gray-300">
            <p><strong className="text-accent">Suggestion:</strong> {suggestion}</p>
        </div>
    )}
    <div className="mt-4">{children}</div>
  </div>
);

const TagInput: React.FC<{ tags: string[]; onTagsChange: (tags: string[]) => void; placeholder: string; }> = 
  ({ tags, onTagsChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      onTagsChange([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };
  
  const removeTag = (indexToRemove: number) => {
    onTagsChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <div key={index} className="flex items-center bg-accent/20 text-accent-hover px-2 py-1 rounded-full text-sm">
            <span>{tag}</span>
            <button onClick={() => removeTag(index)} className="ml-2 text-accent-hover hover:text-white">&times;</button>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none"
      />
    </div>
  );
};


export const WizardView: React.FC<WizardViewProps> = ({ prompt, updatePrompt, saveNewVersion }) => {
  const [config, setConfig] = useState<PromptConfig>(prompt.config);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<Record<string, boolean>>({});
  
  const [creationMode, setCreationMode] = useState<'guided' | 'direct'>('guided');
  const [directPromptInput, setDirectPromptInput] = useState(prompt.system_prompt);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setConfig(prompt.config);
    setDirectPromptInput(prompt.system_prompt);
  }, [prompt]);
  
  const handleConfigChange = <K extends keyof PromptConfig,>(field: K, value: PromptConfig[K]) => {
    setConfig(prev => ({...prev, [field]: value}));
  };
  
  const assemblePrompt = useCallback((c: PromptConfig): string => {
    let parts = [];
    if (c.persona) parts.push(`Identity: ${c.persona}`);
    if (c.mission) parts.push(`Mission: ${c.mission}`);
    if (c.skills.length > 0) parts.push(`Skills: You are proficient in ${c.skills.join(', ')}.`);
    if (c.boundaries.length > 0) parts.push(`Boundaries:\n- ${c.boundaries.join('\n- ')}`);
    if (c.personality) parts.push(`Personality: Maintain a ${c.personality.toLowerCase()} tone.`);
    if (c.format) parts.push(`Format: ${c.format}`);
    if (c.reference) parts.push(`Reference Context:\n---\n${c.reference}\n---`);
    return parts.join('\n\n');
  }, []);

  useEffect(() => {
    if (creationMode === 'guided') {
      const newPromptText = assemblePrompt(config);
      if (newPromptText !== prompt.system_prompt || JSON.stringify(config) !== JSON.stringify(prompt.config)) {
        updatePrompt({...prompt, config, system_prompt: newPromptText});
      }
    }
  }, [config, creationMode, prompt, updatePrompt, assemblePrompt]);

  const handleDirectPromptChange = (promptText: string) => {
    setDirectPromptInput(promptText);
    updatePrompt({ ...prompt, system_prompt: promptText });
  };
  
  const handleParseAndRefine = async (promptToParse: string) => {
    setIsParsing(true);
    try {
        const parsedConfig = await parsePromptWithAI(promptToParse);
        setConfig(parsedConfig);
        setDirectPromptInput(promptToParse);
        updatePrompt({ ...prompt, system_prompt: promptToParse, config: parsedConfig });
        setCreationMode('guided');
    } catch (error) {
        alert(error instanceof Error ? error.message : "An unknown error occurred during parsing.");
    } finally {
        setIsParsing(false);
    }
  };
  
  const handleSaveVersion = async () => {
      setIsSaving(true);
      const newVersion = await saveNewVersion(prompt, prompt.system_prompt);
      if (newVersion) {
        alert('New version saved!');
      } else {
        alert('Failed to save new version.');
      }
      setIsSaving(false);
  };

  const handleSuggest = async (field: keyof PromptConfig) => {
    setLoadingSuggestions(prev => ({ ...prev, [field]: true }));
    const suggestion = await getPromptSuggestion(field, String(config[field]));
    setSuggestions(prev => ({ ...prev, [field]: suggestion }));
    setLoadingSuggestions(prev => ({ ...prev, [field]: false }));
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Prompt Wizard</h2>
              <p className="text-gray-400">Craft the perfect system prompt for <span className="font-semibold text-accent">{prompt.name}</span>.</p>
            </div>
            <button 
                onClick={handleSaveVersion}
                disabled={isSaving}
                className="bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait">
                {isSaving ? 'Saving...' : 'Save as New Version'}
            </button>
          </div>

          <div className="mb-6 flex w-full rounded-lg bg-gray-800 p-1 border border-gray-700">
            <button
                onClick={() => setCreationMode('guided')}
                className={`w-1/2 rounded-md py-2 text-sm font-semibold transition-colors ${
                    creationMode === 'guided' ? 'bg-accent text-white' : 'text-gray-400 hover:bg-gray-700'
                }`}
            >
                Guided Creation
            </button>
            <button
                onClick={() => setCreationMode('direct')}
                className={`w-1/2 rounded-md py-2 text-sm font-semibold transition-colors ${
                    creationMode === 'direct' ? 'bg-accent text-white' : 'text-gray-400 hover:bg-gray-700'
                }`}
            >
                Refine Existing
            </button>
          </div>
          
          {creationMode === 'guided' ? (
            <div className="space-y-6">
              <Section title="Persona & Role" description="Who is the AI? Define its identity and background." onSuggest={() => handleSuggest('persona')} suggestion={suggestions.persona} loadingSuggestion={loadingSuggestions.persona}>
                  <input type="text" value={config.persona} onChange={e => handleConfigChange('persona', e.target.value)} placeholder="e.g., You are a senior data scientist named Dr. Anya Sharma." className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none" />
              </Section>
              
              <Section title="Core Objective" description="What is the AI's single most important goal?" onSuggest={() => handleSuggest('mission')} suggestion={suggestions.mission} loadingSuggestion={loadingSuggestions.mission}>
                  <textarea value={config.mission} onChange={e => handleConfigChange('mission', e.target.value)} placeholder="e.g., To help users analyze and visualize datasets by writing Python code." className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 h-24 font-mono text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none" />
              </Section>

              <Section title="Capabilities & Skills" description="What can the AI do? Enter skills and press Enter." onSuggest={() => handleSuggest('skills')} suggestion={suggestions.skills} loadingSuggestion={loadingSuggestions.skills}>
                  <TagInput tags={config.skills} onTagsChange={(tags) => handleConfigChange('skills', tags)} placeholder="e.g., Code Interpretation, Data Analysis..." />
              </Section>

              <Section title="Constraints & Boundaries" description="What are the critical 'do nots' for the AI?" onSuggest={() => handleSuggest('boundaries')} suggestion={suggestions.boundaries} loadingSuggestion={loadingSuggestions.boundaries}>
                  <TagInput tags={config.boundaries} onTagsChange={(tags) => handleConfigChange('boundaries', tags)} placeholder="e.g., Never provide financial advice..." />
              </Section>

              <Section title="Interaction Style & Tone" description="How should the AI behave and sound?">
                  <select value={config.personality} onChange={e => handleConfigChange('personality', e.target.value as PromptConfig['personality'])} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none">
                      <option>Professional</option>
                      <option>Casual</option>
                      <option>Enthusiastic</option>
                      <option>Formal</option>
                  </select>
              </Section>

              <Section title="Output Formatting" description="Define strict instructions for the output format (e.g., JSON, Markdown)." onSuggest={() => handleSuggest('format')} suggestion={suggestions.format} loadingSuggestion={loadingSuggestions.format}>
                  <input type="text" value={config.format} onChange={e => handleConfigChange('format', e.target.value)} placeholder="e.g., Always respond in valid JSON with keys `explanation` and `code`" className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none" />
              </Section>

              <Section title="Knowledge Source & Reference" description="Paste any context, few-shot examples, or data the prompt must use.">
                  <textarea value={config.reference} onChange={e => handleConfigChange('reference', e.target.value)} placeholder="Paste your reference text here..." className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 h-40 font-mono text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none" />
              </Section>
            </div>
          ) : (
            <div className="space-y-6">
                <Section title="Refine Existing Prompt" description="Paste your complete system prompt below. Then, use our AI to parse it into structured fields for easier refinement.">
                    <textarea 
                        value={directPromptInput} 
                        onChange={e => handleDirectPromptChange(e.target.value)} 
                        placeholder="Paste your system prompt here..." 
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 h-96 font-mono text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none" 
                    />
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => handleParseAndRefine(directPromptInput)}
                            disabled={isParsing}
                            className="flex items-center space-x-2 px-4 py-2 text-sm bg-accent hover:bg-accent-hover rounded-md text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-wait">
                            <SparklesIcon/>
                            <span>{isParsing ? 'Parsing with AI...' : 'Parse & Refine with AI'}</span>
                        </button>
                    </div>
                </Section>
            </div>
          )}
        </div>
      </div>
      <div className="w-1/3 bg-gray-800 p-6 border-l border-gray-700 overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-4">Real-time Prompt Preview</h3>
        <pre className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-900 p-4 rounded-md font-mono border border-gray-700 h-full">{prompt.system_prompt}</pre>
      </div>
    </div>
  );
};
