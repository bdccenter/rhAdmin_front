import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import RhAdmin from '../rhAdmin';
import PrivateRoute from './PrivateRoute';
import AuthProvider from '../context/AuthContext';
import NotificationProvider from '../context/NotificationContext';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Ruta pública para login */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas */}
            <Route element={<PrivateRoute />}>
              <Route path="/admin" element={<RhAdmin />} />
              {/* Aquí podrías agregar más rutas protegidas si es necesario */}
            </Route>
            
            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Ruta para manejo de 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;