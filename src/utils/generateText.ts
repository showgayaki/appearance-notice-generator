import type { Appearance, GeneratedAppearance, PeriodHeader, RegularProgram } from "../types";
import { formatDisplayDate, getDatesInRange, getWeekday, timeToMinutes } from "./date";

const defaultTitle = "🌈今週テレビ🌈";

export const buildGeneratedAppearances = (
  regularPrograms: RegularProgram[],
  appearances: Appearance[],
  startDate: string,
  endDate: string,
): GeneratedAppearance[] => {
  const dates = getDatesInRange(startDate, endDate);
  const regularItems = dates.flatMap((date) =>
    regularPrograms
      .filter((program) => program.is_active && program.weekday === getWeekday(date))
      .map<GeneratedAppearance>((program) => ({
        id: `${program.id}-${date}`,
        date,
        startTime: program.start_time,
        endTime: program.end_time,
        stationName: program.station_name,
        programName: program.program_name,
        source: "regular",
      })),
  );

  const appearanceItems = appearances
    .filter((appearance) => appearance.appearance_date >= startDate && appearance.appearance_date <= endDate)
    .map<GeneratedAppearance>((appearance) => ({
      id: appearance.id,
      date: appearance.appearance_date,
      startTime: appearance.start_time,
      endTime: appearance.end_time,
      stationName: appearance.station_name,
      programName: appearance.program_name,
      source: "appearance",
    }));

  return [...regularItems, ...appearanceItems].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }
    return timeToMinutes(left.startTime) - timeToMinutes(right.startTime);
  });
};

export const findPeriodTitle = (headers: PeriodHeader[], startDate: string, endDate: string): string => {
  const matched = headers.find((header) => header.start_date === startDate && header.end_date === endDate);
  return matched?.title.trim() || defaultTitle;
};

export const generateAppearanceText = (title: string, items: GeneratedAppearance[]): string => {
  const blocks = items.map((item) => {
    const date = formatDisplayDate(item.date);
    return `${date}${item.startTime}〜${item.endTime}\n${item.stationName}「${item.programName}」`;
  });

  return [title, ...blocks].join("\n\n");
};
