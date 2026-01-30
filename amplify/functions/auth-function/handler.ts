// amplify/functions/auth-function/handler.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { env } from "$amplify/env/authFunction";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  const { email, password, name } = event.arguments ?? {};
  const fieldName = event.fieldName; // 'login' or 'signup'
  const tableName = env.USER_TABLE_NAME;

  // --- SIGNUP LOGIC ---
  if (fieldName === "signup") {
    // 1. Check if user already exists
    const existingUser = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { email }
    }));

    if (existingUser.Item) {
      throw new Error("User already exists with this email.");
    }

    // 2. Hash the password (using 10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save to DynamoDB
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        email,
        name,
        password: hashedPassword, // Save only the hash!
        createdAt: new Date().toISOString()
      }
    }));

    return "User registered successfully!";
  }

  // --- LOGIN LOGIC ---
  if (fieldName === "login") {
    const response = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { email }
    }));

    const user = response.Item;

    if (user && await bcrypt.compare(password, user.password)) {
      const now = Math.floor(Date.now() / 1000);
      return jwt.sign(
        { sub: user.email, name: user.name, iat: now, exp: now + 86400 },
        env.JWT_SECRET!,
        { algorithm: "HS256" }
      );
    }
    throw new Error("Invalid email or password");
  }

  throw new Error("Unknown action");
};