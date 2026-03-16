import bcrypt from 'bcryptjs';
import openDb from '../db/db';
import { createUser } from './User';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../db/db', () => jest.fn());

describe('createUser', () => {
  it('hashes password and inserts user into database', async () => {
    const run = jest.fn().mockResolvedValue({ lastID: 7 });
    const close = jest.fn().mockResolvedValue(undefined);

    (openDb as unknown as jest.Mock).mockResolvedValue({ run, close });
    (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hashed-password');

    const result = await createUser({
      email: 'user@example.com',
      password: 'Aa!12345',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('Aa!12345', 10);
    expect(run).toHaveBeenCalledWith('INSERT INTO users (email, password) VALUES (?, ?)', 'user@example.com', 'hashed-password');
    expect(close).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: '7' });
  });

  it('always closes db even when insert fails', async () => {
    const run = jest.fn().mockRejectedValue(new Error('insert failed'));
    const close = jest.fn().mockResolvedValue(undefined);

    (openDb as unknown as jest.Mock).mockResolvedValue({ run, close });
    (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hashed-password');

    await expect(
      createUser({
        email: 'user@example.com',
        password: 'Aa!12345',
      }),
    ).rejects.toThrow('insert failed');

    expect(close).toHaveBeenCalledTimes(1);
  });
});
