export class BlockchainNotConfiguredError extends Error {
  constructor(what: string) {
    super(`${what} is not configured`);
  }
}
