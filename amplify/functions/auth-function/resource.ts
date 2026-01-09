import { defineFunction } from "@aws-amplify/backend";

export const authFunction = defineFunction({
  name: "auth-function",
  entry: "./handler.py",
  runtime: "python3.9",
  timeoutSeconds: 20,
});
