
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App.jsx';
import { Amplify } from 'aws-amplify';
import outputs from 'C:/Users/bhatn/PycharmProjects/fifo-saas/amplify_outputs.json';

if (outputs && outputs.data) {
  Amplify.configure(outputs);
  console.log("Amplify configured successfully");
} else {
  console.warn("Amplify outputs not found. Running in Local Mode.");
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);