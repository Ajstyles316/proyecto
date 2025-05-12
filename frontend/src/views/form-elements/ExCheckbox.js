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
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para selects sin duplicados
  const [uniqueMaquinarias, setUniqueMaquinarias] = useState([]);
  const [uniqueEncargados, setUniqueEncargados] = useState([]);
  const [uniqueGestiones, setUniqueGestiones] = useState([]);

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
      const filtered = maquinarias.filter(m => {
        const duplicate = seen.has(m.detalle);
        seen.add(m.detalle);
        return !duplicate;
      });
      setUniqueMaquinarias(filtered);
    }
  }, [maquinarias]);

  useEffect(() => {
    if (controles.length > 0) {
      const seen = new Set();
      const filtered = controles.filter(c => {
        const duplicate = seen.has(c.encargado);
        seen.add(c.encargado);
        return !duplicate;
      });
      setUniqueEncargados(filtered);
    }
  }, [controles]);

  useEffect(() => {
    if (assignments.length > 0) {
      const gestiones = [...new Set(assignments.map(a => a.gestion).filter(Boolean))];
      setUniqueGestiones(gestiones);
    }
  }, [assignments]);

  // Cargar asignaciones
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

  // Cargar maquinarias
  const fetchMaquinarias = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
      const data = await response.json();
      setMaquinarias(data);
    } catch (error) {
      console.error("Error al cargar máquinas:", error.message);
    }
  };

  // Cargar controles
  const fetchControles = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/control/");
      const data = await response.json();
      setControles(data);
    } catch (error) {
      console.error("Error al cargar controles:", error.message);
    }
  };

  // Validación del formulario
  const validateForm = () => {
    const newErrors = {};
    if (!form.maquinaria || form.maquinaria.trim() === "") {
      newErrors.maquinaria = "Seleccione una maquinaria";
    }
    if (!form.fechaAsignacion || form.fechaAsignacion.trim() === "") {
      newErrors.fechaAsignacion = "Ingrese la fecha de asignación";
    }
    if (!form.gestion || form.gestion.trim() === "") {
      newErrors.gestion = "Seleccione una gestión";
    }
    if (!form.encargado || form.encargado.trim() === "") {
      newErrors.encargado = "Seleccione un encargado";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Abrir modal
  const handleOpen = () => {
    if (maquinarias.length === 0 || controles.length === 0) {
      alert("Espere a que se carguen todos los datos antes de continuar.");
      return;
    }
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

  // Cerrar modal
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

  // Enviar formulario
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
      }

      fetchAssignments();
      handleClose();
    } catch (error) {
      console.error("Error al guardar:", error.message);
      alert(`Ocurrió un error al guardar: ${error.message}`);
    }
  };

  // Editar registro
  const handleEdit = (item) => {
    const _id = item._id?.$oid || item._id;
    setForm({
      maquinaria: item.maquinaria_id?.$oid || item.maquinaria_id || item.maquinaria || "",
      fechaAsignacion: item.fechaAsignacion || new Date().toISOString().split("T")[0],
      gestion: item.gestion || "",
      encargado: item.encargado_id?.$oid || item.encargado_id || item.encargado || "",
    });
    setEditingId(_id);
    setOpenModal(true);
    setErrors({});
  };

  // Eliminar registro
  const handleDelete = async (_id) => {
    const id = _id?.$oid || _id;
    if (!id) return alert("ID inválido");
    try {
      const response = await fetch(`http://localhost:8000/api/asignacion/${id}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar");
      fetchAssignments();
    } catch (error) {
      alert("No se pudo eliminar la asignación");
      console.error("Error al eliminar:", error.message);
    }
  };

  // Formatear fecha sin ajuste de zona horaria
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    try {
      const [year, month, day] = dateString.split("T")[0].split("-");
      return `${year}-${month}-${day}`;
    } catch (e) {
      return "Fecha inválida";
    }
  };

  // Paginación
  const getTotalPages = () => {
    return rowsPerPage === "all" 
      ? 1 
      : Math.ceil(assignments.length / rowsPerPage);
  };

  const handlePageChange = (direction) => {
    if (direction === 'prev') {
      setCurrentPage(prev => Math.max(prev - 1, 1));
    } else if (direction === 'next') {
      setCurrentPage(prev => Math.min(prev + 1, getTotalPages()));
    }
  };

  const handleRowsPerPageChange = (e) => {
    const value = e.target.value;
    setRowsPerPage(value === "all" ? "all" : parseInt(value, 10));
    setCurrentPage(1);
  };

  // Datos paginados
  const paginatedAssignments = rowsPerPage === "all" 
    ? assignments 
    : assignments.slice(
        (currentPage - 1) * rowsPerPage, 
        currentPage * rowsPerPage
      );

  return (
    <Box sx={{ p: 3 }}>
      {/* Título y controles */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Asignación
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            label="Buscar"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <TextField
            select
            label="Registros"
            size="small"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
          >
            <MenuItem value={5}>5 registros</MenuItem>
            <MenuItem value={10}>10 registros</MenuItem>
            <MenuItem value={20}>20 registros</MenuItem>
            <MenuItem value={50}>50 registros</MenuItem>
            <MenuItem value="all">Todos</MenuItem>
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
            <TableCell><Typography fontWeight={600}>Maquinaria</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Encargado</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Fecha Asignación</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Gestión</Typography></TableCell>
            <TableCell align="right"><Typography fontWeight={600}>Acciones</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedAssignments.map((a, index) => {
            const _id = a._id?.$oid || a._id || index.toString();
            return (
              <TableRow key={_id}>
                <TableCell>{(currentPage - 1) * rowsPerPage + index + 1}</TableCell>
                <TableCell>{getMaquinariaNombre(a.maquinaria_id || a.maquinaria)}</TableCell>
                <TableCell>{getEncargadoNombre(a.encargado_id || a.encargado)}</TableCell>
                <TableCell>{formatDate(a.fechaAsignacion)}</TableCell>
                <TableCell>{a.gestion}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleEdit(a)}
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

      {/* Paginación */}
      <Box display="flex" justifyContent="center" mt={2} gap={2}>
        <Button
          variant="outlined"
          color="warning"
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
            {/* Maquinaria */}
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
              {uniqueMaquinarias.length > 0 ? (
                uniqueMaquinarias.map((maq) => {
                  const _id = maq._id?.$oid || maq._id;
                  return (
                    <MenuItem key={_id} value={_id}>
                      {maq.detalle}
                    </MenuItem>
                  );
                })
              ) : (
                <MenuItem disabled>No hay maquinarias disponibles</MenuItem>
              )}
            </TextField>

            {/* Fecha Asignación */}
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

            {/* Gestión */}
            <TextField
              select
              label="Gestión"
              name="gestion"
              value={form.gestion}
              onChange={handleChange}
              error={!!errors.gestion}
              helperText={errors.gestion}
            >
              <MenuItem value="" disabled>
                Seleccione una gestión
              </MenuItem>
              {uniqueGestiones.length > 0 ? (
                uniqueGestiones.map((gestion, index) => (
                  <MenuItem key={index} value={gestion}>
                    {gestion}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No hay gestiones disponibles</MenuItem>
              )}
            </TextField>

            {/* Encargado */}
            <TextField
              select
              label="Encargado"
              name="encargado"
              value={form.encargado}
              onChange={handleChange}
              error={!!errors.encargado}
              helperText={errors.encargado}
            >
              <MenuItem value="" disabled>
                Seleccione un encargado
              </MenuItem>
              {uniqueEncargados.length > 0 ? (
                uniqueEncargados.map((c) => {
                  const _id = c._id?.$oid || c._id;
                  return (
                    <MenuItem key={_id} value={_id}>
                      {c.encargado}
                    </MenuItem>
                  );
                })
              ) : (
                <MenuItem disabled>No hay encargados disponibles</MenuItem>
              )}
            </TextField>

            {/* Botones */}
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