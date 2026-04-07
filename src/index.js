// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import global CSS, including Tailwind base
import './App.css'; // Import App-specific CSS (now mostly empty due to Tailwind)
import App from './App'; // Import the root App component
import reportWebVitals from './reportWebVitals'; // For performance monitoring

// Get the root DOM element where the React application will be mounted.
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the main App component into the root.
// React.StrictMode is a tool for highlighting potential problems in an application.
// It activates additional checks and warnings for its descendants.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
