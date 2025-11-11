import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { CartProvider } from './context/CartContext';
import { PosterAccessProvider } from './context/PosterAccessContext';
import { InventoryProvider } from './context/InventoryContext';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container missing in index.html');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <PosterAccessProvider>
          <InventoryProvider>
            <App />
          </InventoryProvider>
        </PosterAccessProvider>
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
