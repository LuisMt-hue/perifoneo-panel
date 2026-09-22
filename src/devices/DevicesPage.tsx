import React from 'react';
import { Smartphone, Radio } from 'lucide-react';
import { useDevicesManager } from './hooks/useDevicesManager';
import DevicesToolbar from './components/DevicesToolbar';
import DevicesTable from './components/DevicesTable';
import DeviceCreateModal from './components/DeviceCreateModal';
import DeviceEditModal from './components/DeviceEditModal';
import DeviceDeleteConfirmModal from './components/DeviceDeleteConfirmModal';
import ColumnVisibilityModal from './components/ColumnVisibilityModal';
import AttributeManagerModal from './components/AttributeManagerModal';
import BulkEditModal from './components/BulkEditModal';

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
    columnasVisibles,
    toggleVisibilidadColumna,
    marcarTodasColumnas,
    desmarcarTodasColumnas,
    restablecerColumnasPrioritarias,
    todasLasClavesAtributos,
    selectedIds,
    toggleSeleccion,
    seleccionarTodosVisibles,
    deseleccionarTodo,
    savingCell,
    successCell,
    guardarEdicionInline,
    modalCrearAbierto,
    setModalCrearAbierto,
    modalColumnasAbierto,
    setModalColumnasAbierto,
    modalAtributosAbierto,
    setModalAtributosAbierto,
    modalEdicionMasivaAbierto,
    setModalEdicionMasivaAbierto,
    dispositivoParaEditar,
    setDispositivoParaEditar,
    dispositivoParaEliminar,
    setDispositivoParaEliminar,
    eliminandoDispositivo,
    crearNuevoDispositivo,
    guardarDispositivoCompleto,
    confirmarEliminarDispositivo,
    crearAtributoMasivo,
    renombrarAtributoMasivo,
    eliminarAtributoMasivo,
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
    await crearAtributoMasivo(clave, valor, 'selected');
    setModalEdicionMasivaAbierto(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-100/60 dark:bg-zinc-950/60 p-3 sm:p-5 lg:p-7 select-auto transition-colors">
      {/* Contenedor Centrado con Ancho Máximo estilo Apple */}
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-4 sm:gap-5">
        {/* Encabezado de Página estilo Apple macOS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-2xl bg-blue-600/10 dark:bg-blue-400/20 text-[#155BD0] dark:text-blue-400 flex items-center justify-center shadow-xs">
                <Smartphone size={20} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Dispositivos de Perifoneo
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 pl-11.5">
              Control de perifoneadores, unidades móviles y atributos operativos conectados a Traccar.
            </p>
          </div>

          {/* Badges de Conexión en Vivo */}
          <div className="flex items-center gap-2 pl-11.5 sm:pl-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 shadow-2xs">
              <Radio size={12} className="text-emerald-500 animate-pulse" />
              <span>{devices.length} Total</span>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{totalOnline} Online</span>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span className="text-zinc-500">{totalOffline} Offline</span>
            </div>
          </div>
        </div>

        {/* Alerta de Error de Conexión si ocurre */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500 text-white text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in">
            <span>Error de conexión con Traccar: {error}</span>
            <button
              type="button"
              onClick={recargar}
              className="underline hover:no-underline font-bold cursor-pointer ml-2"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Tarjeta Principal de la Tabla estilo Apple macOS */}
        <div className="rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
          {/* Barra de Herramientas y Filtros */}
          <DevicesToolbar
            filters={filters}
            onFilterChange={setFilters}
            columnasDisponibles={columnasDisponibles}
            todasLasClavesAtributos={todasLasClavesAtributos}
            totalDispositivos={devices.length}
            totalFiltrados={dispositivosFiltrados.length}
            totalOnline={totalOnline}
            totalOffline={totalOffline}
            onOpenCreateDevice={() => setModalCrearAbierto(true)}
            onOpenAttributeManager={() => setModalAtributosAbierto(true)}
            onOpenColumnModal={() => setModalColumnasAbierto(true)}
            onRecargar={recargar}
            cargando={cargando}
          />

          {/* Tabla de Dispositivos */}
          <DevicesTable
            devices={dispositivosPaginados}
            columnasVisibles={columnasVisibles}
            selectedIds={selectedIds}
            onToggleSeleccion={toggleSeleccion}
            onSeleccionarTodos={seleccionarTodosVisibles}
            onDeseleccionarTodo={deseleccionarTodo}
            savingCell={savingCell}
            successCell={successCell}
            onInlineSave={guardarEdicionInline}
            onOpenEditModal={(dev) => setDispositivoParaEditar(dev)}
            onEliminarDispositivo={(dev) => setDispositivoParaEliminar(dev)}
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
        </div>
      </div>

      {/* Modal 1: Crear Nuevo Dispositivo */}
      <DeviceCreateModal
        isOpen={modalCrearAbierto}
        onClose={() => setModalCrearAbierto(false)}
        onCreate={crearNuevoDispositivo}
      />

      {/* Modal 2: Editar Dispositivo Completo */}
      <DeviceEditModal
        device={dispositivoParaEditar}
        isOpen={Boolean(dispositivoParaEditar)}
        onClose={() => setDispositivoParaEditar(null)}
        onSave={guardarDispositivoCompleto}
      />

      {/* Modal 3: Confirmar Eliminación de Dispositivo */}
      <DeviceDeleteConfirmModal
        device={dispositivoParaEliminar}
        isOpen={Boolean(dispositivoParaEliminar)}
        onClose={() => setDispositivoParaEliminar(null)}
        onConfirm={confirmarEliminarDispositivo}
        isDeleting={eliminandoDispositivo}
      />

      {/* Modal 4: Selector y Desmarqueo de Columnas con z-[100] */}
      <ColumnVisibilityModal
        isOpen={modalColumnasAbierto}
        onClose={() => setModalColumnasAbierto(false)}
        columnasDisponibles={columnasDisponibles}
        onToggleColumna={toggleVisibilidadColumna}
        onMarcarTodas={marcarTodasColumnas}
        onDesmarcarTodas={desmarcarTodasColumnas}
        onRestablecerPrioritarias={restablecerColumnasPrioritarias}
      />

      {/* Modal 5: CRUD de Atributos Personalizados */}
      <AttributeManagerModal
        isOpen={modalAtributosAbierto}
        onClose={() => setModalAtributosAbierto(false)}
        devices={devices}
        selectedIds={selectedIds}
        onCrearAtributo={crearAtributoMasivo}
        onRenombrarAtributo={renombrarAtributoMasivo}
        onEliminarAtributo={eliminarAtributoMasivo}
        progreso={progresoLote}
      />

      {/* Modal 6: Edición en Masa para Dispositivos Seleccionados */}
      <BulkEditModal
        isOpen={modalEdicionMasivaAbierto}
        onClose={() => setModalEdicionMasivaAbierto(false)}
        onSubmit={handleBulkEditSubmit}
        clavesDisponibles={todasLasClavesAtributos}
        totalSeleccionados={selectedIds.size}
        progreso={progresoLote}
      />
    </div>
  );
};

export default DevicesPage;
