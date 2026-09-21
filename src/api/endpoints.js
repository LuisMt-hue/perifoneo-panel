import { cliente } from './cliente';

// Auth — acepta login(email, password) o login({ email, password })
export const login = (email, password) => {
  const cuerpo = typeof email === 'object' ? email : { email, password };
  return cliente.post('/auth/login', cuerpo);
};
export const obtenerYo = () => cliente.get('/auth/yo');
export const cambiarPassword = (nueva) => cliente.post('/auth/cambiar-password', { nueva });

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, value);
    }
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

// Consulta
export const obtenerSalud = () => cliente.get('/salud');
export const obtenerSectores = () => cliente.get('/sectores');
export const obtenerDispositivos = () => cliente.get('/dispositivos');
export const obtenerVivo = () => cliente.get('/vivo');
export const obtenerEnVivo = () => cliente.get('/vivo');
export const obtenerSesiones = (params) => cliente.get(`/sesiones${buildQuery(params)}`);
export const obtenerRuta = (id) => cliente.get(`/sesiones/${id}/ruta`);
export const obtenerResumen = (params) => cliente.get(`/resumen${buildQuery(params)}`);
export const obtenerResumenSectores = (params) => cliente.get(`/resumen/sectores${buildQuery(params)}`);

// Admin
export const importarDesdeTraccar = () => cliente.post('/admin/importar');
export const forzarSincronizacion = () => cliente.post('/admin/sincronizar');
export const recalcular = (body) => cliente.post('/admin/recalcular', body);
export const obtenerUsuarios = () => cliente.get('/admin/usuarios');
export const crearUsuario = (body) => cliente.post('/admin/usuarios', body);
export const editarUsuario = (id, body) => cliente.patch(`/admin/usuarios/${id}`, body);
export const asignarDispositivos = (id, dispositivos) => cliente.put(`/admin/usuarios/${id}/dispositivos`, { dispositivos });
export const obtenerAuditoria = () => cliente.get('/admin/auditoria');

// Aliases usados por las páginas (misma API §2.6)
export const obtenerResumenPerifoneadores = (params) => cliente.get(`/resumen${buildQuery(params)}`);
export const recalcularDatos = (body) => cliente.post('/admin/recalcular', body);
export const actualizarUsuario = (id, body) => cliente.patch(`/admin/usuarios/${id}`, body);
