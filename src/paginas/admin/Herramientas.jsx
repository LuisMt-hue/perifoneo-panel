import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { recalcularDatos, forzarSincronizacion, obtenerAuditoria, obtenerDispositivos } from '../../api/endpoints';
import FiltroFechas from '../../componentes/FiltroFechas';
import TablaDatos from '../../componentes/TablaDatos';
import { formatearFechaHora } from '../../utilidades/formato';
import { Calculator, RefreshCw } from 'lucide-react';

export default function Herramientas() {
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [dispositivoId, setDispositivoId] = useState('');

  const { data: dispositivos = [] } = useQuery({ queryKey: ['dispositivos'], queryFn: obtenerDispositivos });
  const { data: auditoria = [], isLoading } = useQuery({ queryKey: ['auditoria'], queryFn: obtenerAuditoria });

  const mutRecalcular = useMutation({
    mutationFn: recalcularDatos,
    onSuccess: (data) => alert(`Recálculo completado: ${data.mensaje}`),
    onError: (err) => alert(`Error: ${err.message}`)
  });

  const mutSincronizar = useMutation({
    mutationFn: forzarSincronizacion,
    onSuccess: (data) => alert(`Sincronización completada: ${data.mensaje}`),
    onError: (err) => alert(`Error: ${err.message}`)
  });

  const handleRecalcular = () => {
    if (window.confirm('¿Está seguro de recalcular los datos? Esto puede tomar varios minutos.')) {
      mutRecalcular.mutate({ 
        inicio: fechaInicio, 
        fin: fechaFin, 
        dispositivo_id: dispositivoId || undefined 
      });
    }
  };

  const handleSincronizar = () => {
    if (window.confirm('¿Forzar sincronización de recorridos del día actual?')) {
      mutSincronizar.mutate();
    }
  };

  const columns = [
    { header: 'Fecha', accessorKey: 'fecha', cell: (info) => formatearFechaHora(info.getValue()) },
    { header: 'Usuario', accessorKey: 'usuario' },
    { header: 'Acción', accessorKey: 'accion' },
    { header: 'Detalles', accessorKey: 'detalles' }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Herramientas Administrativas</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4 flex items-center"><Calculator className="w-5 h-5 mr-2 text-blue-600"/> Recalcular Datos</h2>
          <p className="text-sm text-gray-600 mb-4">
            Recalcula las métricas de recorridos (minutos dentro/fuera, distancias, etc.) para un rango de fechas.
          </p>
          <div className="space-y-4">
            <FiltroFechas fechaInicio={fechaInicio} fechaFin={fechaFin} onInicioChange={setFechaInicio} onFinChange={setFechaFin} />
            <div>
              <label className="block text-sm font-medium text-gray-700">Dispositivo (Opcional)</label>
              <select className="mt-1 block w-full border-gray-300 rounded-md" value={dispositivoId} onChange={e => setDispositivoId(e.target.value)}>
                <option value="">Todos</option>
                {dispositivos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <button
              onClick={handleRecalcular}
              disabled={mutRecalcular.isPending}
              className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {mutRecalcular.isPending ? 'Procesando...' : 'Iniciar Recálculo'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4 flex items-center"><RefreshCw className="w-5 h-5 mr-2 text-green-600"/> Forzar Sincronización</h2>
          <p className="text-sm text-gray-600 mb-4">
            Cierra sesiones inactivas y fuerza el procesamiento de posiciones recientes de Traccar del día de hoy.
          </p>
          <button
            onClick={handleSincronizar}
            disabled={mutSincronizar.isPending}
            className="w-full mt-4 flex justify-center items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {mutSincronizar.isPending ? 'Sincronizando...' : 'Sincronizar Ahora'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Registro de Auditoría</h2>
        {isLoading ? <div className="text-center">Cargando...</div> : <TablaDatos data={auditoria} columns={columns} />}
      </div>
    </div>
  );
}
