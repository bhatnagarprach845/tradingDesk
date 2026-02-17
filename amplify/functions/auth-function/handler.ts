import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  const { email, password, name } = event.arguments ?? {};
  const fieldName = event.fieldName;
  const tableName = process.env.USER_TABLE_NAME;
  const jwtSecret = process.env.JWT_SECRET;

  if (!tableName || !jwtSecret) {
    throw new Error("Internal Server Error: Missing environment configuration.");
  }

  // --- SIGNUP LOGIC ---
  if (fieldName === "signup") {
    const existingUser = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { email }
    }));

    if (existingUser.Item) {
      throw new Error("User already exists with this email.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        email,
        name,
        password: hashedPassword,
        role: "Guest", // Default role for new signups
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

      // ✅ Determine group based on DynamoDB record
      const groups = user.role === "Admin" ? ["Admins"] : ["Guests"];

      return jwt.sign(
        {
          sub: user.email,
          name: user.name,
          "cognito:groups": groups,
          iss: "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_9wNrfQNBx",
          token_use: "access",
          iat: now,
          exp: now + 86400 // 24 hours
        },
        jwtSecret,
        { algorithm: "HS256" }
      );
    }
    throw new Error("Invalid email or password");
  }
if (fieldName === "adminFetchAllUsers") {
    const response = await docClient.send(new ScanCommand({
      TableName: tableName,
    }));

    // Return the items array which matches your User ref array in schema
    return response.Items ?? [];
  }
  throw new Error("Unknown action");
};