import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import { deleteExtraProgram, saveExtraProgram } from "../../services/programs";
import type { ExtraProgram, ExtraProgramInput } from "../../types";
import { getTodayYmd } from "../../utils/date";
import { AdminConfirmModal } from "./AdminConfirmModal";
import { AdminEditModal } from "./AdminEditModal";
import { FieldError } from "./FieldError";
import { TimeSelect } from "./TimeSelect";

const emptyExtraProgram = (): ExtraProgramInput => ({
  program_date: getTodayYmd(),
  start_time: "",
  end_time: "",
  station_name: "",
  program_name: "",
});

const requireText = (value: string): string => value.trim();

type ExtraProgramErrors = {
  program_date: string;
  start_time: string;
  end_time: string;
  station_name: string;
  program_name: string;
};

const emptyExtraProgramErrors: ExtraProgramErrors = {
  program_date: "",
  start_time: "",
  end_time: "",
  station_name: "",
  program_name: "",
};

type ExtraProgramManagerProps = {
  items: ExtraProgram[];
  onChanged: () => void;
  onNotify: (message: string, kind?: "success" | "error") => void;
};

export function ExtraProgramManager({ items, onChanged, onNotify }: ExtraProgramManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExtraProgramInput>(emptyExtraProgram);
  const [fieldErrors, setFieldErrors] = useState<ExtraProgramErrors>(emptyExtraProgramErrors);
  const [validationKey, setValidationKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const editingItem = editingId ? items.find((item) => item.id === editingId) : undefined;
  const hasChanges =
    !editingId ||
    !editingItem ||
    form.program_date !== editingItem.program_date ||
    requireText(form.start_time) !== editingItem.start_time ||
    requireText(form.end_time) !== editingItem.end_time ||
    requireText(form.station_name) !== editingItem.station_name ||
    requireText(form.program_name) !== editingItem.program_name;

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    const payload: ExtraProgramInput = {
      program_date: form.program_date,
      start_time: requireText(form.start_time),
      end_time: requireText(form.end_time),
      station_name: requireText(form.station_name),
      program_name: requireText(form.program_name),
    };

    const nextFieldErrors: ExtraProgramErrors = {
      program_date: payload.program_date ? "" : "日付を入力してください。",
      start_time: payload.start_time ? "" : "開始時刻を選択してください。",
      end_time: payload.end_time ? "" : "終了時刻を選択してください。",
      station_name: payload.station_name ? "" : "局を入力してください。",
      program_name: payload.program_name ? "" : "番組名を入力してください。",
    };
    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some((message) => message.length > 0)) {
      setValidationKey((current) => current + 1);
      return;
    }

    try {
      const isEditing = editingId !== null;
      await saveExtraProgram(payload, editingId ?? undefined);
      onNotify(isEditing ? "ゲスト・特番を更新しました" : "ゲスト・特番を追加しました");
    } catch {
      onNotify("保存に失敗しました", "error");
      return;
    }

    setEditingId(null);
    setForm(emptyExtraProgram());
    setIsModalOpen(false);
    onChanged();
  };

  const edit = (item: ExtraProgram) => {
    setEditingId(item.id);
    setForm({
      program_date: item.program_date,
      start_time: item.start_time,
      end_time: item.end_time,
      station_name: item.station_name,
      program_name: item.program_name,
    });
    setFieldErrors(emptyExtraProgramErrors);
    setValidationKey(0);
    setIsModalOpen(true);
  };

  const create = () => {
    setEditingId(null);
    setForm(emptyExtraProgram());
    setFieldErrors(emptyExtraProgramErrors);
    setValidationKey(0);
    setIsModalOpen(true);
  };

  const remove = async (id: string) => {
    try {
      await deleteExtraProgram(id);
      onNotify("ゲスト・特番を削除しました");
    } catch {
      onNotify("削除に失敗しました", "error");
      return;
    }

    setEditingId(null);
    setForm(emptyExtraProgram());
    setIsConfirmModalOpen(false);
    setIsModalOpen(false);
    onChanged();
  };

  return (
    <div className="manager">
      <div className="manager-heading">
        <h3>ゲスト・特番</h3>
        <button type="button" onClick={create}>
          追加
        </button>
      </div>
      {items.length === 0 ? (
        <p className="empty">まだ登録がありません。</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="sticky-action-column"></th>
                <th>日付</th>
                <th>時間</th>
                <th>局</th>
                <th>番組名</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="sticky-action-column">
                    <button type="button" className="icon-button" aria-label={`${item.program_name}を編集`} onClick={() => edit(item)}>
                      <FiEdit aria-hidden="true" />
                    </button>
                  </td>
                  <td>{item.program_date}</td>
                  <td>
                    {item.start_time}〜{item.end_time}
                  </td>
                  <td>{item.station_name}</td>
                  <td>{item.program_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isModalOpen && (
        <AdminEditModal title={editingId ? "ゲスト・特番を編集" : "ゲスト・特番を追加"} onClose={() => setIsModalOpen(false)}>
          <form className="admin-modal-form" onSubmit={(event) => void submit(event)}>
            <div className="field-label field-with-tooltip">
              <span>日付</span>
              <input
                aria-label="日付"
                type="date"
                value={form.program_date}
                onChange={(event) => {
                  setForm({ ...form, program_date: event.target.value });
                  setFieldErrors({ ...fieldErrors, program_date: "" });
                }}
              />
              <FieldError message={fieldErrors.program_date} visibleKey={validationKey} />
            </div>
            <div className="time-form-row">
              <TimeSelect
                error={fieldErrors.start_time}
                errorKey={validationKey}
                label="開始"
                value={form.start_time}
                onChange={(startTime) => {
                  setForm({ ...form, start_time: startTime });
                  setFieldErrors({ ...fieldErrors, start_time: "" });
                }}
              />
              <TimeSelect
                error={fieldErrors.end_time}
                errorKey={validationKey}
                label="終了"
                value={form.end_time}
                onChange={(endTime) => {
                  setForm({ ...form, end_time: endTime });
                  setFieldErrors({ ...fieldErrors, end_time: "" });
                }}
              />
            </div>
            <div className="field-label field-with-tooltip">
              <span>局</span>
              <input
                aria-label="局"
                value={form.station_name}
                onChange={(event) => {
                  setForm({ ...form, station_name: event.target.value });
                  setFieldErrors({ ...fieldErrors, station_name: "" });
                }}
              />
              <FieldError message={fieldErrors.station_name} visibleKey={validationKey} />
            </div>
            <div className="field-label field-with-tooltip">
              <span>番組名</span>
              <input
                aria-label="番組名"
                value={form.program_name}
                onChange={(event) => {
                  setForm({ ...form, program_name: event.target.value });
                  setFieldErrors({ ...fieldErrors, program_name: "" });
                }}
              />
              <FieldError message={fieldErrors.program_name} visibleKey={validationKey} />
            </div>
            <div className="button-row admin-modal-actions">
              {editingId && (
                <button type="button" className="delete-outline-button" onClick={() => setIsConfirmModalOpen(true)}>
                  削除
                </button>
              )}
              <button type="submit" disabled={editingId !== null && !hasChanges}>
                {editingId ? "更新" : "追加"}
              </button>
            </div>
          </form>
        </AdminEditModal>
      )}
      {isConfirmModalOpen && editingId && (
        <AdminConfirmModal
          title="ゲスト・特番を削除"
          message="このゲスト・特番を削除します。元に戻せません。"
          confirmLabel="削除する"
          onConfirm={() => void remove(editingId)}
          onClose={() => setIsConfirmModalOpen(false)}
        />
      )}
    </div>
  );
}
