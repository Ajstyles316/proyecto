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

const ITVTable = () => {
  const [itvs, setItvs] = useState([]);
  const [maquinarias, setMaquinarias] = useState([]);
  const [form, setForm] = useState({
    maquinaria: "",
    detalle: "",
  });
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [uniqueMaquinariasList, setUniqueMaquinariasList] = useState([]);

  // Función para obtener nombre de maquinaria
  const getMaquinariaNombre = (maqId) => {
    const maq = maquinarias.find(m => 
      m._id?.$oid === maqId || m._id === maqId
    );
    return maq?.detalle || "Desconocida";
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchItvs();
    fetchMaquinarias();
  }, []);

  // Extraer maquinarias únicas
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

  const fetchItvs = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/itv/");
      if (!response.ok) throw new Error("Error al cargar los registros");
      const data = await response.json();
      setItvs(data);
    } catch (error) {
      console.error("Error:", error.message);
      alert("No se pudieron cargar los registros. Verifica la conexión con el backend.");
    }
  };

  const fetchMaquinarias = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
      if (!response.ok) throw new Error("Error al cargar las máquinas");
      const data = await response.json();
      setMaquinarias(data);
    } catch (error) {
      console.error("Error al cargar máquinas:", error.message);
      alert("No se pudieron cargar las máquinas. Verifica la conexión.");
    }
  };

  // Calcular total de páginas
  const getTotalPages = () => {
    return rowsPerPage === "all" 
      ? 1 
      : Math.ceil(itvs.length / rowsPerPage);
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
    const value = e.target.value;
    setRowsPerPage(value === "all" ? "all" : parseInt(value, 10));
    setCurrentPage(1);
  };

  // Datos paginados
  const paginatedItvs = rowsPerPage === "all" 
    ? itvs 
    : itvs.slice(
        (currentPage - 1) * rowsPerPage, 
        currentPage * rowsPerPage
      );

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
    setForm({
      maquinaria: "",
      detalle: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.maquinaria.trim()) newErrors.maquinaria = "Seleccione una maquinaria.";
    if (!form.detalle.trim() || isNaN(parseFloat(form.detalle)) || parseFloat(form.detalle) <= 0) {
      newErrors.detalle = "El detalle debe ser un número mayor que cero.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const payload = {
      maquinaria_id: form.maquinaria,
      detalle: parseFloat(form.detalle),
    };
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `http://localhost:8000/api/itv/${editingId}/`
        : "http://localhost:8000/api/itv/";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Error al guardar");
      fetchItvs();
      handleClose();
      setCurrentPage(1);
    } catch (error) {
      console.error("Error al guardar:", error.message);
      alert("Ocurrió un error al guardar.");
    }
  };

  const handleEdit = (item) => {
    const _id = item._id?.$oid || item._id;
    setForm({
      ...item,
      maquinaria: item.maquinaria_id || item.maquinaria,
      detalle: item.detalle.toString(),
    });
    setEditingId(_id);
    setOpenModal(true);
    setErrors({});
  };

  const handleDelete = async (_id) => {
    const id = _id?.$oid || _id;
    if (!id) return alert("ID inválido");
    try {
      const response = await fetch(`http://localhost:8000/api/itv/${id}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar");
      fetchItvs();
    } catch (error) {
      alert("No se pudo eliminar el registro");
      console.error("Error al eliminar:", error.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Título y controles */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>ITV</Typography>
        <Box display="flex" gap={2} alignItems="center">
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

      {/* Tabla con scroll horizontal */}
      <Box sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: "max-content" }}>
          <TableHead>
            <TableRow>
              <TableCell><Typography fontWeight={600}>N°</Typography></TableCell>
              <TableCell><Typography fontWeight={600}>Maquinaria</Typography></TableCell>
              <TableCell><Typography fontWeight={600}>Detalle</Typography></TableCell>
              <TableCell align="right"><Typography fontWeight={600}>Acciones</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedItvs.map((itv, index) => {
              const globalIndex = rowsPerPage === "all" 
                ? index 
                : (currentPage - 1) * rowsPerPage + index;
              const _id = itv._id?.$oid || itv._id || index.toString();
              
              return (
                <TableRow key={_id}>
                  <TableCell>{globalIndex + 1}</TableCell>
                  <TableCell>{getMaquinariaNombre(itv.maquinaria_id || itv.maquinaria)}</TableCell>
                  <TableCell>{`Bs. ${parseFloat(itv.detalle).toFixed(2)}`}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" color="secondary" onClick={() => handleEdit(itv)}>
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
            {editingId ? "Editar ITV" : "Agregar ITV"}
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
              label="Detalle"
              type="number"
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