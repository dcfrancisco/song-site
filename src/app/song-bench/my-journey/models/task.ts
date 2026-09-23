// src/app/models/task.ts
export type TaskStatus = 'Completed' | 'In Progress' | 'Pending' | 'Not Started';

export interface TaskLink {
  text: string;
  url: string;
}

export interface Task {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  progress: number;
  url: string;
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number | null;
  description?: string;
  externalLinks?: TaskLink[];
}
