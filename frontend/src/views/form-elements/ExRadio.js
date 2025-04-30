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

const Seguros = () => {
  const [seguros, setSeguros] = useState([]);
  const [maquinarias, setMaquinarias] = useState([]);
  const [form, setForm] = useState({
    maquinaria: "",
    aporte: "",
  });
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSeguros();
    fetchMaquinarias();
  }, []);

  const fetchSeguros = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/seguros/");
      if (!response.ok) throw new Error("Error al cargar los seguros");
      const data = await response.json();
      setSeguros(data);
    } catch (error) {
      console.error("Error:", error.message);
      alert("No se pudieron cargar los seguros. Verifica la conexión con el backend.");
    }
  };

  const fetchMaquinarias = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
      if (!response.ok) throw new Error("Error al cargar las maquinarias");
      const data = await response.json();
      setMaquinarias(data);
    } catch (error) {
      console.error("Error:", error.message);
      alert("No se pudieron cargar las maquinarias. Verifica la conexión con el backend.");
    }
  };

  const handleOpen = () => {
    setForm({
      maquinaria: "",
      aporte: "",
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
    if (!form.maquinaria) newErrors.maquinaria = "Seleccione una maquinaria.";
    if (!form.aporte || isNaN(form.aporte) || parseFloat(form.aporte) <= 0)
      newErrors.aporte = "El aporte debe ser un número mayor que cero.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        maquinaria: Number(form.maquinaria), // Asegurar que se mande como número
        aporte: parseFloat(form.aporte),
      };

      if (editingId) {
        await fetch(`http://localhost:8000/api/seguros/${editingId}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("http://localhost:8000/api/seguros/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      handleClose();
      fetchSeguros(); // Recargar datos después de guardar
    } catch (error) {
      console.error("Error al guardar los datos:", error);
      alert("Ocurrió un error al guardar los datos.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/seguros/${id}/`, { method: "DELETE" });
      fetchSeguros(); // Recargar datos después de eliminar
    } catch (error) {
      console.error("Error al eliminar el seguro:", error);
      alert("Ocurrió un error al eliminar el seguro.");
    }
  };

  const handleEdit = (item) => {
    setForm({
      maquinaria: item.maquinaria.id || item.maquinaria, // Usar el ID de la maquinaria
      aporte: item.aporte.toString(),
    });
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
          Seguros
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
            <TableCell><Typography fontWeight={600}>Aporte</Typography></TableCell>
            <TableCell align="right"><Typography fontWeight={600}>Acciones</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {seguros.map((s, index) => (
            <TableRow key={s.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{s.maquinaria_detalle || "N/A"}</TableCell>
              <TableCell>{`Bs. ${parseFloat(s.aporte).toFixed(2)}`}</TableCell>
              <TableCell align="right">
                <Button size="small" variant="outlined" color="secondary" onClick={() => handleEdit(s)}>
                  Editar
                </Button>
                <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(s.id)}>
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
            {editingId ? "Editar" : "Agregar"} Seguro
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
              <MenuItem value="" disabled>
                Seleccione una maquinaria
              </MenuItem>
              {maquinarias.map((maq) => (
                <MenuItem key={maq.id} value={maq.id}>
                  {maq.detalle}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Aporte"
              type="number"
              name="aporte"
              value={form.aporte}
              onChange={handleChange}
              error={!!errors.aporte}
              helperText={errors.aporte}
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

export default Seguros;