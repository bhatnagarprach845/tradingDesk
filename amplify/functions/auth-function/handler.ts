// amplify/functions/auth-function/handler.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  const { email, password } = event.arguments ?? {};
  
  // 1. Fetch user from the database
  // Note: Table names in Gen 2 usually contain a unique suffix, 
  // you might pass the table name as an env var in backend.ts
  const tableName = process.env.USER_TABLE_NAME; 

  const response = await git commit -m "fix: pin cdk versions across devDeps and overrides"docClient.send(new GetCommand({
    TableName: tableName,
    Key: { email } 
  }));

  const user = response.Item;

  // 2. Validate user and password (bcrypt.compare recommended here)
  if (user && user.password === password) {
    const now = Math.floor(Date.now() / 1000);
    return jwt.sign(
      { sub: email, iat: now, exp: now + 86400 },
      process.env.JWT_SECRET!,
      { algorithm: "HS256" }
    );
  }

  throw new Error("Invalid email or password");
};