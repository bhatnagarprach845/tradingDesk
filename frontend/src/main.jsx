
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App.jsx';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

if (outputs) {
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
} else {
  console.warn("Amplify outputs not found. Running in Local Mode.");
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);