import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { authFunction } from "../functions/auth-function/resource";
import { pythonUpload } from "../functions/python-upload/resource";
import { authorizerFunction } from "../functions/authorizer/resource"; // ✅ Ensure this import exists

const schema = a.schema({
  User: a.model({
    email: a.string().required(),
    password: a.string().required(),
    name: a.string(),
    createdAt: a.datetime(),
  })
  .identifier(['email'])
  .authorization(allow => [
    allow.ownerDefinedIn("email"),
    allow.custom(), // ✅ Allows the Lambda Authorizer to grant access
  ]),

  listUsers: a.query()
    .returns(a.ref('User').array())
    .handler(a.handler.function(authFunction))
    .authorization(allow => [allow.custom()]), // ✅ Required for your custom Admin check

  login: a.query()
    .arguments({ email: a.string(), password: a.string() })
    .returns(a.string())
    .handler(a.handler.function(authFunction))
    .authorization(allow => [allow.guest()]),

  signup: a.mutation()
    .arguments({ email: a.string(), password: a.string(), name: a.string() })
    .returns(a.string())
    .handler(a.handler.function(authFunction))
    .authorization(allow => [allow.guest()]),

  uploadCsv: a.mutation()
    .arguments({
      csvData: a.string(),
    })
    .returns(a.string())
    .handler(a.handler.function(pythonUpload))
    .authorization(allow => [allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // ✅ Change default to 'lambda' to validate your custom HS256 tokens
    defaultAuthorizationMode: "lambda",
    lambdaAuthorizationMode: {
      function: authorizerFunction,
      timeToLiveInSeconds: 300,
    },
    apiKeyConfig: {
      expiresInDays: 7,
    },
  },
});