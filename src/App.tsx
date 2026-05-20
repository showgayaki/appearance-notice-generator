import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AdminPanel } from "./components/admin/AdminPanel";
import { AuthPanel } from "./components/AuthPanel";
import { DateRangeToolbar } from "./components/DateRangeToolbar";
import { GeneratedTextPanel } from "./components/GeneratedTextPanel";
import { PostHeaderSelect } from "./components/PostHeaderSelect";
import { PublicPrograms } from "./components/PublicPrograms";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { loadProgramData } from "./services/programs";
import type { GuestProgram, PostHeader, RegularProgram } from "./types";
import { getDefaultEndYmd, getTodayYmd } from "./utils/date";
import { buildGeneratedPrograms, generateProgramText } from "./utils/generateText";

const defaultPostTitle = "🌈今週テレビ🌈";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [regularPrograms, setRegularPrograms] = useState<RegularProgram[]>([]);
  const [guestPrograms, setGuestPrograms] = useState<GuestProgram[]>([]);
  const [postHeaders, setPostHeaders] = useState<PostHeader[]>([]);
  const [startDate, setStartDate] = useState(getTodayYmd);
  const [endDate, setEndDate] = useState(getDefaultEndYmd);
  const [selectedPostHeaderId, setSelectedPostHeaderId] = useState("");
  const [selectedProgramIds, setSelectedProgramIds] = useState<Set<string>>(new Set());
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const isLoggedIn = session !== null;

  const generatedItems = useMemo(
    () => buildGeneratedPrograms(regularPrograms, guestPrograms, startDate, endDate),
    [regularPrograms, guestPrograms, startDate, endDate],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await loadProgramData();
      setRegularPrograms(data.regularPrograms);
      setGuestPrograms(data.guestPrograms);
      setPostHeaders(data.postHeaders);
    } catch {
      setMessage("データの読み込みに失敗しました。Supabase設定とRLSを確認してください。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await loadData();
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadData]);

  useEffect(() => {
    setSelectedProgramIds(new Set(generatedItems.map((item) => item.id)));
  }, [generatedItems]);

  useEffect(() => {
    if (!selectedPostHeaderId && postHeaders.length > 0) {
      setSelectedPostHeaderId(postHeaders[0].id);
      return;
    }

    if (selectedPostHeaderId && !postHeaders.some((header) => header.id === selectedPostHeaderId)) {
      setSelectedPostHeaderId("");
    }
  }, [postHeaders, selectedPostHeaderId]);

  const generateSelectedText = () => {
    const selectedTitle = postHeaders.find((header) => header.id === selectedPostHeaderId)?.title.trim() || defaultPostTitle;
    const selectedItems = generatedItems.filter((item) => selectedProgramIds.has(item.id));
    setGeneratedText(generateProgramText(selectedTitle, selectedItems));
  };

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <h1>テレビ出演情報</h1>
        </div>
        {isLoggedIn && (
          <a className="admin-link" href="/admin">
            管理画面
          </a>
        )}
        <AuthPanel isLoggedIn={isLoggedIn} onLoggedOut={() => setSession(null)} />
      </header>

      {!isSupabaseConfigured && (
        <section className="notice">
          <strong>Supabase設定が必要です。</strong>
          <span>.env.localにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定してください。</span>
        </section>
      )}

      {message && <p className="notice">{message}</p>}

      <DateRangeToolbar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <PostHeaderSelect
        postHeaders={postHeaders}
        selectedPostHeaderId={selectedPostHeaderId}
        onSelectedPostHeaderIdChange={setSelectedPostHeaderId}
      />

      <PublicPrograms
        items={generatedItems}
        loading={loading}
        selectedProgramIds={selectedProgramIds}
        onSelectedProgramIdsChange={setSelectedProgramIds}
      />

      <div className="output-actions">
        <button type="button" onClick={generateSelectedText} disabled={generatedItems.length === 0}>
          出力
        </button>
      </div>

      <GeneratedTextPanel generatedText={generatedText} onGeneratedTextChange={setGeneratedText} />

      {isLoggedIn && (
        <AdminPanel
          guestPrograms={guestPrograms}
          postHeaders={postHeaders}
          regularPrograms={regularPrograms}
          onChanged={() => void loadData()}
        />
      )}
    </main>
  );
}
