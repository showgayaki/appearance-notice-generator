import type { Weekday } from "../types";

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"] as const;

export const toYmd = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseYmd = (value: string): Date => {
  const [yearText, monthText, dayText] = value.split("-");
  return new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
};

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const getTodayYmd = (): string => toYmd(new Date());

export const getDefaultEndYmd = (): string => toYmd(addDays(new Date(), 6));

export const getDatesInRange = (startDate: string, endDate: string): string[] => {
  const start = parseYmd(startDate);
  const end = parseYmd(endDate);
  const dates: string[] = [];

  for (let date = start; date <= end; date = addDays(date, 1)) {
    dates.push(toYmd(date));
  }

  return dates;
};

export const getWeekday = (date: string): Weekday => {
  const value = parseYmd(date).getDay();
  if (value === 0 || value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6) {
    return value;
  }
  return 0;
};

export const getWeekdayLabel = (weekday: Weekday): string => weekdayLabels[weekday];

export const formatDisplayDate = (date: string): string => {
  const parsed = parseYmd(date);
  return `${parsed.getMonth() + 1}/${parsed.getDate()}(${weekdayLabels[parsed.getDay()]})`;
};

export const timeToMinutes = (time: string): number => {
  const [hourText, minuteText] = time.split(":");
  return Number(hourText) * 60 + Number(minuteText);
};
