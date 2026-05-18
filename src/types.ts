export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type RegularProgram = {
  id: string;
  weekday: Weekday;
  start_time: string;
  end_time: string;
  station_name: string;
  program_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type GuestProgram = {
  id: string;
  program_date: string;
  start_time: string;
  end_time: string;
  station_name: string;
  program_name: string;
  created_at: string;
  updated_at: string;
};

export type PostHeader = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ProgramInput = {
  weekday: Weekday;
  start_time: string;
  end_time: string;
  station_name: string;
  program_name: string;
  is_active: boolean;
};

export type GuestProgramInput = {
  program_date: string;
  start_time: string;
  end_time: string;
  station_name: string;
  program_name: string;
};

export type PostHeaderInput = {
  title: string;
};

export type GeneratedProgram = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  stationName: string;
  programName: string;
  source: "regular" | "guest";
};
