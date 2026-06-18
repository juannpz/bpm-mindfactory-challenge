/// <reference types="jest" />

/**
 * Utility for creating fully typed mock repository objects in tests.
 * Usage:
 *   const repo = mockRepo<ITramiteRepository>({ create: jest.fn(), ... });
 *   useCases = new TramiteUseCases(repo, ...);
 */
export function mockRepo<T extends object>(
  overrides: Partial<{ [K in keyof T]: jest.Mock }>,
): jest.Mocked<T> {
  return overrides as unknown as jest.Mocked<T>;
}
