import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET!;
const ALGORITHM = "HS256";

export const handler = async (event: any) => {
  console.log("Received event:", JSON.stringify(event));

  const { email, password } = event.arguments ?? {};

  if (!email || !password) {
    throw new Error("Missing email or password");
  }

  // Replace with real validation
  if (email === "test@example.com" && password === "password123") {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      sub: email,
      iat: now,
      exp: now + 60 * 60 * 24,
      role: "user",
    };

    return jwt.sign(payload, SECRET_KEY, { algorithm: ALGORITHM });
  }

  throw new Error("Invalid email or password");
};
