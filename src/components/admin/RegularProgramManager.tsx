import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import { deleteRegularProgram, saveRegularProgram } from "../../services/programs";
import type { ProgramInput, RegularProgram } from "../../types";
import { getWeekdayLabel } from "../../utils/date";
import { AdminConfirmModal } from "./AdminConfirmModal";
import { AdminEditModal } from "./AdminEditModal";
import { FieldError } from "./FieldError";
import { TimeSelect } from "./TimeSelect";
import { WeekdaySelect } from "./WeekdaySelect";

const emptyRegularProgram: ProgramInput = {
  weekday: 1,
  start_time: "",
  end_time: "",
  station_name: "",
  program_name: "",
  is_active: true,
};

const requireText = (value: string): string => value.trim();

type RegularProgramErrors = {
  start_time: string;
  end_time: string;
  station_name: string;
  program_name: string;
};

const emptyRegularProgramErrors: RegularProgramErrors = {
  start_time: "",
  end_time: "",
  station_name: "",
  program_name: "",
};

type RegularProgramManagerProps = {
  items: RegularProgram[];
  onChanged: () => void;
  onNotify: (message: string, kind?: "success" | "error") => void;
};

export function RegularProgramManager({ items, onChanged, onNotify }: RegularProgramManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramInput>(emptyRegularProgram);
  const [fieldErrors, setFieldErrors] = useState<RegularProgramErrors>(emptyRegularProgramErrors);
  const [validationKey, setValidationKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const editingItem = editingId ? items.find((item) => item.id === editingId) : undefined;
  const hasChanges =
    !editingId ||
    !editingItem ||
    form.weekday !== editingItem.weekday ||
    requireText(form.start_time) !== editingItem.start_time ||
    requireText(form.end_time) !== editingItem.end_time ||
    requireText(form.station_name) !== editingItem.station_name ||
    requireText(form.program_name) !== editingItem.program_name ||
    form.is_active !== editingItem.is_active;

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    const payload: ProgramInput = {
      ...form,
      start_time: requireText(form.start_time),
      end_time: requireText(form.end_time),
      station_name: requireText(form.station_name),
      program_name: requireText(form.program_name),
    };

    const nextFieldErrors: RegularProgramErrors = {
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
      await saveRegularProgram(payload, editingId ?? undefined);
      onNotify(isEditing ? "レギュラー番組を更新しました" : "レギュラー番組を追加しました");
    } catch {
      onNotify("保存に失敗しました", "error");
      return;
    }

    setEditingId(null);
    setForm(emptyRegularProgram);
    setIsModalOpen(false);
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
    setFieldErrors(emptyRegularProgramErrors);
    setValidationKey(0);
    setIsModalOpen(true);
  };

  const create = () => {
    setEditingId(null);
    setForm(emptyRegularProgram);
    setFieldErrors(emptyRegularProgramErrors);
    setValidationKey(0);
    setIsModalOpen(true);
  };

  const remove = async (id: string) => {
    try {
      await deleteRegularProgram(id);
      onNotify("レギュラー番組を削除しました");
    } catch {
      onNotify("削除に失敗しました", "error");
      return;
    }

    setEditingId(null);
    setForm(emptyRegularProgram);
    setIsConfirmModalOpen(false);
    setIsModalOpen(false);
    onChanged();
  };

  return (
    <div className="manager">
      <div className="manager-heading">
        <h3>レギュラー番組</h3>
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
                <th>曜日</th>
                <th>時間</th>
                <th>局</th>
                <th>番組名</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={!item.is_active ? "muted-row" : undefined}>
                  <td className="sticky-action-column">
                    <button type="button" className="icon-button" aria-label={`${item.program_name}を編集`} onClick={() => edit(item)}>
                      <FiEdit aria-hidden="true" />
                    </button>
                  </td>
                  <td>{getWeekdayLabel(item.weekday)}</td>
                  <td>
                    {item.start_time}〜{item.end_time}
                  </td>
                  <td>{item.station_name}</td>
                  <td>{item.program_name}</td>
                  <td>{item.is_active ? "有効" : "無効"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isModalOpen && (
        <AdminEditModal title={editingId ? "レギュラー番組を編集" : "レギュラー番組を追加"} onClose={() => setIsModalOpen(false)}>
          <form className="admin-modal-form" onSubmit={(event) => void submit(event)}>
            <WeekdaySelect value={form.weekday} onChange={(weekday) => setForm({ ...form, weekday })} />
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
            <div className="checkbox-label">
              <input
                aria-label="有効"
                checked={form.is_active}
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                type="checkbox"
              />
              <span>有効</span>
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
          title="レギュラー番組を削除"
          message="このレギュラー番組を削除します。元に戻せません。"
          confirmLabel="削除する"
          onConfirm={() => void remove(editingId)}
          onClose={() => setIsConfirmModalOpen(false)}
        />
      )}
    </div>
  );
}
