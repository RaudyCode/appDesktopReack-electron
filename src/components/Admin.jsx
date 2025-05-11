import { useState, useEffect } from 'react';

function RutasAdmin({ userData, rutaSeleccionada, onVolver }) {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [prestamos, setPrestamos] = useState([]);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [vista, setVista] = useState('clientes'); // Default view is now 'clientes' since we already have a route
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
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
  const [recibo, setRecibo] = useState(null);
  const [showRecibo, setShowRecibo] = useState(false);

  // Load clients for the selected route when component mounts
  useEffect(() => {
    if (rutaSeleccionada && rutaSeleccionada.id) {
      fetchClientesPorRuta(rutaSeleccionada.id);
    }
  }, [rutaSeleccionada]);

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

  // Regresar a la vista de clientes
  const volverAClientes = () => {
    setClienteSeleccionado(null);
    setVista('clientes');
    // Clear any active forms and their error messages
    setShowPrestamoForm(false);
    setErrorMsg('');
  };

  // Regresar a la vista de préstamos
  const volverAPrestamos = () => {
    setPrestamoSeleccionado(null);
    setPagoSeleccionado(null);
    setVista('prestamos');
    // Clear any active forms and their error messages
    setShowPagoForm(false);
    setErrorMsg('');
  };

  // Manejar cambios en el formulario de cliente
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Toggle the client form
  const toggleClientForm = () => {
    setShowForm(!showForm);
    // Reset error message when toggling form
    setErrorMsg('');
  };

  // Toggle the loan form
  const toggleLoanForm = () => {
    setShowPrestamoForm(!showPrestamoForm);
    // Reset error message when toggling form
    setErrorMsg('');
  };

  // Toggle the payment form
  const togglePaymentForm = () => {
    setShowPagoForm(!showPagoForm);
    // Reset error message when toggling form
    setErrorMsg('');
  };

  // Manejar cambios en el formulario de préstamo
  const handlePrestamoChange = (e) => {
    const { name, value } = e.target;
    setPrestamoForm(prevState => ({
      ...prevState,
      [name]: value
    }));

    // Calcular cuota automáticamente si tenemos monto
    if (name === 'monto') {
      const monto = parseFloat(value);
      
      if (!isNaN(monto) && monto > 0) {
        // Aplicar tasa de interés del 30% y plazo fijo de 13 semanas
        const plazoFijo = 13;
        const montoTotal = monto * 1.3; // Interés del 30%
        const cuota = (montoTotal / plazoFijo).toFixed(2);
        
        setPrestamoForm(prevState => ({
          ...prevState,
          plazo: plazoFijo.toString(),
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

  // Determinar el estado de un pago (a tiempo, parcial o atrasado)
  const determinarEstadoPago = (montoRecibido, cuotaCompleta, fechaPago, fechaEsperada) => {
    // Convertir fechas a objetos Date
    const fechaPagoObj = new Date(fechaPago);
    const fechaEsperadaObj = new Date(fechaEsperada);
    
    // Considerar atrasado si la fecha de pago es posterior a 2 días de la fecha esperada
    const dosMillisegundosDias = 2 * 24 * 60 * 60 * 1000;
    const esAtrasado = fechaPagoObj > new Date(fechaEsperadaObj.getTime() + dosMillisegundosDias);
    
    // Verificar si el pago es parcial (menos que la cuota completa)
    const esParcial = parseFloat(montoRecibido) < parseFloat(cuotaCompleta);
    
    if (esAtrasado && esParcial) {
      return 'atrasado y parcial';
    } else if (esAtrasado) {
      return 'atrasado';
    } else if (esParcial) {
      return 'parcial';
    } else {
      return 'a tiempo';
    }
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
          rutaId: rutaSeleccionada.id
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
      fetchClientesPorRuta(rutaSeleccionada.id);
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
    if (!prestamoForm.monto || !prestamoForm.fechaInicio) {
      setErrorMsg('El monto y la fecha de inicio son obligatorios');
      return;
    }
    
    try {
      setLoading(true);
      
      // Asegurar que se use el plazo fijo de 13 semanas y el cálculo correcto de cuota
      const monto = parseFloat(prestamoForm.monto);
      const plazoFijo = 13;
      const montoTotal = monto * 1.3; // 30% de interés
      const cuota = (montoTotal / plazoFijo).toFixed(2);
      
      const response = await fetch('http://localhost:4000/api/prestamos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        },
        body: JSON.stringify({
          clienteId: clienteSeleccionado.id,
          monto: monto,
          plazo: plazoFijo,
          cuota: parseFloat(cuota),
          fechaInicio: prestamoForm.fechaInicio,
          totalApagar: montoTotal
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el préstamo');
      }
      
      // Limpiar formulario y recargar préstamos
      setPrestamoForm({
        monto: '',
        plazo: '13',
        cuota: '',
        fechaInicio: new Date().toISOString().split('T')[0]
      });
      toggleLoanForm();
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
    
    // Validar que el monto no sea cero o negativo
    if (parseFloat(pagoForm.monto) <= 0) {
      setErrorMsg('El monto del pago debe ser mayor que cero');
      return;
    }
    
    try {
      setLoading(true);
      
      // Calcular la fecha esperada de pago basada en la fecha de inicio del préstamo
      // y la semana actual
      const fechaInicio = new Date(prestamoSeleccionado.fechaInicio);
      const diasTranscurridos = (prestamoSeleccionado.semana - 1) * 7; // -1 porque la semana 1 es el inicio
      const fechaEsperada = new Date(fechaInicio);
      fechaEsperada.setDate(fechaEsperada.getDate() + diasTranscurridos);
      
      // Determinar estado del pago (a tiempo, parcial, atrasado)
      const estadoPago = determinarEstadoPago(
        pagoForm.monto,
        prestamoSeleccionado.cuota,
        pagoForm.fecha,
        fechaEsperada.toISOString().split('T')[0]
      );
      
      // Calcular el saldo pendiente total
      const saldoPendiente = (prestamoSeleccionado.totalApagar || prestamoSeleccionado.monto * 1.3) - (prestamoSeleccionado.totalPagado || 0);
      
      // Determinar si es un pago completo del préstamo
      const esLiquidacionTotal = parseFloat(pagoForm.monto) >= saldoPendiente;
      
      // Verificar si hay atrasos acumulados
      const atrasosNoPagados = prestamoSeleccionado.atrasosNoPagados || 0;
      let aplicarAAtraso = false;
      let detalleAtrasos = '';
      
      if (atrasosNoPagados > 0 && !esLiquidacionTotal) {
        aplicarAAtraso = true;
        detalleAtrasos = `Este pago se aplicará primero a ${atrasosNoPagados} cuota(s) atrasada(s).`;
        
        // Confirmar con el usuario
        const confirmarAplicacion = confirm(
          `Tienes ${atrasosNoPagados} cuota(s) atrasada(s) pendiente(s) de pago.\n\n` +
          `¿Deseas aplicar este pago de ${formatCurrency(parseFloat(pagoForm.monto))} a la(s) cuota(s) atrasada(s)?`
        );
        
        if (!confirmarAplicacion) {
          aplicarAAtraso = false;
        }
      }
      
      // Preparar datos adicionales para pago completo o atrasos
      const datosAdicionales = {
        ...(esLiquidacionTotal ? { esLiquidacionTotal: true, saldoPendiente: saldoPendiente } : {}),
        ...(aplicarAAtraso ? { aplicarAAtraso: true, atrasosNoPagados: atrasosNoPagados } : {})
      };
      
      console.log("Enviando pago normal:", {
        prestamoId: prestamoSeleccionado.id,
        monto: parseFloat(pagoForm.monto),
        fecha: pagoForm.fecha,
        semana: prestamoSeleccionado.semana,
        montoAbonado: parseFloat(pagoForm.montoAbonado || 0),
        estadoPago: estadoPago,
        fechaEsperada: fechaEsperada.toISOString().split('T')[0],
        ...datosAdicionales
      });
      
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
          montoAbonado: parseFloat(pagoForm.montoAbonado || 0),
          estadoPago: estadoPago,
          fechaEsperada: fechaEsperada.toISOString().split('T')[0],
          ...datosAdicionales
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar el pago');
      }
      
      const data = await response.json();
      
      // Mostrar mensaje apropiado según el tipo de pago
      if (esLiquidacionTotal) {
        alert(`¡Préstamo pagado completamente! Se ha registrado la liquidación total del préstamo.`);
      } else if (aplicarAAtraso) {
        let mensaje = `Pago registrado correctamente.`;
        
        if (data.atrasosLiquidados) {
          mensaje += `\n\nSe han liquidado ${data.atrasosLiquidados} cuota(s) atrasada(s).`;
        }
        
        if (data.atrasosPendientes > 0) {
          mensaje += `\n\nAún quedan ${data.atrasosPendientes} cuota(s) atrasada(s) pendientes.`;
        }
        
        alert(mensaje);
      } else {
        alert(`Pago registrado correctamente para la semana ${prestamoSeleccionado.semana}.`);
      }
      
      // Limpiar formulario y recargar datos
      setPagoForm({
        monto: prestamoSeleccionado.cuota,
        fecha: new Date().toISOString().split('T')[0],
        montoAbonado: '0'
      });
      togglePaymentForm();
      
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

  // Toggle the receipt modal
  const toggleReciboModal = (show, pagoId = null) => {
    if (show && pagoId) {
      generarRecibo(pagoId);
    } else {
      setShowRecibo(false);
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

  // Eliminar un préstamo
  const eliminarPrestamo = async (prestamoId) => {
    // Encontrar el préstamo para mostrar detalles en el mensaje de confirmación
    const prestamo = prestamos.find(p => p.id === prestamoId);
    if (!prestamo) return;
    
    try {
      // Si está completamente pagado o no tiene pagos, confirmar la eliminación
      if (prestamo.estado === 'pagado' || !prestamo.totalPagado || prestamo.totalPagado === 0) {
        let mensaje = prestamo.estado === 'pagado' 
          ? `Este préstamo está completamente pagado. Para eliminarlo, es necesario eliminar también todos sus pagos registrados.\n\n¿Estás seguro de que deseas eliminar el préstamo y todos sus pagos asociados?`
          : `¿Estás seguro de que deseas eliminar el préstamo de ${formatCurrency(prestamo.monto)} para ${clienteSeleccionado.nombre}? Esta acción no se puede deshacer.`;
          
        if (!confirm(mensaje)) {
          return;
        }
        
        setLoading(true);
        setError(null);
        setErrorMsg('');
        
        // Realizar la eliminación con el parámetro correcto para el backend
        const response = await fetch(`http://localhost:4000/api/prestamos/${prestamoId}?borrarPagos=true`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(userData.id)
          }
        });
        
        if (!response.ok) {
          const text = await response.text();
          console.error('Respuesta del servidor:', text);
          throw new Error('Error al eliminar el préstamo. Código: ' + response.status);
        }
        
        // Recargar la lista de préstamos
        fetchPrestamosPorCliente(clienteSeleccionado.id);
        alert('Préstamo eliminado correctamente.');
      } else {
        // Si tiene pagos pero no está completamente pagado, no puede eliminarlo
        alert('Este préstamo tiene pagos registrados y no está completamente pagado. No puede ser eliminado hasta que se complete el pago.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error en eliminarPrestamo:', error);
      setErrorMsg(`No se pudo eliminar el préstamo: ${error.message}`);
      setLoading(false);
    }
  };

  // Actualizar atrasos de préstamos
  const actualizarAtrasos = async () => {
    // Confirmación del usuario
    const confirmacion = confirm(
      `¿Desea registrar automáticamente los atrasos para la ruta ${rutaSeleccionada.nombre}?\n\n` +
      "Esta acción marcará como 'atrasados' todos los préstamos que debían pagar hoy y no lo han hecho."
    );
    
    if (!confirmacion) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setErrorMsg('');
      
      // Calcular la fecha actual
      const fechaActual = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`http://localhost:4000/api/prestamos/actualizar-atrasos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        },
        body: JSON.stringify({
          rutaId: rutaSeleccionada.id,
          fechaActual: fechaActual,
          diaCobro: rutaSeleccionada.diaCobro
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar los atrasos');
      }
      
      const data = await response.json();
      
      // Recargar la lista de préstamos si estamos en la vista de préstamos
      if (clienteSeleccionado) {
        fetchPrestamosPorCliente(clienteSeleccionado.id);
      } else {
        // Si estamos en la vista de clientes, recargar clientes para ver estados actualizados
        fetchClientesPorRuta(rutaSeleccionada.id);
      }
      
      setLoading(false);
      
      // Mostrar mensaje con el resultado
      alert(`Atrasos registrados correctamente:\n\n` +
            `- ${data.prestamosActualizados} préstamos revisados\n` +
            `- ${data.atrasosRegistrados} nuevos pagos marcados como 'no pagado'\n` +
            `- ${data.clientesActualizados} clientes actualizados a estado 'moroso'`);
      
    } catch (error) {
      console.error('Error en actualizarAtrasos:', error);
      setError(`Error al actualizar atrasos: ${error.message}`);
      setLoading(false);
    }
  };

  // Añadir esta nueva función para registrar atraso
  const registrarAtraso = async (prestamoId) => {
    // Pedir confirmación al usuario
    const confirmacion = confirm(
      `¿Estás seguro de que deseas registrar un atraso para este préstamo?\n\n` +
      `Esto marcará la semana ${prestamoSeleccionado.semana} como no pagada.`
    );
    
    if (!confirmacion) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setErrorMsg('');
      
      // Calcular la fecha esperada de pago basada en la fecha de inicio del préstamo
      // y la semana actual
      const fechaInicio = new Date(prestamoSeleccionado.fechaInicio);
      const diasTranscurridos = (prestamoSeleccionado.semana - 1) * 7; // -1 porque la semana 1 es el inicio
      const fechaEsperada = new Date(fechaInicio);
      fechaEsperada.setDate(fechaEsperada.getDate() + diasTranscurridos);
      
      // Usar exactamente el mismo formato y campos que en registrarPago
      const datosPago = {
        prestamoId: prestamoSeleccionado.id,
        monto: 0,
        fecha: new Date().toISOString().split('T')[0],
        semana: prestamoSeleccionado.semana,
        montoAbonado: 0,
        estadoPago: 'atrasado',
        fechaEsperada: fechaEsperada.toISOString().split('T')[0],
        // Añadir un campo que indica explícitamente que es un atraso
        esRegistroAtraso: true
      };
      
      console.log("Enviando pago con atraso:", datosPago);
      
      // Convertir valores numéricos a números (parseFloat) como en registrarPago
      const response = await fetch('http://localhost:4000/api/pagos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(userData.id)
        },
        body: JSON.stringify({
          prestamoId: prestamoSeleccionado.id,
          monto: parseFloat(datosPago.monto), // Usar parseFloat como en registrarPago
          fecha: datosPago.fecha,
          semana: parseInt(datosPago.semana), // Usar parseInt como en registrarPago
          montoAbonado: parseFloat(datosPago.montoAbonado), // Usar parseFloat
          estadoPago: datosPago.estadoPago,
          fechaEsperada: datosPago.fechaEsperada,
          esRegistroAtraso: true
        })
      });
      
      // Si hay error, mostrar detalle
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Respuesta del servidor completa:', response.status, errorText);
        
        // Analizar el error en detalle
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorJson = JSON.parse(errorText);
            console.log("Error JSON:", errorJson);
            throw new Error(errorJson.error || `Error ${response.status}`);
          } else {
            throw new Error(`Error ${response.status}: ${errorText.substring(0, 100)}`);
          }
        } catch (parseError) {
          console.error("Error al analizar respuesta:", parseError);
          throw new Error(`Error ${response.status}`);
        }
      }
      
      // Si llegamos aquí, el pago se registró correctamente
      console.log('Atraso registrado exitosamente');
      
      // Recargar datos desde el servidor
      await fetchPagosPorPrestamo(prestamoSeleccionado.id);
      await fetchPrestamosPorCliente(clienteSeleccionado.id);
      
      alert('Atraso registrado correctamente');
      setLoading(false);
    } catch (error) {
      console.error('Error en registrarAtraso:', error);
      setErrorMsg(`Error al registrar el atraso: ${error.message}`);
      setLoading(false);
    }
  };

  // Renderizado condicional según la vista actual
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con barra de navegación */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/img/logo.svg" alt="Presta G" className="h-10 mr-3" />
            <h1 className="text-2xl font-bold text-green-700">Gestión de Préstamos</h1>
          </div>
          <div className="flex items-center">
            <span className="hidden md:block font-medium text-gray-700 mr-4">{userData.nombre}</span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Loading overlay - show on top of everything */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
            <div className="bg-white p-5 rounded-lg shadow-xl flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mb-3"></div>
              <p className="text-gray-700">Cargando...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {/* Vista de clientes de una ruta */}
        {vista === 'clientes' && rutaSeleccionada && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button 
                  onClick={onVolver}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md shadow flex items-center mr-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Volver a Rutas
                </button>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Clientes: {rutaSeleccionada.nombre}
                </h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={toggleClientForm}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow transition duration-300 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Nuevo Cliente
                </button>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md h-12 w-12 flex items-center justify-center text-white mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-1">{rutaSeleccionada.nombre}</h2>
                  <p className="text-gray-600">Día de cobro: {rutaSeleccionada.diaCobro}</p>
                </div>
              </div>
            </div>

            {/* Formulario para añadir cliente */}
            {showForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Nuevo Cliente</h3>
                  <button 
                    onClick={toggleClientForm}
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
                
                <form onSubmit={crearCliente} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Cliente</label>
                    <input 
                      type="text"
                      name="idCliente"
                      value={formData.idCliente}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="ID-001"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <input 
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                    <input 
                      type="text"
                      name="cedula"
                      value={formData.cedula}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="00123456789"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input 
                      type="text"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="809-123-4567"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
                    <input 
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <textarea 
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Dirección completa"
                      rows="2"
                    ></textarea>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={toggleClientForm}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition"
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Guardar Cliente'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de clientes */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {clientes.length === 0 ? (
                <div className="p-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No hay clientes registrados</h3>
                  <p className="text-gray-600 mb-4">Comienza agregando clientes a esta ruta</p>
                  <button
                    onClick={toggleClientForm}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Agregar Cliente
                  </button>
                </div>
              ) : (
                <div>
                  <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-700">
                      {clientes.length} {clientes.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
                    </h3>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientes.map(cliente => (
                        <tr key={cliente.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{cliente.idCliente}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{cliente.nombre}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{cliente.cedula}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{cliente.telefono}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${cliente.estado === 'activo' ? 'bg-green-100 text-green-800' : 
                                cliente.estado === 'moroso' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                              {cliente.estado || 'activo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => seleccionarCliente(cliente)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-white text-sm font-medium shadow-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Ver Préstamos
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vista de préstamos de un cliente */}
        {vista === 'prestamos' && clienteSeleccionado && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button 
                  onClick={volverAClientes}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md shadow flex items-center mr-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Volver a Clientes
                </button>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Préstamos
                </h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={toggleLoanForm}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow transition duration-300 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Nuevo Préstamo
                </button>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md h-12 w-12 flex items-center justify-center text-white mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-1">{clienteSeleccionado.nombre}</h2>
                  <p className="text-gray-600">Cédula: {clienteSeleccionado.cedula}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600">Teléfono:</p>
                  <p className="font-medium">{clienteSeleccionado.telefono}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email:</p>
                  <p className="font-medium">{clienteSeleccionado.email || 'No disponible'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Dirección:</p>
                  <p className="font-medium">{clienteSeleccionado.direccion}</p>
                </div>
              </div>
            </div>

            {/* Formulario para nuevo préstamo */}
            {showPrestamoForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Nuevo Préstamo</h3>
                  <button 
                    onClick={toggleLoanForm}
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
                
                <form onSubmit={crearPrestamo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto del Préstamo</label>
                    <input 
                      type="number"
                      name="monto"
                      value={prestamoForm.monto}
                      onChange={handlePrestamoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="10000"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                    <input 
                      type="date"
                      name="fechaInicio"
                      value={prestamoForm.fechaInicio}
                      onChange={handlePrestamoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plazo (semanas)</label>
                    <input 
                      type="number"
                      name="plazo"
                      value={prestamoForm.plazo || "13"}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      title="El plazo está fijo en 13 semanas"
                    />
                    <p className="text-xs text-gray-500 mt-1">Plazo fijo de 13 semanas</p>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cuota Semanal</label>
                    <input 
                      type="number"
                      name="cuota"
                      value={prestamoForm.cuota}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      placeholder="Calculada automáticamente"
                    />
                    <p className="text-xs text-gray-500 mt-1">Calculada automáticamente</p>
                  </div>
                  <div className="md:col-span-2 mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Información del préstamo:</strong> 
                      {prestamoForm.monto && !isNaN(parseFloat(prestamoForm.monto)) ? (
                        <span> Préstamo de {formatCurrency(parseFloat(prestamoForm.monto))} a pagar en 13 semanas con cuotas de {formatCurrency(parseFloat(prestamoForm.cuota || 0))}. 
                        Total a pagar: {formatCurrency(parseFloat(prestamoForm.cuota || 0) * 13)}</span>
                      ) : (
                        <span> Ingrese el monto del préstamo para ver los detalles.</span>
                      )}
                    </p>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={toggleLoanForm}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition"
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Crear Préstamo'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de préstamos */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
              {prestamos.length === 0 ? (
                <div className="p-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No hay préstamos registrados</h3>
                  <p className="text-gray-600 mb-4">Comienza otorgando un préstamo a este cliente</p>
                  <button
                    onClick={toggleLoanForm}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Crear Préstamo
                  </button>
                </div>
              ) : (
                <div>
                  <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-700">
                      {prestamos.length} {prestamos.length === 1 ? 'préstamo encontrado' : 'préstamos encontrados'}
                    </h3>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plazo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progreso</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {prestamos.map(prestamo => (
                        <tr key={prestamo.id} className={`hover:bg-gray-50 ${
                          prestamo.estado === 'moroso' ? 'bg-red-50' : ''
                        }`}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{formatCurrency(prestamo.monto)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">13 semanas</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(prestamo.cuota)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatDate(prestamo.fechaInicio)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {prestamo.semana} de 13
                            {prestamo.atrasosNoPagados > 0 && (
                              <div className="mt-1 text-xs text-red-600 font-medium">
                                {prestamo.atrasosNoPagados} {prestamo.atrasosNoPagados === 1 ? 'semana sin pagar' : 'semanas sin pagar'}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${prestamo.estado === 'activo' ? 'bg-green-100 text-green-800' : 
                                prestamo.estado === 'moroso' ? 'bg-red-100 text-red-800' : 
                                prestamo.estado === 'pagado' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                              {prestamo.estado || 'activo'}
                            </span>
                            {prestamo.pagosParciales > 0 && (
                              <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {prestamo.pagosParciales} parcial{prestamo.pagosParciales !== 1 ? 'es' : ''}
                              </span>
                            )}
                            {prestamo.pagosAtrasados > 0 && (
                              <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                {prestamo.pagosAtrasados} atrasado{prestamo.pagosAtrasados !== 1 ? 's' : ''}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => seleccionarPrestamo(prestamo)}
                                className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-md transition-colors text-white text-sm font-medium shadow-sm"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Ver Pagos
                              </button>
                              {/* Mostrar botón de eliminar si el préstamo no tiene pagos o está completamente pagado */}
                              {(prestamo.totalPagado === 0 || prestamo.estado === 'pagado') && (
                                <button
                                  onClick={() => eliminarPrestamo(prestamo.id)}
                                  className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md transition-colors text-white text-sm font-medium shadow-sm"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Eliminar
                                </button>
                              )}
                              {/* Mostrar 'Bloqueado' si el préstamo tiene pagos y no está completamente pagado */}
                              {prestamo.totalPagado > 0 && prestamo.estado !== 'pagado' && (
                                <div className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-md text-xs flex items-center" title="Solo se pueden eliminar préstamos sin pagos o completamente pagados">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Bloqueado
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vista de pagos de un préstamo */}
        {vista === 'pagos' && prestamoSeleccionado && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button 
                  onClick={volverAPrestamos}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md shadow flex items-center mr-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Volver a Préstamos
                </button>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Pagos del Préstamo
                </h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => registrarAtraso(prestamoSeleccionado.id)}
                  className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md shadow transition duration-300 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Registrar Atraso
                </button>
                <button
                  onClick={togglePaymentForm}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow transition duration-300 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Registrar Pago
                </button>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md h-12 w-12 flex items-center justify-center text-white mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-1">Préstamo #{prestamoSeleccionado.id}</h2>
                  <p className="text-gray-600">Cliente: {clienteSeleccionado.nombre}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600">Monto original:</p>
                  <p className="font-medium">{formatCurrency(prestamoSeleccionado.monto)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Cuota semanal:</p>
                  <p className="font-medium">{formatCurrency(prestamoSeleccionado.cuota)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total a pagar:</p>
                  <p className="font-medium">{formatCurrency(prestamoSeleccionado.totalApagar || prestamoSeleccionado.monto * 1.3)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Pagado hasta ahora:</p>
                  <p className="font-medium text-green-600">{formatCurrency(prestamoSeleccionado.totalPagado || 0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Semana actual:</p>
                  <p className="font-medium">{prestamoSeleccionado.semana} de 13</p>
                </div>
                <div>
                  <p className="text-gray-600">Saldo pendiente:</p>
                  <p className="font-medium text-red-600">{formatCurrency((prestamoSeleccionado.totalApagar || prestamoSeleccionado.monto * 1.3) - (prestamoSeleccionado.totalPagado || 0))}</p>
                </div>
                <div>
                  <p className="text-gray-600">Estado:</p>
                  <div className="flex items-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${prestamoSeleccionado.estado === 'activo' ? 'bg-green-100 text-green-800' : 
                        prestamoSeleccionado.estado === 'moroso' ? 'bg-red-100 text-red-800' : 
                        prestamoSeleccionado.estado === 'pagado' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {prestamoSeleccionado.estado || 'activo'}
                    </span>
                    
                    {/* Mostrar si tiene pagos atrasados o parciales */}
                    {prestamoSeleccionado.pagosParciales > 0 && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800" title="Este préstamo tiene pagos parciales">
                        {prestamoSeleccionado.pagosParciales} {prestamoSeleccionado.pagosParciales === 1 ? 'pago parcial' : 'pagos parciales'}
                      </span>
                    )}
                    
                    {prestamoSeleccionado.pagosAtrasados > 0 && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800" title="Este préstamo tiene pagos atrasados">
                        {prestamoSeleccionado.pagosAtrasados} {prestamoSeleccionado.pagosAtrasados === 1 ? 'pago atrasado' : 'pagos atrasados'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Barra de progreso del préstamo */}
              <div className="mt-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Progreso del préstamo</span>
                  <span className="text-sm font-medium text-gray-700">
                    {Math.round((prestamoSeleccionado.totalPagado || 0) / (prestamoSeleccionado.totalApagar || prestamoSeleccionado.monto * 1.3) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ 
                    width: `${Math.round((prestamoSeleccionado.totalPagado || 0) / (prestamoSeleccionado.totalApagar || prestamoSeleccionado.monto * 1.3) * 100)}%` 
                  }}></div>
                </div>
              </div>
            </div>

            {/* Formulario para registrar pago */}
            {showPagoForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Registrar Pago</h3>
                  <button 
                    onClick={togglePaymentForm}
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
                
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-700 font-medium">Saldo pendiente actual:</p>
                      <p className="text-xl font-bold text-blue-700">{formatCurrency((prestamoSeleccionado.totalApagar || prestamoSeleccionado.monto * 1.3) - (prestamoSeleccionado.totalPagado || 0))}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const saldoPendiente = (prestamoSeleccionado.totalApagar || prestamoSeleccionado.monto * 1.3) - (prestamoSeleccionado.totalPagado || 0);
                        setPagoForm({
                          ...pagoForm,
                          monto: saldoPendiente.toFixed(2)
                        });
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow transition flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Pagar Préstamo Completo
                    </button>
                  </div>
                </div>
                
                <form onSubmit={registrarPago} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto del pago</label>
                    <input 
                      type="number"
                      name="monto"
                      value={pagoForm.monto}
                      onChange={handlePagoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Monto de la cuota"
                      min="1"
                      step="0.01"
                    />
                    {pagoForm.monto && parseFloat(pagoForm.monto) < parseFloat(prestamoSeleccionado.cuota) && (
                      <p className="text-yellow-600 text-xs mt-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Pago parcial: {formatCurrency(prestamoSeleccionado.cuota - parseFloat(pagoForm.monto))} pendiente
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Abono extra (opcional)</label>
                    <input 
                      type="number"
                      name="montoAbonado"
                      value={pagoForm.montoAbonado}
                      onChange={handlePagoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del pago</label>
                    <input 
                      type="date"
                      name="fecha"
                      value={pagoForm.fecha}
                      onChange={handlePagoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {(() => {
                      // Verificar si la fecha seleccionada es posterior a la fecha esperada de pago
                      if (pagoForm.fecha) {
                        const fechaSeleccionada = new Date(pagoForm.fecha);
                        const fechaInicio = new Date(prestamoSeleccionado.fechaInicio);
                        const diasTranscurridos = (prestamoSeleccionado.semana - 1) * 7;
                        const fechaEsperada = new Date(fechaInicio);
                        fechaEsperada.setDate(fechaEsperada.getDate() + diasTranscurridos);
                        
                        // Considerar atrasado si la fecha es posterior a 2 días después de la fecha esperada
                        const dosMillisegundosDias = 2 * 24 * 60 * 60 * 1000;
                        if (fechaSeleccionada > new Date(fechaEsperada.getTime() + dosMillisegundosDias)) {
                          return (
                            <p className="text-red-600 text-xs mt-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Pago atrasado: La fecha esperada era {fechaEsperada.toLocaleDateString()}
                            </p>
                          );
                        }
                      }
                      return null;
                    })()}
                  </div>
                  <div className="md:col-span-2 mt-2 p-3 rounded-md">
                    <h4 className="font-medium mb-2">Resumen del pago:</h4>
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between">
                        <span>Cuota completa:</span>
                        <span className="font-medium">{formatCurrency(prestamoSeleccionado.cuota)}</span>
                      </div>
                      {pagoForm.monto && parseFloat(pagoForm.monto) < parseFloat(prestamoSeleccionado.cuota) && (
                        <div className="flex justify-between text-yellow-600">
                          <span>Monto pendiente:</span>
                          <span className="font-medium">{formatCurrency(prestamoSeleccionado.cuota - parseFloat(pagoForm.monto))}</span>
                        </div>
                      )}
                      {pagoForm.montoAbonado && parseFloat(pagoForm.montoAbonado) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Abono extra:</span>
                          <span className="font-medium">{formatCurrency(parseFloat(pagoForm.montoAbonado))}</span>
                        </div>
                      )}
                      {/* Mostrar indicador de liquidación total cuando el monto es igual o mayor al saldo pendiente */}
                      {pagoForm.monto && parseFloat(pagoForm.monto) >= ((prestamoSeleccionado.totalApagar || prestamoSeleccionado.monto * 1.3) - (prestamoSeleccionado.totalPagado || 0)) && (
                        <div className="flex justify-between text-blue-600 bg-blue-50 p-2 rounded-md mt-1">
                          <span className="font-bold">¡LIQUIDACIÓN TOTAL!</span>
                          <span className="font-bold">{formatCurrency(parseFloat(pagoForm.monto))}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-2 mt-1">
                        <span>Total a pagar:</span>
                        <span>{formatCurrency(parseFloat(pagoForm.monto || 0) + parseFloat(pagoForm.montoAbonado || 0))}</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={togglePaymentForm}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition"
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Registrar Pago'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de pagos */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {pagos.length === 0 ? (
                <div className="p-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No hay pagos registrados</h3>
                  <p className="text-gray-600 mb-4">Comienza registrando el primer pago</p>
                  <button
                    onClick={togglePaymentForm}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Registrar Pago
                  </button>
                </div>
              ) : (
                <div>
                  <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-700">
                      {pagos.length} {pagos.length === 1 ? 'pago registrado' : 'pagos registrados'}
                    </h3>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semana</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abono Extra</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagos.map(pago => (
                        <tr key={pago.id} className={`hover:bg-gray-50 ${
                          pago.estadoPago === 'atrasado' || pago.estadoPago === 'atrasado y parcial' 
                            ? 'bg-red-50' 
                            : pago.estadoPago === 'parcial' 
                              ? 'bg-yellow-50' 
                              : ''
                        }`}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{pago.semana}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatDate(pago.fecha)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {pago.estadoPago === 'parcial' || pago.estadoPago === 'atrasado y parcial' ? (
                              <div className="flex flex-col">
                                <span className="text-yellow-600">{formatCurrency(pago.monto)}</span>
                                <span className="text-xs text-gray-500">
                                  de {formatCurrency(prestamoSeleccionado.cuota)}
                                </span>
                              </div>
                            ) : (
                              formatCurrency(pago.monto)
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(pago.montoAbonado || 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(pago.monto + (pago.montoAbonado || 0))}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${pago.estadoPago === 'a tiempo' ? 'bg-green-100 text-green-800' : 
                                pago.estadoPago === 'atrasado' ? 'bg-red-100 text-red-800' : 
                                pago.estadoPago === 'parcial' ? 'bg-yellow-100 text-yellow-800' : 
                                pago.estadoPago === 'atrasado y parcial' ? 'bg-orange-100 text-orange-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {pago.estadoPago === 'a tiempo' ? 'A tiempo' :
                                pago.estadoPago === 'atrasado' ? 'Atrasado' :
                                pago.estadoPago === 'parcial' ? 'Parcial' :
                                pago.estadoPago === 'atrasado y parcial' ? 'Atrasado y parcial' :
                                pago.estadoPago || 'A tiempo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleReciboModal(true, pago.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors text-white text-sm font-medium shadow-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Imprimir Recibo
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal para recibo */}
        {showRecibo && recibo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative">
              <button 
                onClick={() => toggleReciboModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="mb-6 text-center border-b pb-4">
                <h3 className="text-xl font-bold">Recibo de Pago</h3>
                <p className="text-gray-600">Nº {recibo.numeroRecibo}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-600">Fecha:</p>
                  <p className="font-semibold">{recibo.fecha}</p>
                </div>
                <div>
                  <p className="text-gray-600">Cliente:</p>
                  <p className="font-semibold">{recibo.cliente.nombre}</p>
                </div>
                <div>
                  <p className="text-gray-600">Cédula:</p>
                  <p className="font-semibold">{recibo.cliente.cedula}</p>
                </div>
                <div>
                  <p className="text-gray-600">Ruta:</p>
                  <p className="font-semibold">{recibo.ruta.nombre}</p>
                </div>
              </div>
              
              <div className="border-t border-b py-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Préstamo #:</p>
                    <p className="font-semibold">{recibo.prestamo.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Monto original:</p>
                    <p className="font-semibold">{formatCurrency(recibo.prestamo.monto)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Semana:</p>
                    <p className="font-semibold">{recibo.pago.semana} de {recibo.prestamo.plazo}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Cuota semanal:</p>
                    <p className="font-semibold">{formatCurrency(recibo.prestamo.cuota)}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <p className="text-gray-600">Pago regular:</p>
                  <p className="font-semibold">{formatCurrency(recibo.pago.monto)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Abono extra:</p>
                  <p className="font-semibold">{formatCurrency(recibo.pago.montoAbonado || 0)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600">Total pagado:</p>
                  <p className="font-semibold text-lg">{formatCurrency(recibo.pago.monto + (recibo.pago.montoAbonado || 0))}</p>
                </div>
              </div>
              
              <div className="flex justify-center mt-8">
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors text-white text-sm font-medium shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default RutasAdmin;
