import { useState, useEffect } from 'react';

function App() {
  const [activeForm, setActiveForm] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    repetir_password: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const showLoginForm = () => {
    setActiveForm('login');
    setErrorMsg('');
  };

  const showRegisterForm = () => {
    setActiveForm('register');
    setErrorMsg('');
  };

  const closeForm = () => {
    setActiveForm(null);
    setErrorMsg('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setErrorMsg('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Guardar información del usuario en localStorage o estado
      localStorage.setItem('userData', JSON.stringify(data));
      setUserData(data);
      setUserLoggedIn(true);
      setActiveForm(null);
      setLoading(false);
    } catch (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    // Validación básica
    if (!formData.nombre || !formData.email || !formData.password || !formData.repetir_password) {
      setErrorMsg('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.repetir_password) {
      setErrorMsg('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      // Cambiar al formulario de login después del registro exitoso
      setActiveForm('login');
      setErrorMsg('');
      setFormData({
        ...formData,
        password: '',
        repetir_password: ''
      });
      setLoading(false);
    } catch (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    setUserLoggedIn(false);
    setUserData(null);
  };

  // Verificar si hay un usuario en localStorage al cargar la página
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserData(userData);
        setUserLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userData');
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      {/* Welcome section */}
      <div className="flex flex-col justify-center items-center py-5 w-full max-w-lg">
        <div className="max-w-96 py-5">
          <img src="/img/logo.svg" alt="Logo Presta G" className="w-full" />
        </div>
        
        <h2 className="text-center text-2xl font-extrabold text-green-700 mt-4">
          Plataforma de Préstamos
        </h2>
        
        <p className="mt-4 text-gray-600 text-center max-w-md">
          Gestiona tus préstamos de forma rápida y segura con nuestra aplicación.
        </p>

        {userLoggedIn ? (
          <div className="mt-8 flex flex-col items-center">
            <p className="text-xl text-green-700 font-semibold">
              Bienvenido, {userData?.nombre}
            </p>
            <button 
              onClick={handleLogout}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="flex gap-4 mt-8">
            <button 
              onClick={showLoginForm}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-md shadow-md transition duration-300"
            >
              Iniciar Sesión
            </button>
            
            <button 
              onClick={showRegisterForm}
              className="bg-white hover:bg-gray-100 border border-green-600 text-green-600 font-bold py-3 px-6 rounded-md shadow-md transition duration-300"
            >
              Registrarse
            </button>
          </div>
        )}
      </div>

      {/* Modal for forms */}
      {activeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={closeForm}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-center text-2xl font-extrabold mb-6">
              {activeForm === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>

            {errorMsg && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {errorMsg}
              </div>
            )}

            <form className="space-y-5" onSubmit={activeForm === 'login' ? handleLogin : handleRegister}>
              {activeForm === 'register' && (
                <div>
                  <label className="block text-sm uppercase text-gray-500 mb-2 font-bold" htmlFor="nombre">
                    Tu Nombre
                  </label>
                  <div className="flex gap-1 w-full px-3 py-2 border border-gray-300 rounded-md justify-center items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style={{ fill: 'rgba(21, 128, 61, 1)' }}>
                      <path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1h2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z" />
                    </svg>
                    <input
                      id="nombre"
                      className="w-full px-3 py-2 border-none placeholder-gray-400 focus:outline-none"
                      placeholder="Tu Nombre"
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm uppercase text-gray-500 mb-2 font-bold" htmlFor="email">
                  {activeForm === 'login' ? 'Email' : 'Email de Registro'}
                </label>
                <div className="flex gap-1 w-full px-3 py-2 border border-gray-300 rounded-md justify-center items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style={{ fill: 'rgba(21, 128, 61, 1)' }}>
                    <path d="M20 4H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zm0 2v.511l-8 6.223-8-6.222V6h16zM4 18V9.044l7.386 5.745a.994.994 0 0 0 1.228 0L20 9.044 20.002 18H4z" />
                  </svg>
                  <input
                    id="email"
                    className="w-full px-3 py-2 border-none placeholder-gray-400 focus:outline-none"
                    placeholder="Tu Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm uppercase text-gray-500 mb-2 font-bold" htmlFor="password">
                  Password
                </label>
                <div className="flex gap-1 w-full px-3 py-2 border border-gray-300 rounded-md justify-center items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style={{ fill: 'rgba(21, 128, 61, 1)' }}>
                    <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm6 10 .002 8H6v-8h12zm-9-2V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9z" />
                  </svg>
                  <input
                    id="password"
                    className="w-full px-3 py-2 border-none placeholder-gray-400 focus:outline-none"
                    placeholder="Tu Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {activeForm === 'register' && (
                <div>
                  <label className="block text-sm uppercase text-gray-500 mb-2 font-bold" htmlFor="repetir_password">
                    Repetir Password
                  </label>
                  <div className="flex gap-1 w-full px-3 py-2 border border-gray-300 rounded-md justify-center items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style={{ fill: 'rgba(21, 128, 61, 1)' }}>
                      <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm6 10 .002 8H6v-8h12zm-9-2V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9z" />
                    </svg>
                    <input
                      id="repetir_password"
                      className="w-full px-3 py-2 border-none placeholder-gray-400 focus:outline-none"
                      placeholder="Repite tu Password"
                      type="password"
                      name="repetir_password"
                      value={formData.repetir_password}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 cursor-pointer rounded-md transition duration-300 flex justify-center items-center"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-block h-5 w-5 border-4 border-white border-t-green-600 rounded-full animate-spin mr-2"></span>
                ) : null}
                {activeForm === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>

              {activeForm === 'login' ? (
                <p className="text-center text-sm">
                  ¿No tienes cuenta? {' '}
                  <button 
                    type="button"
                    onClick={showRegisterForm} 
                    className="text-green-600 hover:underline font-semibold"
                  >
                    Regístrate
                  </button>
                </p>
              ) : (
                <p className="text-center text-sm">
                  ¿Ya tienes cuenta? {' '}
                  <button 
                    type="button"
                    onClick={showLoginForm} 
                    className="text-green-600 hover:underline font-semibold"
                  >
                    Inicia sesión
                  </button>
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
