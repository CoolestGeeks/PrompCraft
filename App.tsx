import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { WizardView } from './components/views/WizardView';
import { PlaygroundView } from './components/views/PlaygroundView';
import { LibraryView } from './components/views/LibraryView';
import { TeamView } from './components/views/TeamView';
import { AuthView } from './components/auth/AuthView';
import type { PromptLibrary, Prompt, View, PromptVersion, PromptConfig } from './types';
import { LogoIcon } from './components/icons/LogoIcon';
import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseConfig';
import type { Session } from '@supabase/supabase-js';
import * as db from './services/supabaseService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigWarning } from './components/auth/ConfigWarning';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const AppContainer: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [promptLibraries, setPromptLibraries] = useState<PromptLibrary[] | null>(null);
  
  const [activeLibraryId, setActiveLibraryId] = useState<string | null>(null);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('wizard');
  
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (supabaseUrl.includes('your-project-ref') || supabaseAnonKey.includes('your-public-anon-key')) {
      setIsConfigured(false);
    } else {
      setIsConfigured(true);
    }
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        localStorage.clear();
        setPromptLibraries(null);
        setActiveLibraryId(null);
        setActivePromptId(null);
        setActiveView('wizard');
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setPromptLibraries(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const libraries = await db.getLibrariesForUser();
      
      setPromptLibraries(libraries);
      
      const savedLibraryId = localStorage.getItem('activeLibraryId');
      const savedPromptId = localStorage.getItem('activePromptId');
      const savedView = localStorage.getItem('activeView');

      const currentLibraryId = (savedLibraryId && libraries.some(l => l.id === savedLibraryId)) ? savedLibraryId : (libraries[0]?.id || null);
      setActiveLibraryId(currentLibraryId);

      const currentLibrary = libraries.find(l => l.id === currentLibraryId);
      const currentPromptId = (savedPromptId && currentLibrary?.prompts.some(p => p.id === savedPromptId)) ? savedPromptId : (currentLibrary?.prompts[0]?.id || null);
      setActivePromptId(currentPromptId);
      
      if (savedView) {
        setActiveView(savedView as View);
      }

    } catch (error) {
      alert(`Error initializing data: ${error instanceof Error ? error.message : String(error)}`);
      setPromptLibraries([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (isConfigured && session) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [session, isConfigured, loadData]);


  useEffect(() => {
    if (activeLibraryId) localStorage.setItem('activeLibraryId', activeLibraryId);
    if (activePromptId) localStorage.setItem('activePromptId', activePromptId);
    if (activeView) localStorage.setItem('activeView', activeView);
  }, [activeLibraryId, activePromptId, activeView]);


  const handleSelectLibrary = (id: string) => {
    setActiveLibraryId(id);
    const library = promptLibraries?.find(p => p.id === id);
    setActivePromptId(library?.prompts[0]?.id || null);
    setActiveView('wizard');
  };

  const activeLibrary = promptLibraries?.find(p => p.id === activeLibraryId);
  const activePrompt = activeLibrary?.prompts.find(a => a.id === activePromptId);

  const addLibrary = async (name: string) => {
    const team = await db.getTeamForUser();
    if (!team) {
        alert("Cannot add library: no active team found.");
        return;
    }
    try {
        const newLibrary = await db.createLibrary(name, team.id);
        if (newLibrary) {
          setPromptLibraries(prev => (prev ? [...prev, newLibrary] : [newLibrary]));
          setActiveLibraryId(newLibrary.id);
          setActivePromptId(null);
        }
    } catch (error) {
        alert(`Error creating library: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const addPrompt = async (name: string) => {
    if (!activeLibraryId) return;
    try {
        const newPrompt = await db.createPrompt(activeLibraryId, name);
        if (newPrompt) {
          await loadData(); // Reload all data to ensure consistency
          setActivePromptId(newPrompt.id);
        }
    } catch(error){
        alert(`Error creating prompt: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const deleteLibrary = async (libraryId: string) => {
    const libraryToDelete = promptLibraries?.find(l => l.id === libraryId);
    if (!libraryToDelete) return;

    if (window.confirm(`Are you sure you want to delete the library "${libraryToDelete.name}"? This will also delete all prompts within it.`)) {
        try {
            await db.deleteLibrary(libraryId);
            setPromptLibraries(prev => {
                const newLibraries = prev!.filter(l => l.id !== libraryId);
                // If the deleted library was active, select a new one
                if (activeLibraryId === libraryId) {
                    const newActiveLibraryId = newLibraries.length > 0 ? newLibraries[0].id : null;
                    setActiveLibraryId(newActiveLibraryId);
                    if (newActiveLibraryId) {
                        const newActiveLibrary = newLibraries.find(l => l.id === newActiveLibraryId);
                        setActivePromptId(newActiveLibrary?.prompts[0]?.id || null);
                    } else {
                        setActivePromptId(null);
                    }
                }
                return newLibraries;
            });
        } catch (error) {
            alert(`Error deleting library: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
  };

  const updatePrompt = useCallback(async (updatedPrompt: Prompt) => {
     await db.updatePrompt(updatedPrompt.id, { system_prompt: updatedPrompt.system_prompt, config: updatedPrompt.config });
     setPromptLibraries(prevLibraries =>
      prevLibraries!.map(p =>
        p.id === activeLibraryId
          ? { ...p, prompts: p.prompts.map(a => a.id === activePromptId ? updatedPrompt : a) }
          : p
      )
    );
  }, [activeLibraryId, activePromptId]);
  
  const saveNewVersion = useCallback(async (prompt: Prompt, promptText: string): Promise<PromptVersion | null> => {
    const newVersion = await db.addPromptVersion(prompt.id, promptText);
    if (newVersion) {
        const updatedPrompt = { ...prompt, versions: [newVersion, ...prompt.versions]};
        updatePrompt(updatedPrompt);
    }
    return newVersion;
  }, [updatePrompt]);

  const renderContent = () => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <LogoIcon className="w-24 h-24 mb-4 text-gray-600 animate-pulse"/>
                <h2 className="text-2xl font-bold">Loading your studio...</h2>
            </div>
        );
    }
    if (activeView === 'team') {
        return <TeamView />;
    }
    if (!activeLibrary || !activePrompt) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <LogoIcon className="w-24 h-24 mb-4 text-gray-600"/>
          <h2 className="text-2xl font-bold">Welcome to PromptCraft Studio</h2>
          <p className="mt-2">Create a new library and prompt to begin.</p>
        </div>
      );
    }
    switch (activeView) {
      case 'wizard':
        return <WizardView prompt={activePrompt} updatePrompt={updatePrompt} saveNewVersion={saveNewVersion}/>;
      case 'playground':
        return <PlaygroundView prompt={activePrompt} updatePrompt={updatePrompt} />;
      case 'library':
        return <LibraryView prompt={activePrompt} updatePrompt={updatePrompt} onSelectView={setActiveView} />;
      default:
        return <WizardView prompt={activePrompt} updatePrompt={updatePrompt} saveNewVersion={saveNewVersion}/>;
    }
  };
  
  if (!isConfigured) {
    return <ConfigWarning />;
  }

  if (!session) {
    return <AuthView />;
  }

  return (
    <div className="flex h-screen font-sans text-gray-200 bg-gray-900">
      <Sidebar
        promptLibraries={promptLibraries || []}
        activeLibraryId={activeLibraryId}
        activePromptId={activePromptId}
        onSelectLibrary={handleSelectLibrary}
        onSelectPrompt={setActivePromptId}
        onAddLibrary={addLibrary}
        onAddPrompt={addPrompt}
        onDeleteLibrary={deleteLibrary}
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

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AppContainer />
  </QueryClientProvider>
);

export default App;