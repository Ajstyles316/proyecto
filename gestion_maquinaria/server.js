// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/activos_fijos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

// Registro
app.post('/api/register', async (req, res) => {
  const { captchaValue, ...data } = req.body;

  // Validar captcha
  const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
    params: {
      secret: '6Lcs9ysrAAAAAMmuLFBZVQxquWieQ6lkcU35Cko5',
      response: captchaValue,
    },
  });

  if (!response.data.success) {
    return res.status(400).json({ error: 'Captcha inválido' });
  }

  try {
    const newUser = new Usuario(data);
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

app.listen(5000, () => console.log('Servidor en puerto 5000'));
