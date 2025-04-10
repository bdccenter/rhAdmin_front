// src/components/Notification.tsx
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'info';
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoCloseTime?: number;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  isVisible,
  onClose,
  autoCloseTime = 3000,
}) => {
  // Configuración según el tipo
  const config = {
    success: {
      bg: 'bg-gray-700',
      icon: <CheckCircle className="h-6 w-6 text-green-400" />,
      textColor: 'text-white',
    },
    error: {
      bg: 'bg-gray-700',
      icon: <AlertCircle className="h-6 w-6 text-red-400" />,
      textColor: 'text-white',
    },
    info: {
      bg: 'bg-gray-700',
      icon: <Info className="h-6 w-6 text-blue-400" />,
      textColor: 'text-white',
    },
  };

  // Cerrar automáticamente después de un tiempo
  useEffect(() => {
    if (isVisible && autoCloseTime > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, autoCloseTime]);

  if (!isVisible) return null;

  const { bg, icon, textColor } = config[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
      <div className={`${bg} shadow-lg rounded-lg p-4 max-w-md`}>
        <div className="flex items-center space-x-3">
          {icon}
          <div className={`flex-1 ${textColor}`}>{message}</div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;