const path = require('path')

module.exports = {
  rootDir: path.resolve(__dirname),
  testEnvironment: 'node',
  testURL: 'http://localhost',
  setupFilesAfterEnv: ['jest-extended'],
  moduleFileExtensions: [
    'js',
    'json'
  ],
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/lib/$1'
  },
  collectCoverage: true, // Change this to true to enable coverage
  collectCoverageFrom: [
    '<rootDir>/lib/*.js',
    '!**/node_modules/**'
  ],
  coverageReporters: ['html', 'text-summary']
}
