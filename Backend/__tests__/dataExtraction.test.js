jest.mock('../databaseOrders/shemas/index', () => ({
  Order: {
    find: jest.fn()
  }
}));

const { Order } = require('../databaseOrders/shemas/index');
const { getAllOrders } = require('../dataProcessing/dataExtraction');

describe('dataExtraction.getAllOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('връща списък с поръчки при успех', async () => {
    const mockOrders = [{ _id: '1' }, { _id: '2' }];
    Order.find.mockResolvedValue(mockOrders);

    await expect(getAllOrders()).resolves.toEqual(mockOrders);
    expect(Order.find).toHaveBeenCalledTimes(1);
  });

  test('хвърля стандартизирана грешка при проблем от базата', async () => {
    Order.find.mockRejectedValue(new Error('db failed'));

    await expect(getAllOrders()).rejects.toThrow('Some other error');
  });
});
