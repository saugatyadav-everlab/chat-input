import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import App from './App';
import NoDep from './NoDep';
import ReplyMode from './ReplyMode';
import Home from './Home';
import './index.css';

// tiny pathname-based routing (no router dependency)
// `/` is the landing selector; the chat-input page lives at `/input`.
const path = window.location.pathname.replace(/\/$/, '');
const Route =
  path === '/nodep'
    ? NoDep
    : path === '/header'
    ? ReplyMode
    : path === '/input'
    ? App
    : Home;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Route />
  </React.StrictMode>
);
