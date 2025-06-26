import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  MenuItem,
  Button,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Pagination,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

const Pronostico = () => {
  const [pronosticos, setPronosticos] = useState([]);
  const [maquinarias, setMaquinarias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal y formulario IA
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMaquinaria, setSelectedMaquinaria] = useState(null);
  const [form, setForm] = useState({
    fecha_asig: "",
    horas_op: "",
    recorrido: "",
  });
  const [formError, setFormError] = useState("");
  const [iaResult, setIaResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Paginación y filtro para historial
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Paginación para tabla de maquinarias
  const [maqCurrentPage, setMaqCurrentPage] = useState(1);
  const [maqRowsPerPage, setMaqRowsPerPage] = useState(10);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const resPronostico = await fetch("http://localhost:8000/api/pronostico/");
        const resMaquinarias = await fetch("http://localhost:8000/api/maquinaria/");
        const dataPronostico = await resPronostico.json();
        const dataMaquinarias = await resMaquinarias.json();
        setPronosticos(dataPronostico);
        setMaquinarias(dataMaquinarias);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Obtener nombre de maquinaria
  const getMaquinariaNombre = (maqId) => {
    const maq = maquinarias.find((m) => m._id?.$oid === maqId || m._id === maqId);
    return maq?.detalle || "Desconocido";
  };

  // --- Modal y Formulario IA ---
  const openModal = (maquinaria) => {
    setSelectedMaquinaria(maquinaria);
    setForm({ fecha_asig: "", horas_op: "", recorrido: "" });
    setFormError("");
    setIaResult(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedMaquinaria(null);
    setFormError("");
    setIaResult(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const handleIaSubmit = async (e) => {
    e.preventDefault();
    setIaResult(null);
    setFormError("");
    if (!form.fecha_asig || !form.horas_op || !form.recorrido) {
      setFormError("Completa todos los campos.");
      return;
    }
    setSubmitting(true);
    try {
      const maq = selectedMaquinaria;
      const placa = maq?.placa || "";
      const payload = {
        placa,
        fecha_asig: form.fecha_asig,
        horas_op: parseFloat(form.horas_op),
        recorrido: parseFloat(form.recorrido),
      };
      const res = await fetch("http://localhost:8000/api/pronostico/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al obtener pronóstico");
      }
      const result = await res.json();
      setIaResult(result);
      // Refrescar historial
      const resPronostico = await fetch("http://localhost:8000/api/pronostico/");
      setPronosticos(await resPronostico.json());
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  // Filtrado y paginación para historial
  const filteredData = pronosticos.filter((item) =>
    getMaquinariaNombre(item.maquinaria_id)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getTotalPages = () => Math.ceil(filteredData.length / rowsPerPage);

  const handlePageChange = (direction) => {
    if (direction === "prev") setCurrentPage((prev) => Math.max(prev - 1, 1));
    else if (direction === "next") setCurrentPage((prev) => Math.min(prev + 1, getTotalPages()));
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };
  const filteredMaquinarias = maquinarias.filter((maq) =>
    maq.detalle?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    maq.placa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maqTotalPages = Math.ceil(filteredMaquinarias.length / maqRowsPerPage);
  const paginatedMaquinarias = filteredMaquinarias.slice(
    (maqCurrentPage - 1) * maqRowsPerPage,
    maqCurrentPage * maqRowsPerPage
  );

  const handleMaqRowsPerPageChange = (e) => {
    setMaqRowsPerPage(parseInt(e.target.value, 10));
    setMaqCurrentPage(1);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando datos...</Typography>
      </Box>
    );
  }
  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 1100, margin: '0 auto', mt: 3 }}>
      <Typography variant="h5" mb={2} fontWeight={600}>Pronóstico de Mantenimiento</Typography>
      {/* Filtros de búsqueda y cantidad de registros para la tabla de maquinarias */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <TextField
            label="Buscar por detalle o placa"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setMaqCurrentPage(1); // Reiniciar a la primera página al buscar
            }}
            size="small"
            sx={{ minWidth: 250 }}
            color="black"
          />
        </Box>
        <Box>
          <TextField
            select
            label="Mostrar"
            value={maqRowsPerPage}
            onChange={handleMaqRowsPerPageChange}
            size="small"
            sx={{ width: 180 }}
            color="black"
          >
            <MenuItem value={5}>5 registros</MenuItem>
            <MenuItem value={10}>10 registros</MenuItem>
            <MenuItem value={20}>20 registros</MenuItem>
            <MenuItem value={50}>50 registros</MenuItem>
            <MenuItem value={100}>100 registros</MenuItem>
          </TextField>
        </Box>
      </Box>
      {/* Tabla de maquinarias con paginación */}
      <Table sx={{ mb: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell><b>N°</b></TableCell>
            <TableCell><b>Placa</b></TableCell>
            <TableCell><b>Detalle</b></TableCell>
            <TableCell><b>Acción</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedMaquinarias.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center">No hay maquinarias registradas</TableCell>
            </TableRow>
          ) : (
            paginatedMaquinarias.map((m, idx) => (
              <TableRow key={m._id?.$oid || m._id}>
                <TableCell>{(maqCurrentPage - 1) * maqRowsPerPage + idx + 1}</TableCell>
                <TableCell>{m.placa || '-'}</TableCell>
                <TableCell>{m.detalle || '-'}</TableCell>
                <TableCell>
                  <Button variant="contained" color="primary" onClick={() => openModal(m)}>
                    Pronosticar
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Paginación visual para tabla de maquinarias */}
      {maqTotalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 2 }}>
          <Pagination
            count={maqTotalPages}
            page={maqCurrentPage}
            onChange={(e, page) => setMaqCurrentPage(page)}
            showFirstButton
            showLastButton
          />
        </Box>
      )}
      {/* Modal de pronóstico */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="xs" fullWidth>
        <DialogTitle>
          Pronóstico para {selectedMaquinaria?.placa ? `${selectedMaquinaria.placa} - ` : ''}{selectedMaquinaria?.detalle}
          <IconButton
            aria-label="close"
            onClick={closeModal}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleIaSubmit} display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Fecha de asignación"
              name="fecha_asig"
              type="date"
              value={form.fecha_asig}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Horas de operación por día"
              name="horas_op"
              type="number"
              value={form.horas_op}
              onChange={handleFormChange}
              required
            />
            <TextField
              label="Recorrido (km)"
              name="recorrido"
              type="number"
              value={form.recorrido}
              onChange={handleFormChange}
              required
            />
            {formError && <Alert severity="error">{formError}</Alert>}
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? "Calculando..." : "Solicitar Pronóstico"}
            </Button>
          </Box>
          {iaResult && (
            <Box mt={3} p={2} border={1} borderColor="primary.main" borderRadius={2} bgcolor="#f5faff">
              <Typography variant="subtitle1" color="primary">Resultado del Pronóstico</Typography>
              {Object.entries(iaResult).map(([key, value]) => (
                <Typography key={key}><b>{key}:</b> {String(value)}</Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal} color="secondary">Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Pronostico;