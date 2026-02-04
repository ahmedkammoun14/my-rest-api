module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/test/**/*.test.js'],
  testTimeout: 10000,
  forceExit: true,
  clearMocks: true,
};