import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

import './styles/base.css';
import './styles/theme.css';
import './styles/global.css';

const ROOT_ELEMENT_ID = 'root';

const rootElement = document.getElementById(ROOT_ELEMENT_ID);
if (!rootElement) {
  throw new Error(`Root element #${ROOT_ELEMENT_ID} not found in document`);
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
