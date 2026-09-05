import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createLibraryForUser } from "../../libraries/repositories/librariesRepository.js";

import {
  createUser,
  getUserByEmail,
} from "../../users/repositories/usersRepository.js";
type RegisterData = {
  name?: string;
  email: string;
  password: string;
};

export const registerService = async ({
  name,
  email,
  password,
}: RegisterData) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await createUser({
    ...(name?.trim() && {
      name: name.trim(),
    }),
    email: normalizedEmail,
    passwordHash,
  });

  await createLibraryForUser(user.id, "Домашня бібліотека");

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign(
    {
      userId: user.id,
    },
    jwtSecret,
    {
      expiresIn: "7d",
    },
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  };
};

