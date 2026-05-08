export interface Task {
  max: number;
  current: number;
  // replaces %m with max and %c with current
  message: string;
  id: string;
  type: string;

  // Internal use only
  invalid?: boolean;
}
