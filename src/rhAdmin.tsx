import { Save, User, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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

interface NewAdminForm {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  agencia: string;
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
  const { logout, user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  // estado para controlar el modal de nuevo usuario o administrador
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // estados para manejo de usuarios o administradores
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSuperuser, setIsSuperuser] = useState<boolean>(false);

  // Ref para controlar si ya se mostró la notificación
  const notificationShown = useRef(false);

  const [editUserData, setEditUserData] = useState<any>(null);
  const [editEmployeeData, setEditEmployeeData] = useState<ProcessedEmployee | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  // Agregar este nuevo estado
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState<boolean>(false);


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



  const openEditEmployeeModal = (employee: ProcessedEmployee) => {
    // Formatear las fechas para el input date (YYYY-MM-DD)
    const formatDateForInput = (dateStr: string) => {
      if (!dateStr) return '';
      const parts = dateStr.split('/');
      if (parts.length !== 3) return '';
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    setEditEmployeeData({
      ...employee,
      date_of_birth: formatDateForInput(employee.date_of_birth),
      high_date: formatDateForInput(employee.high_date),
      low_date: employee.low_date ? formatDateForInput(employee.low_date) : null
    });
    setShowEditEmployeeModal(true);
  };

  // 3. Función para cerrar el modal de edición
  const closeEditEmployeeModal = () => {
    setShowEditEmployeeModal(false);
    setEditEmployeeData(null);
  };

  // 4. Función para manejar cambios en el formulario de edición
  const handleEditEmployeeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (editEmployeeData) {
      setEditEmployeeData({
        ...editEmployeeData,
        [name]: value
      });
    }
  };

  // 5. Función para guardar los cambios del empleado
  const handleSaveEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editEmployeeData) return;

    try {
      // Preparar datos para envío a la API
      const apiData = {
        name: editEmployeeData.name,
        last_name: editEmployeeData.last_name,
        agency: editEmployeeData.agency,
        date_of_birth: editEmployeeData.date_of_birth,
        high_date: editEmployeeData.high_date,
        status: editEmployeeData.status,
        photo: editEmployeeData.photo,
        id_user: editEmployeeData.id_user
      };

      // Llamada a la API para actualizar el empleado
      const response = await axios.put(`${API_URL}/employees/${editEmployeeData.id}`, apiData);

      if (response.data.success) {
        showNotification('success', 'Empleado actualizado exitosamente');
        closeEditEmployeeModal();
        fetchEmployees(); // Recargar la lista de empleados
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar empleado';
      showNotification('error', errorMessage);
      console.error('Error al actualizar empleado:', err);
    }
  };

  // Función para abrir el modal de edición
  const openEditModal = (user: any) => {
    setEditUserData({
      id: user.id,
      nombre: user.name,
      apellido: user.last_name,
      correo: user.email,
      password: '',
      agencia: user.agency || '',
      isSuperuser: user.admin === 'Sí'
    });
    setShowEditModal(true);
  };

  // Función para cerrar el modal de edición
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditUserData(null);
  };

  // Función para guardar los cambios del usuario editado
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.put(`${API_URL}/users/${editUserData.id}`, {
        name: editUserData.nombre,
        last_name: editUserData.apellido,
        email: editUserData.correo,
        password: editUserData.password, // El backend manejará si está vacío
        agency: editUserData.agencia,
        admin: editUserData.isSuperuser
      });

      // Mostrar notificación de éxito
      showNotification('success', 'Usuario actualizado exitosamente');
      closeEditModal();
      fetchUsers(); // Recargar la lista
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar usuario';
      showNotification('error', errorMessage);
      console.error('Error al actualizar usuario:', err);
    }
  };

  // Función para manejar cambios en el formulario de edición
  const handleEditDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditUserData({
        ...editUserData,
        [name]: checked
      });
    } else {
      setEditUserData({
        ...editUserData,
        [name]: value
      });
    }
  };

  // Función para cargar usuarios
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data);
      setLoadingUsers(false);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      showNotification('error', 'Error al cargar lista de usuarios');
      setLoadingUsers(false);
    }
  };

  // Función para eliminar usuario
  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await axios.delete(`${API_URL}/users/${userId}`);
        showNotification('success', 'Usuario eliminado exitosamente');
        fetchUsers(); // Recargar la lista
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Error al eliminar usuario';
        showNotification('error', errorMessage);
        console.error('Error al eliminar usuario:', err);
      }
    }
  };

  // Función para crear o actualizar usuario
  const handleSubmitAdminForm = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && selectedUserId) {
        // Actualizar usuario existente
        await axios.put(`${API_URL}/users/${selectedUserId}`, {
          name: adminFormData.nombre,
          last_name: adminFormData.apellido,
          email: adminFormData.correo,
          password: adminFormData.password, // El backend manejará si está vacío
          agency: adminFormData.agencia,
          admin: isSuperuser
        });

        showNotification('success', 'Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        await axios.post(`${API_URL}/users`, {
          name: adminFormData.nombre,
          last_name: adminFormData.apellido,
          email: adminFormData.correo,
          password: adminFormData.password,
          agency: adminFormData.agencia,
          admin: isSuperuser
        });
        // 
        showNotification('success', 'Usuario creado exitosamente');
      }

      closeAdminModal();
      fetchUsers(); // Recargar la lista
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al procesar solicitud';
      showNotification('error', errorMessage);
      console.error('Error:', err);
    }
  };

  // Función para abrir el modal en modo creación
  const openAdminModal = () => {
    setSelectedUserId(null);
    setIsEditing(false);
    setAdminFormData({
      nombre: '',
      apellido: '',
      correo: '',
      password: '',
      agencia: ''
    });
    setIsSuperuser(false);
    setShowAdminModal(true);
  };

  // Modificar closeAdminModal para resetear todo
  const closeAdminModal = () => {
    setShowAdminModal(false);
    setSelectedUserId(null);
    setIsEditing(false);
    setAdminFormData({
      nombre: '',
      apellido: '',
      correo: '',
      password: '',
      agencia: ''
    });
    setIsSuperuser(false);
  };

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

  const [adminFormData, setAdminFormData] = useState<NewAdminForm>({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    agencia: ''
  });


  // Maneja cambios en el formulario de nuevo administrador
  const handleAdminFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAdminFormData({
      ...adminFormData,
      [name]: value
    });
  };


  // Cargar usuarios cuando se abre el modal de administrador
  useEffect(() => {
    if (showAdminModal) {
      fetchUsers();
    }
  }, [showAdminModal]);

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
  // Reemplaza la función handleSubmitForm actual con esta:
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Verificar que el usuario está autenticado
      if (!user) {
        showNotification('error', 'Debe iniciar sesión para realizar esta acción');
        return;
      }

      // Convertir los datos al formato esperado por la API
      const apiData = {
        name: formData.nombre,
        last_name: formData.apellido,
        agency: formData.agencia,
        date_of_birth: formData.fechaNacimiento,
        high_date: formData.fechaAlta,
        status: formData.status,
        photo: formData.photo,
        id_user: user.id
      };

      // Enviar datos al servidor
      const response = await axios.post(`${API_URL}/employees`, apiData);

      if (response.data.success) {
        showNotification('success', 'Empleado creado exitosamente');

        // Resetear el formulario y cerrar el modal
        closeModal();

        // Recargar la lista de empleados
        fetchEmployees();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al crear nuevo empleado';
      showNotification('error', errorMessage);
      console.error('Error al crear nuevo empleado:', err);
    }
  };

  // Función para abrir el modal
  // Modifica la función openModal para cargar usuarios
  const openModal = () => {
    fetchUsers(); // Cargar la lista de usuarios disponibles
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
            <img
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFRUlEQVR4nO2YfWgbZRzHT5j4x0QQNsE/5v7TPyb6x5jgdreKII6BIGIaS7o4cLNO7cS9JFMqnQwtOBE3usrd1rkVqjSXviRp09ZmS5vLpSZNX7DrwPfeXbK2s6us3ZhdO37yXFq9tcm95ZqmSb7whXB5eZ7v537P77knGFZQQQWtuvo8u7GoW8CiHlhZuwWsv3UXlnWKZiL8f+awrFM0Y+ETzjpFCwBgTVSA2WzeZDZZnOZiy7S5uBS0WHMFeGqNsVEAzCh8cekNrcFzB4AJ3Xl94XUByLYlYNZR9jkGoFR3+NxYAsX/hwHGdnuuxy7E3YfZi1Vl7MG33xSslj23LSV7Zt+yWqc+fn/vz7UnynrZ8wf9Y22HQne7j/6eWwCCds3OmSVQvs8az1sA5fus8anOI9GMAMiGJQCtr22GNpMPvKZZPaHXPoA2MTyIThJqqgoTreb6mlwC0GaayXMAr3fJAcj5JgioB3hNPyR6gC0NALaZNf+HCARtI2lUwBXZH0d/U0U9fEbCRz0v6wVQrRsAYzuNpas+z7fLAqFrmRIEjjwDjO2ejvD3gLFtSXsCQ53rsT7PiCT8iHgtkwLGXqNj/VcbNoGwawvW574lGr3OtMBb/hAwtkvq777dh75j6CSirr2iV0vgr1wHjO0LYBTKHvUMo8Nnk6CjBOByGUDgQwDmaMI96LXtNLAfPY3luqB94QFpibF8EQQOA/j2A3RYANrNCXdachsAQY4+vpPkPiBIPjrP2MeXrv155tgYem8HxVmLKmEdlgt6qW5sPX5WKMVJrgMnuXmC4gGZ7ajuXgog1FHjX3wfp/g/cYo79NypXx5Jdw4OR/NWJ93COGnXLO1omQyxEdDpuVAw4gsEBjYqDlpExjfgFP81QXLTi6GkfpEanUUQUCUgo9foWpLP3iQo/qvnz/2xWV9470ba4Zp00i5AbnJ6BtMAkHAwckJ2UIIc3U5Q3ESy4HqNU/w/BMkdxwAe0AKAplv2L4ZHdrm8PQYAOJVywB3fCM/iJHfLyPBLXKMRQI0UQLvXlzaA3mD4QNLBtpLRBwmSv7KC4Ret+kTmpFu6pQB8XT1DaVdAKFKUdDD8rFCagfCAGqoGANelAJhAbzpNUHTKJohTfGsmABAUfxev4R5VCt/Y2PiYNHyaO8Di+p9IOSBO8uPSiT7x6YDoFakCii9RAkDTzS9IAcjtAEODwyDEYiDE4jA4+FNKACwb9ssA4Oa1Ath9Qfluo4ej5QC4emUALe9JAbhd7SkbIAp+bWxctCDEZSognPp4TiyZpBKA/t/GxAFfqRMUAHBly/sA/zdqugoAzqjdAdQCYNnIu4YB8F+9Jg54oCkmC6CoeuLhZA9UOMkn78YLcjpcfrU7ACp7BAGFHxwY1r4D6AFQF05Q/6xLHoD42yRHJVkGX2LZsgPoAfC5LwHg4o9xRQA7SX7b8grgfsVSqL7evcHoHYBlw3+lGk+Uli6ODj93mE/gzlAt9A5fVQSAhFN8f6rfAsY+DUFbEwSOPYk+63C4i9TuABoA+OUBkMkPPiknveC50HF448KwIgCC4t6RhpIzTbt61O4A6p8BwmfkAVBcsx4AyJe9lCIAdDRWDcBxPwAjzgCyOwDS9nOxpwiKn9ID4GZ3pSIApO8cnhsqIQzetwP4AgYsgcg2TEnE+dgmguIdC+d41QCQ1QBodLh2fU+7r6uogEnjdoDwTCgYqVIM31DxKuSDCwBSqSEL7k6hAipWcQlIddKKQy4Z06qT+Q6gIR/LXqrVnnABQEWhAqCwBCpWsQcUVBCWF/oXOUVPm0BC6i0AAAAASUVORK5CYII=" alt="external-blogger-blogger-and-influencer-itim2101-flat-itim2101-1"
              className="h-6 w-6"
            />
            <h1 className="text-xl font-semibold">Registro de Empleados</h1>

          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2">
            <img
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADYUlEQVR4nO3Z329URRTA8f0j1PcmPhnu7cqPxOgLgooJiU/yZngm8QcUrA2hDVs0DabGEBIIO5dWDAVrDEKCSbfdlm53KbQIkQYNPwShtNSF0rQWWwrdOV9zuWgvVp46p8FkTzKvs+dz58zc2XMTiXKUoxzleKYj2cTznrH7/MAOecaW/EBY6Hg0j7E3/cCmfUOFWvK+YZUX2Nsukn7qMHbSS/OG8+SXpXnON7aomnzweEUCO+rv5QWngKhsoh94vUX4egDyNyB3HTp/g8xV+OEyHL0I3/0C31wQDg4IzT8J5qyw54ywq09o7BUa8kJ9TqjtEj7pEKoywvrvhRXNT5TVXqeAqEajyQ9dgDPDcHoICoPuEO8dja+EHXQKiG/Y8yNwbkQHkZwro2mngHiN/nwbBn7XQbzTKlQGdtYztkENcHEUVURVm005Tf7fgCt3UUVUtysDro2hhqjOCmtbaX8p4EU1wPVx1BCvHvjnhTbmpVmqAhicQA3x2t8A14g4YPgP1BB13cLL++20c0QcMHIPVcSmjN3nG3s39lYeT6ZZ4QxQ/BNdRL9NVRqSThFxwOgUqoj0j9Ex6hQRB4xNMw9xehi+7IPGU/D5KdjZCw0n4bMC7ChAfR6290BdDrZ1w9YTUNMF1Z2wOQubOuCjduGDNmHdEbKeoebRSLPbC+zUgvdEHDB+n3mItw7rX7P9OcS1BQEmZpiHWPN/Akw+YB7iXBEa++DTgrCjINQXhFRe2N4j1PUItTlhW7ew9YRQE955uoSPO4UtWaEqK2zsED7MCO+3Ce8esSf9wO6MBl/5xt53WkL3HvCfCIcbO6W6iaceooo4fhndY3R6FlXEF70ovMiM/TWcbO23wkwJNcTBAVjWpHGVMFTU5smEyTwsoYZY1aJ0mQtj1pIqWZi1eojVLUrJxwGaiONXYEObwh8az1D9ygE72XQ+Amgi+oeiY9Rp+IGdCZd2ebNQEmXELRXA3OayIUAJUZcTkvsV2irxxlaYsAbi0h1Y2qTV2Iq1FsM6DQGuEccuEe+N3nALCHv3jyd/u1XovxUl7AJxcyI6fVYfeqI3usctwFAR9u4X6bpcDNv5CdexJODNRfjAUawMWJnQivDJhL37sP3t9BNTYAfDslF58uUoRznKkVis+Au1mxEyMIWnXQAAAABJRU5ErkJggg==" alt="exit"
              className="h-6 w-6"
            />
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

          <button
            onClick={openAdminModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <img
              src="data:image/png;base64,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"
              alt="external-administrator-internet-of-things-itim2101-lineal-color-itim2101"
              className="h-5 w-5"
            />
            <span>Agregar Administrador</span>
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
                    {/* Agrega esta nueva columna */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                
                  


                  {currentEmployees.map((employee, index) => (
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.status === 'SI' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {employee.low_date || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.id_user}</td>

                      {/* Nueva celda con botón de editar */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => openEditEmployeeModal(employee)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-xs flex items-center space-x-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
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

                    {/* ID de Usuario - NUEVO CAMPO */}

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
        {/* Modal para agregar administrador */}
        {/* Modal para gestión de administradores */}
        {showAdminModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl overflow-auto max-h-[90vh]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <img
                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC0klEQVR4nO2YzWsTURDAf0aiUmPBXoRcBEFEBG1Fz1KPClahPaj/gYofKMavgvTQIvhfaKOpJ3tT0IOfZw9qrbkqVtQq8RNKKgMTGB67yb7dyO5ifjCwZGfem8nOezPvQY8ePbpFERgDqsAc8F1Fnqf1nehkkkPAW2C5g4jOQTJEAbgWwXFXptQ2dVznPwCXgB3AWpVB4LK+c4NIPW2sQ7eBUhv9dUDNsRkhJVY5OS/Or4hgJzozxm4+rYU95qRNu38+6EssGPtRUqBqHJCc9+WKsb9JCrwxDmyPYT9o7OdIgYZxwCd9WpSMfYMcBtBv7L+RArlPoWnjgBQpX8aN/Q0ysI3K1uiTPh/T3kaLTiGreRSyO1koZGhXaduCmQ5fot9xvgkcIGWmnCAWtEgN6e5U0udxJ21EJskAhYAgOklTnc9EO91iRPO5k/PzWUibMIq6o0hv81qLncgr3SpHs3yk7Ab3gB8q8pwrBoAlk2ryvJ4ccS5gvZwhJ+zVtHEDkCuZ4W5N0gdMAHXnU0eRZ6ZKX9XD0EnghBa2duMtqc5xtanqGN7OP49xddKSPTrOzhjBL4cEJWNFZiLBZC/NOPYwn1RqPgHUjeFFvZGIw2wXA5j1mdh+9rjOC6uBJyEO/QHOA2WViv4WpPtIx4pM0xgn7V92hThVCdCthOhKc+jFojHeRHK+BDhVDtArB+h9ijPhQ2cNJGUxQQCf40x42Awgk29O4PxujxS6EKLrtYUKK51biHrMVJKF97TNIq5EXMSPfRcxenVi74K+Akc9F3Vq22iLfU4QIi80kCiXW6kVMss2J51a8hO4qxe9+4EtwAZgjbHtZisxRAL6dIEFbYdhzVwhoJmTBq0WoZm7BRxL0syFIQeOU9ro2WIXJOJsGMPaOrs2DdMI/nM2AkeA68ADPQe/B34Bv4F3wNY29mcDAjhNjhjI+5FSuJ/nQz3/LX8BvFAIC9QGmDYAAAAASUVORK5CYII=" alt="system-administrator-male"
                      className="h-5 w-5"
                    />
                    <h2 className="text-xl font-semibold text-gray-800">
                      {isEditing ? 'Editar Usuario' : 'Panel Administrativo de Usuarios'}
                    </h2>
                  </div>
                  <button
                    onClick={closeAdminModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Panel de listado de usuarios */}
                {!isEditing && (
                  <div className="mb-8">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-purple-700 text-white">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Admin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Agencia</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {loadingUsers ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 text-center">
                                <div className="flex justify-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-700"></div>
                                </div>
                              </td>
                            </tr>
                          ) : users.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                No hay usuarios registrados
                              </td>
                            </tr>
                          ) : (
                            users.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.admin === 'Sí' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {user.admin}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{`${user.name} ${user.last_name}`}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.agency || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                  <button
                                    onClick={() => openEditModal(user)}
                                    className="text-white bg-purple-600 hover:bg-purple-700 py-1 px-3 rounded-md text-xs"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-white bg-red-600 hover:bg-red-700 py-1 px-3 rounded-md text-xs"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Formulario */}
                <div className="bg-gray-50 p-6 rounded-md">
                  <h3 className="text-lg font-medium mb-4">{isEditing ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h3>

                  <form onSubmit={handleSubmitAdminForm}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Nombre */}
                      <div>
                        <label htmlFor="adminNombre" className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre
                        </label>
                        <input
                          type="text"
                          id="adminNombre"
                          name="nombre"
                          required
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={adminFormData.nombre}
                          onChange={handleAdminFormChange}
                        />
                      </div>

                      {/* Apellido */}
                      <div>
                        <label htmlFor="adminApellido" className="block text-sm font-medium text-gray-700 mb-1">
                          Apellido
                        </label>
                        <input
                          type="text"
                          id="adminApellido"
                          name="apellido"
                          required
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={adminFormData.apellido}
                          onChange={handleAdminFormChange}
                        />
                      </div>

                      {/* Correo */}
                      <div>
                        <label htmlFor="adminCorreo" className="block text-sm font-medium text-gray-700 mb-1">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          id="adminCorreo"
                          name="correo"
                          required
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={adminFormData.correo}
                          onChange={handleAdminFormChange}
                        />
                      </div>

                      {/* Contraseña */}
                      <div>
                        <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          {isEditing ? 'Nueva Contraseña (dejar en blanco para mantener)' : 'Contraseña'}
                        </label>
                        <input
                          type="password"
                          id="adminPassword"
                          name="password"
                          required={!isEditing}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={adminFormData.password}
                          onChange={handleAdminFormChange}
                        />
                      </div>

                      {/* Agencia */}
                      <div>
                        <label htmlFor="adminAgencia" className="block text-sm font-medium text-gray-700 mb-1">
                          Agencia
                        </label>
                        <select
                          id="adminAgencia"
                          name="agencia"
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={adminFormData.agencia}
                          onChange={handleAdminFormChange}
                        >
                          <option value="">Seleccionar agencia</option>
                          {AGENCIAS.map((agencia) => (
                            <option key={agencia} value={agencia}>
                              {agencia}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Volver a la Lista
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={closeAdminModal}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isEditing ? 'Actualizar Usuario' : 'Registrar Usuario'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
        {showEditModal && editUserData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-auto max-h-[90vh]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-6 w-6 text-purple-700" />
                    <h2 className="text-xl font-semibold text-gray-800">Editar Usuario</h2>
                  </div>
                  <button
                    onClick={closeEditModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditUser}>
                  <div className="space-y-4">
                    {/* ID (no editable) */}
                    <div>
                      <label htmlFor="editId" className="block text-sm font-medium text-gray-700 mb-1">
                        ID
                      </label>
                      <input
                        type="text"
                        id="editId"
                        value={editUserData.id}
                        disabled
                        className="w-full px-3 py-2 border bg-gray-100 rounded-md text-sm"
                      />
                    </div>

                    {/* Nombre */}
                    <div>
                      <label htmlFor="editNombre" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="editNombre"
                        name="nombre"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editUserData.nombre}
                        onChange={handleEditDataChange}
                      />
                    </div>

                    {/* Apellido */}
                    <div>
                      <label htmlFor="editApellido" className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido
                      </label>
                      <input
                        type="text"
                        id="editApellido"
                        name="apellido"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editUserData.apellido}
                        onChange={handleEditDataChange}
                      />
                    </div>

                    {/* Correo */}
                    <div>
                      <label htmlFor="editCorreo" className="block text-sm font-medium text-gray-700 mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        id="editCorreo"
                        name="correo"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editUserData.correo}
                        onChange={handleEditDataChange}
                      />
                    </div>

                    {/* Contraseña */}
                    <div>
                      <label htmlFor="editPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Nueva Contraseña (dejar en blanco para mantener)
                      </label>
                      <input
                        type="password"
                        id="editPassword"
                        name="password"
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editUserData.password}
                        onChange={handleEditDataChange}
                        placeholder="Nueva contraseña"
                      />
                    </div>

                    {/* Agencia */}
                    <div>
                      <label htmlFor="editAgencia" className="block text-sm font-medium text-gray-700 mb-1">
                        Agencia
                      </label>
                      <select
                        id="editAgencia"
                        name="agencia"
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editUserData.agencia}
                        onChange={handleEditDataChange}
                      >
                        <option value="">Seleccionar agencia</option>
                        {AGENCIAS.map((agencia) => (
                          <option key={agencia} value={agencia}>
                            {agencia}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Actualizar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
                          handleDeleteUser(editUserData.id);
                          closeEditModal();
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
                    >
                      Eliminar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar empleado */}
        {showEditEmployeeModal && editEmployeeData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-auto max-h-[90vh]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-6 w-6 text-purple-700" />
                    <h2 className="text-xl font-semibold text-gray-800">Editar Empleado</h2>
                  </div>
                  <button
                    onClick={closeEditEmployeeModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditEmployee}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Nombre */}
                    <div>
                      <label htmlFor="edit-nombre" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="edit-nombre"
                        name="name"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editEmployeeData.name}
                        onChange={handleEditEmployeeChange}
                      />
                    </div>

                    {/* Apellido */}
                    <div>
                      <label htmlFor="edit-apellido" className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido
                      </label>
                      <input
                        type="text"
                        id="edit-apellido"
                        name="last_name"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editEmployeeData.last_name}
                        onChange={handleEditEmployeeChange}
                      />
                    </div>

                    {/* Agencia */}
                    <div>
                      <label htmlFor="edit-agencia" className="block text-sm font-medium text-gray-700 mb-1">
                        Agencia
                      </label>
                      <select
                        id="edit-agencia"
                        name="agency"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editEmployeeData.agency}
                        onChange={handleEditEmployeeChange}
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
                      <label htmlFor="edit-fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        id="edit-fechaNacimiento"
                        name="date_of_birth"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editEmployeeData.date_of_birth}
                        onChange={handleEditEmployeeChange}
                      />
                    </div>

                    {/* Fecha de Alta */}
                    <div>
                      <label htmlFor="edit-fechaAlta" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Alta
                      </label>
                      <input
                        type="date"
                        id="edit-fechaAlta"
                        name="high_date"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editEmployeeData.high_date}
                        onChange={handleEditEmployeeChange}
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="edit-status"
                        name="status"
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editEmployeeData.status}
                        onChange={handleEditEmployeeChange}
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>

                    {/* URL de Foto */}
                    <div>
                      <label htmlFor="edit-photo" className="block text-sm font-medium text-gray-700 mb-1">
                        URL de Foto (Google Drive)
                      </label>
                      <input
                        type="text"
                        id="edit-photo"
                        name="photo"
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={editEmployeeData.photo || ''}
                        onChange={handleEditEmployeeChange}
                        placeholder="https://drive.google.com/file/d/..."
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeEditEmployeeModal}
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
                      Guardar Cambios
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