import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { useNotification } from '../context/NotificationContext'; 
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await login(email, password);
            if (success) {
                // Añade un retraso intencional para mostrar la animación de carga por más tiempo
                setTimeout(() => {
                    setIsLoading(false); // Detener la carga antes de navegar
                    navigate('/admin'); // O a la ruta que necesites
                }, 1500); // Ajusta este valor según necesites (en milisegundos)
            } else {
                setIsLoading(false);
                setError('Credenciales incorrectas. Inténtalo de nuevo.');
                showNotification('error', 'Credenciales incorrectas. Inténtalo de nuevo.');
            }
        } catch (err) {
            setIsLoading(false);
            setError('Error al iniciar sesión. Por favor, inténtalo más tarde.');
            showNotification('error', 'Error al iniciar sesión. Por favor, inténtalo más tarde.');
            console.error('Error de inicio de sesión:', err);
        }
    };

    return (
        // Contenedor principal con flexbox para dividir la pantalla
        <div className="flex min-h-screen">
            {/* Lado izquierdo con imagen de fondo y logotipo. */}
            <div className="hidden lg:block lg:w-2/3 relative">
                {/* Overlay opcional, puedes ajustar el color y opacidad */}
                <div className="absolute inset-0 bg-black bg-opacity-25 z-10"></div>
                <img
                    src="/img/iconautotest.png" // Asegúrate que esta ruta es correcta
                    alt="Background"
                    className="object-cover w-full h-full"
                />
            </div>

            {/* Lado derecho con formulario de inicio de sesión */}
            <div className="w-full lg:w-1/3 bg-gray-900 p-8 flex items-center justify-center">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white">Iniciar sesión</h2>
                        <p className="mt-2 text-gray-400">Inicia sesión para acceder a tu cuenta</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <TextField
                            id="email"
                            label="Correo"
                            variant="outlined"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="correo@ejemplo.com"
                            margin="normal"
                            disabled={isLoading}
                            sx={{
                                // Estilos para el contenedor del input y el borde
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: '#4B5563', // Borde gris-azulado
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#6B7280', // Borde gris-azulado más claro en hover
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#FFFFFF', // Borde blanco cuando está enfocado
                                    },
                                    // Color de fondo condicional
                                    backgroundColor: email ? '#FFFFFF' : '#1F2937',
                                    transition: 'background-color 0.3s ease',
                                    borderRadius: '0.5rem', // Bordes redondeados
                                },
                                // Estilos para la etiqueta (Label)
                                '& .MuiInputLabel-root': {
                                    color: '#E5E7EB', // Color gris claro para la etiqueta no enfocada
                                },
                                // --- NUEVA REGLA PARA EL LABEL ENFOCADO ---
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#FFFFFF', // Color blanco para la etiqueta cuando el input está enfocado
                                },
                                // Estilos para el texto dentro del input
                                '& .MuiInputBase-input': {
                                    color: email ? '#000000' : '#FFFFFF', // Texto negro si hay contenido, blanco si no
                                    transition: 'color 0.3s ease',
                                },
                                // Estilos para la etiqueta cuando está encogida (flotando arriba)
                                '& .MuiInputLabel-shrink': {
                                    color: '#FFFFFF', // Texto blanco
                                    backgroundColor: '#1F2937', // Fondo oscuro para que contraste sobre el borde
                                    padding: '0 5px', // Espaciado alrededor del texto
                                    borderRadius: '3px', // Bordes redondeados para el fondo
                                    fontWeight: 'bold',
                                    // Asegura la transformación correcta
                                    transform: 'translate(14px, -9px) scale(0.75)',
                                },
                            }}
                        />

                        <TextField
                            id="password"
                            label="Contraseña"
                            type="password"
                            variant="outlined"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••••"
                            margin="normal"
                            disabled={isLoading}
                            sx={{
                                // Estilos para el contenedor del input y el borde
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: '#4B5563',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#6B7280',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#FFFFFF', // Borde blanco al enfocar
                                    },
                                     // Color de fondo condicional
                                    backgroundColor: password ? '#FFFFFF' : '#1F2937',
                                    transition: 'background-color 0.3s ease',
                                    borderRadius: '0.5rem',
                                },
                                // Estilos para la etiqueta (Label)
                                '& .MuiInputLabel-root': {
                                    color: '#E5E7EB',
                                },
                                // --- NUEVA REGLA PARA EL LABEL ENFOCADO ---
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#FFFFFF', // Color blanco para la etiqueta cuando el input está enfocado
                                },
                                // Estilos para el texto dentro del input
                                '& .MuiInputBase-input': {
                                    color: password ? '#000000' : '#FFFFFF', // Texto negro si hay contenido, blanco si no
                                    transition: 'color 0.3s ease',
                                },
                                // Estilos para la etiqueta cuando está encogida (flotando arriba)
                                '& .MuiInputLabel-shrink': {
                                    color: '#FFFFFF',
                                    backgroundColor: '#1F2937',
                                    padding: '0 5px',
                                    borderRadius: '3px',
                                    fontWeight: 'bold',
                                    transform: 'translate(14px, -9px) scale(0.75)',
                                },
                            }}
                        />

                        <div>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={isLoading}
                                startIcon={
                                    isLoading ? (
                                        // Spinner de carga
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        // Icono normal (asegúrate que la base64 es correcta o usa un componente de icono)
                                        <img
                                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEhUlEQVR4nNVZz28bRRTeC1ScOQAqEkJCgKB/BRJXRIUEKicOjp3gpMhxkzYOJRC1SdPEnjFw4V+AEwevf8RO4jaxPdOkcOBE4B+gohL+sfPGRR701k7qxHbwzo4dGOmTVt6dt9/beTPve8+WZWB8y+ovUiY/plwmCZdZyuQh4fCYMGi64PC4/ZvMus9U5BWcY53n+Iap5wmDq5TDA8ql0gFhwJNMzKCtsRFPVhovEyYpYdDQJd4DBnXKJImXGhdHRvy7ffUM5fAZYVAzRpz3rEiDMPll8ld1wSh5wuENwuHnURGnPYCfNhi8boQ85fDBKL86HexElTK47O/LM/kJ5fBk/ORlO6Q4/E1Zc1KP/INm6LyI01PAk8p72KD3/wHytLMSpALvD0U+fiBeIxz+Om/S9LQTDGpf78ObZ5Jf+kU9a+q0STCp1kpSrZXb14aceIjH+eDQYXDDzws2KqBi20KFM0IFUs4JTGeFiu0IFa+ALyeSHK71D51S46KbETUN3yyCCtonSfdDyHbUF0XhK5QS+/WXehxAeaBlkEs1vwX/Svw05gvgztV0JN5PmGlpm9i2d/JHWNzRDCcG9RMCsK0qvRu6UwYVGCJsBsJ21J2SnhMJLsJPN6+mJI5s9m5Wr5jNa+4HBswljxuCMGh5NRBn+qHTjYmU49rS2MwtWq69YHUqKc8Glu+bcSCQctTyrl4YES4/srDE05n8+Y45B24WdTezJFanTvU8OWbQgZj2aSRtDKHfdSZjMjLlwNI93Y0sD/EE+lNn8sqeuRVY2dPOB49Q/0jNDaRCaf+rELId7YxMGIC2A4iFbf8OxHZ86SLQDiFEnEk1mdYnP5l2/EltDCHC5G/aBrhUqyVQExpyIphy1Kpu7B87IA+1j9Fu3NqTKmQPH06TaeHOoT7f2z5GNRPZaaxXpIrmhSsNBhHHe/jMetkAeX6UyCryihFjHdwtS7VYBDW7KdRMrg28xsyN90y+K8nkhxYKIh0xd94gR2KuUw/w/50DHMrH9QA2js6bEPWM5qcnSko/Bf0gYAfCbxeCDlNStlsqkmgTZaC+ug9ucX81J/pKDDxm8R4+g8/6cYxwueG7rYL65daudEtC3Uw8mxfq9m7b1vAOQHXg31OEwfVhjKyU2l/alBqdyQp1e9iszCBqDRrYtsP23aDJqFvmCuZkdOAUMLzO1EYMDs5sLZ7V3MUkFM6MhnigC/iOfgkPO3L4T9GZ5J9uaLjc3V5H0WVC+3vRSqtdIeW21zm8Z3kZSd4M4uS18njJB45PLcdVuphxE0wGLJ1xl8mJKR963y+m0o5arzSnLT/jxhYshWynNW7ywVSjNbclli0TYyEv3g1nnPq4yIczjfr1onjHMjlmbHUhmnd+DNmNka1GMOW05vKQjZTUc9aoxsJ27VIkJw6CBh0J2Y1WZFPsL92rvmWNaywWxavXCuKH6axT1Wqx2+6ZX40WnO+jBfXK2Ij3G9Fs7dJcQZBIznk4kxWPpjKOxBXCEhKB11PphpzOiT9mN8XB/JaTmE/X3jbx8n8A0x2IRmBkF3AAAAAASUVORK5CYII="
                                            alt="Login icon"
                                            className="w-5 h-5"
                                        />
                                    )
                                }
                                sx={{
                                    backgroundColor: '#493F91', // Color púrpura original
                                    '&:hover': {
                                        backgroundColor: '#3E367F', // Color púrpura más oscuro para hover
                                    },
                                    textTransform: 'none',
                                    padding: '12px 16px',
                                    borderRadius: '0.5rem',
                                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                    '&:focus': {
                                        outline: 'none',
                                        boxShadow: '0 0 0 3px rgba(73, 63, 145, 0.5)',
                                    },
                                    '&.Mui-disabled': {
                                        backgroundColor: '#2D2769',
                                        color: 'rgba(255, 255, 255, 0.7)'
                                    }
                                }}
                            >
                                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Overlay de carga (opcional, si quieres mantenerlo mientras navega) */}
            {/* Si el isLoading se pone en false antes de navegar, este overlay desaparecerá */}
            {/* Si quieres que se muestre hasta que la navegación ocurra, mantén isLoading true hasta después del navigate */}
            {isLoading && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                     <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                         {/* Puedes usar el mismo spinner del botón u otro */}
                         <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                         <p className="text-gray-700 font-medium">Iniciando sesión...</p>
                     </div>
                 </div>
            )}
        </div>
    );
};

export default Login;