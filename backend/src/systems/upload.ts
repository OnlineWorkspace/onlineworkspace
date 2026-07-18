import type { Instance } from "../index.ts";
import System from "../system.ts";
import crypto from "node:crypto"

export default class UploadSystem extends System {
  // uploadId -> {userId: number, handleFile: (readableStream: ReadableStream) => void}
  fileUploads: Map<string, { userId: number, handleFile: (readableStream: ReadableStream) => void }>

  constructor(instance: Instance) {
    super("upload", instance);

    this.fileUploads = new Map();
  }

  createFileUpload(userId: number, handleFile: (readableStream: ReadableStream) => void): string {
    let uploadUUID: string;

    while(uploadUUID === undefined || this.fileUploads.has(uploadUUID)){
      uploadUUID = crypto.randomUUID()
    }

    this.fileUploads.set(uploadUUID, { userId, handleFile })

    return uploadUUID;
  }
}
