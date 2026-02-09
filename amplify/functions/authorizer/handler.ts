import jwt from "jsonwebtoken";

export const handler = async (event: any) => {
  // Extract token from header (supports raw token or 'Bearer <token>')
  const token = event.authorizationToken?.startsWith('Bearer ')
    ? event.authorizationToken.split(' ')[1]
    : event.authorizationToken;

  const jwtSecret = process.env.JWT_SECRET;

  if (!token || !jwtSecret) {
    console.error("Missing token or JWT_SECRET");
    return { isAuthorized: false };
  }

  try {
    // 1. Verify the signature and expiration
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] }) as any;
    const groups = decoded["cognito:groups"] || [];

    // 2. Determine Role
    const isAdmin = groups.includes("Admins");
    const isGuest = groups.includes("Guests");

    // 3. Authorize if they belong to either allowed group
    return {
      isAuthorized: isAdmin || isGuest,
      resolverContext: {
        userId: decoded.sub,
        email: decoded.email,
        role: isAdmin ? "Admin" : "Guest", // Useful for resolver logic
        groups: JSON.stringify(groups)
      }
    };
  } catch (err) {
    console.error("Token verification failed:", err);
    return { isAuthorized: false };
  }
};