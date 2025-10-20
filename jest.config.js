module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'server.js',
    'lib/**/*.js',
    'services/**/*.js',
    '!node_modules/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  verbose: true,
  testTimeout: 30000
};