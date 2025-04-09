// server.js - Archivo principal del servidor usando sintaxis ESM

import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Configuración para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '../..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rh_admin'
};

// Crear pool de conexiones MySQL
const pool = mysql.createPool(dbConfig);

// Ruta para obtener todos los empleados
app.get('/api/employees', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Consulta para obtener los empleados con la información del usuario asociado
    const [rows] = await connection.query(`
      SELECT 
        e.id, 
        e.name, 
        e.last_name, 
        e.agency, 
        DATE_FORMAT(e.date_of_birth, '%d/%m/%Y') as date_of_birth, 
        DATE_FORMAT(e.high_date, '%d/%m/%Y') as high_date, 
        e.status, 
        DATE_FORMAT(e.low_date, '%d/%m/%Y') as low_date, 
        e.photo, 
        e.id_user,
        u.email as user_email
      FROM Employees e
      JOIN Users u ON e.id_user = u.id
    `);
    
    connection.release();
    
    // Convertir fechas a formato adecuado y manejar valores nulos
    const formattedEmployees = rows.map(employee => ({
      ...employee,
      low_date: employee.low_date || null
    }));
    
    res.json(formattedEmployees);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ message: 'Error al obtener datos de empleados', error: error.message });
  }
});

// Ruta para obtener un empleado por ID
app.get('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(`
      SELECT 
        e.id, 
        e.name, 
        e.last_name, 
        e.agency, 
        DATE_FORMAT(e.date_of_birth, '%d/%m/%Y') as date_of_birth, 
        DATE_FORMAT(e.high_date, '%d/%m/%Y') as high_date, 
        e.status, 
        DATE_FORMAT(e.low_date, '%d/%m/%Y') as low_date, 
        e.photo, 
        e.id_user,
        u.email as user_email
      FROM Employees e
      JOIN Users u ON e.id_user = u.id
      WHERE e.id = ?
    `, [id]);
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    
    res.json({
      ...rows[0],
      low_date: rows[0].low_date || null
    });
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ message: 'Error al obtener datos del empleado', error: error.message });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});