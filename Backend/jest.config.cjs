module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'index.js',
    'middlewares/authMiddleware.js',
    'routes/orders.js',
    'databaseOrders/dbConnection.js',
    'dataProcessing/dataExtraction.js',
    'dataProcessing/dataProcessing.js'
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: {
    global: {
      branches: 99,
      functions: 99,
      lines: 99,
      statements: 99
    }
  }
};
