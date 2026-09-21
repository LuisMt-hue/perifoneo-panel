import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { obtenerSesiones, obtenerDispositivos, obtenerSectores } from '../api/endpoints';
import FiltroFechas from '../componentes/FiltroFechas';
import TablaDatos from '../componentes/TablaDatos';
import { formatearFecha, formatearHora, formatearDuracion, formatPorcentaje } from '../utilidades/formato';
import { exportarExcel } from '../utilidades/excel';
import { Download } from 'lucide-react';

export default function Historial() {
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [perifoneador, setPerifoneador] = useState('');
  const [sector, setSector] = useState('');
  const navigate = useNavigate();

  const { data: dispositivos = [] } = useQuery({ queryKey: ['dispositivos'], queryFn: obtenerDispositivos });
  const { data: sectores = [] } = useQuery({ queryKey: ['sectores'], queryFn: obtenerSectores });

  const { data: sesiones = [], isLoading } = useQuery({
    queryKey: ['sesiones', fechaInicio, fechaFin, perifoneador, sector],
    queryFn: () => obtenerSesiones({ inicio: fechaInicio, fin: fechaFin, dispositivo_id: perifoneador, sector_id: sector })
  });

  const columns = [
    { header: 'Fecha', accessorKey: 'fecha', cell: (info) => formatearFecha(info.getValue()) },
    { header: 'Perifoneador', accessorKey: 'perifoneador_nombre' },
    { header: 'Sector', accessorKey: 'sector_nombre' },
    { header: 'Inicio', accessorKey: 'hora_inicio', cell: (info) => formatearHora(info.getValue()) },
    { 
      header: 'Fin', 
      accessorKey: 'hora_fin', 
      cell: (info) => info.row.original.estado === 'EN_CURSO' ? <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>En curso</span> : formatearHora(info.getValue()) 
    },
    { header: 'Duración', accessorKey: 'duracion_minutos', cell: (info) => formatearDuracion(info.getValue()) },
    { header: 'Min Dentro', accessorKey: 'minutos_dentro', cell: (info) => formatearDuracion(info.getValue()) },
    { header: 'Min Fuera', accessorKey: 'minutos_fuera', cell: (info) => formatearDuracion(info.getValue()) },
    { header: '% Dentro', accessorKey: 'porcentaje_dentro', cell: (info) => formatPorcentaje(info.getValue()) },
    { header: 'Detenido', accessorKey: 'minutos_detenido', cell: (info) => formatearDuracion(info.getValue()) },
    { header: 'KM', accessorKey: 'distancia_km', cell: (info) => Number(info.getValue() || 0).toFixed(2) }
  ];

  const handleExport = () => {
    exportarExcel(sesiones, 'Historial_Recorridos');
  };

  const handleRowClick = (row) => {
    navigate(`/recorrido/${row.original.id}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historial de Recorridos</h1>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Excel
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
        <FiltroFechas 
          fechaInicio={fechaInicio} 
          fechaFin={fechaFin} 
          onInicioChange={setFechaInicio} 
          onFinChange={setFechaFin} 
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Perifoneador</label>
          <select 
            value={perifoneador} 
            onChange={(e) => setPerifoneador(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Todos</option>
            {dispositivos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
          <select 
            value={sector} 
            onChange={(e) => setSector(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Todos</option>
            {sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : (
          <TablaDatos 
            data={sesiones} 
            columns={columns} 
            onRowClick={handleRowClick}
          />
        )}
      </div>
    </div>
  );
}
