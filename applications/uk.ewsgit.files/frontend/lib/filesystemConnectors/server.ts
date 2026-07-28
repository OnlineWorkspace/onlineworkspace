import FilesystemConnector, {
  FilesystemConnectorEntryType,
  type FilesystemConnectorFileShareConditions,
  type FilesystemConnectorShareTarget,
} from "../../../lib/filesystemConnector.ts";
import trpc from "../trpc.ts";

export default class ServerFilesystemInterface extends FilesystemConnector {
  connectorType = "server-local";

  async readDirectory(path: string): Promise<{ type: FilesystemConnectorEntryType; name: string }[]> {
    const resp = await trpc.readDirectory.query({path: path});

    if (resp.status === "ok") return resp.items;

    return [];
  }

  readDirectoryItemCount(path: string): Promise<number> {
    throw new Error("Method not implemented.");
  }

  readFile(path: string): Promise<ReadableStream | undefined> {
    throw new Error("Method not implemented.");
  }

  writeFile(path: string, content: ReadableStream): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  getThumbnail(path: string): Promise<Buffer | undefined> {
    throw new Error("Method not implemented.");
  }

  rename(path: string, newPath: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  makeDirectory(path: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  delete(path: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  deletePermanently(path: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  getSharingConditions(path: string): Promise<FilesystemConnectorFileShareConditions> {
    throw new Error("Method not implemented.");
  }

  getSharingLink(path: string, shareTarget: FilesystemConnectorShareTarget): Promise<string | undefined> {
    throw new Error("Method not implemented.");
  }
}
