import jwt from "jsonwebtoken";

export const handler = async (event: any) => {
  // 1. Log the incoming event to see exactly what AppSync sends
  console.log("DEBUG: Full Event:", JSON.stringify(event, null, 2));

  const authHeader = event.authorizationToken || "";
  console.log("DEBUG: Raw Authorization Header:", authHeader);

  // 2. Extract token and log the result
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  console.log("DEBUG: Extracted Token (first 10 chars):", token.substring(0, 10) + "...");

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("DEBUG: CRITICAL ERROR - JWT_SECRET is missing in environment variables.");
    return { isAuthorized: false };
  }

  try {
    // 3. Attempt verification and log decoded payload
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] }) as any;
    console.log("DEBUG: Decoded JWT Payload:", JSON.stringify(decoded, null, 2));

    const groups = decoded["cognito:groups"] || [];
    const isAdmin = groups.includes("Admins");
    const isGuest = groups.includes("Guests");

    console.log("DEBUG: Role Check - isAdmin:", isAdmin, "| isGuest:", isGuest);

    // 4. Return authorization status
    const authorized = isAdmin || isGuest;
    console.log("DEBUG: Final Decision - isAuthorized:", authorized);

    return {
      isAuthorized: authorized,
      resolverContext: {
        userId: decoded.sub,
        email: decoded.email,
        role: isAdmin ? "Admin" : "Guest",
        groups: JSON.stringify(groups)
      }
    };
  } catch (err: any) {
    // 5. Log specific JWT errors (Expired, Invalid Signature, Malformed)
    console.error("DEBUG: Token verification failed:", err.name, "| Message:", err.message);

    // If you see 'JsonWebTokenError: invalid signature', your JWT_SECRET is different
    // between the login function and this authorizer.
    return { isAuthorized: false };
  }
};