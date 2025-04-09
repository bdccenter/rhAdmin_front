import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const success = await login(email, password);
            if (success) {
                navigate('/admin');
            } else {
                setError('Credenciales incorrectas. Inténtalo de nuevo.');
            }
        } catch (err) {
            setError('Error al iniciar sesión. Por favor, inténtalo más tarde.');
            console.error('Error de inicio de sesión:', err);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left side with background image and logo */}
            <div className="hidden lg:block lg:w-2/3 relative">
                <div className="absolute inset-0 bg-purple-/50 z-10"></div>
                <img
                    src="/img/iconautotest.png"
                    alt="Background"
                    className="object-cover w-full h-full"
                />
            </div>

            {/* Right side with login form */}
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
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-400">
                                Correo
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    required
                                    className="bg-gray-800 block w-full px-4 py-3 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-400">
                                Contraseña
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••"
                                    required
                                    className="bg-gray-800 block w-full px-4 py-3 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                                Iniciar sesión
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;