import { useState } from 'react';

const FiltroClientes = ({ onFiltrar, userData, rutas }) => {
  const [filtros, setFiltros] = useState({
    nombre: '',
    idCliente: '',
    cedula: '',
    rutaId: '',
    estado: '',
    esPrueba: '',
    orderBy: 'nombre',
    orderDir: 'ASC',
    limit: '50',
    offset: '0'
  });

  const [resultados, setResultados] = useState({
    total: 0,
    clientes: [],
    cargando: false,
    error: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResultados(prev => ({ ...prev, cargando: true, error: null }));

    try {
      // Construir query string
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`http://localhost:4000/api/clientes/filtrar?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        }
      });

      if (!response.ok) {
        throw new Error('Error al filtrar clientes');
      }

      const data = await response.json();
      setResultados({
        total: data.total,
        clientes: data.clientes,
        cargando: false,
        error: null
      });

      // Notificar al componente padre
      if (onFiltrar) {
        onFiltrar(data.clientes);
      }
    } catch (error) {
      console.error('Error al filtrar clientes:', error);
      setResultados(prev => ({
        ...prev,
        cargando: false,
        error: error.message
      }));
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      nombre: '',
      idCliente: '',
      cedula: '',
      rutaId: '',
      estado: '',
      esPrueba: '',
      orderBy: 'nombre',
      orderDir: 'ASC',
      limit: '50',
      offset: '0'
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Filtrar Clientes</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={filtros.nombre}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Nombre del cliente"
            />
          </div>
          
          {/* Filtro por ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700">ID Cliente</label>
            <input
              type="text"
              name="idCliente"
              value={filtros.idCliente}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="ID del cliente"
            />
          </div>
          
          {/* Filtro por cédula */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Cédula</label>
            <input
              type="text"
              name="cedula"
              value={filtros.cedula}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Cédula del cliente"
            />
          </div>
          
          {/* Filtro por ruta */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Ruta</label>
            <select
              name="rutaId"
              value={filtros.rutaId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todas las rutas</option>
              {rutas.map(ruta => (
                <option key={ruta.id} value={ruta.id}>{ruta.nombre}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              name="estado"
              value={filtros.estado}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          
          {/* Filtro por cliente de prueba */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Datos de Prueba</label>
            <select
              name="esPrueba"
              value={filtros.esPrueba}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Todos los clientes</option>
              <option value="true">Solo datos de prueba (TEST-)</option>
              <option value="false">Excluir datos de prueba</option>
            </select>
          </div>
          
          {/* Ordenar por */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Ordenar por</label>
            <select
              name="orderBy"
              value={filtros.orderBy}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="nombre">Nombre</option>
              <option value="idCliente">ID Cliente</option>
              <option value="cedula">Cédula</option>
              <option value="telefono">Teléfono</option>
              <option value="fecha_registro">Fecha de registro</option>
            </select>
          </div>
          
          {/* Dirección de ordenamiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <select
              name="orderDir"
              value={filtros.orderDir}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="ASC">Ascendente</option>
              <option value="DESC">Descendente</option>
            </select>
          </div>
          
          {/* Límite de resultados */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Resultados por página</label>
            <select
              name="limit"
              value={filtros.limit}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={limpiarFiltros}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Limpiar filtros
          </button>
          
          <button
            type="submit"
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={resultados.cargando}
          >
            {resultados.cargando ? 'Buscando...' : 'Buscar clientes'}
          </button>
        </div>
      </form>
      
      {/* Mostrar estadísticas de resultados */}
      {resultados.total > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-blue-800">
            Se encontraron <span className="font-bold">{resultados.total}</span> clientes
            {filtros.esPrueba === 'true' && <span> de prueba</span>}
            {filtros.esPrueba === 'false' && <span> (excluyendo datos de prueba)</span>}
          </p>
        </div>
      )}
      
      {/* Mostrar error si lo hay */}
      {resultados.error && (
        <div className="mt-4 p-3 bg-red-50 rounded-md">
          <p className="text-red-800">{resultados.error}</p>
        </div>
      )}
    </div>
  );
};

export default FiltroClientes; 