type DateRangeToolbarProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

export function DateRangeToolbar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeToolbarProps) {
  return (
    <section className="toolbar" aria-label="期間選択">
      <div className="date-range-row">
        <div className="field-label">
          <span>開始日</span>
          <input aria-label="開始日" type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
        </div>
        <span className="range-separator">〜</span>
        <div className="field-label">
          <span>終了日</span>
          <input aria-label="終了日" type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} />
        </div>
      </div>
    </section>
  );
}
