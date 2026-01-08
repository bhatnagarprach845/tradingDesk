import { defineFunction } from "@aws-amplify/backend";

export const authFunction = defineFunction({
  name: "auth-function",
  // Amplify handles the bundling, pip install, and zipping automatically
  entry: "./handler.py",
  runtime: 3.9,
  timeoutSeconds: 20,
});