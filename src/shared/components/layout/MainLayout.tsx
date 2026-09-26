import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import MobileTabBar from './MobileTabBar';

/**
 * Plantilla de Disposición Principal (`MainLayout`).
 *
 * Estructura la aplicación con la barra superior de navegación fija estilo macOS
 * y un contenedor dinámico adaptable en modo claro y oscuro. En móviles agrega
 * una tab bar inferior como hermano flex de `<main>` — al no ser `fixed`, el
 * `<main>` se encoge solo para dejarle espacio, sin necesidad de padding extra
 * ni de que las páginas conozcan su existencia.
 */
export const MainLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-zinc-100 text-zinc-900 overflow-hidden select-none">
      <Header />
      <main className="flex-1 overflow-hidden relative select-auto">
        <Outlet />
      </main>
      <MobileTabBar />
    </div>
  );
};

export default MainLayout;
