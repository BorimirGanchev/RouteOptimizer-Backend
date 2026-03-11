jest.mock('../dataProcessing/dataExtraction', () => ({
  getAllOrders: jest.fn()
}));

jest.mock('axios', () => ({
  create: jest.fn(() => ({ get: jest.fn() })),
  post: jest.fn()
}));

const dataExtraction = require('../dataProcessing/dataExtraction');
const axios = require('axios');
const dataProcessing = require('../dataProcessing/dataProcessing');
const axiosInstance = axios.create.mock.results[0].value;

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('dataProcessing handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAllOrders връща само нужните полета', async () => {
    dataExtraction.getAllOrders.mockResolvedValue([
      {
        fullName: 'Ivan Ivanov',
        senderAddress: 'Sofia',
        recipientAddress: 'Plovdiv',
        orderStatus: 'for deployment',
        senderPhone: '111',
        recipientPhone: '222',
        orderPrice: 42,
        hidden: 'ignore'
      }
    ]);

    const req = {};
    const res = createRes();

    await dataProcessing.getAllOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      {
        fullName: 'Ivan Ivanov',
        senderAddress: 'Sofia',
        recipientAddress: 'Plovdiv',
        orderStatus: 'for deployment',
        senderPhone: '111',
        recipientPhone: '222',
        orderPrice: 42
      }
    ]);
  });

  test('getAllOrders връща 500 при грешка', async () => {
    dataExtraction.getAllOrders.mockRejectedValue(new Error('DB error'));

    const res = createRes();
    await dataProcessing.getAllOrders({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
  });

  test('getOrdersCanceled филтрира canceled поръчки', async () => {
    dataExtraction.getAllOrders.mockResolvedValue([
      { id: 1, orderStatus: 'canceled' },
      { id: 2, orderStatus: 'for deployment' }
    ]);

    const res = createRes();
    await dataProcessing.getOrdersCanceled({ params: { status: 'canceled' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1, orderStatus: 'canceled' }]);
  });

  test('getOrdersPostponed филтрира posponed поръчки', async () => {
    dataExtraction.getAllOrders.mockResolvedValue([
      { id: 1, orderStatus: 'posponed' },
      { id: 2, orderStatus: 'for deployment' }
    ]);

    const res = createRes();
    await dataProcessing.getOrdersPostponed({ params: { status: 'posponed' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1, orderStatus: 'posponed' }]);
  });

  test('getOrdersForDelivery връща 400 при липса на валидни поръчки за deployment', async () => {
    dataExtraction.getAllOrders.mockResolvedValue([
      { _id: '1', orderStatus: 'canceled', senderAddress: 'Sofia' }
    ]);

    const res = createRes();
    await dataProcessing.getOrdersForDelivery({ headers: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No valid orders for deployment' });
  });

  test('getOrdersForDelivery връща 500 при грешка от външната услуга', async () => {
    dataExtraction.getAllOrders.mockResolvedValue([
      { _id: '1', orderStatus: 'for deployment', senderAddress: 'Sofia' }
    ]);

    axiosInstance.get.mockResolvedValue({
      data: {
        status: 'OK',
        results: [{ geometry: { location: { lat: 42.7, lng: 23.3 } } }]
      }
    });

    axios.post.mockRejectedValue(new Error('service down'));

    const res = createRes();
    await dataProcessing.getOrdersForDelivery({ headers: { authorization: 'Bearer t' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'service down' });
  });
});
