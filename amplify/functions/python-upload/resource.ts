import { defineFunction } from "@aws-amplify/backend";
import { Runtime, Function, Code } from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export const pythonUpload = defineFunction((scope) => {
  return new Function(scope, "python-upload-lambda", {
    handler: "handler.handler",
    runtime: Runtime.PYTHON_3_11,
    // Using standard path.join with a fallback for the directory
    code: Code.fromAsset(path.join(process.cwd(), 'amplify', 'functions', 'python-upload')),
    timeoutSeconds: 30,
  });
});