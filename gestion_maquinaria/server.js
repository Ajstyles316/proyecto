// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/gestion_maquinaria', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Modelos
const Usuario = mongoose.model('Usuario', new mongoose.Schema({
  Nombre: String,
  Apellido: String,
  Cargo: String,
  Grado: String,
  Unidad: String,
  Celular: String,
  Email: String,
  Password: String,
}));

const Maquinaria = mongoose.model('Maquinaria', new mongoose.Schema({
  detalle: String,
  placa: String,
  unidad: String,
  tipo: String,
  marca: String,
  modelo: String,
}));

// Registro
app.post('/api/register', async (req, res) => {
  try {
    const newUser = new Usuario(req.body);
    await newUser.save();
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await Usuario.findOne({ Email: email, Password: password });
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  res.status(200).json({ message: 'Inicio de sesión correcto' });
});

