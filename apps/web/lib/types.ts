export type User = { id: string; email: string; name: string | null; dailyGoalMinutes: number };

export type Book = {
  id: string;
  title: string;
  author: string | null;
  format: 'PDF' | 'DOCX';
  originalName: string;
  totalPages: number | null;
  wordCount: number | null;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  error: string | null;
  page: number;
  percent: number;
  lastReadAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type Stats = {
  goalMinutes: number;
  todaySeconds: number;
  streak: number;
  week: { day: string; seconds: number }[];
  totalSeconds: number;
  finishedBooks: number;
};
