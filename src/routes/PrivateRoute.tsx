// src/routes/PrivateRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();

  // Si el usuario no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizar el componente hijo con la transición
  return (
    <PageTransition>
      <div className="page-content">
        <Outlet />
      </div>
    </PageTransition>
  );
};

export default PrivateRoute;