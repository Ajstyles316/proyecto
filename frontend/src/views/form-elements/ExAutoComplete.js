import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

const Control = () => {
  const [openModal, setOpenModal] = useState(false);
  const [controlData, setControlData] = useState([]);
  const [editingId, setEditingId] = useState(null); // Para edición
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    estado: "",
    ubicacion: "",
    gerente: "",
    encargado: "",
    fecha: "",
    observaciones: "",
  });
  const [errors, setErrors] = useState({});

  // Cargar datos desde el backend
  useEffect(() => {
    fetchControlData();
  }, []);

  const fetchControlData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/control/");
      if (!response.ok) throw new Error("Error al cargar los datos");
      const data = await response.json();
      const formateddata = data.map(item => ({
        ...item,
        fecha: item.fecha?.split("T")[0] || item.fecha, // Si es ISO, quita la hora
      }));
      setControlData(formateddata);
    } catch (error) {
      console.error("Error:", error.message);
      alert("No se pudieron cargar los datos. Verifica la conexión con el backend.");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.estado.trim()) newErrors.estado = "El estado es obligatorio.";
    if (!form.ubicacion.trim()) newErrors.ubicacion = "La ubicación es obligatoria.";
    if (!form.gerente.trim()) newErrors.gerente = "El gerente es obligatorio.";
    if (!form.encargado.trim()) newErrors.encargado = "El encargado es obligatorio.";
    if (!form.fecha.trim()) newErrors.fecha = "La fecha es obligatoria.";
    if (!form.observaciones.trim())
      newErrors.observaciones = "Las observaciones son obligatorias.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `http://localhost:8000/api/control/${editingId}/`
        : "http://localhost:8000/api/control/";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Error al guardar");
      handleCloseModal();
      fetchControlData(); // Recargar datos
      
    } catch (error) {
      console.error("Error al guardar:", error.message);
      alert("Ocurrió un error al guardar.");
    }
  };

  const handleEdit = (item) => {
    const _id = item._id?.$oid || item._id; // Asegúrate de usar el ID correcto
    setForm({
      estado: item.estado || "",
      ubicacion: item.ubicacion || "",
      gerente: item.gerente || "",
      encargado: item.encargado || "",
      fecha: item.fecha || "",
      observaciones: item.observaciones || "",
    });
    setEditingId(_id);
    setOpenModal(true);
    setErrors({});
  };

  const handleDelete = async (_id) => {
    const id = _id?.$oid || _id;
    if (!id || id.toString().trim().length !== 24) {
      alert("ID inválido");
      console.error("ID inválido:", id);
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/control/${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar");

      fetchControlData(); // Recargar datos
    } catch (error) {
      console.error("Error al eliminar:", error.message);
      alert("Ocurrió un error al eliminar.");
    }
  };

  const handleOpenNew = () => {
    setForm({
      estado: "",
      ubicacion: "",
      gerente: "",
      encargado: "",
      fecha: "",
      observaciones: "",
    });
    setEditingId(null);
    setOpenModal(true);
    setErrors({});
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setForm({
      estado: "",
      ubicacion: "",
      gerente: "",
      encargado: "",
      fecha: "",
      observaciones: "",
    });
    setEditingId(null);
    setErrors({});
  };

  const filteredData = controlData.filter((row) =>
    row.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Título y botón nuevo */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Control</Typography>
        <Button variant="contained" color="success" onClick={handleOpenNew}>
          + Nuevo
        </Button>
      </Box>

      {/* Campo de búsqueda */}
      <TextField
        label="Buscar por ubicación"
        fullWidth
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Tabla */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontSize: "16px" }}>N°</TableCell>
            <TableCell sx={{ fontSize: "16px" }}>Unidad</TableCell>
            <TableCell sx={{ fontSize: "16px" }}>Encargado</TableCell>
            <TableCell sx={{ fontSize: "16px" }}>Estado</TableCell>
            <TableCell sx={{ fontSize: "16px" }}>Observación</TableCell>
            <TableCell sx={{ fontSize: "16px" }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map((row, index) => {
            const _id = row._id?.$oid || row._id || index.toString();

            return (
              <TableRow key={_id}>
                <TableCell sx={{ fontSize: "15px" }}>{index + 1}</TableCell>
                <TableCell sx={{ fontSize: "15px" }}>{row.ubicacion}</TableCell>
                <TableCell sx={{ fontSize: "15px" }}>{row.encargado}</TableCell>
                <TableCell sx={{ fontSize: "15px" }}>{row.estado}</TableCell>
                <TableCell sx={{ fontSize: "15px" }}>{row.observaciones}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleEdit(row)}
                  >
                    Editar
                  </Button>{" "}
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

      {/* Modal para crear/editar */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ textAlign: "left", fontSize: 18, fontWeight: "bold", pl: 2, pt: 2 }}
        >
          {editingId ? "Editar Control" : "Agregar Control"}
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 1 }}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <TextField
                fullWidth
                name="estado"
                placeholder="Estado"
                value={form.estado}
                onChange={handleChange}
                variant="outlined"
                size="small"
                error={!!errors.estado}
                helperText={errors.estado}
                InputProps={{
                  sx: {
                    bgcolor: "#fff",
                    borderRadius: "4px",
                  },
                }}
              />
            </Grid>
            <Grid item>
              <TextField
                fullWidth
                name="ubicacion"
                placeholder="Ubicación"
                value={form.ubicacion}
                onChange={handleChange}
                variant="outlined"
                size="small"
                error={!!errors.ubicacion}
                helperText={errors.ubicacion}
                InputProps={{
                  sx: {
                    bgcolor: "#fff",
                    borderRadius: "4px",
                  },
                }}
              />
            </Grid>
            <Grid item>
              <TextField
                fullWidth
                name="gerente"
                placeholder="Gerente"
                value={form.gerente}
                onChange={handleChange}
                variant="outlined"
                size="small"
                error={!!errors.gerente}
                helperText={errors.gerente}
                InputProps={{
                  sx: {
                    bgcolor: "#fff",
                    borderRadius: "4px",
                  },
                }}
              />
            </Grid>
            <Grid item>
              <TextField
                fullWidth
                name="encargado"
                placeholder="Encargado"
                value={form.encargado}
                onChange={handleChange}
                variant="outlined"
                size="small"
                error={!!errors.encargado}
                helperText={errors.encargado}
                InputProps={{
                  sx: {
                    bgcolor: "#fff",
                    borderRadius: "4px",
                  },
                }}
              />
            </Grid>
            <Grid item>
              <TextField
                fullWidth
                name="fecha"
                type="date"
                value={form.fecha}
                onChange={handleChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                error={!!errors.fecha}
                helperText={errors.fecha}
                sx={{ bgcolor: "#fff", borderRadius: "4px" }}
              />
            </Grid>
            <Grid item>
              <TextField
                fullWidth
                name="observaciones"
                placeholder="Observaciones"
                multiline
                rows={4}
                value={form.observaciones}
                onChange={handleChange}
                variant="outlined"
                error={!!errors.observaciones}
                helperText={errors.observaciones}
                InputProps={{
                  sx: {
                    bgcolor: "#fff",
                    borderRadius: "4px",
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            pb: 2,
          }}
        >
          <Button fullWidth onClick={handleCloseModal} variant="contained" color="error">
            Cancelar
          </Button>
          <Button fullWidth onClick={handleSave} variant="contained" color="secondary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Control;