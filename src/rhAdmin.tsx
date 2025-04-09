import { Users, ChevronLeft, ChevronRight, Save, User, X, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { MdLogout } from "react-icons/md";

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

function rhAdmin() {
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
      
      // Ejemplo de cómo se podría implementar la llamada a la API
      /*
      const response = await axios.post(`${API_URL}/employees`, {
        name: formData.nombre,
        last_name: formData.apellido,
        agency: formData.agencia,
        date_of_birth: formData.fechaNacimiento,
        high_date: formData.fechaAlta,
        status: formData.status,
        photo: formData.photo,
        id_user: parseInt(formData.idUsuario)
      });
      
      if (response.status === 201) {
        // Recargar la lista de empleados después de una creación exitosa
        fetchEmployees();
        // Cerrar el modal y limpiar el formulario
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
      }
      */
      
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
          <button className="bg-red-600 px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2">
            <MdLogout className="text-lg" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* contenedor principal */}
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          {/* Botón de Agregar Empleado */}
          <button 
            onClick={openModal}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
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

            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
              Buscar
            </button>

            <button
              onClick={resetFilters}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm">
              Resetear filtros
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
                <ChevronLeft className="h-4 w-4 mr-1" />
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
                <ChevronRight className="h-4 w-4 ml-1" />
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

                    {/* ID Usuario */}
                    <div>
                      <label htmlFor="idUsuario" className="block text-sm font-medium text-gray-700 mb-1">
                        ID Usuario
                      </label>
                      <input
                        type="number"
                        id="idUsuario"
                        name="idUsuario"
                        required
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={formData.idUsuario}
                        onChange={handleFormChange}
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

export default rhAdmin;