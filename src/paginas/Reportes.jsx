import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { obtenerResumenPerifoneadores, obtenerResumenSectores } from '../api/endpoints';
import FiltroFechas from '../componentes/FiltroFechas';
import TablaDatos from '../componentes/TablaDatos';
import { formatearFecha, formatearDuracion, formatPorcentaje } from '../utilidades/formato';
import { exportarExcel } from '../utilidades/excel';
import { generarInformePDF } from '../utilidades/pdf';
import { FileText, Download } from 'lucide-react';

export default function Reportes() {
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [tab, setTab] = useState('perifoneadores');

  const { data: resumenPerifoneadores = [], isLoading: loadingP } = useQuery({
    queryKey: ['resumenP', fechaInicio, fechaFin],
    queryFn: () => obtenerResumenPerifoneadores({ inicio: fechaInicio, fin: fechaFin })
  });

  const { data: resumenSectores = [], isLoading: loadingS } = useQuery({
    queryKey: ['resumenS', fechaInicio, fechaFin],
    queryFn: () => obtenerResumenSectores({ inicio: fechaInicio, fin: fechaFin })
  });

  const columnsP = [
    { header: 'Perifoneador', accessorKey: 'nombre' },
    { header: 'DNI', accessorKey: 'dni' },
    { header: 'Sector Asignado', accessorKey: 'sector_nombre' },
    { header: 'Recorridos', accessorKey: 'recorridos' },
    { header: 'Días Activos', accessorKey: 'dias_activos' },
    { header: 'Hrs Totales', accessorKey: 'horas_totales', cell: (info) => formatearDuracion(info.getValue() * 60) },
    { header: 'Hrs Dentro', accessorKey: 'horas_dentro', cell: (info) => formatearDuracion(info.getValue() * 60) },
    { header: '% Dentro', accessorKey: 'porcentaje_dentro', cell: (info) => formatPorcentaje(info.getValue()) },
    { header: 'Hrs Detenido', accessorKey: 'horas_detenido', cell: (info) => formatearDuracion(info.getValue() * 60) },
    { header: 'KM', accessorKey: 'km_total', cell: (info) => Number(info.getValue() || 0).toFixed(2) },
    { header: 'Última Actividad', accessorKey: 'ultima_actividad', cell: (info) => formatearFecha(info.getValue()) },
    { 
      header: 'Acciones', 
      id: 'acciones',
      cell: (info) => (
        <button 
          onClick={() => generarInformePDF(info.row.original, fechaInicio, fechaFin)}
          className="text-blue-600 hover:text-blue-800"
          title="Generar PDF"
        >
          <FileText className="w-5 h-5" />
        </button>
      )
    }
  ];

  const columnsS = [
    { header: 'Sector', accessorKey: 'nombre' },
    { header: 'Personas', accessorKey: 'personas' },
    { header: 'Recorridos', accessorKey: 'recorridos' },
    { 
      header: 'Días con Cobertura', 
      accessorKey: 'dias_cobertura',
      cell: (info) => <span className={info.getValue() === 0 ? 'text-red-600 font-bold' : ''}>{info.getValue()}</span>
    },
    { header: 'Hrs Dentro', accessorKey: 'horas_dentro', cell: (info) => formatearDuracion(info.getValue() * 60) },
    { header: 'Última Cobertura', accessorKey: 'ultima_cobertura', cell: (info) => formatearFecha(info.getValue()) }
  ];

  const handleExport = () => {
    if (tab === 'perifoneadores') {
      exportarExcel(resumenPerifoneadores, 'Reporte_Perifoneadores');
    } else {
      exportarExcel(resumenSectores, 'Reporte_Sectores');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Excel
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <FiltroFechas 
          fechaInicio={fechaInicio} 
          fechaFin={fechaFin} 
          onInicioChange={setFechaInicio} 
          onFinChange={setFechaFin} 
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setTab('perifoneadores')}
              className={`${tab === 'perifoneadores' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Por Perifoneador
            </button>
            <button
              onClick={() => setTab('sectores')}
              className={`${tab === 'sectores' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Por Sector
            </button>
          </nav>
        </div>

        <div className="p-4">
          {tab === 'perifoneadores' && (
            loadingP ? <div className="p-4 text-center">Cargando...</div> : <TablaDatos data={resumenPerifoneadores} columns={columnsP} />
          )}
          {tab === 'sectores' && (
            loadingS ? <div className="p-4 text-center">Cargando...</div> : <TablaDatos data={resumenSectores} columns={columnsS} />
          )}
        </div>
      </div>
    </div>
  );
}
