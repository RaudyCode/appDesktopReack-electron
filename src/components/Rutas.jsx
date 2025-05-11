import { useState, useEffect } from 'react';

function Rutas({ userData, onLogout }) {
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    diaCobro: 'Lunes' // valor por defecto
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Cargar rutas al montar el componente
  useEffect(() => {
    fetchRutas();
  }, []);

  // Obtener rutas del usuario actual
  const fetchRutas = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);
      
      console.log('Intentando obtener rutas con userId:', userData.id);
      
      const apiUrl = 'http://localhost:4000/api/rutas';
      console.log('Haciendo fetch a:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        }
      });
      
      console.log('Respuesta del servidor:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Texto de error recibido:', text);
        
        try {
          const errorData = JSON.parse(text);
          setErrorDetails(errorData);
          throw new Error(errorData.error || 'Error al cargar las rutas');
        } catch (parseError) {
          throw new Error(`Error ${response.status}: ${text.substring(0, 100)}...`);
        }
      }
      
      const text = await response.text();
      console.log('Respuesta como texto:', text);
      
      const data = text.trim() ? JSON.parse(text) : [];
      console.log('Rutas recibidas:', data);
      
      setRutas(data);
      setLoading(false);
    } catch (error) {
      console.error('Error en fetchRutas:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Verificar si el servidor está en línea
  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/status');
      const data = await response.json();
      alert(`Estado del servidor: ${data.status}\nMensaje: ${data.message}\nTimestamp: ${data.timestamp}`);
    } catch (error) {
      alert('No se pudo contactar al servidor. Asegúrese de que esté en ejecución.');
    }
  };

  // Verificar usuarios en el sistema
  const checkUsers = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/diagnostico/usuarios');
      const data = await response.json();
      alert(`Total de usuarios: ${data.total}\nDetalles: ${JSON.stringify(data.usuarios, null, 2)}`);
    } catch (error) {
      alert('No se pudo obtener información de usuarios.');
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    e.persist?.(); // Ensure the event persists for async state updates
    const { name, value } = e.target;
    
    // Use safer state update approach
    setTimeout(() => {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }, 0);
  };

  // Limpiar el formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      diaCobro: 'Lunes'
    });
    setEditMode(false);
    setEditId(null);
    setErrorMsg('');
    setShowForm(false);
  };

  // Habilitar modo edición
  const handleEdit = (ruta) => {
    setFormData({
      nombre: ruta.nombre,
      diaCobro: ruta.diaCobro
    });
    setEditMode(true);
    setEditId(ruta.id);
    setErrorMsg('');
    setShowForm(true);
    
    // Hacer scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Crear o actualizar ruta
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Validar campos
    if (!formData.nombre || !formData.diaCobro) {
      setErrorMsg('Todos los campos son obligatorios');
      return;
    }
    
    try {
      let url = 'http://localhost:4000/api/rutas';
      let method = 'POST';
      
      // Si estamos editando, cambiar método y URL
      if (editMode && editId) {
        url = `${url}/${editId}`;
        method = 'PUT';
      }
      
      console.log(`Enviando ${method} a ${url} con userId: ${userData.id}`);
      console.log('Datos a enviar:', formData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        },
        body: JSON.stringify(formData)
      });
      
      console.log('Respuesta del servidor:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Texto de error recibido:', text);
        
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || `Error al ${editMode ? 'actualizar' : 'crear'} la ruta`);
        } catch (parseError) {
          throw new Error(`Error ${response.status}: ${text.substring(0, 100)}...`);
        }
      }
      
      // Actualizar lista de rutas
      await fetchRutas();
      resetForm(); // Limpiar el formulario después de enviar
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setErrorMsg(error.message);
    }
  };

  // Eliminar ruta
  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro que desea eliminar esta ruta?')) {
      return;
    }
    
    try {
      console.log(`Eliminando ruta ${id} con userId: ${userData.id}`);
      
      const response = await fetch(`http://localhost:4000/api/rutas/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        }
      });
      
      console.log('Respuesta del servidor:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Texto de error recibido:', text);
        
        try {
          const errorData = JSON.parse(text);
          // Si hay clientes asociados, mostrar mensaje específico
          if (errorData.clientesAsociados) {
            alert(`${errorData.error} (${errorData.clientesAsociados} clientes)`);
          } else {
            throw new Error(errorData.error || 'Error al eliminar la ruta');
          }
        } catch (parseError) {
          throw new Error(`Error ${response.status}: ${text.substring(0, 100)}...`);
        }
        return;
      }
      
      // Actualizar lista de rutas
      await fetchRutas();
    } catch (error) {
      console.error('Error en handleDelete:', error);
      alert(error.message);
    }
  };

  // Ver detalle de la ruta (clientes)
  const verDetalleRuta = (id) => {
    // En una implementación completa, aquí se navegaría a la vista de clientes de la ruta
    alert(`Ver clientes de la ruta ${id} (funcionalidad en desarrollo)`);
  };

  // Formatear número como moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-DO", {
      maximumFractionDigits: 3,
    }).format(amount || 0);
  };

  // Obtener color de fondo según el día
  const getDayColor = (day) => {
    const colors = {
      'Lunes': 'bg-blue-500',
      'Martes': 'bg-purple-500',
      'Miércoles': 'bg-amber-500',
      'Jueves': 'bg-cyan-500',
      'Viernes': 'bg-pink-500',
      'Sábado': 'bg-emerald-500',
      'Domingo': 'bg-red-500'
    };
    return colors[day] || 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md max-w-lg">
          <h2 className="font-bold text-xl mb-2">Error al cargar datos</h2>
          <p>{error}</p>
          
          {errorDetails && (
            <div className="mt-2 text-sm">
              {errorDetails.mensaje && <p className="mb-1">{errorDetails.mensaje}</p>}
              {errorDetails.sugerencia && <p className="mb-1 font-semibold">{errorDetails.sugerencia}</p>}
            </div>
          )}
          
          <div className="mt-4 flex flex-col space-y-2">
            <button 
              onClick={() => fetchRutas()}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              Reintentar
            </button>
            
            <button 
              onClick={onLogout}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded mt-2"
            >
              Cerrar sesión
            </button>
            
            <div className="flex space-x-2 mt-2">
              <button 
                onClick={checkServerStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
              >
                Verificar servidor
              </button>
              
              <button 
                onClick={checkUsers}
                className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm"
              >
                Verificar usuarios
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con barra de navegación */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/img/logo.svg" alt="Presta G" className="h-10 mr-3" />
            <h1 className="text-2xl font-bold text-green-700">Gestión de Préstamos</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <span className="font-medium text-gray-700">{userData.nombre}</span>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md shadow transition duration-300"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Cabecera de sección y botón para crear */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Rutas de Cobro</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow transition duration-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nueva Ruta
          </button>
        </div>
        
        {/* Formulario desplegable para crear/editar ruta */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{editMode ? 'Editar Ruta' : 'Crear Nueva Ruta'}</h3>
              <button 
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errorMsg}
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
                    Nombre de la Ruta
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    name="nombre"
                    value={formData.nombre || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="Ej: Zona Norte"
                    autoComplete="off"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="diaCobro">
                    Día de Cobro
                  </label>
                  <select
                    id="diaCobro"
                    name="diaCobro"
                    value={formData.diaCobro || 'Lunes'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  >
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition"
                >
                  {editMode ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Listado de rutas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {rutas.length === 0 ? (
            <div className="p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay rutas definidas</h3>
              <p className="text-gray-600 mb-4">Comienza creando tu primera ruta de cobro</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Crear Ruta
              </button>
            </div>
          ) : (
            <div>
              <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-700">
                  {rutas.length} {rutas.length === 1 ? 'ruta encontrada' : 'rutas encontradas'}
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {rutas.map(ruta => (
                  <li key={ruta.id} className="hover:bg-gray-50 transition duration-150">
                    <div className="flex items-center p-4">
                      <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md ${getDayColor(ruta.diaCobro)} text-white mr-4`}>
                        <span className="font-bold">{ruta.diaCobro.substring(0, 3)}</span>
                      </div>
                      
                      <div className="flex-grow cursor-pointer" onClick={() => verDetalleRuta(ruta.id)}>
                        <h4 className="text-lg font-semibold text-gray-800">{ruta.nombre}</h4>
                        <p className="text-sm text-gray-600">Cobro: {ruta.diaCobro}</p>
                      </div>
                      
                      <div className="flex-shrink-0 flex gap-2">
                        <button
                          onClick={() => handleEdit(ruta)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleDelete(ruta.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Rutas; 