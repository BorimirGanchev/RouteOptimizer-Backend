describe('orders router', () => {
  test('регистрира GET / към getOrdersForDelivery', () => {
    const router = { get: jest.fn() };
    const app = { use: jest.fn() };
    const expressMock = jest.fn(() => app);

    expressMock.Router = jest.fn(() => router);
    expressMock.json = jest.fn(() => 'json-middleware');

    jest.resetModules();
    jest.doMock('express', () => expressMock);
    jest.doMock('cors', () => jest.fn(() => 'cors-middleware'));
    jest.doMock('../dataProcessing/dataProcessing', () => ({
      getOrdersForDelivery: jest.fn()
    }));

    const processedData = require('../dataProcessing/dataProcessing');
    const exportedRouter = require('../routes/orders');

    expect(expressMock).toHaveBeenCalledTimes(1);
    expect(expressMock.json).toHaveBeenCalledTimes(1);
    expect(app.use).toHaveBeenCalledWith('cors-middleware');
    expect(app.use).toHaveBeenCalledWith('json-middleware');
    expect(router.get).toHaveBeenCalledWith('/', processedData.getOrdersForDelivery);
    expect(exportedRouter).toBe(router);
  });
});
