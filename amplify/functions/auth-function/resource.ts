import { defineFunction } from "@aws-amplify/backend";

export const authFunction = defineFunction({
  name: "auth-function",
  entry: "./handler.py",
  // Some versions of the CLI prefer the full string identifier
  runtime: 'python3.9',
  timeoutSeconds: 20,
});