import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { defineFunction } from "@aws-amplify/backend";
import { Duration } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";

// Get the current directory of this resource file
const functionDir = path.dirname(fileURLToPath(import.meta.url));

export const authFunction = defineFunction((scope) => {
  return new Function(scope, "auth-function", {
    entry: "./handler.py", // Filename is handler.py, function name is handler
    runtime: Runtime.PYTHON_3_9, // Ensure this matches your local Python version
    timeout: Duration.seconds(20),
    // Point to the folder containing your handler.py and requirements.txt
    code: Code.fromAsset(functionDir),
  });
});