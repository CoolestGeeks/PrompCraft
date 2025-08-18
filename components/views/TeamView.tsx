
import React, { useState, useEffect } from 'react';
import { PlusIcon } from '../icons/PlusIcon';
import { UserIcon } from '../icons/UserIcon';
import type { Team, TeamMember } from '../../types';
import * as db from '../../services/supabaseService';

export const TeamView: React.FC = () => {
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeamData = async () => {
            setLoading(true);
            const currentTeam = await db.getTeamForUser();
            setTeam(currentTeam);
            if (currentTeam) {
                const teamMembers = await db.getMembersForTeam(currentTeam.id);
                if (teamMembers) {
                    setMembers(teamMembers);
                }
            }
            setLoading(false);
        };
        fetchTeamData();
    }, []);

    const handleInvite = async () => {
        if (!team || !inviteEmail.trim()) return;
        try {
            await db.createInvite(team.id, inviteEmail.trim(), inviteRole);
            alert(`Invitation sent to ${inviteEmail}`);
            setIsInviteModalOpen(false);
            setInviteEmail('');
        } catch (error) {
            alert(`Failed to send invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    
    if (loading) {
        return <div className="p-8 text-center text-gray-400">Loading team information...</div>;
    }

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Team Management</h2>
                        <p className="text-gray-400">Manage your team members and their permissions.</p>
                    </div>
                    <button 
                        onClick={() => setIsInviteModalOpen(true)}
                        className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold py-2 px-4 rounded-md transition-colors"
                        disabled={!team}
                    >
                        <PlusIcon />
                        <span>Invite Member</span>
                    </button>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700">
                    <ul className="divide-y divide-gray-700">
                        {members.map(member => (
                            <li key={member.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                        {/* In a real app, you'd use member.profiles.avatar_url */}
                                        <UserIcon />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{member.profiles?.full_name || 'User'}</p>
                                        <p className="text-sm text-gray-400">{'Email not public'}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400 capitalize">
                                    {member.role}
                                </div>
                            </li>
                        ))}
                    </ul>
                     {members.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <p>Your team is looking a bit empty.</p>
                            <p>Invite your first member to start collaborating!</p>
                        </div>
                    )}
                </div>
            </div>

            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-white mb-4">Invite New Member</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email address</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="member@example.com"
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                                <select 
                                    id="role"
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                                >
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-sm rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleInvite} className="px-4 py-2 text-sm rounded-md text-white bg-accent hover:bg-accent-hover transition-colors">
                                Send Invitation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
