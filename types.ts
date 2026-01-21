
export type ActionType = 'write' | 'explain';
export type Position = 'top' | 'below' | 'center';

export interface LessonStep {
  action: ActionType;
  content: string;
  position?: Position;
}

export interface LessonData {
  lesson: LessonStep[];
}

export interface BoardContent {
  id: string;
  text: string;
  position: Position;
  timestamp: number;
}
