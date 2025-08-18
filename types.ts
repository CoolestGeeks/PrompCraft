
export type View = 'wizard' | 'playground' | 'library' | 'team';

export interface PromptLibrary {
  id: string;
  name: string;
  prompts: Prompt[];
  user_id: string;
  created_at: string;
  team_id?: string;
}

export interface Prompt {
  id: string;
  name:string;
  system_prompt: string;
  versions: PromptVersion[];
  config: PromptConfig;
  library_id: string;
  user_id: string;
  created_at: string;
}

export interface PromptConfig {
  persona: string;
  mission: string;
  skills: string[];
  boundaries: string[];
  personality: 'Professional' | 'Casual' | 'Enthusiastic' | 'Formal';
  format: string;
  reference: string;
}

export interface PromptVersion {
  id: string;
  prompt: string;
  created_at: string;
  tag?: 'Production' | 'Beta' | 'Test' | null;
  prompt_id: string;
  user_id: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 encoded image
}

export interface Team {
    id: string;
    name: string;
    owner_id: string;
    created_at: string;
}

export interface TeamMember {
    id: string;
    user_id: string;
    team_id: string;
    role: 'owner' | 'editor' | 'viewer';
    created_at: string;
    profiles: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}
