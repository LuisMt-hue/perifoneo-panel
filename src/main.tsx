import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';

/**
 * Cliente de TanStack React Query con configuración global optimizada:
 * - reintentos limitados a 1 para evitar bucles ante errores de red.
 * - refetchOnWindowFocus desactivado para no saturar las llamadas a la API.
 * - tiempo de frescura de caché (staleTime) de 30 segundos.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
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
