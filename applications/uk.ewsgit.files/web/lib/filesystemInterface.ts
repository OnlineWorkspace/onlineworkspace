export type UniformResourceLocator = `local:${string}` | `remote:${string}`

export default class FilesystemInterface {
  createFile(url: UniformResourceLocator) {
    const parsedUrl = this.urlToPath(url);

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

    if (parsedUrl.type === "local") {
      // Do some electron things
      return true;
    } else {
      // Call tRPC to perform the required actions
      return true;
    }
  }

  urlToPath(url: UniformResourceLocator): {type: "remote" | "local", path: string} | {type: "invalid"} {
    if (url.startsWith("local:")) {
      return {
        type: "local",
        path: url.substring(7)
      }
    } else if (url.startsWith("remote:")) {
      return {
        type: "remote",
        path: url.substring(7)
      }
    }

    return {
      type: "invalid"
    }
  }
}
