import { supabase, Database, type Json } from '../supabaseConfig';
import type { PromptLibrary, Prompt, PromptVersion, PromptConfig, Team, TeamMember } from '../types';

// Helper to get the current user
const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        throw new Error("User not authenticated.");
    }
    return user;
};

// ========= TEAMS =========

export const getTeamForUser = async (): Promise<Team | null> => {
    try {
        const user = await getCurrentUser();
        const { data: member, error: memberError } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

        if (memberError && memberError.code !== 'PGRST116') { // PGRST116: no rows found
             throw new Error(`Error fetching user's team membership: ${memberError.message}`);
        }
        
        if (!member) return null;

        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('id, name, owner_id, created_at')
            .eq('id', member.team_id)
            .single();

        if (teamError) throw new Error(`Error fetching team details: ${teamError.message}`);

        return team;
    } catch (error) {
        console.error("Error fetching team:", error);
        throw error;
    }
};

export const getMembersForTeam = async (teamId: string): Promise<TeamMember[] | null> => {
    const { data: members, error: memberError } = await supabase
        .from('team_members')
        .select('id, user_id, team_id, role, created_at')
        .eq('team_id', teamId);
    
    if (memberError) {
        console.error("Error fetching team members:", memberError);
        throw new Error(`Failed to fetch team members: ${memberError.message}`);
    }
    if (!members) return [];

    const userIds = members.map(m => m.user_id);
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
    
    if (profileError) {
        console.error("Error fetching profiles:", profileError);
        throw new Error(`Failed to fetch profiles: ${profileError.message}`);
    }

    const membersWithProfiles = members.map(member => {
        const profile = profiles.find(p => p.id === member.user_id);
        return {
            ...member,
            profiles: profile || null
        }
    })

    return membersWithProfiles as unknown as TeamMember[];
};

export const createInvite = async (teamId: string, email: string, role: 'editor' | 'viewer'): Promise<any> => {
    const user = await getCurrentUser();
    
    const invite: Database['public']['Tables']['invites']['Insert'] = {
        team_id: teamId,
        email,
        role,
        invited_by: user.id
    };

    const { data, error } = await supabase
        .from('invites')
        .insert(invite);

    if (error) {
        console.error("Error creating invite:", error);
        throw new Error(`Failed to create invite: ${error.message}`);
    }
    
    console.log(`Invitation created for ${email} to join team ${teamId} as ${role}`);
    
    return data;
};

// ========= LIBRARIES =========

export const getLibrariesForUser = async (): Promise<PromptLibrary[]> => {
    try {
        const team = await getTeamForUser();
        if(!team) return [];

        const { data: librariesData, error: librariesError } = await supabase
            .from('prompt_libraries')
            .select('id, name, user_id, created_at, team_id')
            .eq('team_id', team.id);
        
        if (librariesError) throw new Error(`Failed to fetch libraries: ${librariesError.message}`);
        const libraries = librariesData || [];
        if (libraries.length === 0) return [];

        const libraryIds = libraries.map(lib => lib.id);
      
        const { data: promptsData, error: promptsError } = await supabase
            .from('prompts')
            .select('id, name, system_prompt, config, library_id, user_id, created_at')
            .in('library_id', libraryIds);
        
        if (promptsError) throw new Error(`Failed to fetch prompts: ${promptsError.message}`);
        const prompts = promptsData || [];

        const promptIds = prompts.map(p => p.id);
        
        let versions: Database['public']['Tables']['prompt_versions']['Row'][] = [];
        if (promptIds.length > 0) {
            const { data: versionsData, error: versionsError } = await supabase
                .from('prompt_versions')
                .select('id, prompt, created_at, tag, prompt_id, user_id')
                .in('prompt_id', promptIds)
                .order('created_at', { ascending: false });

            if (versionsError) throw new Error(`Failed to fetch prompt versions: ${versionsError.message}`);
            versions = versionsData || [];
        }
        
        const promptsWithVersions: Prompt[] = prompts.map(p => ({
            ...(p as any),
            config: p.config as unknown as PromptConfig,
            versions: versions.filter(v => v.prompt_id === p.id)
        }));

        const librariesWithPrompts: PromptLibrary[] = libraries.map(lib => ({
            ...(lib as any),
            prompts: promptsWithVersions.filter(p => p.library_id === lib.id)
        }));

        return librariesWithPrompts;
    } catch (error) {
        console.error("Error fetching libraries:", error);
        throw error;
    }
};


export const createLibrary = async (name: string, teamId: string): Promise<PromptLibrary | null> => {
    try {
        const user = await getCurrentUser();
        const newLibrary: Database['public']['Tables']['prompt_libraries']['Insert'] = { name, user_id: user.id, team_id: teamId };
        const { data, error } = await supabase
            .from('prompt_libraries')
            .insert(newLibrary)
            .select()
            .single();
        
        if (error) throw new Error(`Failed to create library: ${error.message}`);
        return { ...(data as any), prompts: [] };
    } catch (error) {
        console.error("Error creating library:", error);
        throw error;
    }
};

export const deleteLibrary = async (libraryId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('prompt_libraries')
            .delete()
            .eq('id', libraryId);
        
        if (error) throw new Error(`Failed to delete library: ${error.message}`);
    } catch(error) {
        console.error("Error deleting library:", error);
        throw error;
    }
};

// ========= PROMPTS =========

export const createPrompt = async (libraryId: string, name: string): Promise<Prompt | null> => {
    try {
        const user = await getCurrentUser();

        const newPromptPayload: Database['public']['Tables']['prompts']['Insert'] = {
            library_id: libraryId,
            user_id: user.id,
            name,
            system_prompt: 'You are a helpful assistant.',
            config: { persona: 'Helpful Assistant', mission: '', skills: [], boundaries: [], personality: 'Professional', format: '', reference: '' } as Json,
        };
        const { data: prompt, error: promptError } = await supabase
            .from('prompts')
            .insert(newPromptPayload)
            .select()
            .single();

        if (promptError) throw new Error(`Failed to create prompt: ${promptError.message}`);
        
        const newPrompt = prompt as any;

        const newVersionPayload: Database['public']['Tables']['prompt_versions']['Insert'] = {
            prompt_id: newPrompt.id,
            user_id: user.id,
            prompt: newPrompt.system_prompt,
        };
        const { data: version, error: versionError } = await supabase
            .from('prompt_versions')
            .insert(newVersionPayload)
            .select()
            .single();
            
        if (versionError) throw new Error(`Failed to create initial prompt version: ${versionError.message}`);
        
        return { 
            ...newPrompt, 
            versions: [version as PromptVersion] 
        };

    } catch (error) {
        console.error("Error creating prompt:", error);
        throw error;
    }
};

export const updatePrompt = async (promptId: string, updates: { system_prompt?: string, config?: PromptConfig }): Promise<void> => {
    try {
        const updatePayload: Database['public']['Tables']['prompts']['Update'] = { 
            ...updates, 
            config: updates.config as unknown as Json | undefined
        };
        const { error } = await supabase
            .from('prompts')
            .update(updatePayload)
            .eq('id', promptId);
        
        if (error) throw new Error(`Failed to update prompt: ${error.message}`);
    } catch(error) {
        console.error("Error updating prompt:", error);
        throw error;
    }
}


// ========= PROMPT VERSIONS =========

export const addPromptVersion = async (promptId: string, promptText: string): Promise<PromptVersion | null> => {
    try {
        const user = await getCurrentUser();
        const newVersion: Database['public']['Tables']['prompt_versions']['Insert'] = { 
            prompt_id: promptId, 
            user_id: user.id, 
            prompt: promptText 
        };
        const { data, error } = await supabase
            .from('prompt_versions')
            .insert(newVersion)
            .select()
            .single();
        
        if (error) throw new Error(`Failed to add prompt version: ${error.message}`);
        return data as PromptVersion;
    } catch (error) {
        console.error("Error adding prompt version:", error);
        throw error;
    }
};