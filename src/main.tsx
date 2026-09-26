import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './shared/context/AuthContext';
import { ThemeProvider } from './shared/context/ThemeContext';
import App from './App';
import './index.css';

/**
 * Constantes globales de configuración de React Query
 */
export const DEFAULT_QUERY_STALE_TIME_MS = 30 * 1000;
export const QUERY_RETRY_COUNT = 1;

/**
 * Cliente de TanStack React Query con configuración global optimizada:
 * - reintentos limitados para evitar bucles ante errores de red.
 * - refetchOnWindowFocus desactivado para no saturar las llamadas a la API.
 * - tiempo de frescura de caché (staleTime) controlado por constante.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_RETRY_COUNT,
      refetchOnWindowFocus: false,
      staleTime: DEFAULT_QUERY_STALE_TIME_MS,
    },
  },
});

const rootElement = document.getElementById('app');
if (!rootElement) {
  throw new Error('No se encontró el elemento raíz con id "app" en el DOM.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
