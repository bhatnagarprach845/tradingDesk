import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { authFunction } from "./functions/auth-function/resource";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  authFunction,
});

// Grant the function full access to the User table
//const userTable = backend.data.resources.tables["User"];
//userTable.grantReadWriteData(backend.authFunction.resources.lambda);

// Grant the function permission to the DynamoDB table
backend.authFunction.resources.lambda.addToRolePolicy({
  actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"],
  resources: ["arn:aws:dynamodb:REGION:ACCOUNT_ID:table/users"],
});

export default backend;
