import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { authFunction } from "./functions/auth-function/resource";

const backend = defineBackend({
  auth,
  data,
  authFunction,
});

// The IAM policy is now automatically generated because of
// the allow.resource(authFunction) line in your resource.ts!
// You no longer need to manually call addToRolePolicy with hardcoded ARNs.

// 1. Get a reference to the DynamoDB table generated for the "User" model
const userTable = backend.data.resources.tables["User"];

// 2. Explicitly add the Table Name to your Lambda's environment variables
backend.authFunction.resources.lambda.addEnvironment(
  "USER_TABLE_NAME",
  userTable.tableName
);

// 3. Grant the Lambda permission to read/write to that table
userTable.grantReadWriteData(backend.authFunction.resources.lambda);
export default backend;