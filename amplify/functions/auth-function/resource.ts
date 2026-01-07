// amplify/functions/auth-function/resource.ts
import { defineFunction } from "@aws-amplify/backend";

export const authFunction = defineFunction({
  name: "auth-function",
  entry: "./handler.py" // Path to your Python file relative to this resource file
});