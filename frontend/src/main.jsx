
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App.jsx';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

// Define the REST configuration using data from the outputs file
const customConfig = {
  ...outputs,
  API: {
    REST: {
      'AdminAPI': {
        endpoint: outputs.data.url,   // Dynamically pulls from your outputs
        region: outputs.data.aws_region
      }
    }
  }
};
if (outputs && outputs.data) {
  Amplify.configure({
      customConfig
});
  console.log("Configured APIs:", Amplify.getConfig().API.REST);
  console.log("Amplify configured successfully");
} else {
  console.warn("Amplify outputs not found. Running in Local Mode.");
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);