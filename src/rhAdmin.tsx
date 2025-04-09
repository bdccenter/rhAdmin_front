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

// Mock data con los nuevos enlaces de Google Drive y más agencias
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
    agency: 'CANANEA NISSAUTO',
    dateOfBirth: '16/03/2000',
    highDate: '01/07/2024',
    status: 'SI',
    lowDate: null,
    photo: 'https://drive.google.com/file/d/15AzJAz7gxWylt7a8q0WY-dAuZGdp-vxL/view?usp=drive_link',
    idUser: 'USR002'
  },
  {
    id: 3,
    name: 'Ricardo',
    lastName: 'Arce Duarte',
    agency: 'GUAYMAS',
    dateOfBirth: '10/05/1988',
    highDate: '20/01/2022',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR003'
  },
  {
    id: 4,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },
  {
    id: 5,
    name: 'Juan',
    lastName: 'Evangelista Velázquez',
    agency: 'GRANAUTO',
    dateOfBirth: '30/07/1985',
    highDate: '08/03/2017',
    status: 'NO',
    lowDate: '15/01/2023',
    photo: '',
    idUser: 'USR005'
  },
  {
    id: 6,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 7,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 8,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 9,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 10,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 11,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 12,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 13,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 14,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 15,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 16,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },
  {
    id: 17,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 18,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 19,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 20,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 21,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 22,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },{
    id: 23,
    name: 'Sandra',
    lastName: 'Olivas Mendoza',
    agency: 'AGUA PRIETA NISSAUTO',
    dateOfBirth: '25/09/1990',
    highDate: '15/06/2019',
    status: 'SI',
    lowDate: null,
    photo: '',
    idUser: 'USR004'
  },
];

function rhAdmin() {
  
  // Estado para almacenar los datos de empleados procesados
  // y los términos de búsqueda y filtros
  // Se inicializa el estado de empleados con los datos procesados
  const [employeesData, setEmployeesData] = useState<ProcessedEmployee[]>([]);
  const [nameSearchTerm, setNameSearchTerm] = useState<string>('');
  const [otherSearchTerm, setOtherSearchTerm] = useState<string>('');
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Función para resetear todos los filtros
  const resetFilters = () => {
    setNameSearchTerm('');
    setOtherSearchTerm('');
    setSelectedAgency('');
    setSelectedStatus('');
  };
  
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
    // Filtro por nombre o ID de usuario
    const matchesNameSearch = 
      employee.name.toLowerCase().includes(nameSearchTerm.toLowerCase()) ||
      employee.idUser.toLowerCase().includes(nameSearchTerm.toLowerCase());
    
    // Filtro adicional por apellido o agencia
    const matchesOtherSearch = 
      employee.lastName.toLowerCase().includes(otherSearchTerm.toLowerCase()) ||
      employee.agency.toLowerCase().includes(otherSearchTerm.toLowerCase());
    
    // Filtro por agencia seleccionada
    const matchesAgency = selectedAgency === '' || employee.agency === selectedAgency;
    
    // Filtro por status
    const matchesStatus = selectedStatus === '' || employee.status === selectedStatus;
    
    return matchesNameSearch && matchesOtherSearch && matchesAgency && matchesStatus;
  });

  // Maneja el cambio en el campo de búsqueda por nombre/ID
  const handleNameSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameSearchTerm(e.target.value);
  };

  // Maneja el cambio en el campo de búsqueda por apellido/agencia
  const handleOtherSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherSearchTerm(e.target.value);
  };

  // Maneja el cambio en el filtro de agencia
  const handleAgencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgency(e.target.value);
  };

  // Maneja el cambio en el filtro de status
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
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

      {/* contenedor principal */}
      <div className="container mx-auto py-6 px-4">
        {/* Filtros */}
        <div className="mb-6 flex flex-wrap justify-end items-end gap-4">
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
              <option value="NISSAUTO">NISSAUTO</option>
              <option value="CANANEA NISSAUTO">CANANEA NISSAUTO</option>
              <option value="AGUA PRIETA NISSAUTO">AGUA PRIETA NISSAUTO</option>
              <option value="GUAYMAS">GUAYMAS</option>
              <option value="GRANAUTO">GRANAUTO</option>
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

        {/* Mesa contenedor con altura fija */}
        <div className="bg-white rounded-lg shadow">
          {/* Este div externo mantiene el estilo del contenedor */}
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
                {filteredEmployees.map((employee, index) => (
                  <tr key={`${employee.id}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.lastName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.agency}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.dateOfBirth}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.highDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.status === 'SI' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {employee.lowDate || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{employee.idUser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginacion */}
        <div className="mt-4 bg-white p-3 rounded-lg shadow border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">1</span> a{' '}
              <span className="font-medium">{filteredEmployees.length}</span> de{' '}
              <span className="font-medium">{filteredEmployees.length}</span> resultados
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 border rounded-md disabled:opacity-50">
                Anterior
              </button>
              <button className="px-4 py-2 border rounded-md bg-blue-700 text-white">
                1
              </button>
              <button className="px-4 py-2 border rounded-md disabled:opacity-50">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default rhAdmin;