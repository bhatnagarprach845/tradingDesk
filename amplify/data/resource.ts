import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { authFunction } from "../functions/auth-function/resource";

const schema = a.schema({
  User: a.model({
    email: a.string().required(),
    password: a.string().required(),
    name: a.string(),
  }).authorization(allow => [
    allow.guest(),
    // GRANT THE LAMBDA ACCESS HERE
    allow.resource(authFunction).to(['read', 'create', 'update'])
  ]),

  login: a
    .query()
    .arguments({
      email: a.string(),
      password: a.string(),
    })
    .returns(a.string())
    .handler(a.handler.function(authFunction))
    .authorization((allow) => [allow.guest()]),

  signup: a
    .mutation()
    .arguments({
      email: a.string(),
      password: a.string(),
      name: a.string(),
    })
    .returns(a.string())
    .handler(a.handler.function(authFunction))
    .authorization((allow) => [allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "identityPool",
  },
});