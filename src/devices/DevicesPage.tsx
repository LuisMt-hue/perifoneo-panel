import React from 'react';
import { useDevicesManager } from './hooks/useDevicesManager';
import DevicesToolbar from './components/DevicesToolbar';
import DevicesTable from './components/DevicesTable';
import AddAttributeModal from './components/AddAttributeModal';
import BulkEditModal from './components/BulkEditModal';
import DeviceEditModal from './components/DeviceEditModal';

export const DevicesPage: React.FC = () => {
  const {
    devices,
    dispositivosFiltrados,
    dispositivosPaginados,
    cargando,
    error,
    recargar,
    filters,
    setFilters,
    columnasDisponibles,
    toggleVisibilidadColumna,
    todasLasClavesAtributos,
    selectedIds,
    toggleSeleccion,
    seleccionarTodosVisibles,
    deseleccionarTodo,
    savingCell,
    successCell,
    guardarEdicionInline,
    modalAtributoAbierto,
    setModalAtributoAbierto,
    modalEdicionMasivaAbierto,
    setModalEdicionMasivaAbierto,
    dispositivoParaEditar,
    setDispositivoParaEditar,
    guardarDispositivoCompleto,
    agregarAtributoMasivo,
    eliminarDispositivo,
    progresoLote,
    sortConfig,
    setSortConfig,
    paginaActual,
    setPaginaActual,
    filasPorPagina,
    setFilasPorPagina,
    totalPaginas,
    totalRegistros,
  } = useDevicesManager();

  // Conteo de estados
  const totalOnline = devices.filter((d) => d.status === 'online').length;
  const totalOffline = devices.length - totalOnline;

  const handleSortChange = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleBulkEditSubmit = async (clave: string, valor: string) => {
    await agregarAtributoMasivo(clave, valor, 'selected');
    setModalEdicionMasivaAbierto(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
      {/* Alerta de Error */}
      {error && (
        <div className="bg-rose-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
          <span>Error de conexión: {error}</span>
          <button
            type="button"
            onClick={recargar}
            className="underline hover:no-underline font-bold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Barra de Herramientas y Filtros */}
      <DevicesToolbar
        filters={filters}
        onFilterChange={setFilters}
        columnasDisponibles={columnasDisponibles}
        onToggleColumna={toggleVisibilidadColumna}
        todasLasClavesAtributos={todasLasClavesAtributos}
        totalDispositivos={devices.length}
        totalFiltrados={dispositivosFiltrados.length}
        totalOnline={totalOnline}
        totalOffline={totalOffline}
        onOpenAddAttribute={() => setModalAtributoAbierto(true)}
        onRecargar={recargar}
        cargando={cargando}
      />

      {/* Tabla Principal con Edición Inline */}
      <DevicesTable
        devices={dispositivosPaginados}
        columnasDisponibles={columnasDisponibles}
        selectedIds={selectedIds}
        onToggleSeleccion={toggleSeleccion}
        onSeleccionarTodos={seleccionarTodosVisibles}
        onDeseleccionarTodo={deseleccionarTodo}
        savingCell={savingCell}
        successCell={successCell}
        onInlineSave={guardarEdicionInline}
        onOpenEditModal={(dev) => setDispositivoParaEditar(dev)}
        onEliminarDispositivo={eliminarDispositivo}
        onOpenBulkEdit={() => setModalEdicionMasivaAbierto(true)}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onCambiarPagina={setPaginaActual}
        filasPorPagina={filasPorPagina}
        onCambiarFilasPorPagina={(num) => {
          setFilasPorPagina(num);
          setPaginaActual(1);
        }}
        totalRegistros={totalRegistros}
        cargando={cargando}
      />

      {/* Modal Agregar Atributo Global */}
      <AddAttributeModal
        isOpen={modalAtributoAbierto}
        onClose={() => setModalAtributoAbierto(false)}
        onSubmit={agregarAtributoMasivo}
        totalDispositivos={devices.length}
        totalSeleccionados={selectedIds.size}
        progreso={progresoLote}
      />

      {/* Modal Edición en Masa */}
      <BulkEditModal
        isOpen={modalEdicionMasivaAbierto}
        onClose={() => setModalEdicionMasivaAbierto(false)}
        onSubmit={handleBulkEditSubmit}
        clavesDisponibles={todasLasClavesAtributos}
        totalSeleccionados={selectedIds.size}
        progreso={progresoLote}
      />

      {/* Modal Clásico de Edición de Dispositivo */}
      <DeviceEditModal
        device={dispositivoParaEditar}
        isOpen={Boolean(dispositivoParaEditar)}
        onClose={() => setDispositivoParaEditar(null)}
        onSave={guardarDispositivoCompleto}
      />
    </div>
  );
};

export default DevicesPage;
