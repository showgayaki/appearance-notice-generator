import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isLoginConfigured, isSupabaseConfigured, loginEmail, loginId, supabase } from "./lib/supabase";
import type {
  Appearance,
  AppearanceInput,
  GeneratedAppearance,
  PeriodHeader,
  PeriodHeaderInput,
  ProgramInput,
  RegularProgram,
  Weekday,
} from "./types";
import { getDefaultEndYmd, getTodayYmd, getWeekdayLabel } from "./utils/date";
import { buildGeneratedAppearances, findPeriodTitle, generateAppearanceText } from "./utils/generateText";

const emptyRegularProgram: ProgramInput = {
  weekday: 1,
  start_time: "",
  end_time: "",
  station_name: "",
  program_name: "",
  is_active: true,
};

const emptyAppearance = (): AppearanceInput => ({
  appearance_date: getTodayYmd(),
  start_time: "",
  end_time: "",
  station_name: "",
  program_name: "",
});

const emptyPeriodHeader = (): PeriodHeaderInput => ({
  start_date: getTodayYmd(),
  end_date: getDefaultEndYmd(),
  title: "🌈今週テレビ🌈",
});

const toWeekday = (value: string): Weekday => {
  const weekday = Number(value);
  if (weekday === 0 || weekday === 1 || weekday === 2 || weekday === 3 || weekday === 4 || weekday === 5 || weekday === 6) {
    return weekday;
  }
  return 1;
};

const requireText = (value: string): string => value.trim();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [regularPrograms, setRegularPrograms] = useState<RegularProgram[]>([]);
  const [appearances, setAppearances] = useState<Appearance[]>([]);
  const [periodHeaders, setPeriodHeaders] = useState<PeriodHeader[]>([]);
  const [startDate, setStartDate] = useState(getTodayYmd);
  const [endDate, setEndDate] = useState(getDefaultEndYmd);
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const isLoggedIn = session !== null;

  const generatedItems = useMemo(
    () => buildGeneratedAppearances(regularPrograms, appearances, startDate, endDate),
    [regularPrograms, appearances, startDate, endDate],
  );

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
  }, []);

  useEffect(() => {
    const title = findPeriodTitle(periodHeaders, startDate, endDate);
    setGeneratedText(generateAppearanceText(title, generatedItems));
  }, [generatedItems, periodHeaders, startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    const [regularResult, appearanceResult, headerResult] = await Promise.all([
      supabase.from("regular_programs").select("*").order("weekday").order("start_time").returns<RegularProgram[]>(),
      supabase.from("appearances").select("*").order("appearance_date").order("start_time").returns<Appearance[]>(),
      supabase.from("period_headers").select("*").order("start_date").returns<PeriodHeader[]>(),
    ]);

    if (regularResult.error || appearanceResult.error || headerResult.error) {
      setMessage("データの読み込みに失敗しました。Supabase設定とRLSを確認してください。");
      setLoading(false);
      return;
    }

    setRegularPrograms(regularResult.data);
    setAppearances(appearanceResult.data);
    setPeriodHeaders(headerResult.data);
    setLoading(false);
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(generatedText);
    setCopyStatus("コピーしました");
    window.setTimeout(() => setCopyStatus(""), 1800);
  };

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">wc-appearances</p>
          <h1>テレビ出演情報</h1>
        </div>
        <AuthPanel isLoggedIn={isLoggedIn} onLoggedOut={() => setSession(null)} />
      </header>

      {!isSupabaseConfigured && (
        <section className="notice">
          <strong>Supabase設定が必要です。</strong>
          <span>.env.localにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを設定してください。</span>
        </section>
      )}

      {message && <p className="notice">{message}</p>}

      <section className="toolbar" aria-label="期間選択">
        <label>
          開始日
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          終了日
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <button type="button" onClick={() => void loadData()} disabled={!isSupabaseConfigured || loading}>
          再読み込み
        </button>
      </section>

      <section className="text-panel">
        <div className="section-heading">
          <h2>生成テキスト</h2>
          <button type="button" onClick={() => void copyText()} disabled={generatedText.length === 0}>
            コピー
          </button>
        </div>
        <textarea
          value={generatedText}
          onChange={(event) => setGeneratedText(event.target.value)}
          rows={14}
          aria-label="生成された出演情報テキスト"
        />
        {copyStatus && <p className="status">{copyStatus}</p>}
      </section>

      <PublicAppearances items={generatedItems} loading={loading} />

      {isLoggedIn && (
        <AdminPanel
          appearances={appearances}
          periodHeaders={periodHeaders}
          regularPrograms={regularPrograms}
          selectedEndDate={endDate}
          selectedStartDate={startDate}
          onChanged={() => void loadData()}
        />
      )}
    </main>
  );
}

function AuthPanel({ isLoggedIn, onLoggedOut }: { isLoggedIn: boolean; onLoggedOut: () => void }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!isLoginConfigured) {
      setError("ログインID設定が不足しています。");
      return;
    }

    if (userId.trim() !== loginId) {
      setError("IDまたはパスワードが違います。");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError("IDまたはパスワードが違います。");
      return;
    }

    setPassword("");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  if (isLoggedIn) {
    return (
      <div className="auth-box">
        <span>管理者ログイン中</span>
        <button type="button" onClick={() => void signOut()}>
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <form className="auth-box auth-form" onSubmit={(event) => void signIn(event)}>
      <input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="ID" autoComplete="username" />
      <input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="PASS"
        type="password"
        autoComplete="current-password"
      />
      <button type="submit" disabled={submitting}>
        ログイン
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function PublicAppearances({ items, loading }: { items: GeneratedAppearance[]; loading: boolean }) {
  return (
    <section className="list-panel">
      <div className="section-heading">
        <h2>出演データ一覧</h2>
        <span>{loading ? "読み込み中" : `${items.length}件`}</span>
      </div>
      {items.length === 0 ? (
        <p className="empty">この期間の出演情報はありません。</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>日付</th>
                <th>時間</th>
                <th>局名</th>
                <th>番組名</th>
                <th>種別</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>
                    {item.startTime}〜{item.endTime}
                  </td>
                  <td>{item.stationName}</td>
                  <td>{item.programName}</td>
                  <td>{item.source === "regular" ? "レギュラー" : "単発"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AdminPanel({
  appearances,
  periodHeaders,
  regularPrograms,
  selectedEndDate,
  selectedStartDate,
  onChanged,
}: {
  appearances: Appearance[];
  periodHeaders: PeriodHeader[];
  regularPrograms: RegularProgram[];
  selectedEndDate: string;
  selectedStartDate: string;
  onChanged: () => void;
}) {
  return (
    <section className="admin-panel">
      <h2>管理</h2>
      <div className="admin-grid">
        <RegularProgramManager items={regularPrograms} onChanged={onChanged} />
        <AppearanceManager items={appearances} onChanged={onChanged} />
        <PeriodHeaderManager
          items={periodHeaders}
          onChanged={onChanged}
          selectedEndDate={selectedEndDate}
          selectedStartDate={selectedStartDate}
        />
      </div>
    </section>
  );
}

function RegularProgramManager({ items, onChanged }: { items: RegularProgram[]; onChanged: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramInput>(emptyRegularProgram);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const payload: ProgramInput = {
      ...form,
      start_time: requireText(form.start_time),
      end_time: requireText(form.end_time),
      station_name: requireText(form.station_name),
      program_name: requireText(form.program_name),
    };

    if (!payload.start_time || !payload.end_time || !payload.station_name || !payload.program_name) {
      setError("未入力の項目があります。");
      return;
    }

    const result = editingId
      ? await supabase.from("regular_programs").update(payload).eq("id", editingId)
      : await supabase.from("regular_programs").insert(payload);

    if (result.error) {
      setError("保存に失敗しました。");
      return;
    }

    setEditingId(null);
    setForm(emptyRegularProgram);
    onChanged();
  };

  const edit = (item: RegularProgram) => {
    setEditingId(item.id);
    setForm({
      weekday: item.weekday,
      start_time: item.start_time,
      end_time: item.end_time,
      station_name: item.station_name,
      program_name: item.program_name,
      is_active: item.is_active,
    });
  };

  const remove = async (id: string) => {
    if (!window.confirm("このレギュラー番組を削除しますか？")) {
      return;
    }
    const { error } = await supabase.from("regular_programs").delete().eq("id", id);
    if (error) {
      setError("削除に失敗しました。");
      return;
    }
    onChanged();
  };

  return (
    <div className="manager">
      <h3>レギュラー番組</h3>
      <form onSubmit={(event) => void submit(event)}>
        <label>
          曜日
          <select value={form.weekday} onChange={(event) => setForm({ ...form, weekday: toWeekday(event.target.value) })}>
            {[0, 1, 2, 3, 4, 5, 6].map((weekday) => (
              <option key={weekday} value={weekday}>
                {getWeekdayLabel(weekday as Weekday)}
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            開始
            <input value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} placeholder="26:20" />
          </label>
          <label>
            終了
            <input value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} placeholder="26:45" />
          </label>
        </div>
        <label>
          局名
          <input value={form.station_name} onChange={(event) => setForm({ ...form, station_name: event.target.value })} />
        </label>
        <label>
          番組名
          <input value={form.program_name} onChange={(event) => setForm({ ...form, program_name: event.target.value })} />
        </label>
        <label className="checkbox-label">
          <input
            checked={form.is_active}
            onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            type="checkbox"
          />
          有効
        </label>
        <div className="button-row">
          <button type="submit">{editingId ? "更新" : "追加"}</button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyRegularProgram); }}>
              キャンセル
            </button>
          )}
        </div>
        {error && <p className="error">{error}</p>}
      </form>
      <ItemList
        items={items.map((item) => ({
          id: item.id,
          label: `${getWeekdayLabel(item.weekday)} ${item.start_time}〜${item.end_time} ${item.station_name}「${item.program_name}」`,
          muted: !item.is_active,
          onEdit: () => edit(item),
          onDelete: () => void remove(item.id),
        }))}
      />
    </div>
  );
}

function AppearanceManager({ items, onChanged }: { items: Appearance[]; onChanged: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AppearanceInput>(emptyAppearance);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const payload: AppearanceInput = {
      appearance_date: form.appearance_date,
      start_time: requireText(form.start_time),
      end_time: requireText(form.end_time),
      station_name: requireText(form.station_name),
      program_name: requireText(form.program_name),
    };

    if (!payload.appearance_date || !payload.start_time || !payload.end_time || !payload.station_name || !payload.program_name) {
      setError("未入力の項目があります。");
      return;
    }

    const result = editingId
      ? await supabase.from("appearances").update(payload).eq("id", editingId)
      : await supabase.from("appearances").insert(payload);

    if (result.error) {
      setError("保存に失敗しました。");
      return;
    }

    setEditingId(null);
    setForm(emptyAppearance());
    onChanged();
  };

  const edit = (item: Appearance) => {
    setEditingId(item.id);
    setForm({
      appearance_date: item.appearance_date,
      start_time: item.start_time,
      end_time: item.end_time,
      station_name: item.station_name,
      program_name: item.program_name,
    });
  };

  const remove = async (id: string) => {
    if (!window.confirm("この単発出演を削除しますか？")) {
      return;
    }
    const { error } = await supabase.from("appearances").delete().eq("id", id);
    if (error) {
      setError("削除に失敗しました。");
      return;
    }
    onChanged();
  };

  return (
    <div className="manager">
      <h3>単発出演</h3>
      <form onSubmit={(event) => void submit(event)}>
        <label>
          日付
          <input type="date" value={form.appearance_date} onChange={(event) => setForm({ ...form, appearance_date: event.target.value })} />
        </label>
        <div className="form-row">
          <label>
            開始
            <input value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} placeholder="24:45" />
          </label>
          <label>
            終了
            <input value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} placeholder="25:15" />
          </label>
        </div>
        <label>
          局名
          <input value={form.station_name} onChange={(event) => setForm({ ...form, station_name: event.target.value })} />
        </label>
        <label>
          番組名
          <input value={form.program_name} onChange={(event) => setForm({ ...form, program_name: event.target.value })} />
        </label>
        <div className="button-row">
          <button type="submit">{editingId ? "更新" : "追加"}</button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyAppearance()); }}>
              キャンセル
            </button>
          )}
        </div>
        {error && <p className="error">{error}</p>}
      </form>
      <ItemList
        items={items.map((item) => ({
          id: item.id,
          label: `${item.appearance_date} ${item.start_time}〜${item.end_time} ${item.station_name}「${item.program_name}」`,
          muted: false,
          onEdit: () => edit(item),
          onDelete: () => void remove(item.id),
        }))}
      />
    </div>
  );
}

function PeriodHeaderManager({
  items,
  selectedEndDate,
  selectedStartDate,
  onChanged,
}: {
  items: PeriodHeader[];
  selectedEndDate: string;
  selectedStartDate: string;
  onChanged: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PeriodHeaderInput>({
    ...emptyPeriodHeader(),
    start_date: selectedStartDate,
    end_date: selectedEndDate,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingId === null) {
      setForm((current) => ({ ...current, start_date: selectedStartDate, end_date: selectedEndDate }));
    }
  }, [editingId, selectedEndDate, selectedStartDate]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const payload: PeriodHeaderInput = {
      start_date: form.start_date,
      end_date: form.end_date,
      title: requireText(form.title),
    };

    if (!payload.start_date || !payload.end_date || !payload.title) {
      setError("未入力の項目があります。");
      return;
    }

    const result = editingId
      ? await supabase.from("period_headers").update(payload).eq("id", editingId)
      : await supabase.from("period_headers").insert(payload);

    if (result.error) {
      setError("保存に失敗しました。同じ期間の見出しが既にある場合は編集してください。");
      return;
    }

    setEditingId(null);
    setForm({ ...emptyPeriodHeader(), start_date: selectedStartDate, end_date: selectedEndDate });
    onChanged();
  };

  const edit = (item: PeriodHeader) => {
    setEditingId(item.id);
    setForm({
      start_date: item.start_date,
      end_date: item.end_date,
      title: item.title,
    });
  };

  const remove = async (id: string) => {
    if (!window.confirm("この見出しを削除しますか？")) {
      return;
    }
    const { error } = await supabase.from("period_headers").delete().eq("id", id);
    if (error) {
      setError("削除に失敗しました。");
      return;
    }
    onChanged();
  };

  return (
    <div className="manager">
      <h3>期間別見出し</h3>
      <form onSubmit={(event) => void submit(event)}>
        <div className="form-row">
          <label>
            開始日
            <input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} />
          </label>
          <label>
            終了日
            <input type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} />
          </label>
        </div>
        <label>
          見出し
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <div className="button-row">
          <button type="submit">{editingId ? "更新" : "追加"}</button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ ...emptyPeriodHeader(), start_date: selectedStartDate, end_date: selectedEndDate });
              }}
            >
              キャンセル
            </button>
          )}
        </div>
        {error && <p className="error">{error}</p>}
      </form>
      <ItemList
        items={items.map((item) => ({
          id: item.id,
          label: `${item.start_date}〜${item.end_date} ${item.title}`,
          muted: false,
          onEdit: () => edit(item),
          onDelete: () => void remove(item.id),
        }))}
      />
    </div>
  );
}

function ItemList({
  items,
}: {
  items: {
    id: string;
    label: string;
    muted: boolean;
    onEdit: () => void;
    onDelete: () => void;
  }[];
}) {
  if (items.length === 0) {
    return <p className="empty">まだ登録がありません。</p>;
  }

  return (
    <ul className="item-list">
      {items.map((item) => (
        <li key={item.id} className={item.muted ? "muted" : undefined}>
          <span>{item.label}</span>
          <div className="button-row compact">
            <button type="button" onClick={item.onEdit}>
              編集
            </button>
            <button type="button" onClick={item.onDelete}>
              削除
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
