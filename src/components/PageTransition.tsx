// src/components/PageTransition.tsx
import React, { useState, useEffect } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Simular tiempo de carga
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      
      // Después de que se completa la animación de fadeOut, eliminar la pantalla de carga
      const fadeTimer = setTimeout(() => {
        setIsLoading(false);
      }, 500); // Duración de la animación de fadeOut
      
      return () => clearTimeout(fadeTimer);
    }, 1200); // Tiempo total de carga
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className={`loading-screen ${isFadingOut ? 'fade-out' : ''}`}>
        <img 
          src="./img/AUTO_INSIGHTS-04.jpg" 
          alt="Auto Insights Logo" 
          className="loading-logo"
        />
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando sistema...</div>
      </div>
    );
  }

  return <div className="page-transition-enter">{children}</div>;
};

export default PageTransition;