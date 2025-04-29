import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  Button,
  Modal,
  TextField,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const AssignmentTable = () => {
  const [assignments, setAssignments] = useState([]);
  const [maquinarias, setMaquinarias] = useState([]);
  const [controles, setControles] = useState([]);
  const [form, setForm] = useState({
    maquinaria: "",
    fechaAsignacion: new Date().toISOString().split("T")[0],
    gestion: "",
    encargado: "",
  });
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAssignments();
    fetchMaquinarias();
    fetchControles();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/asignacion/");
      if (!response.ok) throw new Error("Error al cargar las asignaciones");
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error("Error:", error.message);
      alert("No se pudieron cargar las asignaciones. Verifica la conexión con el backend.");
    }
  };

  const fetchMaquinarias = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
      const data = await response.json();
      setMaquinarias(data);
    } catch (error) {
      console.error("Error cargando maquinarias:", error.message);
    }
  };

  const fetchControles = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/control/");
      const data = await response.json();
      setControles(data);
    } catch (error) {
      console.error("Error cargando controles:", error.message);
    }
  };

  const handleOpen = () => {
    setForm({
      maquinaria: "",
      fechaAsignacion: new Date().toISOString().split("T")[0],
      gestion: "",
      encargado: "",
    });
    setEditingId(null);
    setErrors({});
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.maquinaria) newErrors.maquinaria = "Seleccione una maquinaria";
    if (!form.fechaAsignacion.trim()) newErrors.fechaAsignacion = "Ingrese la fecha de asignación";
    if (!form.gestion.trim()) newErrors.gestion = "Seleccione una gestión";
    if (!form.encargado) newErrors.encargado = "Seleccione un encargado";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        maquinaria: form.maquinaria,
        fechaAsignacion: form.fechaAsignacion,
        gestion: form.gestion,
        encargado: form.encargado,
      };

      if (editingId) {
        await fetch(`http://localhost:8000/api/asignacion/${editingId}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("http://localhost:8000/api/asignacion/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      handleClose();
      fetchAssignments(); // Recargar datos después de guardar
    } catch (error) {
      console.error("Error al guardar los datos:", error);
      alert("Ocurrió un error al guardar los datos.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/asignacion/${id}/`, { method: "DELETE" });
      fetchAssignments(); // Recargar datos después de eliminar
    } catch (error) {
      console.error("Error al eliminar la asignación:", error);
      alert("Ocurrió un error al eliminar la asignación.");
    }
  };

  const handleEdit = (item) => {
    setForm({
      maquinaria: item.maquinaria.id,
      fechaAsignacion: item.fechaAsignacion,
      gestion: item.gestion,
      encargado: item.encargado.id,
    });
    setEditingId(item.id);
    setOpenModal(true);
    setErrors({});
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Asignación
        </Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleOpen}>
          Nuevo
        </Button>
      </Box>

      <Table aria-label="simple table" sx={{ whiteSpace: "nowrap" }}>
        <TableHead>
          <TableRow>
            <TableCell><Typography fontWeight={600}>N°</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Maquinaria</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Encargado</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Fecha Asignación</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Gestión</Typography></TableCell>
            <TableCell align="right"><Typography fontWeight={600}>Acciones</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assignments.map((a, index) => (
            <TableRow key={a.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{a.maquinaria_detalle || "N/A"}</TableCell>
              <TableCell>{a.encargado_nombre || "N/A"}</TableCell>
              <TableCell>{new Date(a.fechaAsignacion).toLocaleDateString()}</TableCell>
              <TableCell>{a.gestion}</TableCell>
              <TableCell align="right">
                <Button size="small" variant="outlined" color="secondary" onClick={() => handleEdit(a)}>
                  Editar
                </Button>
                <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(a.id)}>
                  Eliminar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal open={openModal} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" mb={2}>
            {editingId ? "Editar Asignación" : "Agregar Asignación"}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              label="Maquinaria"
              name="maquinaria"
              value={form.maquinaria}
              onChange={handleChange}
              error={!!errors.maquinaria}
              helperText={errors.maquinaria}
            >
              {maquinarias.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.detalle}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              label="Fecha Asignación"
              name="fechaAsignacion"
              value={form.fechaAsignacion}
              onChange={handleChange}
              error={!!errors.fechaAsignacion}
              helperText={errors.fechaAsignacion}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Gestión"
              name="gestion"
              value={form.gestion}
              onChange={handleChange}
              error={!!errors.gestion}
              helperText={errors.gestion}
            >
              <MenuItem value="CUSTODIA">CUSTODIA</MenuItem>
              <MenuItem value="UPCM">UPCM</MenuItem>
              {/* Puedes agregar más gestiones aquí si quieres */}
            </TextField>

            <TextField
              select
              label="Encargado"
              name="encargado"
              value={form.encargado}
              onChange={handleChange}
              error={!!errors.encargado}
              helperText={errors.encargado}
            >
              {controles.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.encargado}
                </MenuItem>
              ))}
            </TextField>

            <Button variant="contained" color="error" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="contained" color="secondary" onClick={handleSubmit}>
              {editingId ? "Actualizar" : "Guardar"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default AssignmentTable;
