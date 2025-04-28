const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
const MONGO_URI = "mongodb://localhost:27017/gestion_maquinaria"; // Ajusta según tu configuración
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

// Importar rutas
const maquinariaRoutes = require("./routes/maquinaria");
const controlRoutes = require("./routes/control");
const asignacionRoutes = require("./routes/asignacion");
app.use("/api/asignacion", asignacionRoutes);
app.use("/api/maquinaria", maquinariaRoutes);
app.use("/api/control", controlRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});