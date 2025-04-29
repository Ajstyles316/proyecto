import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  FormControl,
  FormHelperText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Line } from "react-chartjs-2";
import regression from "regression";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale);

const tipos = ["PREVENTIVO", "CORRECTIVO"];

const getMantenimientoRecomendado = (horas) => {
  if (horas > 10000) return "Sustitución urgente de componentes críticos";
  if (horas > 9500) return "Inspección completa de transmisión y motor";
  if (horas > 9000) return "Cambio de rodamientos y lubricación avanzada";
  return "Todo en orden";
};

const Mantenimiento = () => {
  const [data, setData] = useState([]);
  const [maquinarias, setMaquinarias] = useState([]);
  const [form, setForm] = useState({
    maquinaria: "",
    tipo: "",
    cantidad: "",
    recorrido: "",
    ultimaRevision: "",
    horasOperacion: "",
    unidad: "",
  });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchMantenimientos();
    fetchMaquinarias();
  }, []);

  const fetchMantenimientos = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/mantenimiento/");
      if (!response.ok) throw new Error("Error al cargar los mantenimientos");
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Error:", error.message);
      alert("No se pudieron cargar los mantenimientos. Verifica la conexión con el backend.");
    }
  };

  const fetchMaquinarias = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
      if (!response.ok) throw new Error("Error al cargar la maquinaria");
      const data = await response.json();
      setMaquinarias(data);
    } catch (error) {
      console.error("Error:", error.message);
      alert("No se pudieron cargar las maquinarias. Verifica la conexión.");
    }
  };

  const handleOpen = () => {
    setForm({
      maquinaria: "",
      tipo: "",
      cantidad: "",
      recorrido: "",
      ultimaRevision: "",
      horasOperacion: "",
      unidad: "",
    });
    setEditingId(null);
    setOpen(true);
    setErrors({});
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "tipo" ? value.toLowerCase() : value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.maquinaria) newErrors.maquinaria = "Seleccione una maquinaria.";
    if (!form.tipo.trim()) newErrors.tipo = "Seleccione un tipo.";
    if (!form.cantidad.trim()) newErrors.cantidad = "Ingrese una cantidad.";
    if (!form.recorrido.trim()) newErrors.recorrido = "Ingrese un recorrido.";
    if (!form.ultimaRevision.trim()) newErrors.ultimaRevision = "Ingrese la fecha de última revisión.";
    if (!form.horasOperacion.trim()) newErrors.horasOperacion = "Ingrese las horas de operación por día.";
    if (!form.unidad.trim()) newErrors.unidad = "Seleccione una unidad.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        ...form,
        maquinaria: Number(form.maquinaria), // Asegurar que se mande como número
      };

      if (editingId) {
        await fetch(`http://localhost:8000/api/mantenimiento/${editingId}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("http://localhost:8000/api/mantenimiento/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      handleClose();
      fetchMantenimientos();
    } catch (error) {
      console.error("Error al guardar los datos:", error);
      alert("Ocurrió un error al guardar los datos.");
    }
  };

  const handleEdit = (item) => {
    setForm({
      ...item,
      maquinaria: item.maquinaria_id || item.maquinaria, // Usar el id
    });
    setEditingId(item.id);
    setOpen(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/mantenimiento/${id}/`, { method: "DELETE" });
      fetchMantenimientos();
    } catch (error) {
      console.error("Error al eliminar el mantenimiento:", error);
      alert("Ocurrió un error al eliminar el mantenimiento.");
    }
  };

  const forecastData = () => {
    const acumulados = [];
    data.forEach((item) => {
      const fechaInicio = new Date(item.ultimaRevision);
      const fechaActual = new Date();
      const diasPasados = Math.floor((fechaActual - fechaInicio) / (1000 * 60 * 60 * 24));
      const horasPorDia = Number(item.horasOperacion);
      if (!isNaN(horasPorDia) && diasPasados > 0) {
        const meses = Math.ceil(diasPasados / 30);
        let total = 0;
        for (let i = 0; i < meses; i++) {
          total += horasPorDia * 30;
          acumulados.push([acumulados.length, total]);
        }
      }
    });
    if (acumulados.length < 2) acumulados.push([0, 0], [1, 10]);
    return regression.linear(acumulados);
  };

  const forecast = forecastData();

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Mantenimiento
        </Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleOpen}>
          Nuevo
        </Button>
      </Box>

      <Box sx={{ mb: 3, height: 200 }}>
        <Typography variant="h6">Pronóstico</Typography>
        <Line
          data={{
            labels: forecast.points.map((_, i) => `Mes ${i + 1}`),
            datasets: [
              {
                label: "Horas acumuladas proyectadas",
                data: forecast.points.map((p) => forecast.predict(p[0])[1]),
                borderColor: "blue",
                tension: 0.3,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
          }}
        />
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            {["N°", "Maquinaria", "Unidad", "Tipo", "Fecha", "Horas/día", "Recorrido (km)", "Pronóstico", "Acción"].map(
              (h) => (
                <TableCell key={h}>
                  <b>{h}</b>
                </TableCell>
              )
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((d, i) => (
            <TableRow key={d.id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>{d.maquinaria_nombre || d.maquinaria}</TableCell>
              <TableCell>{d.unidad}</TableCell>
              <TableCell>{d.tipo.toUpperCase()}</TableCell>
              <TableCell>{d.ultimaRevision}</TableCell>
              <TableCell>{`${d.horasOperacion} hrs/día`}</TableCell>
              <TableCell>{`${d.recorrido} km`}</TableCell>
              <TableCell>{getMantenimientoRecomendado(Number(d.horasOperacion) * 30)}</TableCell>
              <TableCell>
                <Button size="small" variant="outlined" color="secondary" onClick={() => handleEdit(d)}>
                  Editar
                </Button>
                <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(d.id)}>
                  Eliminar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            p: 4,
            bgcolor: "#fff",
            borderRadius: 2,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
          }}
        >
          <Typography variant="h6" mb={2}>
            {editingId ? "Editar" : "Agregar"} Mantenimiento
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth error={!!errors.maquinaria}>
              <TextField
                select
                label="Maquinaria"
                name="maquinaria"
                value={form.maquinaria}
                onChange={handleChange}
              >
                <MenuItem value="" disabled>
                  Seleccione una maquinaria
                </MenuItem>
                {maquinarias.map((maq) => (
                  <MenuItem key={maq.id} value={maq.id}>
                    {maq.detalle}
                  </MenuItem>
                ))}
              </TextField>
              <FormHelperText>{errors.maquinaria}</FormHelperText>
            </FormControl>

            <FormControl fullWidth error={!!errors.unidad}>
              <TextField
                select
                label="Unidad"
                name="unidad"
                value={form.unidad}
                onChange={handleChange}
              >
                <MenuItem value="" disabled>
                  Seleccione una unidad
                </MenuItem>
                {maquinarias.map((maq) => (
                  <MenuItem key={maq.id} value={maq.unidad}>
                    {maq.unidad}
                  </MenuItem>
                ))}
              </TextField>
              <FormHelperText>{errors.unidad}</FormHelperText>
            </FormControl>

            <FormControl fullWidth error={!!errors.tipo}>
              <TextField
                select
                label="Tipo"
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
              >
                <MenuItem value="" disabled>
                  Seleccione un tipo
                </MenuItem>
                {tipos.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
              <FormHelperText>{errors.tipo}</FormHelperText>
            </FormControl>

            <TextField
              label="Cantidad"
              name="cantidad"
              value={form.cantidad}
              onChange={handleChange}
              error={!!errors.cantidad}
              helperText={errors.cantidad}
            />

            <TextField
              label="Recorrido (km)"
              name="recorrido"
              value={form.recorrido}
              onChange={handleChange}
              error={!!errors.recorrido}
              helperText={errors.recorrido}
            />

            <TextField
              label="Fecha última revisión"
              type="date"
              name="ultimaRevision"
              value={form.ultimaRevision}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              error={!!errors.ultimaRevision}
              helperText={errors.ultimaRevision}
            />

            <TextField
              label="Horas de operación por día"
              name="horasOperacion"
              value={form.horasOperacion}
              onChange={handleChange}
              error={!!errors.horasOperacion}
              helperText={errors.horasOperacion}
            />

            <Button variant="contained" color="error" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSubmit}>
              Guardar
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Mantenimiento;
