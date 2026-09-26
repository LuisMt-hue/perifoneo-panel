import React from 'react';

/**
 * Fondo decorativo estilo macOS Sonoma con degradados y esferas de luz difusas.
 */
export const LoginBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-slate-900 to-zinc-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 relative overflow-hidden select-none">
      {/* Luces de fondo decorativas estilo macOS */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {children}
    </div>
  );
};

export default LoginBackground;
