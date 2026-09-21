import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obtenerDispositivos, importarDesdeTraccar } from '../../api/endpoints';
import TablaDatos from '../../componentes/TablaDatos';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function Perifoneadores() {
  const queryClient = useQueryClient();

  const { data: dispositivos = [], isLoading } = useQuery({ 
    queryKey: ['dispositivos'], 
    queryFn: obtenerDispositivos 
  });

  const mutImportar = useMutation({
    mutationFn: importarDesdeTraccar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      alert('Sincronización con Traccar completada.');
    }
  });

  const columns = [
    { header: 'Nombre', accessorKey: 'nombre' },
    { header: 'DNI', accessorKey: 'dni' },
    { header: 'Placa', accessorKey: 'placa' },
    { header: 'Teléfono', accessorKey: 'telefono' },
    { 
      header: 'Sector', 
      accessorKey: 'sector_nombre',
      cell: (info) => info.getValue() || (
        <span className="flex items-center text-yellow-600 font-semibold text-xs bg-yellow-50 px-2 py-1 rounded-full">
          <AlertTriangle className="w-3 h-3 mr-1" /> Sin sector
        </span>
      )
    },
    { header: 'Modelo Celular', accessorKey: 'modelo_celular' }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Perifoneadores (Dispositivos)</h1>
        <button
          onClick={() => { if(window.confirm('¿Actualizar desde Traccar?')) mutImportar.mutate(); }}
          disabled={mutImportar.isPending}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${mutImportar.isPending ? 'animate-spin' : ''}`} />
          {mutImportar.isPending ? 'Actualizando...' : 'Actualizar desde Traccar'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-4 text-center">Cargando...</div>
        ) : (
          <TablaDatos data={dispositivos} columns={columns} />
        )}
      </div>
    </div>
  );
}
