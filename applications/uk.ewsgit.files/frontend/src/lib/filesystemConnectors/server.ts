import FilesystemConnector, {
  type FilesystemConnectorEntryType,
  type FilesystemConnectorFileShareConditions,
  type FilesystemConnectorShareTarget,
} from "../../../lib/filesystemConnector.ts";
import trpc from "../trpc.ts";

export default class ServerFilesystemConnector extends FilesystemConnector {
  connectorType = "server-local";

  async readDirectory(path: string): Promise<{ type: FilesystemConnectorEntryType; name: string }[]> {
    const resp = await trpc.filesystemConnector.readDirectory.query({ path });

    if (resp.status === "ok") return resp.items;

    return [];
  }

  async readDirectoryItemCount(path: string): Promise<number> {
    const resp = await trpc.filesystemConnector.readDirectoryItemCount.query({ path });

    if (resp.status === "ok") return resp.count;

    return 0;
  }

  // TODO: this
  async readFile(_path: string): Promise<ReadableStream | undefined> {
    throw new Error("Method not implemented.");
  }

  // TODO: this
  async writeFile(_path: string, _content: ReadableStream): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async getThumbnail(path: string, size: number): Promise<string | undefined> {
    const resp = await trpc.filesystemConnector.getThumbnail.query({ path, size: size });

    if (resp.status === "ok") return URL.createObjectURL(new Blob([Buffer.from(resp.thumbnail, "base64")], { type: "image/webp" }));

    return undefined;
  }

  async move(path: string, newPath: string): Promise<boolean> {
    const resp = await trpc.filesystemConnector.move.mutate({ path, newPath });

    if (resp.status === "ok") return true;

    return false;
  }

  async makeDirectory(path: string): Promise<boolean> {
    const resp = await trpc.filesystemConnector.makeDirectory.mutate({ path });

    if (resp.status === "ok") return true;

    return false;
  }

  async delete(path: string): Promise<boolean> {
    const resp = await trpc.filesystemConnector.delete.mutate({ path });

    if (resp.status === "ok") return true;

    return false;
  }

  async deletePermanently(path: string): Promise<boolean> {
    const resp = await trpc.filesystemConnector.deletePermanently.mutate({ path });

    if (resp.status === "ok") return true;

    return false;
  }

  async getSharingConditions(_path: string): Promise<FilesystemConnectorFileShareConditions> {
    throw new Error("Method not implemented.");
  }

  async getSharingLink(_path: string, _shareTarget: FilesystemConnectorShareTarget): Promise<string | undefined> {
    throw new Error("Method not implemented.");
  }
}
