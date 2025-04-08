import { Users } from 'lucide-react';
import { useState, useEffect } from 'react';

// Definimos la interfaz para los datos de empleados
interface Employee {
  id: number;
  name: string;
  lastName: string;
  agency: string;
  dateOfBirth: string;
  highDate: string;
  status: string;
  lowDate: string | null;
  photo: string;
  idUser: string;
}

// Interfaz para empleados con URL de foto procesada
interface ProcessedEmployee extends Employee {
  photoUrl: string;
}

// Función para convertir enlaces de Google Drive a URLs de imagen directas
const convertGoogleDriveUrl = (url: string): string => {
  // Verifica si es un enlace de Google Drive
  if (url && url.includes('drive.google.com/file/d/')) {
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

// Mock data con los nuevos enlaces de Google Drive
const employees: Employee[] = [
  {
    id: 1,
    name: 'Diego Alberto',
    lastName: 'Rivera Torrero',
    agency: 'NISSAUTO',
    dateOfBirth: '07/12/1994',
    highDate: '16/04/2018',
    status: 'SI',
    lowDate: null,
    photo: 'https://drive.google.com/file/d/1SDRiZqa98ORwsxZbFUflrtni8yYOosHM/view?usp=drive_link',
    idUser: 'USR001'
  },
  {
    id: 2,
    name: 'María',
    lastName: 'González',
    agency: 'NISSAUTO',
    dateOfBirth: '16/03/2000',
    highDate: '01/07/2024',
    status: 'SI',
    lowDate: null,
    photo: 'https://drive.google.com/file/d/15AzJAz7gxWylt7a8q0WY-dAuZGdp-vxL/view?usp=drive_link',
    idUser: 'USR002'
  }
];

function App() {
  const [employeesData, setEmployeesData] = useState<ProcessedEmployee[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  
  // Procesamos los datos para convertir las URLs al cargar el componente
  useEffect(() => {
    const processedEmployees: ProcessedEmployee[] = employees.map(employee => ({
      ...employee,
      photoUrl: convertGoogleDriveUrl(employee.photo)
    }));
    setEmployeesData(processedEmployees);
  }, []);

  // Función para filtrar empleados
  const filteredEmployees = employeesData.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.idUser.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAgency = selectedAgency === '' || employee.agency === selectedAgency;
    
    return matchesSearch && matchesAgency;
  });

  // Maneja el cambio en el campo de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Maneja el cambio en el filtro de agencia
  const handleAgencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgency(e.target.value);
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
          <button className="bg-red-600 px-4 py-2 rounded-md hover:bg-red-700">
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-6 px-4">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Buscar empleado..."
            className="px-4 py-2 border rounded-md flex-1"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select 
            className="px-4 py-2 border rounded-md"
            value={selectedAgency}
            onChange={handleAgencyChange}
          >
            <option value="">Todas las agencias</option>
            <option value="Sede Central">Sede Central</option>
            <option value="Sucursal Norte">Sucursal Norte</option>
          </select>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            Buscar
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Foto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apellido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Nacimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Alta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Baja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Usuario
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={employee.photoUrl}
                      alt={`${employee.name} ${employee.lastName}`}
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        // Usar una imagen base64 sencilla en lugar de depender de un servicio externo
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.agency}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.dateOfBirth}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.highDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.status === 'SI' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.lowDate || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.idUser}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">1</span> a{' '}
            <span className="font-medium">{filteredEmployees.length}</span> de{' '}
            <span className="font-medium">{filteredEmployees.length}</span> resultados
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 border rounded-md disabled:opacity-50">
              Anterior
            </button>
            <button className="px-4 py-2 border rounded-md bg-purple-700 text-white">
              1
            </button>
            <button className="px-4 py-2 border rounded-md disabled:opacity-50">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;