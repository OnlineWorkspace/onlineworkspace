import fs from "node:fs";
import path from "node:path";

const MEMORY_LIMIT = 2 * 1024 * 1024;
const FILE_LIMIT = 10 * 1024 * 1024;

/** The recent output of one process: a bounded in-memory tail for replay, mirrored to a log file which rotates once. */
export default class LogBuffer {
  private chunks: Uint8Array[] = [];
  private size = 0;
  private fileSize = 0;
  private fd: number | undefined;

  constructor(private readonly file: string) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.fileSize = fs.existsSync(file) ? fs.statSync(file).size : 0;
    this.restoreTail();
  }

  /** brings back the end of the previous log so the output survives a restart of the backend */
  private restoreTail() {
    if (this.fileSize === 0) return;

    const length = Math.min(this.fileSize, MEMORY_LIMIT);
    const buffer = Buffer.alloc(length);
    const fd = fs.openSync(this.file, "r");

    try {
      fs.readSync(fd, buffer, 0, length, this.fileSize - length);
    } finally {
      fs.closeSync(fd);
    }

    this.chunks.push(buffer);
    this.size = length;
  }

  append(data: Uint8Array) {
    const copy = new Uint8Array(data);

    this.chunks.push(copy);
    this.size += copy.length;

    while (this.size > MEMORY_LIMIT && this.chunks.length > 1) {
      this.size -= this.chunks.shift()!.length;
    }

    this.writeToFile(copy);
  }

  private writeToFile(data: Uint8Array) {
    try {
      if (this.fileSize + data.length > FILE_LIMIT) {
        this.close();
        fs.renameSync(this.file, `${this.file}.1`);
        this.fileSize = 0;
      }

      this.fd ??= fs.openSync(this.file, "a");
      fs.writeSync(this.fd, data);
      this.fileSize += data.length;
    } catch {
      // the terminal still works if the log file can't be written
    }
  }

  tail(): Uint8Array {
    return Buffer.concat(this.chunks);
  }

  /** forgets the in-memory tail, the log file is kept */
  clear() {
    this.chunks = [];
    this.size = 0;
  }

  close() {
    if (this.fd !== undefined) {
      try {
        fs.closeSync(this.fd);
      } catch {}
      this.fd = undefined;
    }
  }
}
