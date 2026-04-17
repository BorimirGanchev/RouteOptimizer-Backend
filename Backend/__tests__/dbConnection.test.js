describe('connectDB', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.MONGODB_URI = 'mongodb://localhost/test';
  });

  test('свързва се с очакваните mongoose настройки', async () => {
    const toArray = jest.fn().mockResolvedValue([{ name: 'Orders' }]);
    const listCollections = jest.fn(() => ({ toArray }));
    const connect = jest.fn().mockResolvedValue(undefined);

    jest.doMock('mongoose', () => ({
      connect,
      connection: {
        readyState: 1,
        db: {
          databaseName: 'Route-Optimizer',
          listCollections
        }
      }
    }));

    const connectDB = require('../databaseOrders/dbConnection');

    await expect(connectDB()).resolves.toBeUndefined();
    expect(connect).toHaveBeenCalledWith('mongodb://localhost/test', expect.objectContaining({
      authMechanism: 'SCRAM-SHA-1',
      dbName: 'Route-Optimizer',
      directConnection: true
    }));
    expect(listCollections).toHaveBeenCalledTimes(1);
    expect(toArray).toHaveBeenCalledTimes(1);
  });

  test('прехвърля грешка при неуспешна връзка', async () => {
    const connect = jest.fn().mockRejectedValue(new Error('db down'));

    jest.doMock('mongoose', () => ({
      connect,
      connection: {
        readyState: 0,
        db: {
          databaseName: 'Route-Optimizer',
          listCollections: jest.fn(() => ({ toArray: jest.fn() }))
        }
      }
    }));

    const connectDB = require('../databaseOrders/dbConnection');

    await expect(connectDB()).rejects.toThrow('db down');
  });
});
