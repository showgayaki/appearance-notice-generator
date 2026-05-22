import { supabase } from "../lib/supabase";
import type { GuestProgram, GuestProgramInput, PostHeader, PostHeaderInput, ProgramInput, RegularProgram } from "../types";

export type ProgramData = {
  regularPrograms: RegularProgram[];
  guestPrograms: GuestProgram[];
  postHeaders: PostHeader[];
};

const throwIfError = (error: { message: string } | null): void => {
  if (error) {
    throw new Error(error.message);
  }
};

const throwIfNoChangedRow = (error: { message: string } | null, data: { id: string } | null, action: string): void => {
  throwIfError(error);

  if (!data) {
    throw new Error(`${action}できませんでした。`);
  }
};

export const loadProgramData = async (): Promise<ProgramData> => {
  const [regularResult, guestResult, headerResult] = await Promise.all([
    supabase.from("regular_programs").select("*").order("weekday").order("start_time").returns<RegularProgram[]>(),
    supabase.from("guest_programs").select("*").order("program_date").order("start_time").returns<GuestProgram[]>(),
    supabase.from("post_headers").select("*").order("created_at").returns<PostHeader[]>(),
  ]);

  throwIfError(regularResult.error);
  throwIfError(guestResult.error);
  throwIfError(headerResult.error);

  return {
    regularPrograms: regularResult.data ?? [],
    guestPrograms: guestResult.data ?? [],
    postHeaders: headerResult.data ?? [],
  };
};

export const saveRegularProgram = async (input: ProgramInput, id?: string): Promise<void> => {
  const result = id
    ? await supabase.from("regular_programs").update(input).eq("id", id).select("id").maybeSingle()
    : await supabase.from("regular_programs").insert(input).select("id").maybeSingle();

  throwIfNoChangedRow(result.error, result.data, "保存");
};

export const deleteRegularProgram = async (id: string): Promise<void> => {
  const { data, error } = await supabase.from("regular_programs").delete().eq("id", id).select("id").maybeSingle();
  throwIfNoChangedRow(error, data, "削除");
};

export const saveGuestProgram = async (input: GuestProgramInput, id?: string): Promise<void> => {
  const result = id
    ? await supabase.from("guest_programs").update(input).eq("id", id).select("id").maybeSingle()
    : await supabase.from("guest_programs").insert(input).select("id").maybeSingle();

  throwIfNoChangedRow(result.error, result.data, "保存");
};

export const deleteGuestProgram = async (id: string): Promise<void> => {
  const { data, error } = await supabase.from("guest_programs").delete().eq("id", id).select("id").maybeSingle();
  throwIfNoChangedRow(error, data, "削除");
};

export const savePostHeader = async (input: PostHeaderInput, id?: string): Promise<void> => {
  const result = id
    ? await supabase.from("post_headers").update(input).eq("id", id).select("id").maybeSingle()
    : await supabase.from("post_headers").insert(input).select("id").maybeSingle();

  throwIfNoChangedRow(result.error, result.data, "保存");
};

export const deletePostHeader = async (id: string): Promise<void> => {
  const { data, error } = await supabase.from("post_headers").delete().eq("id", id).select("id").maybeSingle();
  throwIfNoChangedRow(error, data, "削除");
};
