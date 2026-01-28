import { defineFunction } from "@aws-amplify/backend";

export const authFunction = defineFunction({
  name: "auth-function",
  entry: "./handler.ts",
  runtime: 18,
  timeoutSeconds: 20,
  // 👇 THIS IS REQUIRED
  environment: {
    JWT_SECRET: "JWT_SECRET",
  },
bundling: {
    externalModules: [
      'jsonwebtoken',
      '@aws-sdk/client-dynamodb',
      '@aws-sdk/lib-dynamodb',
      '@aws-sdk/util-dynamodb'
    ],
  },
});
