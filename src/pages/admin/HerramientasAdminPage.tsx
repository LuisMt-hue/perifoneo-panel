import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Wrench,
  Calculator,
  RefreshCw,
  User,
  Terminal,
} from 'lucide-react';
import {
  recalcularDatos,
  forzarSincronizacion,
  obtenerAuditoria,
  obtenerDispositivos,
} from '../../services/api/endpoints';
import FiltroFechas from '../../components/ui/FiltroFechas';
import TablaDatos from '../../components/ui/TablaDatos';
import { formatearFechaHora, hoy } from '../../utils/formato';
import type {
  Dispositivo,
  RegistroAuditoria,
} from '../../types/perifoneo.types';
import type { ParametrosRecalcular, MensajeRespuesta } from '../../types/api.types';

/**
 * Página de Herramientas Administrativas y Auditoría estilo macOS (`HerramientasAdminPage`).
 *
 * Utilidades para recálculo de datos espaciales, forzado de sincronización
 * y visualización de la bitácora de auditoría del sistema.
 */
export const HerramientasAdminPage: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState<string>(hoy());
  const [fechaFin, setFechaFin] = useState<string>(hoy());
  const [dispositivoId, setDispositivoId] = useState<string>('');

  // Consultas
  const { data: dispositivos = [] } = useQuery<Dispositivo[]>({
    queryKey: ['dispositivos'],
    queryFn: obtenerDispositivos,
  });

  const { data: auditoria = [], isLoading: cargandoAuditoria } = useQuery<RegistroAuditoria[]>({
    queryKey: ['auditoria'],
    queryFn: obtenerAuditoria,
  });

  // Mutaciones
  const mutRecalcular = useMutation({
    mutationFn: (params: ParametrosRecalcular) => recalcularDatos(params),
    onSuccess: (data: MensajeRespuesta) => {
      alert(`Recálculo completado: ${data.mensaje || 'Proceso finalizado.'}`);
    },
    onError: (err: Error) => {
      alert(`Error durante el recálculo: ${err.message}`);
    },
  });

  const mutSincronizar = useMutation({
    mutationFn: forzarSincronizacion,
    onSuccess: (data: MensajeRespuesta) => {
      alert(`Sincronización completada: ${data.mensaje || 'Ciclo ejecutado.'}`);
    },
    onError: (err: Error) => {
      alert(`Error durante la sincronización: ${err.message}`);
    },
  });

  const handleRecalcular = () => {
    if (
      window.confirm(
        '¿Está seguro de iniciar el recálculo de datos? Esta operación reprocesará las métricas espaciales del rango seleccionado.'
      )
    ) {
      mutRecalcular.mutate({
        desde: fechaInicio,
        hasta: fechaFin,
        dispositivo: dispositivoId || undefined,
      });
    }
  };

  const handleSincronizar = () => {
    if (
      window.confirm(
        '¿Desea forzar la sincronización de recorridos y cierre de sesiones inactivas de hoy?'
      )
    ) {
      mutSincronizar.mutate();
    }
  };

  const columnsAuditoria: ColumnDef<RegistroAuditoria, unknown>[] = [
    {
      header: 'Fecha y Hora',
      accessorKey: 'fecha',
      cell: (info) => (
        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
          {formatearFechaHora(info.getValue() as string)}
        </span>
      ),
    },
    {
      header: 'Usuario',
      accessorKey: 'usuario',
      cell: (info) => (
        <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
          <User size={12} className="text-zinc-400" />
          <span>{info.getValue() as string}</span>
        </div>
      ),
    },
    {
      header: 'Acción Ejecutada',
      accessorKey: 'accion',
      cell: (info) => (
        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700 font-mono text-2xs font-semibold">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      header: 'Detalles del Evento',
      accessorKey: 'detalles',
      cell: (info) => (
        <span className="text-zinc-600 dark:text-zinc-400 text-xs">
          {info.getValue() as string}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto bg-zinc-100/60 dark:bg-zinc-950/60 transition-colors">
      {/* Título de la Sección */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Wrench size={18} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Herramientas y Auditoría del Sistema
          </h1>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-10">
          Procesamiento de datos en lote, sincronización forzada y registro histórico de actividades.
        </p>
      </div>

      {/* Tarjetas de Operaciones estilo macOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {/* Recalcular Datos */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-xs border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <Calculator size={16} className="text-blue-600 dark:text-blue-400" />
              <span>Recálculo de Métricas Espaciales</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              Vuelve a calcular los tiempos dentro/fuera de sector, kilómetros y estado de las
              sesiones para un rango de fechas tras ajustes de geocercas o reglas.
            </p>

            <div className="space-y-3">
              <FiltroFechas
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                onInicioChange={setFechaInicio}
                onFinChange={setFechaFin}
              />

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Perifoneador (Opcional)
                </label>
                <select
                  value={dispositivoId}
                  onChange={(e) => setDispositivoId(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl py-2 px-3 text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Todos los perifoneadores</option>
                  {dispositivos.map((d) => (
                    <option key={d.id} value={d.id} className="dark:bg-zinc-900">
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRecalcular}
            disabled={mutRecalcular.isPending}
            className="w-full mt-6 flex justify-center items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-98"
          >
            {mutRecalcular.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando recálculo...
              </span>
            ) : (
              'Iniciar Recálculo de Métricas'
            )}
          </button>
        </div>

        {/* Forzar Sincronización */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-xs border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <RefreshCw size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Sincronización Forzada Traccar</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              Cierra recorridos inactivos que hayan superado el tiempo de corte e incorpora
              inmediatamente las últimas posiciones reportadas en el servidor Traccar para Tacna.
            </p>
          </div>

          <div className="pt-8">
            <button
              type="button"
              onClick={handleSincronizar}
              disabled={mutSincronizar.isPending}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-98"
            >
              {mutSincronizar.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sincronizando...
                </span>
              ) : (
                'Forzar Sincronización Ahora'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Registro de Auditoría */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Terminal size={15} className="text-zinc-500 dark:text-zinc-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Bitácora de Auditoría del Panel
          </h2>
        </div>
        <TablaDatos
          data={auditoria}
          columns={columnsAuditoria}
          isLoading={cargandoAuditoria}
        />
      </div>
    </div>
  );
};

export default HerramientasAdminPage;
