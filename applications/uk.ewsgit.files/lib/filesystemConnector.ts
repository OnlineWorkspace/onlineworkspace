export enum FilesystemConnectorEntryType {
  Directory,
  File,
  Symlink,
}

export interface FilesystemConnectorFileShareConditions {
  memberOfGroups: string[];
  hasAdministratorPermissions: boolean;
}

export interface FilesystemConnectorShareTarget {
  type: "group" | "user";
  target: string;
}

export default abstract class FilesystemConnector {
  abstract connectorType: string;
  abstract readDirectory(path: string): Promise<{ type: FilesystemConnectorEntryType; name: string }[]>;
  abstract readDirectoryItemCount(path: string): Promise<number>;
  abstract readFile(path: string): Promise<ReadableStream | undefined>;
  abstract writeFile(path: string, content: ReadableStream): Promise<boolean>;
  abstract getThumbnail(path: string): Promise<Buffer | undefined>;
  abstract rename(path: string, newPath: string): Promise<boolean>;
  abstract makeDirectory(path: string): Promise<boolean>;
  abstract delete(path: string): Promise<boolean>;
  abstract deletePermanently(path: string): Promise<boolean>;
  abstract getSharingConditions(path: string): Promise<FilesystemConnectorFileShareConditions>;
  abstract getSharingLink(path: string, shareTarget: FilesystemConnectorShareTarget): Promise<string | undefined>;
}
