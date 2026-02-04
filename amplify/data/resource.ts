import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { authFunction } from "../functions/auth-function/resource";
import { pythonUpload } from "../functions/python-upload/resource";

const schema = a.schema({
  User: a.model({
    email: a.string().required(),
    password: a.string().required(), // Note: Ensure your Lambda hashes this!
    name: a.string(),
  })
  .identifier(['email'])
  .authorization(allow => [
    // Corrected the brackets here:
    allow.ownerDefinedIn("email"), // Uses the email field as the owner identity
    allow.group("Admins")
  ]),

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
    defaultAuthorizationMode: "userPool",
    apiKeyConfig: {
      expiresInDays: 7,
    },
  },
});