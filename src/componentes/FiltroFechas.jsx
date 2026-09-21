export default function FiltroFechas(props) {
  // Acepta ambas convenciones: desde/hasta/onCambio y fechaInicio/fechaFin/onInicioChange/onFinChange
  const desde = props.desde ?? props.fechaInicio ?? '';
  const hasta = props.hasta ?? props.fechaFin ?? '';
  const onCambio = props.onCambio || ((obj) => {
    if (props.onInicioChange && obj.desde !== undefined) props.onInicioChange(obj.desde);
    if (props.onFinChange && obj.hasta !== undefined) props.onFinChange(obj.hasta);
  });
  const children = props.children;
  const handleChange = (e) => {
    const { name, value } = e.target;
    onCambio({ desde, hasta, [name]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2">
        <label htmlFor="desde" className="text-sm font-medium text-gray-700">Del</label>
        <input
          type="date"
          id="desde"
          name="desde"
          value={desde}
          onChange={handleChange}
          className="border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="hasta" className="text-sm font-medium text-gray-700">al</label>
        <input
          type="date"
          id="hasta"
          name="hasta"
          value={hasta}
          onChange={handleChange}
          className="border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {children}
    </div>
  );
}
