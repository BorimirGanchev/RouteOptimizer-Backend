jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

jest.mock('../databaseUsers/shemas/users', () => ({
  findById: jest.fn()
}));

const jwt = require('jsonwebtoken');
const UserModel = require('../databaseUsers/shemas/users');
const authenticate = require('../middlewares/authMiddleware');

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('authenticate middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  test('връща 401 без bearer token', async () => {
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('връща 401 когато потребителят липсва', async () => {
    jwt.verify.mockReturnValue({ id: 'user-1' });
    UserModel.findById.mockResolvedValue(null);

    const req = { headers: { authorization: 'Bearer token' } };
    const res = createRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('token', 'test-secret');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  test('закача user към заявката и продължава', async () => {
    const user = { _id: 'user-1', name: 'Ivan' };
    jwt.verify.mockReturnValue({ id: 'user-1' });
    UserModel.findById.mockResolvedValue(user);

    const req = { headers: { authorization: 'Bearer token' } };
    const res = createRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('връща 401 при невалиден token', async () => {
    const error = new Error('invalid token');
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    const req = { headers: { authorization: 'Bearer token' } };
    const res = createRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token', error });
    expect(next).not.toHaveBeenCalled();
  });
});
