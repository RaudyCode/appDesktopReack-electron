import { useState, useEffect } from 'react';

function RutasAdmin({ userData, rutaSeleccionada }) {
  const [rutas, setRutas] = useState([]);
  const [rutaActual, setRutaActual] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [prestamos, setPrestamos] = useState([]);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [vista, setVista] = useState('rutas'); // rutas, clientes, prestamos, pagos
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    idCliente: '',
    nombre: '',
    cedula: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [prestamoForm, setPrestamoForm] = useState({
    monto: '',
    plazo: '',
    cuota: '',
    fechaInicio: new Date().toISOString().split('T')[0] // Fecha actual en formato YYYY-MM-DD
  });
  const [pagoForm, setPagoForm] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    montoAbonado: '0'
  });
  const [showForm, setShowForm] = useState(false);
  const [showPrestamoForm, setShowPrestamoForm] = useState(false);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [recibo, setRecibo] = useState(null);
  const [showRecibo, setShowRecibo] = useState(false);

  // Cargar rutas al montar el componente
  useEffect(() => {
    fetchRutas();
  }, []);

  // Si se recibe una ruta seleccionada, mostrar sus clientes automáticamente
  useEffect(() => {
    if (rutaSeleccionada) {
      setRutaActual(rutaSeleccionada);
      setVista('clientes');
      fetchClientesPorRuta(rutaSeleccionada.id);
    }
  }, [rutaSeleccionada]);

  // Obtener rutas del usuario
  const fetchRutas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:4000/api/rutas', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar las rutas');
      }
      
      const data = await response.json();
      setRutas(data);
      setLoading(false);
    } catch (error) {
      console.error('Error en fetchRutas:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Obtener clientes por ruta
  const fetchClientesPorRuta = async (rutaId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:4000/api/clientes/ruta/${rutaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar los clientes');
      }
      
      const data = await response.json();
      setClientes(data);
      setLoading(false);
    } catch (error) {
      console.error('Error en fetchClientesPorRuta:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Obtener préstamos por cliente
  const fetchPrestamosPorCliente = async (clienteId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:4000/api/prestamos/cliente/${clienteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar los préstamos');
      }
      
      const data = await response.json();
      setPrestamos(data);
      setLoading(false);
    } catch (error) {
      console.error('Error en fetchPrestamosPorCliente:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Obtener pagos por préstamo
  const fetchPagosPorPrestamo = async (prestamoId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:4000/api/pagos/prestamo/${prestamoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar los pagos');
      }
      
      const data = await response.json();
      setPagos(data);
      setLoading(false);
    } catch (error) {
      console.error('Error en fetchPagosPorPrestamo:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Seleccionar una ruta y cargar sus clientes
  const seleccionarRuta = (ruta) => {
    setRutaActual(ruta);
    setVista('clientes');
    fetchClientesPorRuta(ruta.id);
  };

  // Seleccionar un cliente y cargar sus préstamos
  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setVista('prestamos');
    fetchPrestamosPorCliente(cliente.id);
  };

  // Seleccionar un préstamo y cargar sus pagos
  const seleccionarPrestamo = (prestamo) => {
    setPrestamoSeleccionado(prestamo);
    setPagoForm({
      ...pagoForm,
      monto: prestamo.cuota
    });
    setVista('pagos');
    fetchPagosPorPrestamo(prestamo.id);
  };

  // Regresar a la vista de rutas
  const volverARutas = () => {
    setRutaActual(null);
    setClienteSeleccionado(null);
    setVista('rutas');
  };

  // Regresar a la vista de clientes
  const volverAClientes = () => {
    setClienteSeleccionado(null);
    setVista('clientes');
  };

  // Regresar a la vista de préstamos
  const volverAPrestamos = () => {
    setPrestamoSeleccionado(null);
    setPagoSeleccionado(null);
    setVista('prestamos');
  };

  // Manejar cambios en el formulario de cliente
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Manejar cambios en el formulario de préstamo
  const handlePrestamoChange = (e) => {
    const { name, value } = e.target;
    setPrestamoForm(prevState => ({
      ...prevState,
      [name]: value
    }));

    // Calcular cuota automáticamente si tenemos monto y plazo
    if (name === 'monto' || name === 'plazo') {
      const monto = name === 'monto' ? parseFloat(value) : parseFloat(prestamoForm.monto);
      const plazo = name === 'plazo' ? parseInt(value) : parseInt(prestamoForm.plazo);
      
      if (!isNaN(monto) && !isNaN(plazo) && monto > 0 && plazo > 0) {
        // Aplicar tasa de interés (por ejemplo, 20%)
        const interes = 0.2;
        const montoTotal = monto * (1 + interes);
        const cuota = (montoTotal / plazo).toFixed(2);
        
        setPrestamoForm(prevState => ({
          ...prevState,
          cuota: cuota
        }));
      }
    }
  };

  // Manejar cambios en el formulario de pago
  const handlePagoChange = (e) => {
    const { name, value } = e.target;
    setPagoForm(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Crear un nuevo cliente
  const crearCliente = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Validar campos
    if (!formData.idCliente || !formData.nombre || !formData.cedula || 
        !formData.telefono || !formData.direccion) {
      setErrorMsg('Los campos ID Cliente, Nombre, Cédula, Teléfono y Dirección son obligatorios');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:4000/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        },
        body: JSON.stringify({
          ...formData,
          rutaId: rutaActual.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el cliente');
      }
      
      // Limpiar formulario y recargar clientes
      setFormData({
        idCliente: '',
        nombre: '',
        cedula: '',
        telefono: '',
        email: '',
        direccion: ''
      });
      setShowForm(false);
      fetchClientesPorRuta(rutaActual.id);
      setLoading(false);
    } catch (error) {
      console.error('Error en crearCliente:', error);
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  // Crear un nuevo préstamo
  const crearPrestamo = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Validar campos
    if (!prestamoForm.monto || !prestamoForm.plazo || !prestamoForm.cuota || !prestamoForm.fechaInicio) {
      setErrorMsg('Todos los campos son obligatorios');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:4000/api/prestamos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        },
        body: JSON.stringify({
          clienteId: clienteSeleccionado.id,
          monto: parseFloat(prestamoForm.monto),
          plazo: parseInt(prestamoForm.plazo),
          cuota: parseFloat(prestamoForm.cuota),
          fechaInicio: prestamoForm.fechaInicio
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el préstamo');
      }
      
      // Limpiar formulario y recargar préstamos
      setPrestamoForm({
        monto: '',
        plazo: '',
        cuota: '',
        fechaInicio: new Date().toISOString().split('T')[0]
      });
      setShowPrestamoForm(false);
      fetchPrestamosPorCliente(clienteSeleccionado.id);
      setLoading(false);
    } catch (error) {
      console.error('Error en crearPrestamo:', error);
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  // Registrar un nuevo pago
  const registrarPago = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Validar campos
    if (!pagoForm.monto || !pagoForm.fecha) {
      setErrorMsg('El monto y la fecha son obligatorios');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:4000/api/pagos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        },
        body: JSON.stringify({
          prestamoId: prestamoSeleccionado.id,
          monto: parseFloat(pagoForm.monto),
          fecha: pagoForm.fecha,
          semana: prestamoSeleccionado.semana,
          montoAbonado: parseFloat(pagoForm.montoAbonado || 0)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar el pago');
      }
      
      const data = await response.json();
      
      // Limpiar formulario y recargar datos
      setPagoForm({
        monto: prestamoSeleccionado.cuota,
        fecha: new Date().toISOString().split('T')[0],
        montoAbonado: '0'
      });
      setShowPagoForm(false);
      
      // Actualizar préstamo seleccionado con los datos actualizados
      setPrestamoSeleccionado(data.prestamo);
      
      // Recargar pagos y préstamos
      fetchPagosPorPrestamo(prestamoSeleccionado.id);
      fetchPrestamosPorCliente(clienteSeleccionado.id);
      
      setLoading(false);
    } catch (error) {
      console.error('Error en registrarPago:', error);
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  // Generar recibo para un pago
  const generarRecibo = async (pagoId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:4000/api/recibos/pago/${pagoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al generar el recibo');
      }
      
      const data = await response.json();
      setRecibo(data);
      setShowRecibo(true);
      setLoading(false);
    } catch (error) {
      console.error('Error en generarRecibo:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  // Renderizado condicional según la vista actual
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Administración de Rutas</h1>
      
      {loading && <p className="text-center">Cargando...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}
      
      {/* Vista de rutas */}
      {vista === 'rutas' && (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold mb-4">Mis Rutas</h2>
          {rutas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rutas.map(ruta => (
                <div 
                  key={ruta.id}
                  className="bg-white shadow-md rounded-lg p-6 cursor-pointer hover:shadow-lg"
                  onClick={() => seleccionarRuta(ruta)}
                >
                  <h3 className="text-lg font-semibold">{ruta.nombre}</h3>
                  <p className="text-gray-600">Día de cobro: {ruta.diaCobro}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center my-4">No hay rutas disponibles.</p>
          )}
        </div>
      )}

      {/* Vista de clientes de una ruta */}
      {vista === 'clientes' && rutaActual && (
        <div className="grid gap-4">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={volverARutas}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded flex items-center"
            >
              <span>← Volver a Rutas</span>
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
            >
              <span>{showForm ? 'Cancelar' : 'Añadir Cliente'}</span>
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">{rutaActual.nombre}</h2>
            <p className="text-gray-600">Día de cobro: {rutaActual.diaCobro}</p>
          </div>

          {/* Resto del código sin cambios */}
          {/* ... */}
        </div>
      )}
    </div>
  );
}

export default RutasAdmin; 