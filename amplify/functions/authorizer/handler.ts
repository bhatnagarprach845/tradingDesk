import jwt from "jsonwebtoken";

export const handler = async (event: any) => {
  const token = event.authorizationToken?.replace('Bearer ', '');
  const jwtSecret = process.env.JWT_SECRET;

  if (!token || !jwtSecret) {
    return { isAuthorized: false };
  }

  try {
    // 1. Verify the signature and expiration
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] }) as any;

    // 2. Check if the user belongs to the Admins group
    const isAdmin = decoded["cognito:groups"]?.includes("Admins");

    return {
      isAuthorized: isAdmin,
      resolverContext: {
        userId: decoded.sub,
        email: decoded.email,
        groups: JSON.stringify(decoded["cognito:groups"])
      }
    };
  } catch (err) {
    console.error("Token verification failed:", err);
    return { isAuthorized: false };
  }
};