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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const Maquinaria = () => {
  const [maquinarias, setMaquinarias] = useState([]);
  const [form, setForm] = useState({
    detalle: "",
    placa: "",
    unidad: "",
    tipo: "",
    marca: "",
    modelo: "",
  });
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  const añoActual = new Date().getFullYear();

  // Cargar datos al iniciar
  useEffect(() => {
    fetchMaquinarias();
  }, []);

  function isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
  
  const fetchMaquinarias = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
      if (!response.ok) throw new Error("Error al cargar las máquinas");
      const data = await response.json();
      setMaquinarias(data);
    } catch (error) {
      alert("No se pudieron cargar las máquinas.");
    }
  };

  const handleOpen = () => {
    setForm({
      detalle: "",
      placa: "",
      unidad: "",
      tipo: "",
      marca: "",
      modelo: "",
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
    if (!form.detalle.trim()) newErrors.detalle = "El detalle es obligatorio";
    if (!form.placa.trim()) newErrors.placa = "La placa es obligatoria";
    if (!form.unidad.trim()) newErrors.unidad = "La unidad es obligatoria";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `http://localhost:8000/api/maquinaria/${editingId}`
        : "http://localhost:8000/api/maquinaria/";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Error al guardar");

      handleClose();
      fetchMaquinarias();
    } catch (error) {
      alert("Ocurrió un error al guardar los datos.");
    }
  };

  const handleDelete = async (_id) => {
    
    // Validación del ID
    if (!_id || !isValidObjectId(_id)) {
      alert("ID inválido");
      console.error("ID no válido:", _id);
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${_id}`, {
        method: "DELETE",
      });
  
      if (!response.ok) throw new Error("Error al eliminar");
  
      fetchMaquinarias();
    } catch (error) {
      console.error("Error al eliminar:", error.message);
      alert("No se pudo eliminar la máquina.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Maquinaria
        </Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleOpen}>
          Nuevo
        </Button>
      </Box>

      <Table aria-label="simple table" sx={{ whiteSpace: "nowrap" }}>
        <TableHead>
          <TableRow>
            <TableCell><Typography fontWeight={600}>N°</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Detalle</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Placa</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Unidad</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Tipo</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Marca</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Modelo</Typography></TableCell>
            <TableCell align="right"><Typography fontWeight={600}>Acciones</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {maquinarias.map((m, index) => {
            const _id = m._id?.$oid || m._id || index.toString();
            return (
              <TableRow key={_id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{m.detalle}</TableCell>
                <TableCell>{m.placa}</TableCell>
                <TableCell>{m.unidad}</TableCell>
                <TableCell>{m.tipo}</TableCell>
                <TableCell>{m.marca}</TableCell>
                <TableCell>{m.modelo}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      setForm(m);
                      setEditingId(_id);
                      setOpenModal(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(_id)}
                  >
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
            {editingId ? "Editar Vehículo" : "Agregar Vehículo"}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Detalle"
              name="detalle"
              value={form.detalle}
              onChange={handleChange}
              error={!!errors.detalle}
              helperText={errors.detalle}
            />

            <TextField
              label="Placa"
              name="placa"
              value={form.placa}
              onChange={handleChange}
              error={!!errors.placa}
              helperText={errors.placa}
            />

            <TextField
              label="Unidad"
              name="unidad"
              value={form.unidad}
              onChange={handleChange}
              error={!!errors.unidad}
              helperText={errors.unidad}
            />

            <TextField
              label="Tipo"
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              error={!!errors.tipo}
              helperText={errors.tipo}
            />

            <TextField
              label="Marca"
              name="marca"
              value={form.marca}
              onChange={handleChange}
              error={!!errors.marca}
              helperText={errors.marca}
            />

            <TextField
              label="Modelo"
              type="number"
              inputProps={{ min: 1980, max: añoActual }}
              name="modelo"
              value={form.modelo || ""}
              onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              error={!!errors.modelo}
              helperText={errors.modelo}
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

export default Maquinaria;