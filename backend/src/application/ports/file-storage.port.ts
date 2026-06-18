export interface IFileStorage {
  save(filename: string, buffer: Buffer, mimeType: string): Promise<string>;
  get(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
  getUrl(storageKey: string): string;
}
