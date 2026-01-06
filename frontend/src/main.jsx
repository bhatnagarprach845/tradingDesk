import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './pages/App.jsx'
import { Amplify } from "aws-amplify";
import outputs from "C:/Users/bhatn/PycharmProjects/fifo-saas/amplify_outputs.json"; // <--- This line is the link!

Amplify.configure(outputs);
createRoot(document.getElementById('root')).render(<App />)
