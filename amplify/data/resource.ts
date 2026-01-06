import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { authFunction } from "../functions/auth-function/resource"; // Adjust path to your python function resource

const schema = a.schema({
  // We define 'login' here.
  // If you use .query(), call it with client.queries.login()
  // If you use .mutation(), call it with client.mutations.login()
  login: a
    .query()
    .arguments({
      email: a.string(),
      password: a.string(),
    })
    .returns(a.string()) // This expects the JWT string back from Python
    .handler(a.handler.function(authFunction))
    .authorization((allow) => [allow.guest()]), // Allows login without being logged in
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "iam", // Or 'userPool' depending on your config
  },
});