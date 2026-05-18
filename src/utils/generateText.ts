import type { GeneratedProgram, GuestProgram, PostHeader, RegularProgram } from "../types";
import { formatDisplayDate, getDatesInRange, getWeekday, timeToMinutes } from "./date";

const defaultTitle = "🌈今週テレビ🌈";

export const buildGeneratedPrograms = (
  regularPrograms: RegularProgram[],
  guestPrograms: GuestProgram[],
  startDate: string,
  endDate: string,
): GeneratedProgram[] => {
  const dates = getDatesInRange(startDate, endDate);
  const regularItems = dates.flatMap((date) =>
    regularPrograms
      .filter((program) => program.is_active && program.weekday === getWeekday(date))
      .map<GeneratedProgram>((program) => ({
        id: `${program.id}-${date}`,
        date,
        startTime: program.start_time,
        endTime: program.end_time,
        stationName: program.station_name,
        programName: program.program_name,
        source: "regular",
      })),
  );

  const guestItems = guestPrograms
    .filter((program) => program.program_date >= startDate && program.program_date <= endDate)
    .map<GeneratedProgram>((program) => ({
      id: program.id,
      date: program.program_date,
      startTime: program.start_time,
      endTime: program.end_time,
      stationName: program.station_name,
      programName: program.program_name,
      source: "guest",
    }));

  return [...regularItems, ...guestItems].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }
    return timeToMinutes(left.startTime) - timeToMinutes(right.startTime);
  });
};

export const findPostTitle = (headers: PostHeader[]): string => {
  return headers[0]?.title.trim() || defaultTitle;
};

export const generateProgramText = (title: string, items: GeneratedProgram[]): string => {
  const blocks = items.map((item) => {
    const date = formatDisplayDate(item.date);
    return `${date}${item.startTime}〜${item.endTime}\n${item.stationName}「${item.programName}」`;
  });

  return [title, ...blocks].join("\n\n");
};
