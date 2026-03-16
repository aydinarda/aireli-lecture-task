import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { registerUser } from './auth.controllers';
import { createUser } from '../models/User';

jest.mock('../models/User', () => ({
  createUser: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('registerUser', () => {
  const makeRes = () => {
    const status = jest.fn();
    const json = jest.fn();
    status.mockReturnValue({ json });
    return { status, json } as unknown as Response;
  };

  it('returns 400 when email or password is missing', async () => {
    const req = { body: { email: 'user@example.com' } } as Request;
    const res = makeRes();

    await registerUser(req, res);

    expect((createUser as unknown as jest.Mock)).not.toHaveBeenCalled();
    expect((res.status as unknown as jest.Mock)).toHaveBeenCalledWith(400);
    expect((res.json as unknown as jest.Mock)).toHaveBeenCalledWith({ message: 'Email and password are required' });
  });

  it('returns 201 and created user when registration succeeds', async () => {
    const req = { body: { email: 'user@example.com', password: 'Aa!12345' } } as Request;
    const res = makeRes();

    (createUser as unknown as jest.Mock).mockResolvedValue({ id: '1' });
    (jwt.sign as unknown as jest.Mock).mockReturnValue('token-123');

    await registerUser(req, res);

    expect(createUser).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Aa!12345',
    });
    expect(jwt.sign).toHaveBeenCalledWith({ id: '1' }, process.env.JWT_SECRET || 'no_key_set', { expiresIn: '1h' });
    expect((res.status as unknown as jest.Mock)).toHaveBeenCalledWith(201);
    expect((res.json as unknown as jest.Mock)).toHaveBeenCalledWith({
      user: { id: '1' },
      accessToken: 'token-123',
      expiresAt: expect.any(String),
    });
  });

  it('returns 500 when createUser throws', async () => {
    const req = { body: { email: 'user@example.com', password: 'Aa!12345' } } as Request;
    const res = makeRes();

    (createUser as unknown as jest.Mock).mockRejectedValue(new Error('db error'));

    await registerUser(req, res);

    expect((res.status as unknown as jest.Mock)).toHaveBeenCalledWith(500);
    expect((res.json as unknown as jest.Mock)).toHaveBeenCalledWith({ message: 'Could not register user' });
  });
});
