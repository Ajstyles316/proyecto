import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const detalles = [
  "ACOPLE DE TRAILER",
  "AMBULANCIA",
  "AUTOMOVIL",
  // ... (otros detalles)
];

const ITVTable = () => {
  const [itvs, setItvs] = useState([]);
  const [form, setForm] = useState({
    maquinaria: "",
    detalle: "",
  });
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchItvs();
  }, []);

  const fetchItvs = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/itv/");
      if (!response.ok) throw new Error("Error al cargar los registros de ITV");
      const data = await response.json();
      setItvs(data);
    } catch (error) {
      console.error("Error:", error.message);
      alert("No se pudieron cargar los registros de ITV. Verifica la conexión con el backend.");
    }
  };

  const handleOpen = () => {
    setForm({
      maquinaria: "",
      detalle: "",
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
    if (!form.maquinaria.trim()) newErrors.maquinaria = "Seleccione una maquinaria";
    if (!form.detalle.trim()) newErrors.detalle = "Ingrese el detalle";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingId) {
        await fetch(`http://localhost:8000/api/itv/${editingId}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("http://localhost:8000/api/itv/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      handleClose();
      fetchItvs(); // Recargar datos después de guardar
    } catch (error) {
      console.error("Error al guardar los datos:", error);
      alert("Ocurrió un error al guardar los datos.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/itv/${id}/`, { method: "DELETE" });
      fetchItvs(); // Recargar datos después de eliminar
    } catch (error) {
      console.error("Error al eliminar el registro de ITV:", error);
      alert("Ocurrió un error al eliminar el registro de ITV.");
    }
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditingId(item.id);
    setOpenModal(true);
    setErrors({});
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Título e Icono Nuevo */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          ITV
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
            <TableCell><Typography fontWeight={600}>Detalle</Typography></TableCell>
            <TableCell align="right"><Typography fontWeight={600}>Acciones</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {itvs.map((itv, index) => (
            <TableRow key={itv.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{itv.maquinaria}</TableCell>
              <TableCell>{itv.detalle}</TableCell>
              <TableCell align="right">
                <Button size="small" variant="outlined" color="secondary" onClick={() => handleEdit(itv)}>
                  Editar
                </Button>
                <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(itv.id)}>
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
            {editingId ? "Editar" : "Agregar"} ITV
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
              {detalles.map((detalle) => (
                <MenuItem key={detalle} value={detalle}>
                  {detalle}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Detalle"
              name="detalle"
              value={form.detalle}
              onChange={handleChange}
              error={!!errors.detalle}
              helperText={errors.detalle}
            />

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

export default ITVTable;