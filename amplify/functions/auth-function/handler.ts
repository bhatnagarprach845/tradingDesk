import * as jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET!;
const ALGORITHM = "HS256";

export const handler = async (event: any) => {
  const { email, password } = event.arguments ?? {};

  if (!email || !password) {
    throw new Error("Missing email or password");
  }

  if (email === "test@example.com" && password === "password123") {
    const now = Math.floor(Date.now() / 1000);

    return jwt.sign(
      {
        sub: email,
        iat: now,
        exp: now + 60 * 60 * 24,
        role: "user",
      },
      SECRET_KEY,
      { algorithm: ALGORITHM }
    );
  }

  throw new Error("Invalid email or password");
};
