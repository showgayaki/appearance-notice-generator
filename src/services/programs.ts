import { supabase } from "../lib/supabase";
import type { ExtraProgram, ExtraProgramInput, PostHeader, PostHeaderInput, ProgramInput, RegularProgram } from "../types";

export type ProgramData = {
  regularPrograms: RegularProgram[];
  extraPrograms: ExtraProgram[];
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
  const [regularResult, extraResult, headerResult] = await Promise.all([
    supabase.from("regular_programs").select("*").order("weekday").order("start_time").overrideTypes<RegularProgram[], { merge: false }>(),
    supabase.from("extra_programs").select("*").order("program_date").order("start_time").overrideTypes<ExtraProgram[], { merge: false }>(),
    supabase.from("post_headers").select("*").order("created_at").overrideTypes<PostHeader[], { merge: false }>(),
  ]);

  throwIfError(regularResult.error);
  throwIfError(extraResult.error);
  throwIfError(headerResult.error);

  return {
    regularPrograms: regularResult.data ?? [],
    extraPrograms: extraResult.data ?? [],
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

export const saveExtraProgram = async (input: ExtraProgramInput, id?: string): Promise<void> => {
  const result = id
    ? await supabase.from("extra_programs").update(input).eq("id", id).select("id").maybeSingle()
    : await supabase.from("extra_programs").insert(input).select("id").maybeSingle();

  throwIfNoChangedRow(result.error, result.data, "保存");
};

export const deleteExtraProgram = async (id: string): Promise<void> => {
  const { data, error } = await supabase.from("extra_programs").delete().eq("id", id).select("id").maybeSingle();
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
