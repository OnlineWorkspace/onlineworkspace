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
      // Do some electron things
      return { status: "missing_permission" as const };
    } else {
      console.log(parsedUrl.path);
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

  async getViewEntry(url: UniformResourceLocator, viewType: "details" | "grid") {
    const parsedUrl = this.urlToPath(url);

    if (parsedUrl.type === "invalid") {
      return { status: "invalid_path" as const };
    }

    if (parsedUrl.type === "local") {
      // Do some electron things
      return { status: "missing_permission" as const };
    } else {
      const getEntryResponse = await trpc.view.getEntry.query({ path: parsedUrl.path, thumbnailSize: viewType === "details" ? 32 : 128 });

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
        path: url.substring(7),
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
