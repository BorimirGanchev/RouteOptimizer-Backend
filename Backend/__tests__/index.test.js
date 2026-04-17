const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

const loadIndex = () => {
  jest.resetModules();
  process.env.JWT_SECRET = 'jwt-secret';

  const routes = {
    get: new Map(),
    post: new Map(),
    put: new Map()
  };

  const app = {
    use: jest.fn(() => app),
    get: jest.fn((path, ...handlers) => {
      routes.get.set(path, handlers);
      return app;
    }),
    post: jest.fn((path, ...handlers) => {
      routes.post.set(path, handlers);
      return app;
    }),
    put: jest.fn((path, ...handlers) => {
      routes.put.set(path, handlers);
      return app;
    }),
    listen: jest.fn((port, host, callback) => {
      if (callback) {
        callback();
      }
      return app;
    })
  };

  const expressMock = jest.fn(() => app);
  expressMock.json = jest.fn(() => 'json-middleware');

  const corsMiddleware = 'cors-middleware';
  const getOrdersRouter = { kind: 'orders-router' };
  const authenticate = jest.fn((req, res, next) => next());
  const jwt = { verify: jest.fn(), sign: jest.fn() };
  const connectDB = jest.fn();

  const UserModel = jest.fn(function UserModel(data) {
    Object.assign(this, data);
    this._id = data._id || 'new-user-id';
    this.save = jest.fn().mockResolvedValue(this);
  });
  UserModel.findById = jest.fn();
  UserModel.find = jest.fn();
  UserModel.findOne = jest.fn();
  UserModel.findByIdAndUpdate = jest.fn();

  const OrderModel = jest.fn(function OrderModel(data) {
    Object.assign(this, data);
    this._id = data._id || 'new-order-id';
    this.save = jest.fn().mockResolvedValue(this);
  });
  OrderModel.find = jest.fn();
  OrderModel.findById = jest.fn();
  OrderModel.findByIdAndUpdate = jest.fn();

  const mongoose = { connection: { readyState: 1 } };

  jest.doMock('express', () => expressMock);
  jest.doMock('cors', () => jest.fn(() => corsMiddleware));
  jest.doMock('jsonwebtoken', () => jwt);
  jest.doMock('../databaseOrders/dbConnection', () => connectDB);
  jest.doMock('../databaseUsers/shemas/users', () => UserModel);
  jest.doMock('../databaseOrders/shemas/orderShema', () => OrderModel);
  jest.doMock('../routes/orders', () => getOrdersRouter);
  jest.doMock('mongoose', () => mongoose);
  jest.doMock('../middlewares/authMiddleware', () => authenticate);

  require('../index');

  return {
    app,
    routes,
    authenticate,
    connectDB,
    corsMiddleware,
    getOrdersRouter,
    jwt,
    mongoose,
    OrderModel,
    UserModel
  };
};

describe('index routes', () => {
  test('инициализира express приложението', () => {
    const { app, connectDB, corsMiddleware, getOrdersRouter } = loadIndex();

    expect(app.listen).toHaveBeenCalledWith(8000, '0.0.0.0', expect.any(Function));
    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(app.use).toHaveBeenCalledWith(corsMiddleware);
    expect(app.use).toHaveBeenCalledWith('json-middleware');
    expect(app.use).toHaveBeenCalledWith('/backend/orders', getOrdersRouter);
  });

  test('health и welcome routes връщат очаквания отговор', async () => {
    const { routes } = loadIndex();
    const healthRes = createRes();
    const rootRes = createRes();
    const backendRes = createRes();

    await routes.get.get('/health')[0]({}, healthRes);
    await routes.get.get('/')[0]({}, rootRes);
    await routes.get.get('/backend/')[0]({}, backendRes);

    expect(healthRes.status).toHaveBeenCalledWith(200);
    expect(healthRes.send).toHaveBeenCalledWith('OK');
    expect(rootRes.send).toHaveBeenCalledWith('Welcome to the Route Optimizer Backend!');
    expect(backendRes.send).toHaveBeenCalledWith('Welcome to the Route Optimizer Backend!');
  });

  test('/backend/user обработва unauthorized, липсващ user, success и грешка', async () => {
    const { routes, jwt, UserModel } = loadIndex();
    const handler = routes.get.get('/backend/user')[0];

    const unauthorizedRes = createRes();
    await handler({ headers: {} }, unauthorizedRes);

    jwt.verify.mockReturnValueOnce({ id: 'user-1' });
    UserModel.findById.mockResolvedValueOnce(null);
    const notFoundRes = createRes();
    await handler({ headers: { authorization: 'Bearer token' } }, notFoundRes);

    jwt.verify.mockReturnValueOnce({ id: 'user-2' });
    UserModel.findById.mockResolvedValueOnce({ _id: 'user-2' });
    const okRes = createRes();
    await handler({ headers: { authorization: 'Bearer token' } }, okRes);

    jwt.verify.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const errorRes = createRes();
    await handler({ headers: { authorization: 'Bearer token' } }, errorRes);

    expect(unauthorizedRes.status).toHaveBeenCalledWith(401);
    expect(notFoundRes.status).toHaveBeenCalledWith(404);
    expect(okRes.json).toHaveBeenCalledWith({ _id: 'user-2' });
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });

  test('/backend/users обработва unauthorized, success и грешка', async () => {
    const { routes, jwt, UserModel } = loadIndex();
    const handler = routes.get.get('/backend/users')[0];

    const unauthorizedRes = createRes();
    await handler({ headers: {} }, unauthorizedRes);

    jwt.verify.mockReturnValueOnce({ id: 'admin-1' });
    UserModel.find.mockResolvedValueOnce([{ _id: 'user-1' }]);
    const okRes = createRes();
    await handler({ headers: { authorization: 'Bearer token' } }, okRes);

    jwt.verify.mockImplementationOnce(() => {
      throw new Error('jwt down');
    });
    const errorRes = createRes();
    await handler({ headers: { authorization: 'Bearer token' } }, errorRes);

    expect(unauthorizedRes.status).toHaveBeenCalledWith(401);
    expect(UserModel.find).toHaveBeenCalledWith({ role: 'user', masterAdmin: 'admin-1' });
    expect(okRes.json).toHaveBeenCalledWith([{ _id: 'user-1' }]);
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });

  test('/backend/users/:id/orders обработва 404, success и грешка', async () => {
    const { routes, UserModel, OrderModel } = loadIndex();
    const handler = routes.get.get('/backend/users/:id/orders')[0];

    UserModel.findById.mockResolvedValueOnce(null);
    const notFoundRes = createRes();
    await handler({ params: { id: 'user-1' } }, notFoundRes);

    UserModel.findById.mockResolvedValueOnce({ orders: ['o1', 'o2'] });
    OrderModel.find.mockResolvedValueOnce([{ _id: 'o1' }, { _id: 'o2' }]);
    const okRes = createRes();
    await handler({ params: { id: 'user-1' } }, okRes);

    UserModel.findById.mockRejectedValueOnce(new Error('db down'));
    const errorRes = createRes();
    await handler({ params: { id: 'user-1' } }, errorRes);

    expect(notFoundRes.status).toHaveBeenCalledWith(404);
    expect(OrderModel.find).toHaveBeenCalledWith({ _id: { $in: ['o1', 'o2'] } });
    expect(okRes.json).toHaveBeenCalledWith([{ _id: 'o1' }, { _id: 'o2' }]);
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });

  test('/backend/users/:id/status обработва success и грешка', async () => {
    const { routes, UserModel } = loadIndex();
    const handler = routes.put.get('/backend/users/:id/status')[0];

    const okRes = createRes();
    await handler({ params: { id: 'user-1' }, body: { status: 'available' } }, okRes);

    UserModel.findByIdAndUpdate.mockRejectedValueOnce(new Error('update failed'));
    const errorRes = createRes();
    await handler({ params: { id: 'user-1' }, body: { status: 'available' } }, errorRes);

    expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith('user-1', { status: 'available' });
    expect(okRes.json).toHaveBeenCalledWith({ message: 'User status updated successfully' });
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });

  test('/backend/users/location обработва unauthorized и success', async () => {
    const { routes, jwt, UserModel } = loadIndex();
    const handler = routes.post.get('/backend/users/location')[0];

    const unauthorizedRes = createRes();
    await handler({ headers: {}, body: {} }, unauthorizedRes);

    jwt.verify.mockReturnValueOnce({ id: 'user-1' });
    const okRes = createRes();
    await handler({
      headers: { authorization: 'Bearer token' },
      body: { lat: 42.6, lng: 23.3 }
    }, okRes);

    expect(unauthorizedRes.status).toHaveBeenCalledWith(401);
    expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith('user-1', {
      location: { lat: 42.6, lng: 23.3 }
    });
    expect(okRes.status).toHaveBeenCalledWith(200);
  });

  test('/backend/orders/:id обработва 404, success и грешка', async () => {
    const { routes, OrderModel } = loadIndex();
    const handler = routes.get.get('/backend/orders/:id')[0];

    OrderModel.findById.mockResolvedValueOnce(null);
    const notFoundRes = createRes();
    await handler({ params: { id: 'order-1' } }, notFoundRes);

    OrderModel.findById.mockResolvedValueOnce({ _id: 'order-1' });
    const okRes = createRes();
    await handler({ params: { id: 'order-1' } }, okRes);

    OrderModel.findById.mockRejectedValueOnce(new Error('find failed'));
    const errorRes = createRes();
    await handler({ params: { id: 'order-1' } }, errorRes);

    expect(notFoundRes.status).toHaveBeenCalledWith(404);
    expect(okRes.json).toHaveBeenCalledWith({ _id: 'order-1' });
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });

  test('/backend/orders/:orderId обработва 404, success и грешка', async () => {
    const { routes, OrderModel } = loadIndex();
    const handler = routes.put.get('/backend/orders/:orderId')[0];

    OrderModel.findByIdAndUpdate.mockResolvedValueOnce(null);
    const notFoundRes = createRes();
    await handler({ params: { orderId: 'order-1' }, body: { orderStatus: 'done' } }, notFoundRes);

    OrderModel.findByIdAndUpdate.mockResolvedValueOnce({ _id: 'order-1', orderStatus: 'done' });
    const okRes = createRes();
    await handler({ params: { orderId: 'order-1' }, body: { orderStatus: 'done' } }, okRes);

    OrderModel.findByIdAndUpdate.mockRejectedValueOnce(new Error('update failed'));
    const errorRes = createRes();
    await handler({ params: { orderId: 'order-1' }, body: { orderStatus: 'done' } }, errorRes);

    expect(notFoundRes.status).toHaveBeenCalledWith(404);
    expect(okRes.json).toHaveBeenCalledWith({
      message: 'Order status updated successfully',
      updatedOrder: { _id: 'order-1', orderStatus: 'done' }
    });
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });

  test('/backend/user/:userId/removeOrder обработва 404, success и грешка', async () => {
    const { routes, UserModel } = loadIndex();
    const handler = routes.put.get('/backend/user/:userId/removeOrder')[0];

    UserModel.findByIdAndUpdate.mockResolvedValueOnce(null);
    const notFoundRes = createRes();
    await handler({ params: { userId: 'user-1' }, body: { orderId: 'order-1' } }, notFoundRes);

    UserModel.findByIdAndUpdate.mockResolvedValueOnce({ _id: 'user-1', orders: [] });
    const okRes = createRes();
    await handler({ params: { userId: 'user-1' }, body: { orderId: 'order-1' } }, okRes);

    UserModel.findByIdAndUpdate.mockRejectedValueOnce(new Error('pull failed'));
    const errorRes = createRes();
    await handler({ params: { userId: 'user-1' }, body: { orderId: 'order-1' } }, errorRes);

    expect(notFoundRes.status).toHaveBeenCalledWith(404);
    expect(okRes.json).toHaveBeenCalledWith({
      message: 'Order removed from user list',
      user: { _id: 'user-1', orders: [] }
    });
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });

  test('/backend/users/:id/ordersasaign обработва 400, 404, success и грешка', async () => {
    const { routes, UserModel } = loadIndex();
    const handler = routes.put.get('/backend/users/:id/ordersasaign')[0];

    const invalidRes = createRes();
    await handler({ params: { id: 'user-1' }, body: { orders: [] } }, invalidRes);

    UserModel.findByIdAndUpdate.mockResolvedValueOnce(null);
    const notFoundRes = createRes();
    await handler({ params: { id: 'user-1' }, body: { orders: ['o1'] } }, notFoundRes);

    UserModel.findByIdAndUpdate.mockResolvedValueOnce({ _id: 'user-1', orders: ['o1'] });
    const okRes = createRes();
    await handler({ params: { id: 'user-1' }, body: { orders: ['o1'] } }, okRes);

    UserModel.findByIdAndUpdate.mockRejectedValueOnce(new Error('push failed'));
    const errorRes = createRes();
    await handler({ params: { id: 'user-1' }, body: { orders: ['o1'] } }, errorRes);

    expect(invalidRes.status).toHaveBeenCalledWith(400);
    expect(notFoundRes.status).toHaveBeenCalledWith(404);
    expect(okRes.json).toHaveBeenCalledWith({
      message: 'Orders assigned successfully',
      user: { _id: 'user-1', orders: ['o1'] }
    });
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });

  test('/backend/login обработва 404, 400, success и грешка', async () => {
    const { routes, jwt, UserModel } = loadIndex();
    const handler = routes.post.get('/backend/login')[0];

    UserModel.findOne.mockResolvedValueOnce(null);
    const notFoundRes = createRes();
    await handler({ body: { email: 'a@b.com', password: '123' } }, notFoundRes);

    UserModel.findOne.mockResolvedValueOnce({ password: 'correct' });
    const invalidPasswordRes = createRes();
    await handler({ body: { email: 'a@b.com', password: 'wrong' } }, invalidPasswordRes);

    UserModel.findOne.mockResolvedValueOnce({
      _id: 'user-1',
      email: 'a@b.com',
      password: 'correct',
      role: 'admin'
    });
    jwt.sign.mockReturnValueOnce('signed-token');
    const okRes = createRes();
    await handler({ body: { email: 'a@b.com', password: 'correct' } }, okRes);

    UserModel.findOne.mockRejectedValueOnce(new Error('query failed'));
    const errorRes = createRes();
    await handler({ body: { email: 'a@b.com', password: 'correct' } }, errorRes);

    expect(notFoundRes.status).toHaveBeenCalledWith(404);
    expect(invalidPasswordRes.status).toHaveBeenCalledWith(400);
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'user-1', email: 'a@b.com', role: 'admin' },
      'jwt-secret',
      { expiresIn: '8h' }
    );
    expect(okRes.json).toHaveBeenCalledWith({
      message: 'Login successful',
      token: 'signed-token',
      user: { role: 'admin' }
    });
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });

  test('/backend/signup регистрира authenticate и обработва 400, success и грешка', async () => {
    const { routes, authenticate, UserModel } = loadIndex();
    const handlers = routes.post.get('/backend/signup');
    const signupHandler = handlers[1];

    expect(handlers[0]).toBe(authenticate);

    const invalidRes = createRes();
    await signupHandler({ body: {}, user: { _id: 'admin-1' } }, invalidRes);

    const okRes = createRes();
    await signupHandler({
      body: {
        name: 'Ivan',
        email: 'ivan@example.com',
        password: '1234',
        role: 'user',
        lat: 42.7,
        lng: 23.3
      },
      user: { _id: 'admin-1' }
    }, okRes);

    UserModel.mockImplementationOnce(function UserModelWithFail(data) {
      Object.assign(this, data);
      this.save = jest.fn().mockRejectedValue(new Error('save failed'));
    });
    const errorRes = createRes();
    await signupHandler({
      body: {
        name: 'Ivan',
        email: 'ivan@example.com',
        password: '1234',
        role: 'admin'
      },
      user: { _id: 'admin-1' }
    }, errorRes);

    expect(invalidRes.status).toHaveBeenCalledWith(400);
    expect(okRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'User created successfully'
    }));
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });

  test('/backend/create обработва 400, success и грешка', async () => {
    const { routes, OrderModel } = loadIndex();
    const handler = routes.post.get('/backend/create')[0];

    const invalidRes = createRes();
    await handler({ body: {} }, invalidRes);

    const okRes = createRes();
    await handler({
      body: {
        fullName: 'Ivan',
        senderAddress: 'Sofia',
        recipientAddress: 'Plovdiv',
        senderPhone: '111',
        recipientPhone: '222',
        orderPrice: 10
      }
    }, okRes);

    OrderModel.mockImplementationOnce(function OrderModelWithFail(data) {
      Object.assign(this, data);
      this.save = jest.fn().mockRejectedValue(new Error('save failed'));
    });
    const errorRes = createRes();
    await handler({
      body: {
        fullName: 'Ivan',
        senderAddress: 'Sofia',
        recipientAddress: 'Plovdiv',
        senderPhone: '111',
        recipientPhone: '222',
        orderPrice: 10
      }
    }, errorRes);

    expect(invalidRes.status).toHaveBeenCalledWith(400);
    expect(okRes.status).toHaveBeenCalledWith(201);
    expect(okRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Order created successfully'
    }));
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });
});
