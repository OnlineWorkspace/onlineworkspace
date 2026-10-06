import { type Accessor, createContext, useContext } from "solid-js";
import type { MediaItem, ShareTarget } from "./types";

export interface PhotosActions {
  pickAndUpload(): void;
  uploadFiles(files: File[]): Promise<void>;
  setFavorite(ids: number[], value: boolean): Promise<void>;
  setArchived(ids: number[], value: boolean): Promise<void>;
  /** Moves items to the trash, with an "Undo" in the confirmation. */
  trash(ids: number[]): Promise<boolean>;
  restore(ids: number[]): Promise<void>;
  deletePermanently(ids: number[]): void;
  emptyTrash(): void;
  addToAlbum(ids: number[]): void;
  removeFromAlbum(albumId: number, ids: number[]): Promise<void>;
  setAlbumCover(albumId: number, imageId: number): Promise<void>;
  createAlbum(ids?: number[]): void;
  renameAlbum(albumId: number, currentName: string): void;
  renamePerson(personId: number, currentName: string): void;
  deleteAlbum(albumId: number, name: string): void;
  editLocation(ids: number[], current?: string | null): void;
  share(target: ShareTarget): void;
  openNewMenu(x: number, y: number): void;
}

export interface PhotosContextValue {
  // bumped after every change so that lists know to reload
  version: Accessor<number>;
  refresh(): void;
  notify(message: string, action?: { label: string; onClick: () => void }): void;
  // a provider dialog is open, so keys should go to it rather than to the page behind it
  dialogOpen: Accessor<boolean>;
  counts: Accessor<{ favorites: number; archive: number; trash: number; total: number } | undefined>;
  // the photos on screen, in the order the viewer moves through them
  viewerItems: Accessor<MediaItem[]>;
  setViewerItems(owner: symbol, items: MediaItem[]): void;
  clearViewerItems(owner: symbol): void;
  actions: PhotosActions;
}

export const PhotosContext = createContext<PhotosContextValue>();

export function usePhotos(): PhotosContextValue {
  const context = useContext(PhotosContext);

  if (!context) throw new Error("usePhotos() must be used inside <PhotosProvider>");

  return context;
}
