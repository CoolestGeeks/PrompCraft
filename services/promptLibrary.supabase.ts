// services/promptLibrary.supabase.ts
// Supabase-backed data access layer for Prompt Libraries (categories) and Prompts.
// - Respects your RLS: personal libs (user-owned) and team libs (is_team_member)
// - Team members may add prompts to team libraries
// - Owners may rename/delete their own libraries (per RLS you set)
//
// Usage from React (example at bottom): wire these functions to LibraryView's
// onCreateCategory / onRenameCategory / onDeleteCategory / onCreatePrompt /
// onUpdatePrompt / onDeletePrompt callbacks.

import { supabase } from '../supabaseConfig';

// =============================
// Types mapping DB -> UI
// =============================
export type DbLibrary = {
  id: string;
  name: string;
  user_id: string;
  team_id: string | null;
};

export type DbPrompt = {
  id: string;
  name: string; // maps to UI "usecase"
  system_prompt: string; // maps to UI "prompt" text
  config: any;
  library_id: string;
  user_id: string;
};

export type PromptTemplate = { usecase: string; prompt: string };
export type PromptCategory = { id: string; app: string; team_id: string | null; user_id: string; templates: PromptTemplate[] };

const toCategory = (lib: DbLibrary, prompts: DbPrompt[]): PromptCategory => ({
  id: lib.id,
  app: lib.name,
  team_id: lib.team_id,
  user_id: lib.user_id,
  templates: prompts
    .filter(p => p.library_id === lib.id)
    .map(p => ({ usecase: p.name, prompt: p.system_prompt }))
});

// =============================
// Helpers
// =============================
export async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return data.user.id;
}

export async function getTeamIdByName(teamName: string): Promise<string> {
  const { data, error } = await supabase
    .from('teams')
    .select('id')
    .ilike('name', teamName)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Team not found or not accessible: ${teamName}`);
  return data.id;
}

// =============================
// READ
// =============================
export async function fetchAccessibleLibrariesWithPrompts(): Promise<PromptCategory[]> {
  const [{ data: libs, error: e1 }, { data: prompts, error: e2 }] = await Promise.all([
    supabase.from('prompt_libraries').select('id,name,user_id,team_id').order('name', { ascending: true }),
    supabase.from('prompts').select('id,name,system_prompt,config,library_id,user_id')
  ]);
  if (e1) throw e1; if (e2) throw e2;
  const map = new Map<string, DbPrompt[]>();
  (prompts ?? []).forEach(p => {
    const arr = map.get(p.library_id) ?? [];
    arr.push(p);
    map.set(p.library_id, arr);
  });
  return (libs ?? []).map(l => toCategory(l as any, map.get(l.id) ?? []));
}

// =============================
// LIBRARIES (Categories)
// =============================
export async function createPersonalLibrary(name: string): Promise<string> {
  const uid = await getCurrentUserId();
  const { data, error } = await supabase
    .from('prompt_libraries')
    .insert({ name, user_id: uid, team_id: null })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function createTeamLibrary(name: string, teamName: string): Promise<string> {
  const uid = await getCurrentUserId();
  const team_id = await getTeamIdByName(teamName);
  const { data, error } = await supabase
    .from('prompt_libraries')
    .insert({ name, user_id: uid, team_id })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function renameLibraryById(libraryId: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('prompt_libraries')
    .update({ name: newName })
    .eq('id', libraryId);
  if (error) throw error;
}

export async function deleteLibraryById(libraryId: string): Promise<void> {
  const { error } = await supabase
    .from('prompt_libraries')
    .delete()
    .eq('id', libraryId);
  if (error) throw error;
}

// Convenience by-name wrappers (less safe if duplicate names exist)
export async function renameLibraryByName(oldName: string, newName: string): Promise<void> {
  const { data: lib, error } = await supabase
    .from('prompt_libraries')
    .select('id')
    .ilike('name', oldName)
    .limit(1)
    .single();
  if (error) throw error;
  await renameLibraryById(lib.id, newName);
}

export async function deleteLibraryByName(name: string): Promise<void> {
  const { data: lib, error } = await supabase
    .from('prompt_libraries')
    .select('id')
    .ilike('name', name)
    .limit(1)
    .single();
  if (error) throw error;
  await deleteLibraryById(lib.id);
}

// =============================
// PROMPTS
// =============================
export async function createPromptInLibrary(libraryId: string, promptName: string, systemPrompt: string, config: any = {}): Promise<string> {
  const uid = await getCurrentUserId();
  const { data, error } = await supabase
    .from('prompts')
    .insert({ name: promptName, system_prompt: systemPrompt, config, library_id: libraryId, user_id: uid })
    .select('id')
    .single();
  if (error) throw error;

  // also create first version
  const { error: e2 } = await supabase
    .from('prompt_versions')
    .insert({ prompt_id: data.id, user_id: uid, prompt: systemPrompt });
  if (e2) throw e2;
  return data.id;
}

export async function updatePromptText(libraryId: string, promptName: string, newSystemPrompt: string): Promise<void> {
  const uid = await getCurrentUserId();
  // find prompt by (libraryId, name)
  const { data: p, error: e1 } = await supabase
    .from('prompts')
    .select('id')
    .eq('library_id', libraryId)
    .ilike('name', promptName)
    .limit(1)
    .single();
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from('prompts')
    .update({ system_prompt: newSystemPrompt })
    .eq('id', p.id);
  if (e2) throw e2;

  const { error: e3 } = await supabase
    .from('prompt_versions')
    .insert({ prompt_id: p.id, user_id: uid, prompt: newSystemPrompt });
  if (e3) throw e3;
}

export async function deletePromptByName(libraryId: string, promptName: string): Promise<void> {
  // delete by id (cascade deletes versions)
  const { data: p, error: e1 } = await supabase
    .from('prompts')
    .select('id')
    .eq('library_id', libraryId)
    .ilike('name', promptName)
    .limit(1)
    .single();
  if (e1) throw e1;

  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', p.id);
  if (error) throw error;
}

// =============================
// Glue for your existing LibraryView props
// =============================
// The current LibraryView uses category NAMES only. To avoid ambiguity,
// prefer wiring with IDs. Here are helpers that adapt by name -> id.

export async function onCreateCategory(name: string, teamName?: string) {
  // For this app, we assume we are not creating team libraries here.
  // This could be extended to take a teamId.
  return createPersonalLibrary(name);
}

export async function onRenameCategory(oldName: string, newName: string) {
  return renameLibraryByName(oldName, newName);
}

export async function onDeleteCategory(name: string) {
  return deleteLibraryByName(name);
}

export async function onCreatePrompt(categoryName: string, tmpl: { usecase: string; prompt: string }) {
  // resolve library by name
  const { data: lib, error } = await supabase
    .from('prompt_libraries')
    .select('id')
    .ilike('name', categoryName)
    .limit(1)
    .single();
  if (error) throw error;
  return createPromptInLibrary(lib.id, tmpl.usecase, tmpl.prompt, {});
}

export async function onUpdatePrompt(categoryName: string, oldUsecase: string, updated: { usecase: string; prompt: string }) {
  // resolve library
  const { data: lib, error: e0 } = await supabase
    .from('prompt_libraries')
    .select('id')
    .ilike('name', categoryName)
    .limit(1)
    .single();
  if (e0) throw e0;

  // If the name (usecase) changed, do an upsert-like flow
  if (oldUsecase.toLowerCase() !== updated.usecase.toLowerCase()) {
    // Update text on old name
    await updatePromptText(lib.id, oldUsecase, updated.prompt);
    // Also rename prompt
    const { data: p, error: e1 } = await supabase
      .from('prompts')
      .select('id')
      .eq('library_id', lib.id)
      .ilike('name', oldUsecase)
      .limit(1)
      .single();
    if (e1) throw e1;
    const { error: e2 } = await supabase
      .from('prompts')
      .update({ name: updated.usecase })
      .eq('id', p.id);
    if (e2) throw e2;
    return;
  }

  // Only text changed
  await updatePromptText(lib.id, oldUsecase, updated.prompt);
}

export async function onDeletePrompt(categoryName: string, usecase: string) {
  const { data: lib, error } = await supabase
    .from('prompt_libraries')
    .select('id')
    .ilike('name', categoryName)
    .limit(1)
    .single();
  if (error) throw error;
  return deletePromptByName(lib.id, usecase);
}
