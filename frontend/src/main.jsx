
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App.jsx';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

Amplify.configure({
  ...outputs,
  API: {
    ...outputs.API, // Preserve existing API settings if any
    REST: {
      'AdminAPI': {
        endpoint: outputs.data.url,
        region: outputs.data.aws_region
      }
    }
  }
});
const config = Amplify.getConfig();
if (config.API && config.API.REST) {
  console.log("✅ AdminAPI is ready:", config.API.REST.AdminAPI.endpoint);
} else {
  console.error("❌ REST configuration failed to load.");
}
  console.log("Amplify configured successfully");
} else {
  console.warn("Amplify outputs not found. Running in Local Mode.");
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);