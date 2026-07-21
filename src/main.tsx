import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import App from './App';
import NoDep from './NoDep';
import ReplyMode from './ReplyMode';
import './index.css';

// tiny pathname-based routing (no router dependency)
const path = window.location.pathname.replace(/\/$/, '');
const Route = path === '/nodep' ? NoDep : path === '/reply' ? ReplyMode : App;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Route />
  </React.StrictMode>
);
