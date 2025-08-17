import { supabase } from '../supabaseConfig';
import type { Project, Agent, PromptVersion, PromptConfig } from '../types';

// Helper to get the current user
const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn("User not authenticated.");
        return null;
    }
    return user;
};

// ========= PROJECTS =========

export const getProjectsForUser = async (): Promise<Project[] | null> => {
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        // The generated Supabase types might have issues with deep nesting.
        // We fetch the data and manually map it to our application types for robustness.
        const { data, error } = await supabase
            .from('projects')
            .select('*, agents(*, prompt_versions(*))')
            .eq('user_id', user.id);

        if (error) throw error;
        if (!data) return [];

        const projects: any[] = data;

        // Manually structure the data to match our application's types
        return projects.map(p => ({
            id: p.id,
            name: p.name,
            user_id: p.user_id,
            created_at: p.created_at,
            agents: (p.agents || []).map((a: any) => ({
                id: a.id,
                name: a.name,
                systemPrompt: a.system_prompt,
                config: a.config as PromptConfig,
                project_id: a.project_id,
                user_id: a.user_id,
                created_at: a.created_at,
                versions: (a.prompt_versions || []).map((v: any) => ({
                    id: v.id,
                    prompt: v.prompt,
                    createdAt: new Date(v.created_at),
                    tag: v.tag,
                    agent_id: v.agent_id,
                    user_id: v.user_id,
                })).sort((v1: PromptVersion, v2: PromptVersion) => new Date(v2.createdAt).getTime() - new Date(v1.createdAt).getTime())
            }))
        }));
    } catch (error) {
        console.error("Error fetching projects:", error);
        return null;
    }
};

export const createProject = async (name: string): Promise<Project | null> => {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('projects')
            .insert({ name, user_id: user.id })
            .select()
            .single();
        
        if (error) throw error;
        return { ...(data as any), agents: [] };
    } catch (error) {
        console.error("Error creating project:", error);
        return null;
    }
};

// ========= AGENTS =========

export const createAgent = async (projectId: string, agentData: Partial<Agent>): Promise<Agent | null> => {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .insert({
                project_id: projectId,
                user_id: user.id,
                name: agentData.name!,
                system_prompt: agentData.systemPrompt!,
                config: agentData.config as any,
            })
            .select()
            .single();

        if (agentError) throw agentError;
        
        const newAgent = agent as any;

        // Also create the initial prompt version
        const { data: version, error: versionError } = await supabase
            .from('prompt_versions')
            .insert({
                agent_id: newAgent.id,
                user_id: user.id,
                prompt: agentData.systemPrompt!,
            })
            .select()
            .single();
            
        if (versionError) throw versionError;
        
        const newVersion = version as any;

        return { 
            ...newAgent, 
            systemPrompt: newAgent.system_prompt, 
            versions: [{...newVersion, createdAt: new Date(newVersion.created_at) }] 
        };

    } catch (error) {
        console.error("Error creating agent:", error);
        return null;
    }
};

export const updateAgent = async (agentId: string, updates: { system_prompt?: string, config?: any }): Promise<void> => {
    try {
        const { error } = await supabase
            .from('agents')
            .update(updates)
            .eq('id', agentId);
        
        if (error) throw error;
    } catch(error) {
        console.error("Error updating agent:", error);
    }
}


// ========= PROMPT VERSIONS =========

export const addPromptVersion = async (agentId: string, prompt: string): Promise<PromptVersion | null> => {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('prompt_versions')
            .insert({ agent_id: agentId, user_id: user.id, prompt })
            .select()
            .single();
        
        if (error) throw error;
        const newVersion = data as any;
        return {...newVersion, createdAt: new Date(newVersion.created_at)};
    } catch (error) {
        console.error("Error adding prompt version:", error);
        return null;
    }
};

export const deletePromptVersion = async (versionId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('prompt_versions')
            .delete()
            .eq('id', versionId);
        
        if (error) throw error;
    } catch (error) {
        console.error("Error deleting prompt version:", error);
    }
};