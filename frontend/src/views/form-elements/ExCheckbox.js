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
  
  // Estados para paginación y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para selects sin duplicados
  const [uniqueMaquinariasList, setUniqueMaquinariasList] = useState([]);
  const [uniqueEncargadosList, setUniqueEncargadosList] = useState([]);
  const [uniqueGestionesList, setUniqueGestionesList] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchAssignments();
    fetchMaquinarias();
    fetchControles();
  }, []);

  // Extraer opciones únicas para selects
  useEffect(() => {
    if (maquinarias.length > 0) {
      const seen = new Set();
      const filtered = maquinarias.filter(maq => {
        const duplicate = seen.has(maq.detalle);
        seen.add(maq.detalle);
        return !duplicate;
      });
      setUniqueMaquinariasList(filtered);
    }
  }, [maquinarias]);

  useEffect(() => {
    if (controles.length > 0) {
      const filtered = controles.map(c => c.encargado).filter(Boolean);
      setUniqueEncargadosList([...new Set(filtered)]);
    }
  }, [controles]);

  useEffect(() => {
    if (assignments.length > 0) {
      const gestiones = assignments.map(a => a.gestion).filter(Boolean);
      setUniqueGestionesList([...new Set(gestiones)]);
    }
  }, [assignments]);

  // Función para obtener nombre de maquinaria
  const getMaquinariaNombre = (maqId) => {
    const maq = maquinarias.find(m => 
      m._id?.$oid === maqId || m._id === maqId
    );
    return maq?.detalle || "Desconocida";
  };

  // Función para obtener nombre de encargado
  const getEncargadoNombre = (encId) => {
    const enc = controles.find(c => 
      c._id?.$oid === encId || c._id === encId
    );
    return enc?.encargado || "Desconocido";
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/asignacion/");
      if (!response.ok) throw new Error("Error al cargar las asignaciones");
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error("Error:", error.message);
      alert("No se pudieron cargar las asignaciones.");
    }
  };

  const fetchMaquinarias = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
      const data = await response.json();
      setMaquinarias(data);
    } catch (error) {
      console.error("Error al cargar máquinas:", error.message);
    }
  };

  const fetchControles = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/control/");
      const data = await response.json();
      setControles(data);
    } catch (error) {
      console.error("Error al cargar controles:", error.message);
    }
  };

  // Calcular total de páginas
  const getTotalPages = () => {
    return Math.ceil(assignments.length / rowsPerPage);
  };

  // Manejar cambio de página
  const handlePageChange = (direction) => {
    if (direction === 'prev') {
      setCurrentPage(prev => Math.max(prev - 1, 1));
    } else if (direction === 'next') {
      setCurrentPage(prev => Math.min(prev + 1, getTotalPages()));
    }
  };

  // Manejar cambio de registros por página
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  // Datos filtrados y paginados
  const filteredAssignments = assignments.filter(a => 
    getMaquinariaNombre(a.maquinaria_id || a.maquinaria).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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
    setForm({
      maquinaria: "",
      fechaAsignacion: new Date().toISOString().split("T")[0],
      gestion: "",
      encargado: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.maquinaria.trim()) newErrors.maquinaria = "Seleccione una maquinaria.";
    if (!form.fechaAsignacion.trim()) newErrors.fechaAsignacion = "Ingrese la fecha de asignación";
    if (!form.gestion.trim()) newErrors.gestion = "Seleccione una gestión";
    if (!form.encargado.trim()) newErrors.encargado = "Seleccione un encargado";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const payload = {
        maquinaria_id: form.maquinaria,
        fechaAsignacion: form.fechaAsignacion,
        gestion: form.gestion,
        encargado_id: form.encargado,
      };
      
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `http://localhost:8000/api/asignacion/${editingId}/`
        : "http://localhost:8000/api/asignacion/";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error al guardar");
      
      fetchAssignments();
      handleClose();
    } catch (error) {
      console.error("Error al guardar:", error.message);
      alert(`Ocurrió un error al guardar: ${error.message}`);
    }
  };

  const handleEdit = (item) => {
    const _id = item._id?.$oid || item._id;
    setForm({
      maquinaria: item.maquinaria_id || item.maquinaria,
      fechaAsignacion: item.fechaAsignacion || "",
      gestion: item.gestion || "",
      encargado: item.encargado_id || item.encargado,
    });
    setEditingId(_id);
    setOpenModal(true);
    setErrors({});
  };

  const handleDelete = async (_id) => {
    const id = _id?.$oid || _id;
    if (!id) return alert("ID inválido");
    
    try {
      const response = await fetch(`http://localhost:8000/api/asignacion/${id}/`, {
        method: "DELETE"
      });
      
      if (!response.ok) throw new Error("Error al eliminar");
      
      fetchAssignments();
    } catch (error) {
      alert("No se pudo eliminar la asignación");
      console.error("Error al eliminar:", error.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Título y controles */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>Asignación</Typography>
        <Box display="flex" gap={2} alignItems="center">
          {/* Campo de búsqueda por maquinaria */}
          <TextField
            label="Buscar por maquinaria"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Selector de registros por página */}
          <TextField
            select
            label="Mostrar"
            size="small"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            sx={{ width: 120 }}
          >
            <MenuItem value={5}>5 registros</MenuItem>
            <MenuItem value={10}>10 registros</MenuItem>
            <MenuItem value={20}>20 registros</MenuItem>
            <MenuItem value={50}>50 registros</MenuItem>
            <MenuItem value={100}>100 registros</MenuItem>
          </TextField>
          <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleOpen}>
            Nuevo
          </Button>
        </Box>
      </Box>

      {/* Tabla con scroll horizontal */}
      <Box sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: "max-content" }}>
          <TableHead>
            <TableRow>
              <TableCell><Typography fontWeight={600}>N°</Typography></TableCell>
              <TableCell><Typography fontWeight={600}>Maquinaria</Typography></TableCell>
              <TableCell><Typography fontWeight={600}>Encargado</Typography></TableCell>
              <TableCell><Typography fontWeight={600}>Fecha</Typography></TableCell>
              <TableCell><Typography fontWeight={600}>Gestión</Typography></TableCell>
              <TableCell align="right"><Typography fontWeight={600}>Acciones</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAssignments.map((a, index) => {
              const globalIndex = (currentPage - 1) * rowsPerPage + index;
              const _id = a._id?.$oid || a._id;
              
              return (
                <TableRow key={_id}>
                  <TableCell>{globalIndex + 1}</TableCell>
                  <TableCell>{getMaquinariaNombre(a.maquinaria_id || a.maquinaria)}</TableCell>
                  <TableCell>{getEncargadoNombre(a.encargado_id || a.encargado)}</TableCell>
                  <TableCell>{a.fechaAsignacion}</TableCell>
                  <TableCell>{a.gestion}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" color="secondary" onClick={() => handleEdit(a)}>
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
      </Box>

      {/* Paginación */}
      <Box display="flex" justifyContent="center" mt={2} gap={2}>
        <Button
          variant="outlined"
          color="warning"
          disabled={currentPage === 1}
          onClick={() => handlePageChange('prev')}
        >
          Anterior
        </Button>
        <Typography sx={{ alignSelf: "center" }}>Página {currentPage}</Typography>
        <Button
          variant="outlined"
          color="warning"
          disabled={currentPage === getTotalPages()}
          onClick={() => handlePageChange('next')}
        >
          Siguiente
        </Button>
      </Box>

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
              <MenuItem value="" disabled>Seleccione una maquinaria</MenuItem>
              {uniqueMaquinariasList.map((maq) => {
                const _id = maq._id?.$oid || maq._id;
                return (
                  <MenuItem key={_id} value={_id}>
                    {maq.detalle}
                  </MenuItem>
                );
              })}
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
              <MenuItem value="" disabled>Seleccione una gestión</MenuItem>
              {uniqueGestionesList.map((gestion, index) => (
                <MenuItem key={index} value={gestion}>
                  {gestion}
                </MenuItem>
              ))}
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
              <MenuItem value="" disabled>Seleccione un encargado</MenuItem>
              {uniqueEncargadosList.map((encargado, index) => (
                <MenuItem key={index} value={encargado}>
                  {encargado}
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