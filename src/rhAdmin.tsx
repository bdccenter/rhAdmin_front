import { Users, Save, User, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MdLogout } from "react-icons/md";
import { MdNextPlan } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useNotification } from './context/NotificationContext';


// Definimos la interfaz para los datos de empleados que recibiremos de la API
interface Employee {
  id: number;
  name: string;
  last_name: string;
  agency: string;
  date_of_birth: string;
  high_date: string;
  status: string;
  low_date: string | null;
  photo: string | null;
  id_user: number;
  user_email?: string;
}

// Interfaz para empleados con URL de foto procesada
interface ProcessedEmployee extends Employee {
  photoUrl: string;
}

// Interfaz para el formulario de nuevo empleado
interface NewEmployeeForm {
  nombre: string;
  apellido: string;
  agencia: string;
  fechaNacimiento: string;
  fechaAlta: string;
  status: string;
  photo: string;
  idUsuario: string;
}

// URL base de la API
const API_URL = 'http://localhost:3001/api';

// Lista de agencias disponibles
const AGENCIAS = [
  'AGUA PRIETA',
  'CABORCA',
  'CANANEA',
  'GRANAUTO',
  'GUAYMAS',
  'NAVOJOA',
  'MAGDALENA',
  'MORELOS',
  'NISSAUTO',
  'NOGALES',
  'PENASCO',
  'SICREA'
];

// Función para convertir enlaces de Google Drive a URLs de imagen directas
const convertGoogleDriveUrl = (url: string): string => {
  // Si la URL es nula o vacía, retornamos una cadena vacía
  if (!url) return '';

  // Verifica si es un enlace de Google Drive
  if (url.includes('drive.google.com/file/d/')) {
    // Extrae el ID del archivo de Google Drive
    const fileIdMatch = url.match(/\/d\/([^\/]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      // Retorna la URL de thumbnail (esta opción suele funcionar mejor)
      return `https://drive.google.com/thumbnail?id=${fileId}`;
    }
  }
  // Si no es un enlace de Google Drive o no se pudo extraer el ID, devuelve la URL original
  return url;
};

function RhAdmin() {
  // Auth Context para funcionalidad de logout
  const { logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // Ref para controlar si ya se mostró la notificación
  const notificationShown = useRef(false);

  // Estado para almacenar los datos de empleados procesados
  // y los términos de búsqueda y filtros
  const [employeesData, setEmployeesData] = useState<ProcessedEmployee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nameSearchTerm, setNameSearchTerm] = useState<string>('');
  const [otherSearchTerm, setOtherSearchTerm] = useState<string>('');
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [agencies, setAgencies] = useState<string[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Estado para el formulario de nuevo empleado
  const [formData, setFormData] = useState<NewEmployeeForm>({
    nombre: '',
    apellido: '',
    agencia: '',
    fechaNacimiento: '',
    fechaAlta: '',
    status: 'SI',
    photo: '',
    idUsuario: ''
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 100; // 100 registros por página

  // Mostrar notificación de inicio de sesión exitoso SOLO UNA VEZ
  useEffect(() => {
    if (!notificationShown.current) {
      showNotification('success', 'Inicio de sesión exitoso');
      notificationShown.current = true;
    }
  }, [showNotification]);

  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Función para resetear todos los filtros
  const resetFilters = () => {
    setNameSearchTerm('');
    setOtherSearchTerm('');
    setSelectedAgency('');
    setSelectedStatus('');
    setCurrentPage(1); // Volver a la primera página al resetear filtros
  };

  // Función para cargar los empleados desde la API
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/employees`);

      // Procesar datos: convertir las URLs de fotos
      const processedEmployees: ProcessedEmployee[] = response.data.map((employee: Employee) => ({
        ...employee,
        photoUrl: convertGoogleDriveUrl(employee.photo || '')
      }));

      setEmployeesData(processedEmployees);

      // Extraer todas las agencias únicas para el filtro
      const uniqueAgencies = Array.from(new Set(processedEmployees.map(emp => emp.agency)));
      setAgencies(uniqueAgencies);

      setLoading(false);
    } catch (err) {
      console.error('Error al cargar empleados:', err);
      setError('No se pudieron cargar los datos de empleados. Por favor, intenta nuevamente.');
      setLoading(false);
    }
  };

  // Cargar datos de empleados al montar el componente
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Función para filtrar empleados
  const filteredEmployees = employeesData.filter(employee => {
    // Filtro por nombre o ID de usuario
    const matchesNameSearch =
      employee.name.toLowerCase().includes(nameSearchTerm.toLowerCase()) ||
      String(employee.id_user).includes(nameSearchTerm);

    // Filtro adicional por apellido o agencia
    const matchesOtherSearch =
      employee.last_name.toLowerCase().includes(otherSearchTerm.toLowerCase()) ||
      employee.agency.toLowerCase().includes(otherSearchTerm.toLowerCase());

    // Filtro por agencia seleccionada
    const matchesAgency = selectedAgency === '' || employee.agency === selectedAgency;

    // Filtro por status
    const matchesStatus = selectedStatus === '' || employee.status === selectedStatus;

    return matchesNameSearch && matchesOtherSearch && matchesAgency && matchesStatus;
  });

  // Calcular empleados para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // Funciones de navegación
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Maneja el cambio en el campo de búsqueda por nombre/ID
  const handleNameSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameSearchTerm(e.target.value);
    setCurrentPage(1); // Resetear a primera página al cambiar el filtro
  };

  // Maneja el cambio en el campo de búsqueda por apellido/agencia
  const handleOtherSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Maneja el cambio en el filtro de agencia
  const handleAgencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgency(e.target.value);
    setCurrentPage(1);
  };

  // Maneja el cambio en el filtro de status
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  // Maneja cambios en el formulario de nuevo empleado
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Maneja el envío del formulario de nuevo empleado
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Aquí se implementaría la lógica para enviar los datos al servidor
      console.log('Datos a enviar:', formData);

      // Por ahora, solo reseteamos el formulario y cerramos el modal
      setFormData({
        nombre: '',
        apellido: '',
        agencia: '',
        fechaNacimiento: '',
        fechaAlta: '',
        status: 'SI',
        photo: '',
        idUsuario: ''
      });
      setShowModal(false);

    } catch (err) {
      console.error('Error al crear nuevo empleado:', err);
      // Aquí se manejaría el error, posiblemente mostrando un mensaje al usuario
    }
  };

  // Función para abrir el modal
  const openModal = () => {
    setShowModal(true);
  };

  // Función para cerrar el modal y resetear el formulario
  const closeModal = () => {
    setShowModal(false);
    setFormData({
      nombre: '',
      apellido: '',
      agencia: '',
      fechaNacimiento: '',
      fechaAlta: '',
      status: 'SI',
      photo: '',
      idUsuario: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-700 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Panel Admin - Empleados</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2">
            <MdLogout className="text-lg" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* contenedor principal */}
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          {/* Botón de Agregar Empleado */}
          {/* Botón de Agregar Empleado con nuevo ícono */}
          <button
            onClick={openModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            {/* Imagen de icono */}
            <img
              src="data:image/png;base64,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"
              alt="user-group-man-woman"
              className="h-5 w-5" 
            />
            <span>Agregar Empleado</span>
          </button>

          {/* Filtros */}
          <div className="flex flex-wrap justify-end items-end gap-4">
            <div className="flex-grow-0 min-w-[180px]">
              <input
                id="nameSearch"
                type="text"
                placeholder="Nombre"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={nameSearchTerm}
                onChange={handleNameSearchChange}
              />
            </div>

            <div className="flex-grow-0 min-w-[180px]">
              <input
                id="otherSearch"
                type="text"
                placeholder="Apellido"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={otherSearchTerm}
                onChange={handleOtherSearchChange}
              />
            </div>

            <div className="flex-grow-0 min-w-[180px]">
              <select
                id="agencyFilter"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={selectedAgency}
                onChange={handleAgencyChange}
              >
                <option value="">Todas las agencias</option>
                {agencies.map(agency => (
                  <option key={agency} value={agency}>{agency}</option>
                ))}
              </select>
            </div>

            <div className="flex-grow-0 min-w-[150px]">
              <select
                id="statusFilter"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={selectedStatus}
                onChange={handleStatusChange}
              >
                <option value="">Todos los status</option>
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
            </div>

            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm flex items-center space-x-2">
              <img
                src="https://img.icons8.com/fluency/48/search.png"
                alt="icono de búsqueda"
                className="h-5 w-5"
              />
              <span>Buscar</span>
            </button>

            <button
              onClick={resetFilters}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm flex items-center space-x-2">
              <img
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFe0lEQVR4nO2YbUwbdRzHT6KLyxbNmIw9wD2U8tjnkilqjMa3e7XEGHyhr0x8YTSZc4liFoxmzKcYdRo2lmXZXe9K2xW2AqUPh4vb9NWW6Ea2TBNg5X/Xa/u/q09hZcL+5lrKSqEU2gJpwjf5BF7w/9/nd/f//XoUwzazmc0Un05UYb0E26y80mHlFbeVj49aeUWx8Mp964iSsPJKxBKMj5p5xWEOKh9af/yzFUPokeW23NMzfnB3z8RtbC1juARrLHz8uHUkDqwjcWTl48iyJMpDginMQSVkCcif6HmpOnvf6lMTB6pPjSf2nBpHayK+P/jXTmsw3m3hlemcsnOiGcKLCajICXNA+bo1qDyp7v3Ud3cOVJ8cS+w+OYZ2r0UBFl5uN/MKzCVqySmaG5OKT5Hqzv3xaeXx64mqb2+jZAEnx0pXwIuX0KPmoNJdtKg/jbwYH0TEmTuosus6qvrmVukKaPsltNUckAeWkzUF5BlzQL5sDsiHDQHYZvT/s6v1GnpMXWvi4T6TX37e6JMPm3zQZ/TDmZSwnMSYhYYZQzu6riWLKM2dV+Vz3FWjX5ky+pTPjf7wrpXuaQnE9hqG4XGDT56aFx9eSB0zniyi6AJMfqU75+P3yS6dT64tdG/DcOxtVdaQBD7EmwI/fae4Aox+uX3Js+qHs4Zh2JFvli8XvRce1A/F7qdll0LvhaioUWn0Qbj4nMJZo1duL3jjHPL6oaUp+CIGH+zObq7U44YdWJHRDcHbuYT1aQZjSDcQ/a0weS+sMQ7D6ezG0g/HXMUcm3WLQZ0QWU2l98KpYhp2/dKJKgxDsdCiphqCn2HlEIMXtqndn3kedUOxmdXM+Q2NbhB+lN1QugH4E1Yu0Q1G+5ITIIMWT/Q9rFyiG4yOzssPpGi6CNuwconOE5VV6ZYMtF6xCiuXNHui0y0e9dhk4ERbNsJF0yv+rOkVURqKE6/mXdTsiUy3eKLquUfNF1NsWAF28YrGLiIVyi4ikhUv513UdDEip8XTGN1lMkLVNPVHR5svRJFKU5o+6VmsXNLYH3XPi/dHkjT2R95fbw8NF36Z4sRfSVY8Q7CgXetc4SBp7Jc60uJz8qixX7qCrXNIVnyL4tTGFRDFCohghfs4K7bmXVh/IfxMY18ELUSa0WxAH5D0pIlkwRHCBgKkDdzC6TCVf1Unqmh0R0Jp+QZ3GukLrFzS4Ja6GtwSyuKexinga33tajq8jeLAGMmCqxQj7i9ok3on3NfgkhIN5yVUn4HWFe5b639oqunwNoIFEyQrINIGZklGOKtl4BOr3qj+vPRDUty1EK1LOoqtcaqcke04A7pwm3CPYASEM8Kbq96kqQ/s1Lqk2Jy0eveR1hlGWof4oN4hvVZqacI++RLFgh4N/XBY4OxdDc6E3lELKmjTOkf41aR0Ng7xgdYhHi3lcSJY0KMeG4IFNzOLKDpap/h9nSOMlqQ33FdMY7c4I9tV1N9VacIGbhI2Aak/a5yhypIUoH61qHGIngzpeebeEu9peoUvKW7x9/y5ov4tyYnHSE74m+KEiQVFMOAmwQBUS0++gZUqNc7QVo1d9GS+2iaxZyLMqq+7Gnv4SJ0dPKdKtjhHt6hra5yhfZRdeIHixEMUJ/pIVvgv+QnLpT5lSRZ0zV/rdKgSPzf5OnF2/HGslEk+CU48sVA69ZqbhFuOtOjSEDYhgbOSBluPUJz4CskJkZyieWRT830xuE14F1uv4OzdHSQHTpA2IUGuUpbIhgH/4rTwVcGjspjUcnf3kjZwjLAJobyiSdk0ABE0+J1gJj8u6cgsOJ2ogmJDTxOM8AFhE1wELdwgaEHGaTBN0GCKoIFA0OAGTgO2lp48tKLX4s1sZjPYSvI/ZkYDkohpw24AAAAASUVORK5CYII="
                alt="icono de resetear filtros"
                className="h-5 w-5"
              />
              <span>Resetear filtros</span>
            </button>
          </div>
        </div>

        {/* Mesa contenedor con altura fija */}
        <div className="bg-white rounded-lg shadow">
          {/* Mensajes de carga o error */}
          {loading && (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-700"></div>
            </div>
          )}

          {error && (
            <div className="flex justify-center items-center h-60 text-red-600">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div style={{ height: '600px', overflow: 'auto' }} className="border-t border-gray-200">
              {/* La tabla dentro del contenedor de scroll */}
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Foto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Apellido
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Agencia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Fecha de Nacimiento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Fecha de Alta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Fecha de Baja
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      id_Usuario
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                        No se encontraron empleados con los filtros aplicados
                      </td>
                    </tr>
                  ) : (
                    currentEmployees.map((employee, index) => (
                      <tr key={`${employee.id}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <img
                            src={employee.photoUrl}
                            alt={`${employee.name} ${employee.last_name}`}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              // Usar una imagen base64 sencilla en lugar de depender de un servicio externo
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.last_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.agency}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.date_of_birth}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.high_date}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.status === 'SI' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {employee.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {employee.low_date || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.id_user}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación */}
        <div className="mt-4 bg-white p-3 rounded-lg shadow border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {!loading && !error && (
                <>
                  Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredEmployees.length)}
                  </span> de{' '}
                  <span className="font-medium">{filteredEmployees.length}</span> registros
                </>
              )}
            </div>

            {/* Botones de navegación */}
            <div className="flex space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1 || loading}
                className={`flex items-center px-4 py-2 border rounded-md ${currentPage === 1 || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                  }`}
              >
                <MdNextPlan className="h-5 w-5 mr-1 transform scale-x-[-1]" />
                <span>Anterior</span>
              </button>

              <span className="px-4 py-2 border rounded-md bg-white-700 text-black">
                {currentPage}
              </span>

              <button
                onClick={nextPage}
                disabled={currentPage >= totalPages || loading}
                className={`flex items-center px-4 py-2 border rounded-md ${currentPage >= totalPages || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                  }`}
              >
                <span>Siguiente</span>
                <MdNextPlan className="h-5 w-5 ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal para agregar empleado */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-auto max-h-[90vh]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-6 w-6 text-purple-700" />
                    <h2 className="text-xl font-semibold text-gray-800">Ingresar Nuevo Empleado</h2>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmitForm}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Nombre */}
                    <div>
                      <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={formData.nombre}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Apellido */}
                    <div>
                      <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido
                      </label>
                      <input
                        type="text"
                        id="apellido"
                        name="apellido"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={formData.apellido}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Agencia */}
                    <div>
                      <label htmlFor="agencia" className="block text-sm font-medium text-gray-700 mb-1">
                        Agencia
                      </label>
                      <select
                        id="agencia"
                        name="agencia"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={formData.agencia}
                        onChange={handleFormChange}
                      >
                        <option value="">Seleccionar agencia</option>
                        {AGENCIAS.map((agencia) => (
                          <option key={agencia} value={agencia}>
                            {agencia}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fecha de Nacimiento */}
                    <div>
                      <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        id="fechaNacimiento"
                        name="fechaNacimiento"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={formData.fechaNacimiento}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Fecha de Alta */}
                    <div>
                      <label htmlFor="fechaAlta" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Alta
                      </label>
                      <input
                        type="date"
                        id="fechaAlta"
                        name="fechaAlta"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={formData.fechaAlta}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={formData.status}
                        onChange={handleFormChange}
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>

                    {/* URL de Foto */}
                    <div>
                      <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
                        URL de Foto (Google Drive)
                      </label>
                      <input
                        type="text"
                        id="photo"
                        name="photo"
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={formData.photo}
                        onChange={handleFormChange}
                        placeholder="https://drive.google.com/file/d/..."
                      />
                    </div>


                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-700 text-white rounded-md text-sm font-medium hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Ingresar Empleado
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RhAdmin;