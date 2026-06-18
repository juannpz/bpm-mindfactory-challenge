export class PrismaPg {
  connectionString: string;
  constructor(opts: { connectionString: string }) {
    this.connectionString = opts.connectionString;
  }
  connect() {}
  dispose() {}
}
