// amplify/functions/python-upload/resource.ts
import { defineFunction } from "@aws-amplify/backend";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export const pythonUpload = defineFunction((scope) => {
  const { Function, Code } = require("aws-cdk-lib/aws-lambda");

  return new Function(scope, "python-upload-lambda", {
    handler: "handler.handler", // filename.function_name
    runtime: Runtime.PYTHON_3_11,
    code: Code.fromAsset(path.dirname(__filename)), // Points to this folder
    timeoutSeconds: 30, // CSV processing can take time
  });
});