import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  MenuItem,
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

  // ✅ Estado para mostrar cantidad de registros
  const [pageSize, setPageSize] = useState(10); // Por defecto: 10 registros
  const pageSizeOptions = [5, 10, 20, 50, "Todos"];

  // Cargar datos al iniciar
  useEffect(() => {
    fetchMaquinarias();
  }, []);

  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  const fetchMaquinarias = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
      if (!response.ok) throw new Error("Error al cargar las máquinas");
      const data = await response.json();
      setMaquinarias(data);
    } catch (error) {
      alert("No se pudieron cargar las máquinas.");
      console.error("Error al cargar maquinaria:", error.message);
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
    setForm({
      detalle: "",
      placa: "",
      unidad: "",
      tipo: "",
      marca: "",
      modelo: "",
    });
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
        ? `http://localhost:8000/api/maquinaria/${editingId}/`
        : "http://localhost:8000/api/maquinaria/";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Error al guardar");

      fetchMaquinarias();
      handleClose();
    } catch (error) {
      alert("Ocurrió un error al guardar los datos.");
      console.error("Error al guardar:", error.message);
    }
  };

  const handleDelete = async (_id) => {
    const url = `http://localhost:8000/api/maquinaria/${_id}/`;
    if (!_id || !isValidObjectId(_id)) {
      alert("ID inválido");
      console.error("ID no válido:", _id);
      return;
    }

    try {
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar");
      fetchMaquinarias();
    } catch (error) {
      alert("No se pudo eliminar la máquina.");
      console.error("Error al eliminar:", error.message);
    }
  };

  const handleEdit = (m) => {
    const _id = m._id?.$oid || m._id;
    setForm(m);
    setEditingId(_id);
    setOpenModal(true);
    setErrors({});
  };

  // ✅ Función para obtener los datos según el tamaño de página
  const getDisplayedData = () => {
    if (pageSize === "Todos") return maquinarias;
    const limit = parseInt(pageSize, 10);
    return maquinarias.slice(0, limit);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Título y botón nuevo */}
      <Box sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
        flexWrap: "wrap",
      }}>
        <Typography variant="h5" fontWeight={600}>
          Maquinaria
        </Typography>

        {/* Menú desplegable para seleccionar tamaño de página */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            select
            label="Mostrar"
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value)}
            size="small"
            sx={{ width: 120 }}
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option === "Todos" ? "Todos" : `${option} registros`}
              </MenuItem>
            ))}
          </TextField>

          <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleOpen}>
            Nuevo
          </Button>
        </Box>
      </Box>

      {/* Tabla */}
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
          {/* ✅ Mostrar solo los registros según el tamaño de página */}
          {getDisplayedData().map((m, index) => {
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
                    onClick={() => handleEdit(m)}
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

      {/* Modal */}
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