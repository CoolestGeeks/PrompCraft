import React, { useState } from 'react';
import type { PromptLibrary, View } from '../../types';
import { LogoIcon } from '../icons/LogoIcon';
import { WizardIcon } from '../icons/WizardIcon';
import { PlaygroundIcon } from '../icons/PlaygroundIcon';
import { LibraryIcon } from '../icons/LibraryIcon';
import { TeamIcon } from '../icons/TeamIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../supabaseConfig';
import { MinusCircleIcon } from '../icons/MinusCircleIcon';

interface SidebarProps {
  promptLibraries: PromptLibrary[];
  activeLibraryId: string | null;
  activePromptId: string | null;
  onSelectLibrary: (id: string) => void;
  onSelectPrompt: (id: string) => void;
  onAddLibrary: (name: string) => void;
  onAddPrompt: (name: string) => void;
  onDeleteLibrary: (id: string) => void;
  activeView: View;
  onSelectView: (view: View) => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  promptLibraries,
  activeLibraryId,
  activePromptId,
  onSelectLibrary,
  onSelectPrompt,
  onAddLibrary,
  onAddPrompt,
  onDeleteLibrary,
  activeView,
  onSelectView,
  user
}) => {
  const [isAddingLibrary, setIsAddingLibrary] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState('');
  const [isAddingPrompt, setIsAddingPrompt] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');

  const handleAddNewLibrary = () => {
    if (newLibraryName.trim()) {
      onAddLibrary(newLibraryName.trim());
      setNewLibraryName('');
      setIsAddingLibrary(false);
    }
  };
  
  const handleAddNewPrompt = () => {
    if (newPromptName.trim()) {
      onAddPrompt(newPromptName.trim());
      setNewPromptName('');
      setIsAddingPrompt(false);
    }
  };

  const handleCancelAddLibrary = () => {
    setIsAddingLibrary(false);
    setNewLibraryName('');
  };

  const handleCancelAddPrompt = () => {
    setIsAddingPrompt(false);
    setNewPromptName('');
  };

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'wizard', label: 'Prompt Wizard', icon: <WizardIcon /> },
    { id: 'playground', label: 'Playground', icon: <PlaygroundIcon /> },
    { id: 'library', label: 'Prompt Library', icon: <LibraryIcon /> },
    { id: 'team', label: 'Team', icon: <TeamIcon /> },
  ];
  
  const studioViews: View[] = ['wizard', 'playground', 'library'];

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700 flex items-center space-x-2">
        <LogoIcon className="w-8 h-8 text-accent" />
        <h1 className="text-xl font-bold text-white">PromptCraft</h1>
      </div>

      <div className="p-4 flex-grow overflow-y-auto">
        {/* Libraries Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Libraries</h2>
            <button onClick={() => setIsAddingLibrary(true)} className="text-gray-400 hover:text-white transition-colors" aria-label="Add new library"><PlusIcon/></button>
          </div>
          {isAddingLibrary && (
            <div className="p-1 mb-2 bg-gray-700 rounded-md">
              <input
                type="text"
                value={newLibraryName}
                onChange={(e) => setNewLibraryName(e.target.value)}
                placeholder="New library name..."
                className="w-full bg-gray-900 border border-gray-600 rounded-md p-1.5 text-sm outline-none focus:ring-1 focus:ring-accent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNewLibrary();
                  if (e.key === 'Escape') handleCancelAddLibrary();
                }}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button onClick={handleCancelAddLibrary} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded">Cancel</button>
                <button onClick={handleAddNewLibrary} className="text-xs bg-accent text-white hover:bg-accent-hover px-2 py-1 rounded font-semibold">Add</button>
              </div>
            </div>
          )}
          {promptLibraries.map(library => (
            <div key={library.id}>
              <div className="group relative">
                <button
                  onClick={() => onSelectLibrary(library.id)}
                  className={`w-full text-left p-2 rounded flex justify-between items-center ${activeLibraryId === library.id ? 'bg-gray-700 text-white' : 'hover:bg-gray-700/50'}`}
                >
                  <span className="truncate pr-8">{library.name}</span>
                  <ChevronDownIcon className={`transform transition-transform ${activeLibraryId === library.id ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteLibrary(library.id); }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label={`Delete library ${library.name}`}
                  title={`Delete library ${library.name}`}
                >
                  <MinusCircleIcon />
                </button>
              </div>
              {activeLibraryId === library.id && (
                <div className="pl-4 mt-2">
                   <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase">Prompts</h3>
                    <button onClick={() => setIsAddingPrompt(true)} className={`text-gray-400 transition-colors ${activeLibraryId === library.id ? 'hover:text-white' : 'hover:text-gray-200'}`} aria-label="Add new prompt"><PlusIcon /></button>
                  </div>
                  {isAddingPrompt && (
                     <div className="p-1 mb-2 bg-gray-700 rounded-md">
                      <input
                        type="text"
                        value={newPromptName}
                        onChange={(e) => setNewPromptName(e.target.value)}
                        placeholder="New prompt name..."
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-1.5 text-sm outline-none focus:ring-1 focus:ring-accent"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNewPrompt();
                          if (e.key === 'Escape') handleCancelAddPrompt();
                        }}
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={handleCancelAddPrompt} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded">Cancel</button>
                        <button onClick={handleAddNewPrompt} className="text-xs bg-accent text-white hover:bg-accent-hover px-2 py-1 rounded font-semibold">Add</button>
                      </div>
                    </div>
                  )}
                  {library.prompts.map(prompt => (
                    <button
                      key={prompt.id}
                      onClick={() => onSelectPrompt(prompt.id)}
                      className={`w-full text-left p-2 text-sm rounded ${activePromptId === prompt.id ? 'bg-accent text-white' : 'hover:bg-gray-700'}`}
                    >
                      {prompt.name}
                    </button>
                  ))}
                   {library.prompts.length === 0 && !isAddingPrompt && <p className="text-xs text-gray-500 p-2">No prompts yet.</p>}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</h2>
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => onSelectView(item.id)}
                  className={`flex items-center w-full p-2 rounded transition-colors ${activeView === item.id ? 'bg-accent text-white' : 'hover:bg-gray-700'} ${studioViews.includes(item.id) && !activePromptId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={studioViews.includes(item.id) && !activePromptId}
                >
                  <span className="w-5 h-5 mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        <p className="truncate" title={user?.email}>{user?.email}</p>
        <button onClick={() => supabase.auth.signOut()} className="w-full mt-2 text-center text-sm bg-gray-700 hover:bg-gray-600 rounded py-1.5 transition-colors">
            Sign Out
        </button>
      </div>
    </div>
  );
};