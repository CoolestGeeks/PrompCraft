import React, { useState } from 'react';
import type { Agent, PromptVersion } from '../../types';

interface LibraryViewProps {
  agent: Agent;
  updateAgent: (agent: Agent) => void;
  deleteVersion: (versionId: string) => Promise<void>;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ agent, updateAgent, deleteVersion }) => {
    const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(agent.versions[0] || null);

    const handleRestoreVersion = (versionId: string) => {
        const versionToRestore = agent.versions.find(v => v.id === versionId);
        if (versionToRestore && window.confirm("Are you sure you want to restore this version? This will become the current active prompt.")) {
            updateAgent({
                ...agent,
                systemPrompt: versionToRestore.prompt,
            });
            alert('Version restored! The change is now reflected in the wizard and playground.');
        }
    };
    
    const handleDeleteVersion = (versionId: string) => {
        if (agent.versions.length <= 1) {
            alert("Cannot delete the last remaining version.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this version? This action cannot be undone.")) {
            deleteVersion(versionId);
            const remainingVersions = agent.versions.filter(v => v.id !== versionId);
            setSelectedVersion(remainingVersions[0] || null);
        }
    };

    return (
        <div className="flex h-full">
            <div className="w-1/3 border-r border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">Version History</h2>
                    <p className="text-gray-400">Manage saved prompts for <span className="font-semibold text-accent">{agent.name}</span>.</p>
                </div>
                <ul className="overflow-y-auto flex-grow">
                    {agent.versions.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((version) => (
                        <li key={version.id}>
                            <button
                                onClick={() => setSelectedVersion(version)}
                                className={`w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800 transition-colors ${selectedVersion?.id === version.id ? 'bg-gray-800' : ''}`}
                            >
                                <p className="font-semibold">{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(version.createdAt))}</p>
                                <p className="text-xs text-gray-400 truncate mt-1 font-mono">{version.prompt}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
                {selectedVersion ? (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-xl font-bold">
                                    Version from {new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'long' }).format(new Date(selectedVersion.createdAt))}
                                </h3>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleRestoreVersion(selectedVersion.id)} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">Restore Version</button>
                                <button onClick={() => handleDeleteVersion(selectedVersion.id)} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-md transition-colors">Delete</button>
                            </div>
                        </div>
                        <pre className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-800 p-6 rounded-md font-mono border border-gray-700 h-full">
                            {selectedVersion.prompt}
                        </pre>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>No version selected or no versions available.</p>
                    </div>
                )}
            </div>
        </div>
    );
};