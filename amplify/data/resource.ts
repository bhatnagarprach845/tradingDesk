import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { authFunction } from "../functions/auth-function/resource";

const schema = a.schema({
  User: a.model({
    email: a.string().required(),
    password: a.string().required(),
    name: a.string(),
  })
.identifier(['email']) // ✅ Explicitly set email as the Primary Key
.authorization(allow => [
    allow.guest(), // ONLY user-facing rules here
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
  .returns(a.string()) // This matches the JSON.dumps output from Python
  .handler(a.handler.function(pythonUpload))
  .authorization(allow => [allow.guest()]),
})
// ✅ MOVE RESOURCE ACCESS HERE (Global level)
.authorization(allow => [
  allow.resource(authFunction).to(['query', 'mutate', 'listen'])
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "identityPool",
  },
});