import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import App from './App';
import NoDep from './NoDep';
import ReplyMode from './ReplyMode';
import Home from './Home';
import './index.css';

// tiny pathname-based routing (no router dependency)
// `/` is the landing selector; the beam homepage now lives at `/beams`.
const path = window.location.pathname.replace(/\/$/, '');
const Route =
  path === '/nodep'
    ? NoDep
    : path === '/reply'
    ? ReplyMode
    : path === '/beams'
    ? App
    : Home;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Route />
  </React.StrictMode>
);
