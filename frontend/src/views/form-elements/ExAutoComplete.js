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
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";

const Control = () => {
  const [openModal, setOpenModal] = useState(false);
  const [controlData, setControlData] = useState([]);
  const [maquinarias, setMaquinarias] = useState([]); // Nuevo estado para maquinarias
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    maquinaria_id: "",
    estado: "",
    ubicacion: "",
    gerente: "",
    encargado: "",
    fecha: "",
    observaciones: "",
  });
  const [errors, setErrors] = useState({});
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Datos únicos para selects
  const [uniqueUbicaciones, setUniqueUbicaciones] = useState([]);
  const [uniqueGerentes, setUniqueGerentes] = useState([]);
  const [uniqueEncargados, setUniqueEncargados] = useState([]);

  // Cargar datos desde el backend
  useEffect(() => {
    fetchControlData();
    fetchMaquinarias(); // Cargar maquinarias al iniciar
  }, []);

  // Función para obtener el nombre del detalle de la maquinaria
  const getMaquinariaDetalle = (maqId) => {
    const maq = maquinarias.find(m => 
      m._id?.$oid === maqId || m._id === maqId
    );
    return maq?.detalle || "Desconocido";
  };

  const fetchMaquinarias = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
      if (!response.ok) throw new Error("Error al cargar maquinarias");
      const data = await response.json();
      setMaquinarias(data);
    } catch (error) {
      console.error("Error al cargar maquinarias:", error.message);
    }
  };

  const fetchControlData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/control/");
      if (!response.ok) throw new Error("Error al cargar los datos");
      const data = await response.json();
      const formateddata = data.map(item => ({
        ...item,
        fecha: item.fecha?.split("T")[0] || item.fecha,
      }));
      setControlData(formateddata);
    } catch (error) {
      console.error("Error:", error.message);
      alert("No se pudieron cargar los datos. Verifica la conexión con el backend.");
    }
  };

  // Manejo de paginación
  const filteredData = controlData.filter((row) =>
    row.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalPages = () => {
    if (rowsPerPage === "all") return 1;
    return Math.ceil(filteredData.length / rowsPerPage);
  };

  const getDisplayedData = () => {
    if (rowsPerPage === "all") return filteredData;
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  };

  const paginatedData = getDisplayedData();

  // Extraer opciones únicas para selects
  useEffect(() => {
    if (controlData.length > 0) {
      setUniqueUbicaciones([...new Set(controlData.map(item => item.ubicacion))].filter(Boolean));
      setUniqueGerentes([...new Set(controlData.map(item => item.gerente))].filter(Boolean));
      setUniqueEncargados([...new Set(controlData.map(item => item.encargado))].filter(Boolean));
    }
  }, [controlData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.maquinaria_id) newErrors.maquinaria_id = "La maquinaria es obligatoria.";
    if (!form.estado) newErrors.estado = "El estado es obligatorio.";
    if (!form.ubicacion) newErrors.ubicacion = "La ubicación es obligatoria.";
    if (!form.gerente) newErrors.gerente = "El gerente es obligatorio.";
    if (!form.encargado) newErrors.encargado = "El encargado es obligatorio.";
    if (!form.fecha) newErrors.fecha = "La fecha es obligatoria.";
    if (!form.observaciones) newErrors.observaciones = "Las observaciones son obligatorias.";
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
      
      // Mantener formato original pero enviar maquinaria_id como cadena
      const payload = {
        ...form,
        maquinaria_id: form.maquinaria_id,
      };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error("Error al guardar");
      
      handleCloseModal();
      fetchControlData();
    } catch (error) {
      console.error("Error al guardar:", error.message);
      alert("Ocurrió un error al guardar.");
    }
  };

  const handleEdit = (item) => {
    const _id = item._id?.$oid || item._id;
    setForm({
      maquinaria_id: item.maquinaria_id?.$oid || item.maquinaria_id || "",
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
    if (!id || id.toString().length !== 24) {
      alert("ID inválido");
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/control/${id}/`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Error al eliminar");
      
      fetchControlData();
    } catch (error) {
      console.error("Error al eliminar:", error.message);
      alert("Ocurrió un error al eliminar.");
    }
  };

  const handleOpenNew = () => {
    setForm({
      maquinaria_id: "",
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
      maquinaria_id: "",
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

  const handleChangeRowsPerPage = (e) => {
    const value = e.target.value;
    setRowsPerPage(value === 'all' ? 'all' : parseInt(value, 10));
    setCurrentPage(1);
  };

  const handlePageChange = (direction) => {
    setCurrentPage(prev => {
      const newPage = direction === 'next' 
        ? Math.min(prev + 1, getTotalPages()) 
        : Math.max(prev - 1, 1);
      return newPage;
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Título y botón nuevo */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Control</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Buscar por ubicación"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <TextField
            select
            size="small"
            value={rowsPerPage}
            onChange={handleChangeRowsPerPage}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value={5}>5 registros</MenuItem>
            <MenuItem value={10}>10 registros</MenuItem>
            <MenuItem value={15}>15 registros</MenuItem>
            <MenuItem value={20}>20 registros</MenuItem>
            <MenuItem value="all">Todos</MenuItem>
          </TextField>
          <Button variant="contained" color="success" onClick={handleOpenNew}>
            + Nuevo
          </Button>
        </Box>
      </Box>
      
      {/* Tabla */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontSize: "16px" }}>N°</TableCell>
            <TableCell sx={{ fontSize: "16px" }}>Maquinaria</TableCell>
            <TableCell sx={{ fontSize: "16px" }}>Unidad</TableCell>
            <TableCell sx={{ fontSize: "16px" }}>Encargado</TableCell>
            <TableCell sx={{ fontSize: "16px" }}>Estado</TableCell>
            <TableCell sx={{ fontSize: "16px" }}>Fecha</TableCell>
            <TableCell sx={{ fontSize: "16px" }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.map((row, index) => {
            const globalIndex = rowsPerPage === "all" ? index : (currentPage - 1) * rowsPerPage + index;
            const _id = row._id?.$oid || row._id || index.toString();
            return (
              <TableRow key={_id}>
                <TableCell sx={{ fontSize: "15px" }}>{globalIndex + 1}</TableCell>
                <TableCell sx={{ fontSize: "15px" }}>{getMaquinariaDetalle(row.maquinaria_id?.$oid || row.maquinaria_id)}</TableCell>
                <TableCell sx={{ fontSize: "15px" }}>{row.ubicacion}</TableCell>
                <TableCell sx={{ fontSize: "15px" }}>{row.encargado}</TableCell>
                <TableCell sx={{ fontSize: "15px" }}>{row.estado}</TableCell>
                <TableCell sx={{ fontSize: "15px" }}>{row.fecha}</TableCell>
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

      {/* Controles de paginación */}
      <Box display="flex" justifyContent="center" mt={2} gap={2}>
        <Button
          variant="outlined"
          disabled={currentPage === 1 || rowsPerPage === "all"}
          onClick={() => handlePageChange('prev')}
        >
          Anterior
        </Button>
        <Typography sx={{ alignSelf: "center" }}>Página {currentPage}</Typography>
        <Button
          variant="outlined"
          color="warning"
          disabled={currentPage === getTotalPages() || rowsPerPage === "all"}
          onClick={() => handlePageChange('next')}
        >
          Siguiente
        </Button>
      </Box>

      {/* Modal para crear/editar */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ textAlign: "left", fontSize: 18, fontWeight: "bold", pl: 2, pt: 2 }}
        >
          {editingId ? "Editar Control" : "Agregar Control"}
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 1 }}>
          <Grid container direction="column" spacing={2}>
            {/* Maquinaria */}
            <Grid item>
              <FormControl fullWidth error={!!errors.maquinaria_id}>
                <InputLabel>Maquinaria</InputLabel>
                <Select
                  name="maquinaria_id"
                  value={form.maquinaria_id}
                  onChange={handleChange}
                  label="Maquinaria"
                  size="small"
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: "4px",
                  }}
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
                </Select>
                {errors.maquinaria_id && (
                  <Typography color="error" variant="caption">
                    {errors.maquinaria_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Estado */}
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

            {/* Ubicación */}
            <Grid item>
              <FormControl fullWidth error={!!errors.ubicacion}>
                <InputLabel>Ubicación</InputLabel>
                <Select
                  name="ubicacion"
                  value={form.ubicacion}
                  onChange={handleChange}
                  label="Ubicación"
                  size="small"
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: "4px",
                  }}
                >
                  <MenuItem value="" disabled>
                    Seleccione una ubicación
                  </MenuItem>
                  {uniqueUbicaciones.map((option, index) => (
                    <MenuItem key={index} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.ubicacion && (
                  <Typography color="error" variant="caption">
                    {errors.ubicacion}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Gerente */}
            <Grid item>
              <FormControl fullWidth error={!!errors.gerente}>
                <InputLabel>Gerente</InputLabel>
                <Select
                  name="gerente"
                  value={form.gerente}
                  onChange={handleChange}
                  label="Gerente"
                  size="small"
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: "4px",
                  }}
                >
                  <MenuItem value="" disabled>
                    Seleccione un gerente
                  </MenuItem>
                  {uniqueGerentes.map((option, index) => (
                    <MenuItem key={index} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.gerente && (
                  <Typography color="error" variant="caption">
                    {errors.gerente}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Encargado */}
            <Grid item>
              <FormControl fullWidth error={!!errors.encargado}>
                <InputLabel>Encargado</InputLabel>
                <Select
                  name="encargado"
                  value={form.encargado}
                  onChange={handleChange}
                  label="Encargado"
                  size="small"
                  sx={{
                    bgcolor: "#fff",
                    borderRadius: "4px",
                  }}
                >
                  <MenuItem value="" disabled>
                    Seleccione un encargado
                  </MenuItem>
                  {uniqueEncargados.map((option, index) => (
                    <MenuItem key={index} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {errors.encargado && (
                  <Typography color="error" variant="caption">
                    {errors.encargado}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Fecha */}
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

            {/* Observaciones */}
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