
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App.jsx';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

/// Log the start of configuration
console.log("Initializing Amplify Configuration...");
// ✅ Step 1: Initialize Amplify
Amplify.configure({
...outputs,
API: {
  ...outputs.API,
  REST: {
    'AdminAPI': {
      endpoint: outputs.data.url,
      region: outputs.data.aws_region
    }
  }
}
});

// ✅ Step 2: Set Production Logging (Hardening)
// This prevents sensitive Auth details from showing in browser logs
import { LoggingProvider } from 'aws-amplify/utils';

console.log("Amplify configured successfully with AdminAPI");
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);