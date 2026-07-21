import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import App from './App';
import NoDep from './NoDep';
import './index.css';

// tiny pathname-based routing (no router dependency)
const Route = window.location.pathname.replace(/\/$/, '') === '/nodep' ? NoDep : App;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Route />
  </React.StrictMode>
);
