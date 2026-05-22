import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { GuestProgramManager } from "./components/admin/GuestProgramManager";
import { PostHeaderManager } from "./components/admin/PostHeaderManager";
import { RegularProgramManager } from "./components/admin/RegularProgramManager";
import { AppHeader } from "./components/AppHeader";
import { DateRangeToolbar } from "./components/DateRangeToolbar";
import { GeneratedTextPanel } from "./components/GeneratedTextPanel";
import { PostHeaderSelect } from "./components/PostHeaderSelect";
import { PublicPrograms } from "./components/PublicPrograms";
import { Snackbar } from "./components/Snackbar";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { loadProgramData } from "./services/programs";
import type { GuestProgram, PostHeader, RegularProgram } from "./types";
import type { SnackbarKind, SnackbarMessage } from "./components/Snackbar";
import { getDefaultEndYmd, getTodayYmd } from "./utils/date";
import { buildGeneratedPrograms, generateProgramText } from "./utils/generateText";

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
  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);

  const isLoggedIn = session !== null;
  const isAdminPage = window.location.pathname === "/admin";

  const generatedItems = useMemo(
    () => buildGeneratedPrograms(regularPrograms, guestPrograms, startDate, endDate),
    [regularPrograms, guestPrograms, startDate, endDate],
  );

  const showSnackbar = useCallback((snackbarMessage: string, kind: SnackbarKind = "success") => {
    setSnackbar({
      id: Date.now(),
      message: snackbarMessage,
      kind,
    });
  }, []);

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
    if (selectedPostHeaderId && !postHeaders.some((header) => header.id === selectedPostHeaderId)) {
      setSelectedPostHeaderId("");
    }
  }, [postHeaders, selectedPostHeaderId]);

  const generateSelectedText = () => {
    const selectedTitle = selectedPostHeaderId ? postHeaders.find((header) => header.id === selectedPostHeaderId)?.title.trim() ?? "" : "";
    const selectedItems = generatedItems.filter((item) => selectedProgramIds.has(item.id));
    setGeneratedText(generateProgramText(selectedTitle, selectedItems));
  };

  return (
    <>
      <AppHeader
        isAdminPage={isAdminPage}
        isLoggedIn={isLoggedIn}
        onLoggedIn={() => showSnackbar("ログインしました")}
        onLoggedOut={() => {
          setSession(null);
          showSnackbar("ログアウトしました");
        }}
      />

      {snackbar && <Snackbar key={snackbar.id} snackbar={snackbar} onClose={() => setSnackbar(null)} />}

      <main className="app-shell">
        {!isSupabaseConfigured && (
          <section className="notice">
            <strong>Supabase設定が必要です。</strong>
            <span>.env.localにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定してください。</span>
          </section>
        )}

        {message && <p className="notice">{message}</p>}

        {isAdminPage ? (
          <>
            <h2 className="page-title">管理</h2>
            {!isLoggedIn && <p className="notice">管理機能を使うには、右上のアイコンから管理者ログインしてください。</p>}
            {isLoggedIn && (
              <>
                <PostHeaderManager items={postHeaders} onChanged={() => void loadData()} onNotify={showSnackbar} />
                <RegularProgramManager items={regularPrograms} onChanged={() => void loadData()} onNotify={showSnackbar} />
                <GuestProgramManager items={guestPrograms} onChanged={() => void loadData()} onNotify={showSnackbar} />
              </>
            )}
          </>
        ) : (
          <>
            <h2 className="page-title">作成</h2>
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

            <GeneratedTextPanel generatedText={generatedText} onGeneratedTextChange={setGeneratedText} onNotify={showSnackbar} />
          </>
        )}
      </main>
    </>
  );
}
