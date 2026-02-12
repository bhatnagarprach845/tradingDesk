
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App.jsx';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

// Log the start of configuration
console.log("Initializing Amplify Configuration...");

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
console.log("Amplify configured successfully with AdminAPI");
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);