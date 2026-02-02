// amplify/functions/python-upload/resource.ts
import { defineFunction } from "@aws-amplify/backend";
import { Runtime, Function, Code } from "aws-cdk-lib/aws-lambda";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const pythonUpload = defineFunction((scope) => {
  return new Function(scope, "python-upload-lambda", {
    handler: "handler.handler", // filename.function_name
    runtime: Runtime.PYTHON_3_11,
    // Points to the current directory containing handler.py and fifo_engine.py
    code: Code.fromAsset(__dirname),
    timeoutSeconds: 30, // CSV processing can take time
  });
});