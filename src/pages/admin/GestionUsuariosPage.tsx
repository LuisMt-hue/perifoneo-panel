import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Users,
  UserPlus,
  Edit2,
  Shield,
  Check,
  AlertCircle,
  Mail,
  Lock,
  User,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  asignarDispositivos,
  obtenerDispositivos,
} from '../../services/api/endpoints';
import TablaDatos from '../../components/ui/TablaDatos';
import Modal from '../../components/ui/Modal';
import type { Usuario, Rol } from '../../types/auth.types';
import type { Dispositivo } from '../../types/perifoneo.types';
import type { CrearUsuarioDTO, ActualizarUsuarioDTO } from '../../types/api.types';

/**
 * Página de Gestión de Usuarios del Panel estilo macOS (`GestionUsuariosPage`).
 *
 * Administra supervisores y administradores con modales tipo sheet macOS,
 * asignación de dispositivos y control de roles.
 */
export const GestionUsuariosPage: React.FC = () => {
  const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);

  // Formulario de Usuario
  const [formData, setFormData] = useState<CrearUsuarioDTO & { activo?: boolean }>({
    nombre: '',
    email: '',
    password: '',
    rol: 'SUPERVISOR',
    activo: true,
  });

  // Lista de perifoneadores asignados al supervisor en edición
  const [dispositivosSeleccionados, setDispositivosSeleccionados] = useState<number[]>([]);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Consultas
  const { data: usuarios = [], isLoading } = useQuery<Usuario[]>({
    queryKey: ['usuarios'],
    queryFn: obtenerUsuarios,
  });

  const { data: dispositivos = [] } = useQuery<Dispositivo[]>({
    queryKey: ['dispositivos'],
    queryFn: obtenerDispositivos,
  });

  // Mutaciones
  const mutCrear = useMutation({
    mutationFn: (dto: CrearUsuarioDTO) => crearUsuario(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setModalUsuarioAbierto(false);
    },
    onError: (err: Error) => setErrorForm(err.message),
  });

  const mutActualizar = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarUsuarioDTO }) =>
      actualizarUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setModalUsuarioAbierto(false);
    },
    onError: (err: Error) => setErrorForm(err.message),
  });

  const mutAsignar = useMutation({
    mutationFn: ({ id, dispIds }: { id: number; dispIds: number[] }) =>
      asignarDispositivos(id, dispIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setModalAsignarAbierto(false);
    },
  });

  const abrirModalUsuario = (user: Usuario | null = null) => {
    setErrorForm(null);
    setUsuarioSeleccionado(user);
    if (user) {
      setFormData({
        nombre: user.nombre,
        email: user.email,
        password: '',
        rol: user.rol,
        activo: user.activo,
      });
    } else {
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: 'SUPERVISOR',
        activo: true,
      });
    }
    setModalUsuarioAbierto(true);
  };

  const abrirModalAsignar = (user: Usuario) => {
    setUsuarioSeleccionado(user);
    setDispositivosSeleccionados(user.dispositivos_asignados || []);
    setModalAsignarAbierto(true);
  };

  const handleUsuarioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm(null);

    if (usuarioSeleccionado) {
      const payload: ActualizarUsuarioDTO = {
        nombre: formData.nombre,
        rol: formData.rol,
        activo: formData.activo,
      };
      if (formData.password && formData.password.trim().length > 0) {
        payload.password = formData.password;
      }
      mutActualizar.mutate({ id: usuarioSeleccionado.id, data: payload });
    } else {
      mutCrear.mutate({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
      });
    }
  };

  const handleAsignarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSeleccionado) return;
    mutAsignar.mutate({
      id: usuarioSeleccionado.id,
      dispIds: dispositivosSeleccionados,
    });
  };

  // Columnas
  const columns: ColumnDef<Usuario, unknown>[] = [
    {
      header: 'Nombre',
      accessorKey: 'nombre',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-2xs">
            <User size={12} />
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {info.getValue() as string}
          </span>
        </div>
      ),
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: (info) => (
        <span className="text-zinc-600 dark:text-zinc-400">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      header: 'Rol',
      accessorKey: 'rol',
      cell: (info) => {
        const rol = info.getValue() as Rol;
        return (
          <span
            className={`px-2 py-0.5 rounded-md text-2xs font-bold uppercase tracking-wider border ${
              rol === 'ADMIN'
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
            }`}
          >
            {rol}
          </span>
        );
      },
    },
    {
      header: 'Estado',
      accessorKey: 'activo',
      cell: (info) => {
        const activo = Boolean(info.getValue());
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold border ${
              activo
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}
          >
            {activo ? (
              <>
                <CheckCircle2 size={11} />
                <span>Activo</span>
              </>
            ) : (
              <>
                <XCircle size={11} />
                <span>Inactivo</span>
              </>
            )}
          </span>
        );
      },
    },
    {
      header: 'Acciones',
      id: 'acciones',
      cell: (info) => {
        const u = info.row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => abrirModalUsuario(u)}
              className="p-1.5 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Editar usuario"
            >
              <Edit2 size={14} />
            </button>
            {u.rol === 'SUPERVISOR' && (
              <button
                type="button"
                onClick={() => abrirModalAsignar(u)}
                className="p-1.5 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Asignar perifoneadores a supervisar"
              >
                <Shield size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto bg-zinc-100/60 dark:bg-zinc-950/60 transition-colors">
      {/* Título y Botón Nuevo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users size={18} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Gestión de Usuarios
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-10">
            Administración de cuentas con roles de Supervisor y Administrador.
          </p>
        </div>

        <button
          type="button"
          onClick={() => abrirModalUsuario(null)}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer active:scale-98"
        >
          <UserPlus size={15} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <TablaDatos data={usuarios} columns={columns} isLoading={isLoading} />

      {/* Modal: Crear / Editar Usuario */}
      <Modal
        isOpen={modalUsuarioAbierto}
        onClose={() => setModalUsuarioAbierto(false)}
        title={usuarioSeleccionado ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
      >
        <form onSubmit={handleUsuarioSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nombre Completo
            </label>
            <div className="relative">
              <User
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="email"
                required
                disabled={Boolean(usuarioSeleccionado)}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 disabled:opacity-60 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Contraseña {usuarioSeleccionado && '(dejar en blanco para no modificar)'}
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="password"
                required={!usuarioSeleccionado}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={usuarioSeleccionado ? '••••••••' : 'Mínimo 6 caracteres'}
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Rol del Usuario
            </label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value as Rol })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="SUPERVISOR" className="dark:bg-zinc-900">
                Supervisor (Auditoría limitada a sus perifoneadores)
              </option>
              <option value="ADMIN" className="dark:bg-zinc-900">
                Administrador (Control total del sistema)
              </option>
            </select>
          </div>

          {usuarioSeleccionado && (
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Usuario Activo
                </span>
              </label>
            </div>
          )}

          {errorForm && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorForm}</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setModalUsuarioAbierto(false)}
              className="px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutCrear.isPending || mutActualizar.isPending}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {mutCrear.isPending || mutActualizar.isPending ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Asignar Perifoneadores a Supervisor */}
      <Modal
        isOpen={modalAsignarAbierto}
        onClose={() => setModalAsignarAbierto(false)}
        title={`Asignar Perifoneadores a ${usuarioSeleccionado?.nombre || 'Supervisor'}`}
      >
        <form onSubmit={handleAsignarSubmit} className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Selecciona los perifoneadores que este supervisor tendrá permiso de auditar y supervisar.
          </p>

          <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 space-y-1">
            {dispositivos.length === 0 ? (
              <p className="text-xs text-zinc-400 p-4 text-center">No hay perifoneadores registrados.</p>
            ) : (
              dispositivos.map((d) => {
                const isSelected = dispositivosSeleccionados.includes(d.id);
                return (
                  <label
                    key={d.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDispositivosSeleccionados([...dispositivosSeleccionados, d.id]);
                          } else {
                            setDispositivosSeleccionados(
                              dispositivosSeleccionados.filter((id) => id !== d.id)
                            );
                          }
                        }}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {d.nombre}
                      </span>
                    </div>
                    <span className="text-2xs text-zinc-400 font-mono">
                      {d.sector || d.sector_nombre || 'Sin sector'}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setModalAsignarAbierto(false)}
              className="px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutAsignar.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Check size={14} />
              <span>{mutAsignar.isPending ? 'Guardando...' : 'Guardar Asignaciones'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GestionUsuariosPage;
