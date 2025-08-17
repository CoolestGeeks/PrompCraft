import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { WizardView } from './components/views/WizardView';
import { PlaygroundView } from './components/views/PlaygroundView';
import { LibraryView } from './components/views/LibraryView';
import { AuthView } from './components/auth/AuthView';
import type { Project, Agent, View } from './types';
import { LogoIcon } from './components/icons/LogoIcon';
import { supabase } from './supabaseConfig';
import type { Session } from '@supabase/supabase-js';
import * as db from './services/supabaseService';


const defaultPrompt = `Identity: You are a helpful assistant.

Mission: Your primary goal is to assist the user with their requests.

Skills: You are proficient in a wide range of topics.

Boundaries: 
- You must not engage in harmful or unethical discussions.

Personality: Maintain a professional and helpful tone.

Format: Respond in clear, easy-to-read text.`;


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('wizard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      setLoading(true);
      db.getProjectsForUser().then(data => {
        setProjects(data);
        if (data && data.length > 0) {
            const firstProject = data[0];
            setActiveProjectId(firstProject.id);
            if(firstProject.agents && firstProject.agents.length > 0) {
                setActiveAgentId(firstProject.agents[0].id);
            } else {
                setActiveAgentId(null);
            }
        } else {
            setActiveProjectId(null);
            setActiveAgentId(null);
        }
        setLoading(false);
      });
    } else if (!session) {
      setProjects(null);
      setActiveProjectId(null);
      setActiveAgentId(null);
    }
  }, [session]);

  const activeProject = projects?.find(p => p.id === activeProjectId);
  const activeAgent = activeProject?.agents.find(a => a.id === activeAgentId);

  const addProject = async (name: string) => {
    const newProject = await db.createProject(name);
    if (newProject) {
      setProjects(prev => (prev ? [...prev, newProject] : [newProject]));
      setActiveProjectId(newProject.id);
      setActiveAgentId(null);
    }
  };

  const addAgent = async (name: string) => {
    if (!activeProjectId) return;
    const newAgentData: Partial<Agent> = {
      name,
      systemPrompt: defaultPrompt,
      config: { persona: 'Helpful Assistant', mission: '', skills: [], boundaries: [], personality: 'Professional', format: '', reference: '' }
    };
    const newAgent = await db.createAgent(activeProjectId, newAgentData);
    if (newAgent) {
      setProjects(prev => prev!.map(p => p.id === activeProjectId ? { ...p, agents: [...p.agents, newAgent] } : p));
      setActiveAgentId(newAgent.id);
    }
  };

  const updateAgent = useCallback(async (updatedAgent: Agent) => {
     await db.updateAgent(updatedAgent.id, { system_prompt: updatedAgent.systemPrompt, config: updatedAgent.config });
     setProjects(prevProjects =>
      prevProjects!.map(p =>
        p.id === activeProjectId
          ? { ...p, agents: p.agents.map(a => a.id === activeAgentId ? updatedAgent : a) }
          : p
      )
    );
  }, [activeProjectId, activeAgentId]);
  
  const saveNewVersion = useCallback(async (agent: Agent, prompt: string) => {
    const newVersion = await db.addPromptVersion(agent.id, prompt);
    if (newVersion) {
        const updatedAgent = { ...agent, versions: [newVersion, ...agent.versions]};
        updateAgent(updatedAgent);
    }
    return newVersion;
  }, [updateAgent]);

  const deleteVersion = useCallback(async (versionId: string) => {
    await db.deletePromptVersion(versionId);
    if (activeAgent) {
      const updatedAgent = {...activeAgent, versions: activeAgent.versions.filter(v => v.id !== versionId)};
      updateAgent(updatedAgent);
    }
  }, [activeAgent, updateAgent]);


  const renderContent = () => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <LogoIcon className="w-24 h-24 mb-4 text-gray-600 animate-pulse"/>
                <h2 className="text-2xl font-bold">Loading your studio...</h2>
            </div>
        );
    }
    if (!activeProject || !activeAgent) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <LogoIcon className="w-24 h-24 mb-4 text-gray-600"/>
          <h2 className="text-2xl font-bold">Welcome to PromptCraft Studio</h2>
          <p className="mt-2">Select a project and agent, or create a new one to begin.</p>
        </div>
      );
    }
    switch (activeView) {
      case 'wizard':
        return <WizardView agent={activeAgent} updateAgent={updateAgent} saveNewVersion={saveNewVersion}/>;
      case 'playground':
        return <PlaygroundView agent={activeAgent} updateAgent={updateAgent} />;
      case 'library':
        return <LibraryView agent={activeAgent} updateAgent={updateAgent} deleteVersion={deleteVersion} />;
      default:
        return <WizardView agent={activeAgent} updateAgent={updateAgent} saveNewVersion={saveNewVersion}/>;
    }
  };

  if (!session) {
    return <AuthView />;
  }

  return (
    <div className="flex h-screen font-sans text-gray-200 bg-gray-900">
      <Sidebar
        projects={projects || []}
        activeProjectId={activeProjectId}
        activeAgentId={activeAgentId}
        onSelectProject={setActiveProjectId}
        onSelectAgent={setActiveAgentId}
        onAddProject={addProject}
        onAddAgent={addAgent}
        activeView={activeView}
        onSelectView={setActiveView}
        user={session.user}
      />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;