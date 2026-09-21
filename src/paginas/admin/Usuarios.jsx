import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obtenerUsuarios, crearUsuario, actualizarUsuario, asignarDispositivos, obtenerDispositivos } from '../../api/endpoints';
import TablaDatos from '../../componentes/TablaDatos';
import { Edit2, Shield, UserPlus } from 'lucide-react';

export default function Usuarios() {
  const [modalUsuario, setModalUsuario] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '', rol: 'SUPERVISOR', activo: true });
  const [dispositivosSeleccionados, setDispositivosSeleccionados] = useState([]);

  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({ queryKey: ['usuarios'], queryFn: obtenerUsuarios });
  const { data: dispositivos = [] } = useQuery({ queryKey: ['dispositivos'], queryFn: obtenerDispositivos });

  const mutCrear = useMutation({
    mutationFn: crearUsuario,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); setModalUsuario(false); }
  });

  const mutActualizar = useMutation({
    mutationFn: ({ id, data }) => actualizarUsuario(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); setModalUsuario(false); }
  });

  const mutAsignar = useMutation({
    mutationFn: ({ id, dispositivos }) => asignarDispositivos(id, dispositivos),
    onSuccess: () => { setModalAsignar(false); }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (usuarioEdit) {
      const data = { ...formData };
      if (!data.password) delete data.password;
      mutActualizar.mutate({ id: usuarioEdit.id, data });
    } else {
      mutCrear.mutate(formData);
    }
  };

  const handleAsignarSubmit = (e) => {
    e.preventDefault();
    mutAsignar.mutate({ id: usuarioEdit.id, dispositivos: dispositivosSeleccionados });
  };

  const abrirModalUsuario = (user = null) => {
    setUsuarioEdit(user);
    if (user) {
      setFormData({ nombre: user.nombre, email: user.email, password: '', rol: user.rol, activo: user.activo });
    } else {
      setFormData({ nombre: '', email: '', password: '', rol: 'SUPERVISOR', activo: true });
    }
    setModalUsuario(true);
  };

  const abrirModalAsignar = (user) => {
    setUsuarioEdit(user);
    setDispositivosSeleccionados(user.dispositivos_asignados || []);
    setModalAsignar(true);
  };

  const columns = [
    { header: 'Nombre', accessorKey: 'nombre' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Rol', accessorKey: 'rol' },
    { 
      header: 'Estado', 
      accessorKey: 'activo',
      cell: (info) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${info.getValue() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {info.getValue() ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      header: 'Acciones',
      id: 'acciones',
      cell: (info) => (
        <div className="flex space-x-2">
          <button onClick={() => abrirModalUsuario(info.row.original)} className="text-blue-600 hover:text-blue-900"><Edit2 className="w-5 h-5" /></button>
          {info.row.original.rol === 'SUPERVISOR' && (
            <button onClick={() => abrirModalAsignar(info.row.original)} className="text-indigo-600 hover:text-indigo-900"><Shield className="w-5 h-5" /></button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <button
          onClick={() => abrirModalUsuario()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {isLoading ? <div className="p-4 text-center">Cargando...</div> : <TablaDatos data={usuarios} columns={columns} />}
      </div>

      {modalUsuario && (
        <div className="fixed z-50 inset-0 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{usuarioEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium">Nombre</label><input required className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
              <div><label className="block text-sm font-medium">Email</label><input type="email" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!!usuarioEdit} /></div>
              <div><label className="block text-sm font-medium">Contraseña {usuarioEdit && '(dejar en blanco para no cambiar)'}</label><input type="password" required={!usuarioEdit} className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
              <div><label className="block text-sm font-medium">Rol</label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {usuarioEdit && (
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" checked={formData.activo} onChange={e => setFormData({...formData, activo: e.target.checked})} /> Activo
                  </label>
                </div>
              )}
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setModalUsuario(false)} className="px-4 py-2 border rounded-md">Cancelar</button>
                <button type="submit" disabled={mutCrear.isPending || mutActualizar.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalAsignar && (
        <div className="fixed z-50 inset-0 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Asignar Dispositivos a {usuarioEdit.nombre}</h2>
            <form onSubmit={handleAsignarSubmit}>
              <div className="max-h-60 overflow-y-auto mb-4 border border-gray-200 rounded p-2">
                {dispositivos.map(d => (
                  <label key={d.id} className="flex items-center mb-2">
                    <input 
                      type="checkbox" 
                      className="mr-2"
                      checked={dispositivosSeleccionados.includes(d.id)}
                      onChange={e => {
                        if (e.target.checked) setDispositivosSeleccionados([...dispositivosSeleccionados, d.id]);
                        else setDispositivosSeleccionados(dispositivosSeleccionados.filter(id => id !== d.id));
                      }}
                    />
                    {d.nombre}
                  </label>
                ))}
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setModalAsignar(false)} className="px-4 py-2 border rounded-md">Cancelar</button>
                <button type="submit" disabled={mutAsignar.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
