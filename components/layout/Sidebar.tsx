import React, { useState } from 'react';
import type { Project, View } from '../../types';
import { LogoIcon } from '../icons/LogoIcon';
import { WizardIcon } from '../icons/WizardIcon';
import { PlaygroundIcon } from '../icons/PlaygroundIcon';
import { LibraryIcon } from '../icons/LibraryIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../supabaseConfig';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  activeAgentId: string | null;
  onSelectProject: (id: string) => void;
  onSelectAgent: (id: string) => void;
  onAddProject: (name: string) => void;
  onAddAgent: (name: string) => void;
  activeView: View;
  onSelectView: (view: View) => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  activeAgentId,
  onSelectProject,
  onSelectAgent,
  onAddProject,
  onAddAgent,
  activeView,
  onSelectView,
  user
}) => {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');

  const handleAddNewProject = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setIsAddingProject(false);
    }
  };
  
  const handleAddNewAgent = () => {
    if (newAgentName.trim()) {
      onAddAgent(newAgentName.trim());
      setNewAgentName('');
      setIsAddingAgent(false);
    }
  };

  const handleCancelAddProject = () => {
    setIsAddingProject(false);
    setNewProjectName('');
  };

  const handleCancelAddAgent = () => {
    setIsAddingAgent(false);
    setNewAgentName('');
  };

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'wizard', label: 'Prompt Wizard', icon: <WizardIcon /> },
    { id: 'playground', label: 'Playground', icon: <PlaygroundIcon /> },
    { id: 'library', label: 'Version History', icon: <LibraryIcon /> },
  ];

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700 flex items-center space-x-2">
        <LogoIcon className="w-8 h-8 text-accent" />
        <h1 className="text-xl font-bold text-white">PromptCraft</h1>
      </div>

      <div className="p-4 flex-grow overflow-y-auto">
        {/* Projects Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Projects</h2>
            <button onClick={() => setIsAddingProject(true)} className="text-gray-400 hover:text-white transition-colors" aria-label="Add new project"><PlusIcon/></button>
          </div>
          {isAddingProject && (
            <div className="p-1 mb-2 bg-gray-800 rounded-md">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="New project name..."
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-1.5 text-sm outline-none focus:ring-1 focus:ring-accent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNewProject();
                  if (e.key === 'Escape') handleCancelAddProject();
                }}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button onClick={handleCancelAddProject} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded">Cancel</button>
                <button onClick={handleAddNewProject} className="text-xs bg-accent text-white hover:bg-accent-hover px-2 py-1 rounded font-semibold">Add</button>
              </div>
            </div>
          )}
          {projects.map(project => (
            <div key={project.id}>
              <button
                onClick={() => onSelectProject(project.id)}
                className={`w-full text-left p-2 rounded flex justify-between items-center ${activeProjectId === project.id ? 'bg-accent text-white' : 'hover:bg-gray-700'}`}
              >
                <span>{project.name}</span>
                <ChevronDownIcon className={`transform transition-transform ${activeProjectId === project.id ? 'rotate-180' : ''}`} />
              </button>
              {activeProjectId === project.id && (
                <div className="pl-4 mt-2">
                   <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase">Agents</h3>
                    <button onClick={() => setIsAddingAgent(true)} className={`text-gray-400 transition-colors ${activeProjectId === project.id ? 'hover:text-white' : 'hover:text-gray-200'}`} aria-label="Add new agent"><PlusIcon /></button>
                  </div>
                  {isAddingAgent && (
                     <div className="p-1 mb-2 bg-gray-800 rounded-md">
                      <input
                        type="text"
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        placeholder="New agent name..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-1.5 text-sm outline-none focus:ring-1 focus:ring-accent"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNewAgent();
                          if (e.key === 'Escape') handleCancelAddAgent();
                        }}
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={handleCancelAddAgent} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded">Cancel</button>
                        <button onClick={handleAddNewAgent} className="text-xs bg-accent text-white hover:bg-accent-hover px-2 py-1 rounded font-semibold">Add</button>
                      </div>
                    </div>
                  )}
                  {project.agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => onSelectAgent(agent.id)}
                      className={`w-full text-left p-2 text-sm rounded ${activeAgentId === agent.id ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
                    >
                      {agent.name}
                    </button>
                  ))}
                   {project.agents.length === 0 && !isAddingAgent && <p className="text-xs text-gray-500 p-2">No agents yet.</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Section */}
        {activeAgentId && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Studio</h2>
            <ul className="space-y-1">
              {navItems.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => onSelectView(item.id)}
                    className={`flex items-center w-full p-2 rounded transition-colors ${activeView === item.id ? 'bg-accent text-white' : 'hover:bg-gray-700'}`}
                  >
                    <span className="w-5 h-5 mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
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