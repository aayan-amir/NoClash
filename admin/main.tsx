import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdminApp } from './AdminApp';
import '../src/design/tokens.css';

const rootEl = document.getElementById('admin-root');
if (!rootEl) {
  throw new Error('Admin root element not found');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
