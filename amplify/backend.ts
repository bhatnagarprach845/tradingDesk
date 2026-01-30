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

export default backend;