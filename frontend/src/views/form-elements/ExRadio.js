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

  // Busca el nombre de la máquina
  const getMaquinariaNombre = (maqId) => {
    const maq = maquinarias.find(m => m._id?.$oid === maqId || m._id === maqId);
    return maq?.detalle || "Desconocido";
  };

  // Cargar datos
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
      const data = await response.json();
      setMaquinarias(data);
    } catch (error) {
      console.error("Error cargando maquinarias:", error.message);
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
    if (!form.maquinaria.trim()) newErrors.maquinaria = "Seleccione una maquinaria.";
    if (!form.aporte.trim() || isNaN(parseFloat(form.aporte)) || parseFloat(form.aporte) <= 0) {
      newErrors.aporte = "El aporte debe ser un número mayor que cero.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      maquinaria_id: form.maquinaria,
      aporte: parseFloat(form.aporte),
    };

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `http://localhost:8000/api/seguros/${editingId}/`
        : "http://localhost:8000/api/seguros/";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error al guardar");

      fetchSeguros();
      handleClose();
    } catch (error) {
      alert("Ocurrió un error al guardar.");
      console.error("Error al guardar:", error.message);
    }
  };

  const handleEdit = (item) => {
    const _id = item._id?.$oid || item._id;
    setForm({
      maquinaria: item.maquinaria_id?.$oid || item.maquinaria_id || item.maquinaria,
      aporte: item.aporte?.toString() || "",
    });
    setEditingId(_id);
    setOpenModal(true);
    setErrors({});
  };

  const handleDelete = async (_id) => {
    const id = _id?.$oid || _id;
    if (!id) return alert("ID inválido");

    try {
      const response = await fetch(`http://localhost:8000/api/seguros/${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar");

      fetchSeguros();
    } catch (error) {
      alert("No se pudo eliminar el seguro");
      console.error("Error al eliminar:", error.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
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
            <TableCell>
              <Typography fontWeight={600}>N°</Typography>
            </TableCell>
            <TableCell>
              <Typography fontWeight={600}>Maquinaria</Typography>
            </TableCell>
            <TableCell>
              <Typography fontWeight={600}>Aporte</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography fontWeight={600}>Acciones</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {seguros.map((s, index) => {
            const _id = s._id?.$oid || s._id || index.toString();
            return (
              <TableRow key={_id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{getMaquinariaNombre(s.maquinaria_id || s.maquinaria)}</TableCell>
                <TableCell>{`Bs. ${parseFloat(s.aporte).toFixed(2)}`}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" color="secondary" onClick={() => handleEdit(s)}>
                    Editar
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(_id)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
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
            {editingId ? "Editar Seguro" : "Agregar Seguro"}
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
              {maquinarias.map((maq) => {
                const _id = maq._id?.$oid || maq._id;
                return (
                  <MenuItem key={_id} value={_id}>
                    {maq.detalle}
                  </MenuItem>
                );
              })}
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