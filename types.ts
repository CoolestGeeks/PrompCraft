export type View = 'wizard' | 'playground' | 'library';

export interface Project {
  id: string;
  name: string;
  agents: Agent[];
  user_id: string;
  created_at: string;
}

export interface Agent {
  id: string;
  name:string;
  systemPrompt: string;
  versions: PromptVersion[];
  config: PromptConfig;
  project_id: string;
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
  createdAt: Date | string; // Can be Date object or ISO string from DB
  tag?: 'Production' | 'Beta' | 'Test';
  agent_id?: string;
  user_id?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 encoded image
}