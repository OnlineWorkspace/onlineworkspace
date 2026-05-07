export interface Task {
  parent: `view${number}` | string;
  max: number;
  current: number;
  // replaces %m with max and %c with current
  message: string;
  id: string;
  type: string;

  // Internal use only
  invalid?: boolean;
}
