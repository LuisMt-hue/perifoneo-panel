import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';

/**
 * Plantilla de Disposición Principal (`MainLayout`).
 *
 * Estructura la aplicación con la barra superior de navegación fija estilo macOS
 * y un contenedor dinámico adaptable en modo claro y oscuro.
 */
export const MainLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden select-none transition-colors duration-200">
      <Header />
      <main className="flex-1 overflow-hidden relative select-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
