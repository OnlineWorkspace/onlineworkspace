import path from "path-browserify";
import trpc from "./trpc";

export type UniformResourceLocator = `local:${string}` | `remote:${string}`;

class FilesystemInterface {
  createFile(url: UniformResourceLocator) {
    const parsedUrl = this.urlToPath(url);

    if (parsedUrl.type === "invalid") {
      return false;
    }

    if (parsedUrl.type === "local") {
      // Do some electron things
      return true;
    } else {
      // Call tRPC to perform the required actions
      return true;
    }
  }

  createDirectory(url: UniformResourceLocator) {
    const parsedUrl = this.urlToPath(url);

    if (parsedUrl.type === "invalid") {
      return false;
    }

    if (parsedUrl.type === "local") {
      // Do some electron things
      return true;
    } else {
      // Call tRPC to perform the required actions
      return true;
    }
  }

  async readDirectory(url: UniformResourceLocator) {
    const parsedUrl = this.urlToPath(url);

    if (parsedUrl.type === "invalid") {
      return { status: "invalid_path" as const };
    }

    if (parsedUrl.type === "local") {
      // @ts-ignore
      const readDirectoryResponse = await window.electronAPI.fs.readdir(parsedUrl.path);

      if (readDirectoryResponse.status === "ok") {
        return {
          status: readDirectoryResponse.status,
          items: readDirectoryResponse.items.map((newItem: string) => {
            return `${parsedUrl.type}:${path.join(parsedUrl.path, newItem)}` as UniformResourceLocator;
          }),
        };
      } else {
        return { status: readDirectoryResponse.status };
      }
    } else {
      const readDirectoryResponse = await trpc.readDirectory.query({ path: parsedUrl.path });

      if (readDirectoryResponse.status === "ok") {
        return {
          status: readDirectoryResponse.status,
          items: readDirectoryResponse.items.map((newItem) => {
            return `${parsedUrl.type}:${path.join(parsedUrl.path, newItem)}` as UniformResourceLocator;
          }),
        };
      } else {
        return { status: readDirectoryResponse.status };
      }
    }
  }

  getViewEntryBatchSize(url: UniformResourceLocator) {
    const parsedUrl = this.urlToPath(url);

    if (parsedUrl.type === "invalid") {
      return 0;
    }

    if (parsedUrl.type === "local") {
      return 4;
    } else {
      return 10;
    }
  }

  async getViewEntry(url: UniformResourceLocator, thumbnailSize?: number) {
    const parsedUrl = this.urlToPath(url);

    if (parsedUrl.type === "invalid") {
      return { status: "invalid_path" as const };
    }

    if (parsedUrl.type === "local") {
      // @ts-ignore
      const getEntryResponse = await window.electronAPI.files.get_entry(parsedUrl.path, thumbnailSize);

      if (getEntryResponse.status === "ok") {
        let thumbnail: string | undefined;

        if (getEntryResponse.data.thumbnail) {
          // @ts-ignore
          const blob = new Blob([getEntryResponse.data.thumbnail]);

          thumbnail = URL.createObjectURL(blob);
        }

        return {
          status: getEntryResponse.status,
          data: {
            ...getEntryResponse.data,
            path: `${parsedUrl.type}:${getEntryResponse.data.path}`,
            thumbnail: thumbnail,
          },
        };
      } else {
        return { status: getEntryResponse.status };
      }
    } else {
      const getEntryResponse = await trpc.view.getEntry.query({ path: parsedUrl.path, thumbnailSize: thumbnailSize });

      if (getEntryResponse.status === "ok") {
        return {
          status: getEntryResponse.status,
          data: {
            ...getEntryResponse.data,
            path: `${parsedUrl.type}:${getEntryResponse.data.path}`,
          },
        };
      } else {
        return { status: getEntryResponse.status };
      }
    }
  }

  async getQuota(location: "local" | "remote") {
    if (location === "local") return { maximum: -1, currentUsage: -1 };

    const quota = await trpc.quota.query();

    return quota;
  }

  async openInDefaultApplication(url: UniformResourceLocator) {
    const parsedUrl = this.urlToPath(url);

    if (parsedUrl.type === "invalid") {
      return { status: "invalid_path" as const };
    }

    if (parsedUrl.type === "local") {
      // @ts-ignore
      const openInDefaultApplicationResponse = await window.electronAPI.files.open_in_default_application(parsedUrl.path);

      if (openInDefaultApplicationResponse.status === "ok") {
        return { status: openInDefaultApplicationResponse.status };
      } else {
        return { status: openInDefaultApplicationResponse.status };
      }
    } else {
      alert("Cannot open remote files as no applications exist to open them yet.");
    }
  }

  joinUrls(...urls: UniformResourceLocator[]) {
    const firstUrlType = this.urlToPath(urls[0]).type;

    const paths: string[] = [];

    for (const url of urls) {
      const parsedUrl = this.urlToPath(url);

      if (parsedUrl.type === "invalid") {
        throw new Error(`Cannot join invalid fs URLs, \n${urls.join("\n")}`);
      }

      if (parsedUrl.type !== firstUrlType) {
        throw new Error(`Cannot join fs URLs which are of a different type, \n${urls.join("\n")}`);
      }

      paths.push(parsedUrl.path);
    }

    return `${firstUrlType}:${path.join(...paths)}`;
  }

  urlToPath(url: UniformResourceLocator): { type: "remote" | "local"; path: string } | { type: "invalid" } {
    if (url.startsWith("local:")) {
      return {
        type: "local",
        path: url.substring(6),
      };
    } else if (url.startsWith("remote:")) {
      return {
        type: "remote",
        path: url.substring(7),
      };
    }

    return {
      type: "invalid",
    };
  }
}

const filesystemInterface = new FilesystemInterface();

export default filesystemInterface;
