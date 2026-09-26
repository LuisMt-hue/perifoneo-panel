import React, { useMemo, useState } from 'react';
import { Smartphone, Radio } from 'lucide-react';
import { useDevicesManager } from './hooks/useDevicesManager';
import DevicesToolbar from './components/DevicesToolbar';
import DevicesTable from './components/DevicesTable';
import DeviceCreateModal from './components/DeviceCreateModal';
import DeviceEditModal from './components/DeviceEditModal';
import DeviceDeleteConfirmModal from './components/DeviceDeleteConfirmModal';
import BulkEditModal from './components/BulkEditModal';
import ManageListsModal from './components/ManageListsModal';
import type { ManagedDevice } from './types';

export const DevicesPage: React.FC = () => {
  const {
    devices,
    paginated,
    cargando,
    error,
    recargar,
    filters,
    setFilters,
    counts,
    geofences,
    groups,
    selectedIds,
    toggleSeleccion,
    seleccionarTodosVisibles,
    deseleccionarTodo,
    crearNuevoDispositivo,
    guardarDispositivoCompleto,
    confirmarEliminarDispositivo,
    eliminandoDispositivo,
    bulkEditarCampo,
    progresoLote,
    crearGrupo,
    renombrarGrupo,
    eliminarGrupo,
    renombrarBase,
    eliminarBase,
    progresoBase,
    sortConfig,
    onSortChange,
    paginaActual,
    setPaginaActual,
    filasPorPagina,
    setFilasPorPagina,
    totalPaginas,
    totalRegistros,
  } = useDevicesManager();

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalEdicionMasivaAbierto, setModalEdicionMasivaAbierto] = useState(false);
  const [modalGestionAbierto, setModalGestionAbierto] = useState(false);
  const [dispositivoParaEditar, setDispositivoParaEditar] = useState<ManagedDevice | null>(null);
  const [dispositivoParaEliminar, setDispositivoParaEliminar] = useState<ManagedDevice | null>(null);

  const basesConocidas = useMemo(() => {
    const set = new Set<string>();
    for (const d of devices) {
      const base = String(d.attributes?.base || '').trim();
      if (base) set.add(base);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  }, [devices]);

  const handleBulkEditSubmit = async (fieldOrKey: string, valor: string, isAttribute: boolean) => {
    const value = fieldOrKey === 'groupId' ? (valor ? Number(valor) : null) : valor;
    await bulkEditarCampo(Array.from(selectedIds), fieldOrKey, value, isAttribute);
    setModalEdicionMasivaAbierto(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-100/60 dark:bg-zinc-950/60 p-3 sm:p-5 lg:p-7 select-auto transition-colors">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-4 sm:gap-5">
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
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 pl-11.5">
              Perifoneadores y unidades móviles conectadas a Traccar.
            </p>
          </div>

          <div className="flex items-center gap-2 pl-11.5 sm:pl-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 shadow-2xs">
              <Radio size={12} className="text-emerald-500 animate-pulse" />
              <span>{devices.length} Total</span>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{counts.activos} Activos</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500 text-white text-[13px] font-semibold flex items-center justify-between shadow-md animate-in fade-in">
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

        <div className="rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
          <DevicesToolbar
            filters={filters}
            onFilterChange={setFilters}
            counts={counts}
            onOpenCreateDevice={() => setModalCrearAbierto(true)}
            onOpenManageLists={() => setModalGestionAbierto(true)}
          />

          <DevicesTable
            devices={paginated}
            selectedIds={selectedIds}
            onToggleSeleccion={toggleSeleccion}
            onSeleccionarTodos={seleccionarTodosVisibles}
            onDeseleccionarTodo={deseleccionarTodo}
            onOpenEditModal={(dev) => setDispositivoParaEditar(dev)}
            onEliminarDispositivo={(dev) => setDispositivoParaEliminar(dev)}
            onOpenBulkEdit={() => setModalEdicionMasivaAbierto(true)}
            sortConfig={sortConfig}
            onSortChange={onSortChange}
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onCambiarPagina={setPaginaActual}
            filasPorPagina={filasPorPagina}
            onCambiarFilasPorPagina={setFilasPorPagina}
            totalRegistros={totalRegistros}
            cargando={cargando}
          />
        </div>
      </div>

      <DeviceCreateModal
        isOpen={modalCrearAbierto}
        onClose={() => setModalCrearAbierto(false)}
        onCreate={crearNuevoDispositivo}
        geofences={geofences}
        groups={groups}
        basesConocidas={basesConocidas}
      />

      <DeviceEditModal
        device={dispositivoParaEditar}
        isOpen={Boolean(dispositivoParaEditar)}
        onClose={() => setDispositivoParaEditar(null)}
        onSave={guardarDispositivoCompleto}
        geofences={geofences}
        groups={groups}
        basesConocidas={basesConocidas}
      />

      <DeviceDeleteConfirmModal
        device={dispositivoParaEliminar}
        isOpen={Boolean(dispositivoParaEliminar)}
        onClose={() => setDispositivoParaEliminar(null)}
        onConfirm={async (id) => {
          await confirmarEliminarDispositivo(id);
          setDispositivoParaEliminar(null);
        }}
        isDeleting={eliminandoDispositivo}
      />

      <BulkEditModal
        isOpen={modalEdicionMasivaAbierto}
        onClose={() => setModalEdicionMasivaAbierto(false)}
        onSubmit={handleBulkEditSubmit}
        totalSeleccionados={selectedIds.size}
        progreso={progresoLote}
        geofences={geofences}
        groups={groups}
        basesConocidas={basesConocidas}
      />

      <ManageListsModal
        isOpen={modalGestionAbierto}
        onClose={() => setModalGestionAbierto(false)}
        groups={groups}
        devices={devices}
        onCreateGroup={crearGrupo}
        onRenameGroup={renombrarGrupo}
        onDeleteGroup={eliminarGrupo}
        onRenameBase={renombrarBase}
        onDeleteBase={eliminarBase}
        progresoBase={progresoBase}
      />
    </div>
  );
};

export default DevicesPage;
