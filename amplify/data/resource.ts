import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { authFunction } from "../functions/auth-function/resource";
import { pythonUpload } from "../functions/python-upload/resource";
import { authorizerFunction } from "../functions/authorizer/resource";

const schema = a.schema({
  User: a.model({
    email: a.string().required(),
    password: a.string().required(),
    name: a.string(),
    role: a.string(), // "Admin" or "Guest"
    createdAt: a.datetime(),
  })
  .identifier(['email'])
  .authorization(allow => [
    allow.ownerDefinedIn("email"),
    allow.custom(), // Allows the Authorizer to grant access to Admins
  ]),

  listUsers: a.query()
    .returns(a.ref('User').array())
    .handler(a.handler.function(authFunction))
    .authorization(allow => [allow.custom()]), // Validated by your role logic

  login: a.query()
    .arguments({ email: a.string(), password: a.string() })
    .returns(a.string())
    .handler(a.handler.function(authFunction))
    .authorization(allow => [allow.guest()]), // Publicly accessible to allow login

  signup: a.mutation()
    .arguments({ email: a.string(), password: a.string(), name: a.string() })
    .returns(a.string())
    .handler(a.handler.function(authFunction))
    .authorization(allow => [allow.guest()]), // Publicly accessible to allow new users

  uploadCsv: a.mutation()
    .arguments({ csvData: a.string() })
    .returns(a.string())
    .handler(a.handler.function(pythonUpload))
    .authorization(allow => [allow.custom()]), // Only valid token holders (Guests/Admins)
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "lambda", // Sets Lambda as the primary gatekeeper
    lambdaAuthorizationMode: {
      function: authorizerFunction,
      timeToLiveInSeconds: 0, // Set to 0 to disable 401 caching for instant updates
    },
  },
});