
export interface Set {
  id: string;
  weight: number;
  reps: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: Set[];
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  exercises: Exercise[];
}

export type View = 'dashboard' | 'log' | 'history' | 'details';
