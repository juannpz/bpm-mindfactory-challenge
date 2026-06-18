import { Injectable } from '@nestjs/common';
import { IFileStorage } from '@application/ports/file-storage.port';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalFileStorageService implements IFileStorage {
  private readonly basePath: string;

  constructor() {
    this.basePath = process.env.UPLOAD_DIR ?? './uploads';
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async save(
    filename: string,
    buffer: Buffer,
    _mimeType: string,
  ): Promise<string> {
    const storageKey = `${Date.now()}-${filename}`;
    const filePath = path.join(this.basePath, storageKey);
    await fs.promises.writeFile(filePath, buffer);
    return storageKey;
  }

  async get(storageKey: string): Promise<Buffer> {
    return fs.promises.readFile(path.join(this.basePath, storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = path.join(this.basePath, storageKey);
    if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
  }

  getUrl(storageKey: string): string {
    return `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/api/tramites/documentos/${storageKey}`;
  }
}
