import React, { useMemo, useState, useEffect } from 'react';
import type { Prompt, View } from '../../types';
import * as api from '../../services/promptLibrary.supabase';
import type { PromptCategory, PromptTemplate } from '../../services/promptLibrary.supabase';
import { SparklesIcon } from '../icons/SparklesIcon';

interface LibraryViewProps {
  prompt: Prompt;
  updatePrompt: (prompt: Prompt) => void;
  onSelectView: (view: View) => void;
  canManage?: boolean;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  prompt,
  updatePrompt,
  onSelectView,
  canManage = true,
}) => {
  const [categories, setCategories] = useState<api.PromptCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedApp, setSelectedApp] = useState<api.PromptCategory | null>(null);

  const refreshLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      const cats = await api.fetchAccessibleLibrariesWithPrompts();
      setCategories(cats);

      if (selectedApp) {
        const updatedSelected = cats.find(c => c.id === selectedApp.id);
        setSelectedApp(updatedSelected || (cats.length > 0 ? cats[0] : null));
      } else if (cats.length > 0) {
        setSelectedApp(cats[0]);
      } else {
        setSelectedApp(null);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load library prompts.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLibrary();
  }, []);

  const [showNewCat, setShowNewCat] = useState(false);
  const [showRenameCat, setShowRenameCat] = useState<null | { name: string }>(null);
  const [showDeleteCat, setShowDeleteCat] = useState<null | { name: string }>(null);

  const [showNewPrompt, setShowNewPrompt] = useState(false);
  const [showEditPrompt, setShowEditPrompt] = useState<null | PromptTemplate>(null);
  const [deletePromptName, setDeletePromptName] = useState<null | string>(null);

  const handleUsePrompt = (promptText: string) => {
    if (window.confirm('Are you sure you want to use this prompt? It will replace the current content in the Prompt Wizard.')) {
      updatePrompt({ ...prompt, system_prompt: promptText });
      onSelectView('wizard');
    }
  };

  const createCategory = async (name: string) => {
    if (!name.trim()) return;
    if (categories.some(c => c.app.toLowerCase() === name.toLowerCase())) {
      alert('A category with this name already exists.');
      return;
    }
    await api.onCreateCategory(name);
    await refreshLibrary();
  };

  const renameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim()) return;
    if (oldName === newName) return;
    if (categories.some(c => c.app.toLowerCase() === newName.toLowerCase())) {
      alert('A category with this name already exists.');
      return;
    }
    await api.onRenameCategory(oldName, newName);
    await refreshLibrary();
  };

  const deleteCategory = async (name: string) => {
    if (!window.confirm(`Delete category "${name}" and all its prompts?`)) return;
    await api.onDeleteCategory(name);
    await refreshLibrary();
  };

  const createPrompt = async (tmpl: PromptTemplate) => {
    if (!selectedApp) return;
    if (selectedApp.templates.some(t => t.usecase.toLowerCase() === tmpl.usecase.toLowerCase())) {
      alert('A prompt with this name already exists in this category.');
      return;
    }
    await api.onCreatePrompt(selectedApp.app, tmpl);
    await refreshLibrary();
  };

  const updatePromptTmpl = async (oldUsecase: string, updated: PromptTemplate) => {
    if (!selectedApp) return;
    await api.onUpdatePrompt(selectedApp.app, oldUsecase, updated);
    await refreshLibrary();
  };

  const deletePromptTmpl = async (usecase: string) => {
    if (!selectedApp) return;
    if (!window.confirm(`Delete prompt "${usecase}"?`)) return;
    await api.onDeletePrompt(selectedApp.app, usecase);
    await refreshLibrary();
  };

  return (
    <div className="flex h-full">
      {/* Left rail: Categories */}
      <div className="w-1/4 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Prompt Library</h2>
            <p className="text-gray-400 mt-1">Explore and use system prompts from various AI applications.</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowNewCat(true)}
              className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-200"
              title="Add category"
            >
              <PlusIcon />
            </button>
          )}
        </div>
        <ul className="overflow-y-auto flex-grow">
          {loading && <li className="p-4 text-gray-400">Loading libraries...</li>}
          {error && <li className="p-4 text-red-400">Error: {error}</li>}
          {!loading && !error && categories.map((category) => (
            <li key={category.id} className="group">
              <button
                onClick={() => setSelectedApp(category)}
                className={`w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800 transition-colors ${selectedApp?.id === category.id ? 'bg-accent text-white' : 'text-gray-300'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{category.app}</p>
                    <p className="text-xs text-gray-400 mt-1">{category.templates.length} prompts</p>
                  </div>
                  {canManage && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <IconButton title="Rename" onClick={(e) => { e.stopPropagation(); setShowRenameCat({ name: category.app }); }}>
                        <PencilIcon />
                      </IconButton>
                      <IconButton title="Delete" onClick={(e) => { e.stopPropagation(); setShowDeleteCat({ name: category.app }); }}>
                        <TrashIcon />
                      </IconButton>
                    </div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main: Prompts in selected category */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedApp ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">{selectedApp.app} Prompts</h3>
              {canManage && (
                <button
                  onClick={() => setShowNewPrompt(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-700 hover:bg-gray-800 text-gray-200 text-sm"
                >
                  <PlusIcon />
                  Add Prompt
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {selectedApp.templates.map((template) => (
                <div key={template.usecase} className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
                  <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h4 className="font-semibold text-white">{template.usecase}</h4>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <IconButton title="Edit" onClick={() => setShowEditPrompt(template)}>
                          <PencilIcon />
                        </IconButton>
                        <IconButton title="Delete" onClick={() => setDeletePromptName(template.usecase)}>
                          <TrashIcon />
                        </IconButton>
                      </div>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-gray-300 bg-gray-900/50 p-4 font-mono flex-grow overflow-auto h-96">
                    {template.prompt}
                  </pre>
                  <div className="p-4 border-t border-gray-700 bg-gray-800">
                    <button
                      onClick={() => handleUsePrompt(template.prompt)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm bg-accent hover:bg-accent-hover rounded-md text-white font-semibold transition-colors"
                    >
                      <SparklesIcon />
                      <span>Use Prompt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {loading ? <p>Loading...</p> : <p>Select an application to view its prompts, or create one.</p>}
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      {showNewCat && (
        <Modal title="Create Category" onClose={() => setShowNewCat(false)}>
          <CategoryForm
            initialName=""
            onSubmit={async (name) => { await createCategory(name); setShowNewCat(false); }}
            submitLabel="Create"
          />
        </Modal>
      )}

      {showRenameCat && (
        <Modal title="Rename Category" onClose={() => setShowRenameCat(null)}>
          <CategoryForm
            initialName={showRenameCat.name}
            onSubmit={async (name) => { await renameCategory(showRenameCat.name, name); setShowRenameCat(null); }}
            submitLabel="Rename"
          />
        </Modal>
      )}

      {showDeleteCat && (
        <Confirm
          title="Delete Category"
          message={`This will delete "${showDeleteCat.name}" and all its prompts. Are you sure?`}
          onCancel={() => setShowDeleteCat(null)}
          onConfirm={async () => { await deleteCategory(showDeleteCat.name); setShowDeleteCat(null); }}
        />
      )}

      {showNewPrompt && (
        <Modal title="Add Prompt" onClose={() => setShowNewPrompt(false)}>
          <PromptForm
            initial={{ usecase: '', prompt: '' }}
            onSubmit={async (val) => { await createPrompt(val); setShowNewPrompt(false); }}
            submitLabel="Add"
          />
        </Modal>
      )}

      {showEditPrompt && (
        <Modal title="Edit Prompt" onClose={() => setShowEditPrompt(null)}>
          <PromptForm
            initial={showEditPrompt}
            onSubmit={async (val) => { await updatePromptTmpl(showEditPrompt.usecase, val); setShowEditPrompt(null); }}
            submitLabel="Save"
          />
        </Modal>
      )}

      {deletePromptName && (
        <Confirm
          title="Delete Prompt"
          message={`Delete prompt "${deletePromptName}"?`}
          onCancel={() => setDeletePromptName(null)}
          onConfirm={async () => { await deletePromptTmpl(deletePromptName); setDeletePromptName(null); }}
        />
      )}
    </div>
  );
};

// =============================
// UI helpers (no external deps)
// =============================

const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...rest }) => (
  <button
    className={`inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-700 hover:bg-gray-800 text-gray-300 ${className}`}
    {...rest}
  >
    {children}
  </button>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/60" onClick={onClose} />
    <div className="relative w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 shadow-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-semibold">{title}</h4>
        <button className="text-gray-400 hover:text-gray-200" onClick={onClose} aria-label="Close">
          <XIcon />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Confirm: React.FC<{ title: string; message: string; onCancel: () => void; onConfirm: () => void }> = ({ title, message, onCancel, onConfirm }) => (
  <Modal title={title} onClose={onCancel}>
    <p className="text-sm text-gray-300 mb-4">{message}</p>
    <div className="flex justify-end gap-2">
      <button className="px-3 py-2 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800" onClick={onCancel}>Cancel</button>
      <button className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm}>Delete</button>
    </div>
  </Modal>
);

const CategoryForm: React.FC<{ initialName: string; onSubmit: (name: string) => void; submitLabel: string }> = ({ initialName, onSubmit, submitLabel }) => {
  const [name, setName] = useState(initialName);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(name.trim()); }}>
      <label className="block text-sm text-gray-300 mb-1">Category name</label>
      <input
        autoFocus
        className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 mb-4"
        placeholder="e.g., Growth"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="flex justify-end">
        <button className="px-3 py-2 rounded-md bg-accent hover:bg-accent-hover text-white" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
};

const PromptForm: React.FC<{ initial: PromptTemplate; onSubmit: (val: PromptTemplate) => void; submitLabel: string }> = ({ initial, onSubmit, submitLabel }) => {
  const [usecase, setUsecase] = useState(initial.usecase);
  const [text, setText] = useState(initial.prompt);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ usecase: usecase.trim(), prompt: text }); }}>
      <div className="mb-3">
        <label className="block text-sm text-gray-300 mb-1">Prompt name</label>
        <input
          autoFocus
          className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500"
          placeholder="e.g., Enterprise Prompt"
          value={usecase}
          onChange={(e) => setUsecase(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">System prompt</label>
        <textarea
          className="w-full h-48 px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500"
          placeholder="Paste your system prompt here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button className="px-3 py-2 rounded-md bg-accent hover:bg-accent-hover text-white" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
};

// ---------------- Icons (inline, no external deps) ----------------
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m1 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.3 6.3l5.4 5.4M4 20l4.2-1.1a2 2 0 00.9-.5l9.4-9.4a2 2 0 000-2.8L16.8 3.5a2 2 0 00-2.8 0L4.6 13a2 2 0 00-.5.9L3 18.2V20h1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
