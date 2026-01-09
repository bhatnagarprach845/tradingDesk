import type { Handler } from 'aws-lambda';

export const handler: Handler = async (event, context) => {
  console.log("!!! LOG TEST: The Node.js backend was reached !!!");
  return "Hello from the backend!";
};