import { defineFunction } from "@aws-amplify/backend";

export const authFunction = defineFunction({
  name: "auth-function",
  entry: "./handler.ts",
  runtime: 18,
  timeoutSeconds: 20,
});
