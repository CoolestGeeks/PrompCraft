
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Prompt, ChatMessage } from '../../types';
import { generateChatResponseStream } from '../../services/geminiService';
import { SendIcon } from '../icons/SendIcon';
import { PaperclipIcon } from '../icons/PaperclipIcon';
import { BotIcon } from '../icons/BotIcon';
import { UserIcon } from '../icons/UserIcon';
import { ThumbsUpIcon } from '../icons/ThumbsUpIcon';
import { ThumbsDownIcon } from '../icons/ThumbsDownIcon';

interface PlaygroundViewProps {
  prompt: Prompt;
  updatePrompt: (prompt: Prompt) => void;
}

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0"><BotIcon/></div>}
            <div className={`max-w-xl p-4 rounded-lg ${isUser ? 'bg-accent text-white' : 'bg-gray-700'}`}>
                {message.image && <img src={message.image} alt="user upload" className="max-w-xs rounded-md mb-2"/>}
                <p className="whitespace-pre-wrap">{message.text}</p>
                 {!isUser && (
                     <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-600/50">
                        <button className="text-gray-400 hover:text-white"><ThumbsUpIcon/></button>
                        <button className="text-gray-400 hover:text-white"><ThumbsDownIcon/></button>
                     </div>
                 )}
            </div>
             {isUser && <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0"><UserIcon/></div>}
        </div>
    );
};

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({ prompt, updatePrompt }) => {
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState(prompt.system_prompt);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentSystemPrompt(prompt.system_prompt);
  }, [prompt.system_prompt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() && !image) return;

    const userMessage: ChatMessage = { role: 'user', text: userInput, image: image || undefined };
    setHistory(prev => [...prev, userMessage]);
    setUserInput('');
    setImage(null);
    setIsLoading(true);

    const modelMessage: ChatMessage = { role: 'model', text: '' };
    setHistory(prev => [...prev, modelMessage]);

    try {
        const stream = generateChatResponseStream(currentSystemPrompt, history, userMessage);
        for await (const chunk of stream) {
            setHistory(prev => prev.map((msg, index) => 
                index === prev.length - 1 ? { ...msg, text: msg.text + chunk } : msg
            ));
        }
    } catch (error) {
        setHistory(prev => prev.map((msg, index) => 
            index === prev.length - 1 ? { ...msg, text: "An error occurred." } : msg
        ));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Panel: Config */}
      <div className="w-1/4 bg-gray-800 p-6 flex flex-col border-r border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">System Prompt</h3>
        <p className="text-xs text-gray-400 mb-2">You can edit the prompt here for this session. Changes won't be saved automatically.</p>
        <textarea
          value={currentSystemPrompt}
          onChange={(e) => setCurrentSystemPrompt(e.target.value)}
          className="w-full flex-grow bg-gray-900 border border-gray-600 rounded-md p-2 font-mono text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
        />
      </div>

      {/* Middle Panel: Chat */}
      <div className="flex-1 flex flex-col bg-gray-900">
        <div className="flex-grow p-6 overflow-y-auto">
            <div className="space-y-6">
                {history.length === 0 && (
                    <div className="text-center text-gray-500 pt-20">
                        <BotIcon className="w-16 h-16 mx-auto mb-4"/>
                        <h3 className="text-xl font-bold">Testing Playground</h3>
                        <p>Start a conversation to test your prompt.</p>
                    </div>
                )}
                {history.map((msg, i) => <ChatBubble key={i} message={msg}/>)}
                <div ref={chatEndRef} />
            </div>
        </div>
        <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleSubmit} className="relative">
                {image && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-700 rounded-md">
                        <img src={image} alt="preview" className="h-20 w-20 object-cover rounded"/>
                        <button type="button" onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6">&times;</button>
                    </div>
                )}
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                    }
                  }}
                  placeholder={`Chat with ${prompt.name}...`}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md p-3 pr-24 resize-none focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  rows={2}
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden"/>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white" disabled={isLoading}><PaperclipIcon/></button>
                    <button type="submit" className="p-2 bg-accent rounded-md text-white hover:bg-accent-hover disabled:bg-gray-600" disabled={isLoading || (!userInput.trim() && !image)}><SendIcon/></button>
                </div>
            </form>
        </div>
      </div>
      
      {/* Right Panel: Inspector */}
      <div className="w-1/4 bg-gray-800 p-6 border-l border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Inspector</h3>
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Model</label>
                <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none">
                    <option>gemini-2.5-flash</option>
                    <option disabled>gpt-4o (coming soon)</option>
                    <option disabled>claude-3.5-sonnet (coming soon)</option>
                </select>
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2">Temperature: {temperature}</label>
                 <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent" />
            </div>
            <div className="text-sm text-gray-400 border-t border-gray-700 pt-4">
                <h4 className="font-semibold text-gray-200 mb-2">Session Info</h4>
                <p>Token Usage: <span className="text-white">N/A</span></p>
                <p>Latency: <span className="text-white">N/A</span></p>
                <p>Message Count: <span className="text-white">{history.length}</span></p>
            </div>
             <button onClick={() => setHistory([])} className="w-full mt-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">Clear Session</button>
        </div>
      </div>
    </div>
  );
};
