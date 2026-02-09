import { defineFunction } from "@aws-amplify/backend";

export const authorizerFunction = defineFunction({
  name: "authorizer",
  entry: "./handler.ts", // This points to the handler code I gave you earlier
  runtime: 20, // ✅ Change this to 20 or the latest supported LTS
  environment: {
    // You must set this in the Amplify Console so the Lambda can verify tokens
    JWT_SECRET: process.env.JWT_SECRET || "fallback-secret-for-local-dev",
  },
});