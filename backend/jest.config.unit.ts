import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
  collectCoverageFrom: ['src/**/*.(t|j)s', '!src/generated/**'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^(\\.\\./)+generated/prisma/client\\.js$':
      '<rootDir>/src/application/__tests__/__mocks__/prisma-client.mock.ts',
    '^@prisma/adapter-pg$':
      '<rootDir>/src/application/__tests__/__mocks__/prisma-adapter-pg.mock.ts',
  },
};

export default config;
