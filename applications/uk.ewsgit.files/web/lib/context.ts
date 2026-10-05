import { type Accessor, createContext, type Resource, useContext } from "solid-js";
import type { Entry } from "./types";

export interface Place {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export interface FilesActions {
  open(entry: Entry): void;
  newFolder(directory?: string): void;
  newFile(directory?: string): void;
  pickAndUpload(directory?: string): void;
  uploadFiles(files: File[], directory?: string): Promise<void>;
  rename(entry: Entry): void;
  trash(entries: Entry[]): void;
  moveOrCopy(entries: Entry[], mode: "move" | "copy"): void;
  setStarred(entries: Entry[], starred: boolean): Promise<void>;
  share(entry: Entry): Promise<void>;
  download(entry: Entry): Promise<void>;
  openNewMenu(x: number, y: number, directory?: string): void;
  openEntryMenu(entries: Entry[], x: number, y: number): void;
  openPlaces(): void;
}

export interface FilesContextValue {
  places: Resource<Place[]>;
  // bumped after every change so that listings know to reload
  version: Accessor<number>;
  refresh(): void;
  // the folder that "New" and uploads target, kept up to date by the browse page
  currentDirectory: Accessor<string>;
  setCurrentDirectory(directory: string): void;
  notify(message: string): void;
  actions: FilesActions;
}

export const FilesContext = createContext<FilesContextValue>();

export function useFiles(): FilesContextValue {
  const context = useContext(FilesContext);

  if (!context) throw new Error("useFiles() must be used inside <FilesProvider>");

  return context;
}
