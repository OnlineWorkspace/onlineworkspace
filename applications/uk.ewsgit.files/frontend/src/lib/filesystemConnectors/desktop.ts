import FilesystemConnector, { FilesystemConnectorEntryType, type FilesystemConnectorFileShareConditions, type FilesystemConnectorShareTarget } from "../../../lib/filesystemConnector.ts"

export default class DesktopFilesystemInterface extends FilesystemConnector {
  readDirectory(path: string): Promise<{ type: FilesystemConnectorEntryType; name: string }[]> {
    throw new Error("Method not implemented.")
  }
  readDirectoryItemCount(path: string): Promise<number> {
    throw new Error("Method not implemented.")
  }
  readFile(path: string): Promise<ReadableStream | undefined> {
    throw new Error("Method not implemented.")
  }
  writeFile(path: string, content: ReadableStream): Promise<boolean> {
    throw new Error("Method not implemented.")
  }
  getThumbnail(path: string, size: number): Promise<string | undefined> {
    throw new Error("Method not implemented.")
  }
  move(path: string, newPath: string): Promise<boolean> {
    throw new Error("Method not implemented.")
  }
  makeDirectory(path: string): Promise<boolean> {
    throw new Error("Method not implemented.")
  }
  delete(path: string): Promise<boolean> {
    throw new Error("Method not implemented.")
  }
  deletePermanently(path: string): Promise<boolean> {
    throw new Error("Method not implemented.")
  }
  getSharingConditions(path: string): Promise<FilesystemConnectorFileShareConditions> {
    throw new Error("Method not implemented.")
  }
  getSharingLink(path: string, shareTarget: FilesystemConnectorShareTarget): Promise<string | undefined> {
    throw new Error("Method not implemented.")
  }
  connectorType = "desktop-local"
}
