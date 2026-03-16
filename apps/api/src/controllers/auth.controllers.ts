import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PlatformUserCreateInput } from "@enterprise-commerce/core/platform/types"
import { createUser } from "../models/User"

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const newUser: PlatformUserCreateInput = {
    email,
    password,
  };

  try {
    const createdUser = await createUser(newUser);
    const accessToken = jwt.sign({ id: createdUser?.id }, process.env.JWT_SECRET || "no_key_set" as string, { expiresIn: '1h' });
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    res.status(201).json({ user: createdUser, accessToken, expiresAt });
  } catch (error) {
    res.status(500).json({ message: 'Could not register user' });
  }

};