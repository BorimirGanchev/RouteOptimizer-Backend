module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'dataProcessing/dataExtraction.js',
    'dataProcessing/dataProcessing.js'
  ],
  coveragePathIgnorePatterns: ['/node_modules/']
};
