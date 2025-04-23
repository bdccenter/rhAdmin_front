import { Save, User, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MdNextPlan } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useNotification } from './context/NotificationContext';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es'; // Importar locale español
import { esES } from '@mui/x-date-pickers/locales';


dayjs.locale('es');


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
  last_modified?: string;
  modified_by?: number;
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
  modified_by_name?: string; // Nombre del usuario que modificó
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

  // Estado para controlar la carga inicial
  const [isLoading, setIsLoading] = useState(false);
  // Auth Context para funcionalidad de logout
  const { logout, user } = useAuth();
  // Notificación Context para mostrar mensajes
  const { showNotification } = useNotification();
  // Navegación
  const navigate = useNavigate();
  // estado para controlar el modal de nuevo usuario o administrador
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // estados para manejo de usuarios o administradores
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  // Estado para controlar si estamos editando un usuario
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // Estado para controlar si el usuario es superusuario
  const [isSuperuser, setIsSuperuser] = useState<boolean>(false);

  // Ref para controlar si ya se mostró la notificación
  const notificationShown = useRef(false);
  // Estado para almacenar los datos del formulario de administrador
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

  // Función para mostrar notificaciones
  const handleDeleteEmployee = async (employeeId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.')) {
      try {
        // Llamada a la API para eliminar el empleado
        const response = await axios.delete(`${API_URL}/employees/${employeeId}`);

        if (response.data.success) {
          showNotification('success', 'Empleado eliminado exitosamente');
          closeEditEmployeeModal();
          fetchEmployees(); // Recargar la lista de empleados
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Error al eliminar empleado';
        showNotification('error', errorMessage);
        console.error('Error al eliminar empleado:', err);
      }
    }
  };

  // 1. Función para abrir el modal de edición de empleado
  const openEditEmployeeModal = (employee: ProcessedEmployee) => {
    // Formatear las fechas para el input date (YYYY-MM-DD)
    const formatDateForInput = (dateStr: string) => {
      if (!dateStr) return '';
      const parts = dateStr.split('/');
      if (parts.length !== 3) return '';
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    // Establecer los datos del empleado a editar
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
    // Add null check for safety, although the modal logic should prevent this
    if (editEmployeeData) {
      setEditEmployeeData({
        ...editEmployeeData,
        [name]: value,
      });
    }
  };

  // 5. Función para guardar los cambios del empleado
  const handleSaveEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editEmployeeData) return;

    try {
      // Asegúrate de que la fecha de baja esté en el formato correcto (YYYY-MM-DD)
      // y de que sea null si no está presente
      let lowDate = null;
      if (editEmployeeData.low_date && editEmployeeData.low_date.trim() !== '') {
        lowDate = editEmployeeData.low_date; // Ya debe estar en formato YYYY-MM-DD del input date
      }

      // Preparar datos para envío a la API
      const apiData = {
        name: editEmployeeData.name,
        last_name: editEmployeeData.last_name,
        agency: editEmployeeData.agency,
        date_of_birth: editEmployeeData.date_of_birth,
        high_date: editEmployeeData.high_date,
        status: editEmployeeData.status,
        low_date: lowDate,
        photo: editEmployeeData.photo,
        id_user: user?.id  // Usar el ID del usuario actual que está modificando
      };

      // Llamada a la API para actualizar el empleado
      const response = await axios.put(`${API_URL}/employees/${editEmployeeData.id}`, apiData);

      // Verificar si la respuesta fue exitosa
      if (response.data.success) {
        showNotification('success', 'Empleado actualizado exitosamente');
        closeEditEmployeeModal();
        fetchEmployees(); // Recargar la lista de empleados
      }
    } catch (err: any) { // Mostrar notificación de éxito
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

    // Validar que los campos requeridos estén llenos
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

    // Si el tipo es checkbox, manejarlo como booleano
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
    // Confirmación antes de eliminar
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      try { // Llamada a la API para eliminar usuario
        await axios.delete(`${API_URL}/users/${userId}`);
        showNotification('success', 'Usuario eliminado exitosamente');
        fetchUsers(); // Recargar la lista
      } catch (err: any) { // Mostrar notificación de error
        const errorMessage = err.response?.data?.message || 'Error al eliminar usuario';
        showNotification('error', errorMessage);
        console.error('Error al eliminar usuario:', err);
      }
    }
  };

  // Función para crear o actualizar usuario
  const handleSubmitAdminForm = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar que los campos requeridos estén llenos
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
        // Mostrar notificación de éxito
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
      // Cerrar el modal y recargar la lista de usuarios
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
    // Limpiar los datos del formulario
    setSelectedUserId(null);
    setIsEditing(false);
    setAdminFormData({
      nombre: '',
      apellido: '',
      correo: '',
      password: '',
      agencia: ''
    });
    // Limpiar el estado de superusuario
    setIsSuperuser(false);
    setShowAdminModal(true);
  };

  // Modificar closeAdminModal para resetear todo
  const closeAdminModal = () => {
    // Limpiar los datos del formulario
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
    // Limpiar el estado de superusuario
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

  // Estado para el formulario de nuevo administrador
  const [adminFormData, setAdminFormData] = useState<NewAdminForm>({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    agencia: ''
  });


  // Maneja cambios en el formulario de nuevo administrador
  const handleAdminFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {

    const { name, value } = e.target;

    // Asegúrate de que 'name' exista (es buena práctica, aunque Select con prop 'name' lo tendrá)
    if (name) {
      setAdminFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Aplica la carga inicial al montar el componente
  useEffect(() => {
    setIsLoading(true);

    // Simular tiempo de carga para una transición suave
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // 1.5 segundos de carga

    return () => clearTimeout(timer);
  }, []);

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
  // Función para cargar los empleados desde la API
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/employees`);

      // Procesar datos: convertir las URLs de fotos y obtener nombres de usuarios
      const processedEmployees: ProcessedEmployee[] = await Promise.all(
        response.data.map(async (employee: Employee) => {
          // Intentar obtener el nombre del usuario que modificó si existe
          let modifiedByName = '';
          if (employee.modified_by) {
            try {
              const userResponse = await axios.get(`${API_URL}/users/${employee.modified_by}`);
              modifiedByName = `${userResponse.data.name} ${userResponse.data.last_name}`;
            } catch (error) {
              console.error('Error al obtener usuario modificador:', error);
              modifiedByName = `Usuario ID: ${employee.modified_by}`;
            }
          }
          // Convertir la URL de la foto
          return {
            ...employee,
            photoUrl: convertGoogleDriveUrl(employee.photo || ''),
            modified_by_name: modifiedByName
          };
        })
      );
      // Establecer los datos procesados en el estado
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
    // Retornar true si el empleado cumple con todos los filtros
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
    // Si hay más páginas, incrementar la página actual
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Función para ir a la página anterior
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
  const handleAgencyChange = (e: SelectChangeEvent) => {
    setSelectedAgency(e.target.value);
    setCurrentPage(1);
  };

  // Maneja el cambio en el filtro de status
  const handleStatusChange = (e: SelectChangeEvent) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  // Maneja cambios en el formulario de nuevo empleado
  const handleFormChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target as { name: string; value: string };
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
    // Renderizar el componente
    <div className="min-h-screen bg-gray-50">
      {isLoading && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">

          <div className="w-12 h-12 border-4 border-purple-700 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Cargando sistema...</p>
        </div>
      )}
      {/* Header */}
      <div className="text-white p-4" style={{ backgroundColor: '#493F91' }}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Logo AUTO INSIGHTS */}
            <img
              src="./img/AUTO_INSIGHTS_LOGO-03.jpg"
              alt="Auto Insights Logo"
              className="h-10 w-32 mr-2" // Mantiene la altura en 32px pero establece un ancho de 128px
            />
            <img
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFRUlEQVR4nO2YfWgbZRzHT5j4x0QQNsE/5v7TPyb6x5jgdreKII6BIGIaS7o4cLNO7cS9JFMqnQwtOBE3usrd1rkVqjSXviRp09ZmS5vLpSZNX7DrwPfeXbK2s6us3ZhdO37yXFq9tcm95ZqmSb7whXB5eZ7v537P77knGFZQQQWtuvo8u7GoW8CiHlhZuwWsv3UXlnWKZiL8f+awrFM0Y+ETzjpFCwBgTVSA2WzeZDZZnOZiy7S5uBS0WHMFeGqNsVEAzCh8cekNrcFzB4AJ3Xl94XUByLYlYNZR9jkGoFR3+NxYAsX/hwHGdnuuxy7E3YfZi1Vl7MG33xSslj23LSV7Zt+yWqc+fn/vz7UnynrZ8wf9Y22HQne7j/6eWwCCds3OmSVQvs8az1sA5fus8anOI9GMAMiGJQCtr22GNpMPvKZZPaHXPoA2MTyIThJqqgoTreb6mlwC0GaayXMAr3fJAcj5JgioB3hNPyR6gC0NALaZNf+HCARtI2lUwBXZH0d/U0U9fEbCRz0v6wVQrRsAYzuNpas+z7fLAqFrmRIEjjwDjO2ejvD3gLFtSXsCQ53rsT7PiCT8iHgtkwLGXqNj/VcbNoGwawvW574lGr3OtMBb/hAwtkvq777dh75j6CSirr2iV0vgr1wHjO0LYBTKHvUMo8Nnk6CjBOByGUDgQwDmaMI96LXtNLAfPY3luqB94QFpibF8EQQOA/j2A3RYANrNCXdachsAQY4+vpPkPiBIPjrP2MeXrv155tgYem8HxVmLKmEdlgt6qW5sPX5WKMVJrgMnuXmC4gGZ7ajuXgog1FHjX3wfp/g/cYo79NypXx5Jdw4OR/NWJ93COGnXLO1omQyxEdDpuVAw4gsEBjYqDlpExjfgFP81QXLTi6GkfpEanUUQUCUgo9foWpLP3iQo/qvnz/2xWV9470ba4Zp00i5AbnJ6BtMAkHAwckJ2UIIc3U5Q3ESy4HqNU/w/BMkdxwAe0AKAplv2L4ZHdrm8PQYAOJVywB3fCM/iJHfLyPBLXKMRQI0UQLvXlzaA3mD4QNLBtpLRBwmSv7KC4Bet+kTmpFu6pQB8XT1DaVdAKFKUdDD8rFCagfCAGqoGANelAJhAbzpNUHTKJohTfGsmABAUfxev4R5VCt/Y2PiYNHyaO8Di+p9IOSBO8uPSiT7x6YDoFakCii9RAkDTzS9IAcjtAEODwyDEYiDE4jA4+FNKACwb9ssA4Oa1Ath9Qfluo4ej5QC4emUALe9JAbhd7SkbIAp+bWxctCDEZSognPp4TiyZpBKA/t/GxAFfqRMUAHBly/sA/zdqugoAzqjdAdQCYNnIu4YB8F+9Jg54oCkmC6CoeuLhZA9UOMkn78YLcjpcfrU7ACp7BAGFHxwY1r4D6AFQF05Q/6xLHoD42yRHJVkGX2LZsgPoAfC5LwHg4o9xRQA7SX7b8grgfsVSqL7evcHoHYBlw3+lGk+Uli6ODj93mE/gzlAt9A5fVQSAhFN8f6rfAsY+DUFbEwSOPYk+63C4i9TuABoA+OUBkMkPPiknveC50HF448KwIgCC4t6RhpIzTbt61O4A6p8BwmfkAVBcsx4AyJe9lCIAdDRWDcBxPwAjzgCyOwDS9nOxpwiKn9ID4GZ3pSIApO8cnhsqIQzetwP4AgYsgcg2TEnE+dgmguIdC+d41QCQ1QBodLh2fU+7r6uogEnjdoDwTCgYqVIM31DxKuSDCwBSqSEL7k6hAipWcQlIddKKQy4Z06qT+Q6gIR/LXqrVnnABQEWhAqCwBCpWsQcUVBCWF/oXOUVPm0BC6i0AAAAASUVORK5CYII="
              alt="external-blogger-blogger-and-influencer-itim2101-flat-itim2101-1"
              className="h-6 w-6"
            />
            <h1 className="text-xl font-semibold">Registro de Empleados</h1>
          </div>
          <Button
            variant="contained"
            onClick={handleLogout}
            startIcon={
              <img
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADYUlEQVR4nO3Z329URRTA8f0j1PcmPhnu7cqPxOgLgooJiU/yZngm8QcUrA2hDVs0DabGEBIIO5dWDAVrDEKCSbfdlm53KbQIkQYNPwShtNSF0rQWWwrdOV9zuWgvVp46p8FkTzKvs+dz58zc2XMTiXKUoxzleKYj2cTznrH7/MAOecaW/EBY6Hg0j7E3/cCmfUOFWvK+YZUX2Nsukn7qMHbSS/OG8+SXpXnON7aomnzweEUCO+rv5QWngKhsoh94vUX4egDyNyB3HTp/g8xV+OEyHL0I3/0C31wQDg4IzT8J5qyw54ywq09o7BUa8kJ9TqjtEj7pEKoywvrvhRXNT5TVXqeAqEajyQ9dgDPDcHoICoPuEO8dja+EHXQKiG/Y8yNwbkQHkZwro2mngHiN/nwbBn7XQbzTKlQGdtYztkENcHEUVURVm005Tf7fgCt3UUVUtysDro2hhqjOCmtbaX8p4EU1wPVx1BCvHvjnhTbmpVmqAhicQA3x2t8A14g4YPgP1BB13cLL++20c0QcMHIPVcSmjN3nG3s39lYeT6ZZ4QxQ/BNdRL9NVRqSThFxwOgUqoj0j9Ex6hQRB4xNMw9xehi+7IPGU/D5KdjZCw0n4bMC7ChAfR6290BdDrZ1w9YTUNMF1Z2wOQubOuCjduGDNmHdEbKeoebRSLPbC+zUgvdEHDB+n3mItw7rX7P9OcS1BQEmZpiHWPN/Akw+YB7iXBEa++DTgrCjINQXhFRe2N4j1PUItTlhW7ew9YRQE955uoSPO4UtWaEqK2zsED7MCO+3Ce8esSf9wO6MBl/5xt53WkL3HvCfCIcbO6W6iaceooo4fhndY3R6FlXEF70ovMiM/TWcbO23wkwJNcTBAVjWpHGVMFTU5smEyTwsoYZY1aJ0mQtj1pIqWZi1eojVLUrJxwGaiONXYEObwh8az1D9ygE72XQ+Amgi+oeiY9Rp+IGdCZd2ebNQEmXELRXA3OayIUAJUZcTkvsV2irxxlaYsAbi0h1Y2qTV2Iq1FsM6DQGuEccuEe+N3nALCHv3jyd/u1XovxUl7AJxcyI6fVYfeqI3usctwFAR9u4X6bpcDNv5CdexJODNRfjAUawMWJnQivDJhL37sP3t9BNTYAfDslF58uUoRznKkVis+Au1mxEyMIWnXQAAAABJRU5ErkJggg=="
                alt="exit"
                className="h-6 w-6"
              />
            }
            sx={{
              backgroundColor: '#dc2626', // Color rojo (equivalente a red-600 de Tailwind)
              '&:hover': {
                backgroundColor: '#b91c1c', // Color rojo oscuro (equivalente a red-700 de Tailwind)
              },
              textTransform: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontSize: '0.875rem',
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* contenedor principal */}
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-start items-center mb-6">
          {/* Todo el contenido ahora está alineado a la derecha con justify-end */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-32">
              <TextField
                id="nameSearch"
                label="Nombres"
                variant="outlined"
                size="small"
                fullWidth
                value={nameSearchTerm}
                onChange={handleNameSearchChange}
              />
            </div>

            <div className="w-32">
              <TextField
                id="otherSearch"
                label="Apellidos"
                variant="outlined"
                size="small"
                fullWidth
                value={otherSearchTerm}
                onChange={handleOtherSearchChange}
              />
            </div>

            <div className="w-32">
              <FormControl fullWidth size="small">
                <InputLabel id="agency-select-label">Agencia</InputLabel>
                <Select
                  labelId="agency-select-label"
                  id="agencyFilter"
                  value={selectedAgency}
                  label="Agencia"
                  onChange={handleAgencyChange}
                  MenuProps={{
                    TransitionProps: {
                      timeout: 300,
                      easing: {
                        enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
                        exit: 'cubic-bezier(0.4, 0, 0.2, 1)'
                      }
                    },
                    PaperProps: {
                      style: {
                        maxHeight: 224,
                        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)'
                      }
                    }
                  }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {agencies.map(agency => (
                    <MenuItem key={agency} value={agency}>{agency}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className="w-32">
              <FormControl fullWidth size="small">
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  id="statusFilter"
                  value={selectedStatus}
                  label="Status"
                  onChange={handleStatusChange}
                  MenuProps={{
                    TransitionProps: {
                      timeout: 300,
                      easing: {
                        enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
                        exit: 'cubic-bezier(0.4, 0, 0.2, 1)'
                      }
                    },
                    PaperProps: {
                      style: {
                        maxHeight: 224,
                        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)'
                      }
                    }
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="SI">SI</MenuItem>
                  <MenuItem value="NO">NO</MenuItem>
                </Select>
              </FormControl>
            </div>

            <Button
              variant="contained"
              onClick={() => { /* Tu función de búsqueda */ }}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                textTransform: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                height: '40px',
                minWidth: '80px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <img
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADLUlEQVR4nO2YWU8TURiG505N0DuTarkwBlxiIhLxn4hL4o3GiPuOMWo0uJJGiQtKaYHSVqORH6DxpuFCIdUQ4pK4QJu2YKWgFBi00xYec1oX3BJxzsxI0jc5N3P1PGfO9n2KUkghhfxT/DDPDxu9E7hbswRbsyQ8WdKeDOmWDImmDMHmDK5GjQ1NMFf5X+KFJT5o9k0w7p2E1on88IiRhZYsNGfyw50GlwaNKcadKZoaUpRaBn4X5vjgohcyvkn4a3gNnCm48QnqP5K+No7DA7NNhb8FpX545gP+Ff56XoCr43B5jI46lQWmwHuh3A8JWfBXVLiswqVRYo4xVpox89Lh68ZyAlwcIeZQsRkCL9apH7oNhMcxArVJnlyKMke6gNiwJsBz4QOcfU+N9KNSz2kzHfhz7+HMEGOnBiQupdw5bx48NYNwKsENaTfstC4pOfCcHECtHpRwY+eeB+bDc+IdHI+zXrdA7m1jAfyxOBx9S6NugdzDzBp4qvvp0C3gyTJoBfyRfjgcY0C3QEsWzRL4PjgUI6VfIINmETwHonIEBi2CZ29EwhL6UkmZDr8vArtDEjaxKAOtgN8Thl29OHULiBrWEvgQ7AhRqVugHoqcKVSz4bf3oO58TpEiI6IAN3Xme2FbDy5FVkT3QBTgZsFX9aBtfsViRWZE98AkeLa+4YJiREkpugdGw68NDqdX+LrKFCNSr2KrGyVqFPymZ59Y6n3MsraX8fIHQ8sNkRCtj1z3QDb804+suNnF0jsvWHU/TkV7sq88kCwxROLcKPNrk7TLgq8MDmul3mAe/t5b1rSP5MbqQPJRsTtqjMQVmCW6B6eHUPWcNltfc37l7e4ly9tehsXMf4WvCCRDdk/s3QJXNG5zh41ZTiKieyAKcFHDTueSquqhcepRWRaIL6poHwn/AO+OkhtGS3wRKRI17NF+nEf66RTFyMEY2v4omnhV7g7TubOXhqoQ6/50w5YHkiWrA8mHxZ6+7/BmSsiIvSFWanNH+n4RKEiYHHvhT8yAP2FzR14pMyH230m4IpM2V2S7MlNinyox0+B/kni9sCm65dvHQgopRJmaz39BUHt8KVcUAAAAAElFTkSuQmCC"
                alt="search"
                style={{ width: '20px', height: '20px' }}
              />
              Buscar empleados
            </Button>

            <Button
              variant="contained"
              onClick={resetFilters}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                textTransform: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                height: '40px',
                minWidth: '80px',
                fontSize: '0.8rem',
              }}
            >
              <img
                src="data:image/png;base64,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"
                alt="search"
                style={{ width: '20px', height: '20px' }}
              />
              Resetear Filtro
            </Button>

            <Button
              variant="contained"
              onClick={openModal}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                textTransform: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                height: '40px',
                minWidth: '80px',
                fontSize: '0.8rem',
              }}
            >
              <img
                src="data:image/png;base64,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"
                alt="search"
                style={{ width: '20px', height: '20px' }}
              />
              Agregar empleado
            </Button>

            <Button
              variant="contained"
              onClick={openAdminModal}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                textTransform: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                height: '40px',
                minWidth: '100px',
                fontSize: '0.8rem',
              }}
            >
              <img
                src="data:image/png;base64,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"
                alt="search"
                style={{ width: '20px', height: '20px' }}
              />
              Agregar nuevo administrador
            </Button>
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
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Última Modificación
                    </th>
                    {/* Agrega esta nueva columna */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-32">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">

                  {/* Mapeo de empleados */}
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {employee.last_modified ? (
                          <div className="text-xs">
                            <div>{new Date(employee.last_modified).toLocaleDateString()}</div>
                            <div className="text-gray-500">Por: {employee.modified_by_name || employee.modified_by || '-'}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      {/* Nueva celda con botón de editar */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          variant="contained"
                          onClick={() => openEditEmployeeModal(employee)}
                          startIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          }
                          size="small"
                          sx={{
                            backgroundColor: '#1976d2',
                            '&:hover': {
                              backgroundColor: '#1565c0',
                            },
                            textTransform: 'none',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            minWidth: 'unset',
                            lineHeight: 1.2,
                          }}
                        >
                          Editar
                        </Button>
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
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <User className="h-6 w-6 text-blue-700" />
                    <h2 className="text-xl font-semibold text-blue-800">Ingresar Nuevo Empleado</h2>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmitForm}>
                  {/* Primera fila - Nombre, Apellido, Agencia */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Nombre */}
                    <div>
                      <TextField
                        id="nombre"
                        label="Nombre"
                        variant="outlined"
                        name="nombre"
                        fullWidth
                        required
                        value={formData.nombre}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                          setFormData({
                            ...formData,
                            nombre: e.target.value
                          });
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: '#1976d2',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#1976d2',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#1976d2',
                          }
                        }}
                      />
                    </div>

                    {/* Apellido */}
                    <div>
                      <TextField
                        id="apellido"
                        label="Apellido"
                        variant="outlined"
                        name="apellido"
                        fullWidth
                        required
                        value={formData.apellido}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                          setFormData({
                            ...formData,
                            apellido: e.target.value
                          });
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: '#1976d2',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#1976d2',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#1976d2',
                          }
                        }}
                      />
                    </div>

                    {/* Agencia */}
                    <div>
                      <FormControl fullWidth>
                        <InputLabel id="agencia-select-label">Agencia</InputLabel>
                        <Select
                          labelId="agencia-select-label"
                          id="agencia"
                          name="agencia"
                          value={formData.agencia}
                          label="Agencia"
                          onChange={(e: SelectChangeEvent) => {
                            setFormData({
                              ...formData,
                              agencia: e.target.value
                            });
                          }}
                          required
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1976d2',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1976d2',
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>Seleccionar agencia</em>
                          </MenuItem>
                          {AGENCIAS.map((agencia) => (
                            <MenuItem key={agencia} value={agencia}>
                              {agencia}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                  </div>

                  {/* Segunda fila - Fecha Nacimiento, Fecha Alta, Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale="es" // Configurar el adaptador en español
                      localeText={esES.components.MuiLocalizationProvider.defaultProps.localeText}
                    >
                      {/* Fecha de Nacimiento */}
                      <div>
                        <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Nacimiento
                        </label>
                        <DatePicker
                          format="DD/MM/YYYY"
                          value={formData.fechaNacimiento ? dayjs(formData.fechaNacimiento) : null}
                          onChange={(newValue) => {
                            const formattedValue = newValue ? newValue.format('YYYY-MM-DD') : '';
                            handleFormChange({
                              target: { name: 'fechaNacimiento', value: formattedValue }
                            } as any);
                          }}
                          slotProps={{
                            textField: {
                              id: 'fechaNacimiento',
                              name: 'fechaNacimiento',
                              required: true,
                              fullWidth: true,
                              variant: 'outlined',
                              placeholder: "DD/MM/YYYY",
                              sx: {
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#1976d2',
                                  },
                                },
                              }
                            },
                          }}
                        />
                      </div>

                      {/* Fecha de Alta */}
                      <div>
                        <label htmlFor="fechaAlta" className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Alta
                        </label>
                        <DatePicker
                          format="DD/MM/YYYY"
                          value={formData.fechaAlta ? dayjs(formData.fechaAlta) : null}
                          onChange={(newValue) => {
                            const formattedValue = newValue ? newValue.format('YYYY-MM-DD') : '';
                            handleFormChange({
                              target: { name: 'fechaAlta', value: formattedValue }
                            } as any);
                          }}
                          slotProps={{
                            textField: {
                              id: 'fechaAlta',
                              name: 'fechaAlta',
                              required: true,
                              fullWidth: true,
                              variant: 'outlined',
                              placeholder: "DD/MM/YYYY",
                              sx: {
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#1976d2',
                                  },
                                },
                              }
                            },
                          }}
                        />
                      </div>
                    </LocalizationProvider>

                    {/* Status */}
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <FormControl fullWidth>
                        <Select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={(event: SelectChangeEvent<string>) => {
                            const { name, value } = event.target;
                            setFormData((prevFormData) => ({
                              ...prevFormData,
                              [name]: value,
                            }));
                          }}
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' },
                          }}
                        >
                          <MenuItem value="SI">SI</MenuItem>
                          <MenuItem value="NO">NO</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                  </div>

                  {/* Tercera fila - URL de Foto */}
                  <div className="mb-6">
                    <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                      URL de Foto (Google Drive Opcional)
                    </label>
                    <TextField
                      id="photo"
                      name="photo"
                      fullWidth
                      placeholder="https://drive.google.com/file/d/..."
                      value={formData.photo}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                        setFormData({
                          ...formData,
                          photo: e.target.value
                        });
                      }}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                          },
                        }
                      }}
                    />
                  </div>

                  {/* Botones */}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </button>

                    <Button
                      type="submit"
                      variant="contained"
                      sx={{
                        backgroundColor: '#1976d2', // Color azul de Material UI
                        '&:hover': {
                          backgroundColor: '#1565c0', // Un tono más oscuro para el hover
                        },
                        textTransform: 'none', // Para mantener el texto con mayúsculas/minúsculas como está
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      startIcon={
                        <img
                          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA7ElEQVR4nO2WsQrCMBRF8zVC3ZQ39C8c/R3BxbWTb7X+gJsU1EWEbrGDINRd/6BjRESoEJDaJCb1HrhzOdz7aIQAAAAvIS7VK9Ek02a1OxgL1b5H83IWtgAbkDAt0BvGb/kowC0lvBDgFhLeCPCXEl4JcKkgEKGBGBNqRP2A+tOtdkKL9d7ITyzNcrtHPEgKrcQo2bSWSLNcjZcnuwI+RECA0YDChJrQqSMubpVyzfFamRP4FQQB1jcgzxcrcdZA8AKuIAhwRyckQxdwBUGAOzohGbqAKwgC/Gzg8bR1jTT5nPYh4u8EAABAuOAOASTBaeDBltsAAAAASUVORK5CYII="
                          alt="save--v1"
                          className="h-5 w-5"
                        />
                      }
                    >
                      Guardar Cambios
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

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
                        <thead className="text-white bg-[#493F91] text-white">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Agencia</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {loadingUsers ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 text-center">
                                <div className="flex justify-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-700"></div>
                                </div>
                              </td>
                            </tr>
                          ) : users.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                No hay usuarios registrados
                              </td>
                            </tr>
                          ) : (
                            users.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{`${user.name} ${user.last_name}`}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.agency || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                  <Button
                                    variant="contained"
                                    onClick={() => openEditModal(user)}
                                    size="small"
                                    sx={{
                                      backgroundColor: '#1976d2', // Color azul como el de Agregar Empleado
                                      '&:hover': {
                                        backgroundColor: '#1565c0', // Un tono más oscuro para el hover
                                      },
                                      textTransform: 'none',
                                      padding: '4px 10px',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      minWidth: 'unset',
                                      marginRight: '8px'
                                    }}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    variant="contained"
                                    onClick={() => handleDeleteUser(user.id)}
                                    size="small"
                                    sx={{
                                      backgroundColor: '#dc2626', // Color rojo
                                      '&:hover': {
                                        backgroundColor: '#b91c1c', // Un tono más oscuro para el hover
                                      },
                                      textTransform: 'none',
                                      padding: '4px 10px',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      minWidth: 'unset'
                                    }}
                                  >
                                    Eliminar
                                  </Button>
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
                        <TextField
                          id="adminNombre"
                          label="Nombre"
                          variant="outlined"
                          name="nombre"
                          fullWidth
                          required
                          value={adminFormData.nombre}
                          onChange={handleAdminFormChange}
                          sx={{
                            marginBottom: 2,
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: '#1976d2',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#1976d2',
                              },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#1976d2',
                            }
                          }}
                        />
                      </div>

                      {/* Apellido */}
                      <div>
                        <TextField
                          id="adminApellido"
                          label="Apellido"
                          variant="outlined"
                          name="apellido"
                          fullWidth
                          required
                          value={adminFormData.apellido}
                          onChange={handleAdminFormChange}
                          sx={{
                            marginBottom: 2,
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: '#1976d2',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#1976d2',
                              },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#1976d2',
                            }
                          }}
                        />
                      </div>

                      {/* Correo */}
                      <div>
                        <TextField
                          id="adminCorreo"
                          label="Correo Electrónico"
                          variant="outlined"
                          name="correo"
                          type="email"
                          fullWidth
                          required
                          value={adminFormData.correo}
                          onChange={handleAdminFormChange}
                          sx={{
                            marginBottom: 2,
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: '#1976d2',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#1976d2',
                              },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#1976d2',
                            }
                          }}
                        />
                      </div>

                      {/* Contraseña */}
                      <div>
                        <TextField
                          id="adminPassword"
                          label={isEditing ? 'Nueva Contraseña (dejar en blanco para mantener)' : 'Contraseña'}
                          variant="outlined"
                          name="password"
                          type="password"
                          fullWidth
                          required={!isEditing}
                          value={adminFormData.password}
                          onChange={handleAdminFormChange}
                          sx={{
                            marginBottom: 2,
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: '#1976d2',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#1976d2',
                              },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#1976d2',
                            }
                          }}
                        />
                      </div>

                      {/* Agencia - Con Select de Material UI */}
                      <div>
                        <FormControl fullWidth sx={{ marginBottom: 2 }}>
                          <InputLabel id="adminAgencia-label">Agencia</InputLabel>
                          <Select
                            labelId="adminAgencia-label"
                            id="adminAgencia"
                            name="agencia"
                            value={adminFormData.agencia}
                            label="Agencia"
                            onChange={handleAdminFormChange}
                            sx={{
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1976d2',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#1976d2',
                              }
                            }}
                          >
                            <MenuItem value="">
                              <em>Seleccionar agencia</em>
                            </MenuItem>
                            {AGENCIAS.map((agencia) => (
                              <MenuItem key={agencia} value={agencia}>
                                {agencia}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
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

                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={
                          <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA7ElEQVR4nO2WsQrCMBRF8zVC3ZQ39C8c/R3BxbWTb7X+gJsU1EWEbrGDINRd/6BjRESoEJDaJCb1HrhzOdz7aIQAAAAvIS7VK9Ek02a1OxgL1b5H83IWtgAbkDAt0BvGb/kowC0lvBDgFhLeCPCXEl4JcKkgEKGBGBNqRP2A+tOtdkKL9d7ITyzNcrtHPEgKrcQo2bSWSLNcjZcnuwI+RECA0YDChJrQqSMubpVyzfFamRP4FQQB1jcgzxcrcdZA8AKuIAhwRyckQxdwBUGAOzohGbqAKwgC/Gzg8bR1jTT5nPYh4u8EAABAuOAOASTBaeDBltsAAAAASUVORK5CYII="
                            alt="save--v1"
                            className="h-4 w-4"
                          />
                        }
                        sx={{
                          backgroundColor: '#1565c0', // El color morado original
                          '&:hover': {
                            backgroundColor: '#1565c0', // Un tono más oscuro para el hover
                          },
                          textTransform: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                          fontSize: '0.875rem',
                        }}
                      >
                        {isEditing ? 'Actualizar Usuario' : 'Registrar Usuario'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar usuario */}
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
                <div className="flex items-center justify-between mb-6">
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
                  {/* Primera fila - Nombre, Apellido, Agencia */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Nombre */}
                    <div>
                      <TextField
                        id="edit-nombre"
                        label="Nombre"
                        variant="outlined"
                        name="name"
                        fullWidth
                        required
                        value={editEmployeeData.name}
                        onChange={handleEditEmployeeChange as any}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: '#1976d2',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#1976d2',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#1976d2',
                          }
                        }}
                      />
                    </div>

                    {/* Apellido */}
                    <div>
                      <TextField
                        id="edit-apellido"
                        label="Apellido"
                        variant="outlined"
                        name="last_name"
                        fullWidth
                        required
                        value={editEmployeeData.last_name}
                        onChange={handleEditEmployeeChange as any}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: '#1976d2',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#1976d2',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#1976d2',
                          }
                        }}
                      />
                    </div>

                    {/* Agencia */}
                    <div>
                      <FormControl fullWidth>
                        <InputLabel id="edit-agencia-label">Agencia</InputLabel>
                        <Select
                          labelId="edit-agencia-label"
                          id="edit-agencia"
                          name="agency"
                          value={editEmployeeData.agency}
                          label="Agencia"
                          onChange={handleEditEmployeeChange as any}
                          required
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1976d2',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#1976d2',
                            },
                          }}
                        >
                          <MenuItem value="">
                            <em>Seleccionar agencia</em>
                          </MenuItem>
                          {AGENCIAS.map((agencia) => (
                            <MenuItem key={agencia} value={agencia}>
                              {agencia}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>
                  </div>

                  {/* Segunda fila - Fechas y Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale="es"
                      localeText={esES.components.MuiLocalizationProvider.defaultProps.localeText}
                    >
                      {/* Fecha de Nacimiento */}
                      <div>
                        <label htmlFor="edit-fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Nacimiento
                        </label>
                        <DatePicker
                          format="DD/MM/YYYY"
                          value={editEmployeeData.date_of_birth ? dayjs(editEmployeeData.date_of_birth) : null}
                          onChange={(newValue) => {
                            const formattedValue = newValue ? newValue.format('YYYY-MM-DD') : '';
                            handleEditEmployeeChange({
                              target: { name: 'date_of_birth', value: formattedValue }
                            } as any);
                          }}
                          slotProps={{
                            textField: {
                              id: 'edit-fechaNacimiento',
                              name: 'date_of_birth',
                              required: true,
                              fullWidth: true,
                              variant: 'outlined',
                              sx: {
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#1976d2',
                                  },
                                },
                              }
                            },
                          }}
                        />
                      </div>

                      {/* Fecha de Alta */}
                      <div>
                        <label htmlFor="edit-fechaAlta" className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Alta
                        </label>
                        <DatePicker
                          format="DD/MM/YYYY"
                          value={editEmployeeData.high_date ? dayjs(editEmployeeData.high_date) : null}
                          onChange={(newValue) => {
                            const formattedValue = newValue ? newValue.format('YYYY-MM-DD') : '';
                            handleEditEmployeeChange({
                              target: { name: 'high_date', value: formattedValue }
                            } as any);
                          }}
                          slotProps={{
                            textField: {
                              id: 'edit-fechaAlta',
                              name: 'high_date',
                              required: true,
                              fullWidth: true,
                              variant: 'outlined',
                              sx: {
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#1976d2',
                                  },
                                },
                              }
                            },
                          }}
                        />
                      </div>

                      {/* Status - con el mismo formato de label que las fechas */}
                      <div>
                        <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <FormControl fullWidth>
                          <Select
                            id="edit-status"
                            name="status"
                            value={editEmployeeData.status}
                            onChange={handleEditEmployeeChange as any}
                            sx={{
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' },
                            }}
                          >
                            <MenuItem value="SI">SI</MenuItem>
                            <MenuItem value="NO">NO</MenuItem>
                          </Select>
                        </FormControl>
                      </div>
                    </LocalizationProvider>
                  </div>

                  {/* Tercera fila - Fecha de Baja y URL de Foto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale="es"
                      localeText={esES.components.MuiLocalizationProvider.defaultProps.localeText}
                    >
                      {/* Fecha de Baja */}
                      <div>
                        <label htmlFor="edit-fechaBaja" className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Baja
                        </label>
                        <DatePicker
                          format="DD/MM/YYYY"
                          value={editEmployeeData?.low_date ? dayjs(editEmployeeData.low_date) : null}
                          onChange={(newValue) => {
                            const formattedValue = newValue ? newValue.format('YYYY-MM-DD') : '';
                            handleEditEmployeeChange({
                              target: { name: 'low_date', value: formattedValue }
                            } as any);
                          }}
                          slotProps={{
                            textField: {
                              id: 'edit-fechaBaja',
                              name: 'low_date',
                              fullWidth: true,
                              variant: 'outlined',
                              sx: {
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#1976d2',
                                  },
                                },
                              }
                            },
                          }}
                        />
                      </div>
                    </LocalizationProvider>

                    {/* URL de Foto */}
                    <div>
                      <label htmlFor="edit-photo" className="block text-sm font-medium text-gray-700 mb-2">
                        URL de Foto (Google Drive Opcional)
                      </label>
                      <TextField
                        id="edit-photo"
                        name="photo"
                        fullWidth
                        placeholder="https://drive.google.com/file/d/..."
                        value={editEmployeeData?.photo || ''}
                        onChange={handleEditEmployeeChange as any}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: '#1976d2',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#1976d2',
                            },
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Botones */}
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
                      className="px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-medium hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                    >
                      <img
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA7ElEQVR4nO2WsQrCMBRF8zVC3ZQ39C8c/R3BxbWTb7X+gJsU1EWEbrGDINRd/6BjRESoEJDaJCb1HrhzOdz7aIQAAAAvIS7VK9Ek02a1OxgL1b5H83IWtgAbkDAt0BvGb/kowC0lvBDgFhLeCPCXEl4JcKkgEKGBGBNqRP2A+tOtdkKL9d7ITyzNcrtHPEgKrcQo2bSWSLNcjZcnuwI+RECA0YDChJrQqSMubpVyzfFamRP4FQQB1jcgzxcrcdZA8AKuIAhwRyckQxdwBUGAOzohGbqAKwgC/Gzg8bR1jTT5nPYh4u8EAABAuOAOASTBaeDBltsAAAAASUVORK5CYII=" alt="save--v1"
                        className="h-4 w-4 mr-2"
                      />
                      Guardar Cambios
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEmployee(editEmployeeData.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
                    >
                      <img
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADd0lEQVR4nO3WS08TURgG4MNaEzdsXCj0fqEttG6Uf2DcSEj8C2DcmBiBdmHd+QvEfaHQu6VMgUK7kzWYKEwBE7WXmc5MWyMuicecGQ7UMqUz0zNIYt/kTSCB6fM1M2c+APrpp5//PLM7jwZmdssDM7tQVV/ulMDMx4f/mg8QRDX+rDvfr14c/HQTzO3fA376CQjQz8HcZwjm9iDw70MQQKVPW+zw8770t/49KP4vuga6Frrmi90bZLGzX26BwMEkCBTfgACdAwH6m4TRq/Rv4C9+lT4LfebBpGjQHD+9py+42L3IoDkBOnsNBqBAr/HmG0e+QhN2qzeP24DerQYcw90872gOtS51ow49uOtS3esCdK8J0J0VDgGp+PLN7SuDr0l1UfwHYgN4C43UBXi+O3x0swWtFJ7F5ZPEBvAVmu9k4Vt6wAXoogTopLh5YgN4C83XWuAeDfARihfrzHBBcgPk69P4NvHK3d89w/kz+MiqVGeGnyI2gC/XnPB2ezBl4G4t8FURDx0Z/jGxAcYK9XFFJwoBuFMsB+0Z9gGxAdxbP4yKj8IWuEsD3LEi1brCGIgN4MkxN1SdKD3AHahpDqLPBCQzul7/perBzJ6fKPJwThZuT3PQluaOAel4NoQjtUehWrgd9X0N2lLsIfkB1oRtxfBWtAq4HeGlAcitETjuLJ/SeqI4FMNrYq1JltwagePKCvM9PZgK4DYRX4OWBPuW/ACUENR6otgVwq1JVmqCfUV+gAw/rRl+ilYAhxbUGDtFfoBVYUIrvB3dEZ5goSUu/k5ujcAZoWrjPcOTl8MtcRaa4yw0xQiuEThuijWqOwrbv+1TeKITnIHmmFRrjOAagYNe7cTgcXm4OcZAU5SBnhDhNQLHvsIda4FbFMJNUQYaI9WfuuDFAdLckYqjUB4ek4ebUCMMNCxXD/UbIMVua4Gb2+HRi3BjpCrWsFQlv0bg2FK1FDF45G+4cVnq8FIlqd8ASXZeC7z92za1oY3LVXTroG8fDUB+jcCxJtggcfhSaytwOFwmv0bgmFPstBa4sRs8jOC4JfJrBI4lyU50evkogRsugy9KHQpVyK8ROOgVrxt8sQKHFlBL93UbwBquDJpj1ROt8OFL4WU4FCqd3A5XBoGeMUWZZ6Yo01AOr3SHL5Th3VC5fidUfqorvp9++gHXLn8A4SXcqAb6QuoAAAAASUVORK5CYII=" alt="filled-trash"
                        className="h-4 w-4 mr-2"
                      />
                      Eliminar
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