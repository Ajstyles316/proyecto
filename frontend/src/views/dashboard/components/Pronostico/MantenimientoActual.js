import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  FormHelperText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const MantenimientoActual = () => {
  const [data, setData] = useState([]);
  const [maquinarias, setMaquinarias] = useState([]);
  const [form, setForm] = useState({
    maquinaria: "",
    tipo: "",
    cantidad: "",
    recorrido: "",
    horasOperacion: "",
    unidad: "",
  });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Estados para paginación y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para selects sin duplicados
  const [uniqueMaquinariasList, setUniqueMaquinariasList] = useState([]);
  const [uniqueTiposList, setUniqueTiposList] = useState([]);
  const [uniqueUnidadesList, setUniqueUnidadesList] = useState([]);

  // Función movida al inicio para evitar errores de inicialización
  const getMaquinariaNombre = (maqId) => {
    const maq = maquinarias.find(
      (m) => m._id?.$oid === maqId || m._id === maqId
    );
    return maq?.detalle || "Desconocido";
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchMantenimientos(), fetchMaquinarias()]);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        alert("Error al cargar datos desde el servidor");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Extraer opciones únicas para selects
  useEffect(() => {
    if (maquinarias.length > 0) {
      const seen = new Set();
      const filtered = maquinarias.filter((maq) => {
        const duplicate = seen.has(maq.detalle);
        seen.add(maq.detalle);
        return !duplicate;
      });
      setUniqueMaquinariasList(filtered);
    }
  }, [maquinarias]);

  useEffect(() => {
    if (data.length > 0) {
      const tiposUnicos = [...new Set(data.map((d) => d.tipo))];
      setUniqueTiposList(tiposUnicos);
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
      const unidadesUnicas = [...new Set(data.map((d) => d.unidad))];
      setUniqueUnidadesList(unidadesUnicas);
    }
  }, [data]);

  // Datos filtrados y paginados
  const filteredData = data.filter((item) => {
    const matchesSearch = getMaquinariaNombre(item.maquinaria_id)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Calcular total de páginas
  const getTotalPages = () => {
    return Math.ceil(filteredData.length / rowsPerPage);
  };

  // Manejar cambio de página
  const handlePageChange = (direction) => {
    if (direction === "prev") {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    } else if (direction === "next") {
      setCurrentPage((prev) => Math.min(prev + 1, getTotalPages()));
    }
  };

  // Manejar cambio de registros por página
  const handleRowsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setRowsPerPage(value);
    setCurrentPage(1);
  };

  // Funciones para abrir/cerrar modal
  const handleOpen = () => {
    setForm({
      maquinaria: "",
      tipo: "",
      cantidad: "",
      recorrido: "",
      horasOperacion: "",
      unidad: "",
    });
    setEditingId(null);
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm({
      maquinaria: "",
      tipo: "",
      cantidad: "",
      recorrido: "",
      horasOperacion: "",
      unidad: "",
    });
    setErrors({});
  };

  const fetchMantenimientos = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/mantenimientoact/");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Error ${response.status}: ${
            errorData.detail || "No se pudieron cargar los mantenimientos"
          }`
        );
      }
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Error en fetchMantenimientos:", error);
      throw error;
    }
  };

  const fetchMaquinarias = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
      if (!response.ok) throw new Error("Error al cargar la maquinaria");
      const data = await response.json();
      setMaquinarias(data);
    } catch (error) {
      console.error("Error en fetchMaquinarias:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.maquinaria.trim())
      newErrors.maquinaria = "Seleccione una maquinaria.";
    if (!form.tipo.trim()) newErrors.tipo = "Seleccione un tipo.";
    if (!form.cantidad.trim()) newErrors.cantidad = "Ingrese una cantidad.";
    if (!form.recorrido.trim()) newErrors.recorrido = "Ingrese un recorrido.";
    if (!form.horasOperacion.trim())
      newErrors.horasOperacion = "Ingrese horas de operación por día.";
    if (!form.unidad.trim()) newErrors.unidad = "Ingrese una unidad.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const payload = {
        maquinaria_id: form.maquinaria,
        tipo: form.tipo,
        cantidad: parseInt(form.cantidad),
        recorrido: parseFloat(form.recorrido),
        horasOperacion: parseInt(form.horasOperacion),
        unidad: form.unidad,
      };
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `http://localhost:8000/api/mantenimientoact/${editingId}/`
        : "http://localhost:8000/api/mantenimientoact/";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Error ${response.status}: ${
            errorData.detail || "No se pudo guardar el registro"
          }`
        );
      }

      await fetchMantenimientos();
      handleClose();
    } catch (error) {
      alert(error.message);
      console.error("Error en handleSubmit:", error);
    }
  };

  const handleEdit = (item) => {
    const _id = item._id?.$oid || item._id;

    // Asegura que los valores existan en las listas únicas
    const maquinariaValida = uniqueMaquinariasList.some(
      (m) => m._id?.$oid === item.maquinaria_id || m._id === item.maquinaria_id
    )
      ? item.maquinaria_id
      : "";

    const tipoValido = uniqueTiposList.includes(item.tipo)
      ? item.tipo
      : uniqueTiposList[0] || "";

    const unidadValida = uniqueUnidadesList.includes(item.unidad)
      ? item.unidad
      : uniqueUnidadesList[0] || "";

    setForm({
      maquinaria: maquinariaValida,
      tipo: tipoValido,
      cantidad: item.cantidad?.toString() || "",
      recorrido: item.recorrido?.toString() || "",
      horasOperacion: item.horasOperacion?.toString() || "",
      unidad: unidadValida,
    });
    setEditingId(_id);
    setOpen(true);
  };

  const handleDelete = async (_id) => {
    const id = _id?.$oid || _id;
    if (!id) return alert("ID inválido");
    try {
      const response = await fetch(
        `http://localhost:8000/api/mantenimientoact/${id}/`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Error ${response.status}: ${
            errorData.detail || "No se pudo eliminar"
          }`
        );
      }
      await fetchMantenimientos();
    } catch (error) {
      alert(error.message);
      console.error("Error en handleDelete:", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando datos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Título y acciones */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Mantenimiento Actual</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            select
            size="small"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            sx={{ minWidth: 120 }}
            label="Mostrar"
          >
            <MenuItem value={5}>5 registros</MenuItem>
            <MenuItem value={10}>10 registros</MenuItem>
            <MenuItem value={20}>20 registros</MenuItem>
            <MenuItem value={50}>50 registros</MenuItem>
            <MenuItem value={100}>100 registros</MenuItem>
          </TextField>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            disabled={loading}
          >
            Nuevo
          </Button>
        </Box>
      </Box>

      {/* Campo de búsqueda */}
      <Box mb={2}>
        <TextField
          label="Buscar por maquinaria"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          sx={{ maxWidth: 300 }}
        />
      </Box>

      {/* Tabla */}
      <Box sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: "max-content" }}>
          <TableHead>
            <TableRow>
              {[
                "N°",
                "Maquinaria",
                "Unidad",
                "Tipo",
                "Horas/día",
                "Recorrido (km)",
                "Acción",
              ].map((h) => (
                <TableCell key={h}>
                  <b>{h}</b>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay registros disponibles
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((d, i) => {
                const _id = d._id?.$oid || d._id;
                const globalIndex =
                  (currentPage - 1) * rowsPerPage + i + 1;
                return (
                  <TableRow key={_id}>
                    <TableCell>{globalIndex}</TableCell>
                    <TableCell>{getMaquinariaNombre(d.maquinaria_id)}</TableCell>
                    <TableCell>{d.unidad}</TableCell>
                    <TableCell>{d.tipo?.toUpperCase() || "N/A"}</TableCell>
                    <TableCell>{`${d.horasOperacion || 0} hrs/día`}</TableCell>
                    <TableCell>{`${d.recorrido || 0} km`}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleEdit(d)}
                        disabled={loading}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(_id)}
                        disabled={loading}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Paginación */}
      <Box display="flex" justifyContent="center" mt={3} gap={2}>
        <Button
          variant="outlined"
          color="warning"
          disabled={currentPage === 1}
          onClick={() => handlePageChange("prev")}
        >
          Anterior
        </Button>
        <Typography sx={{ alignSelf: "center" }}>
          Página {currentPage}
        </Typography>
        <Button
          variant="outlined"
          color="warning"
          disabled={currentPage === getTotalPages()}
          onClick={() => handlePageChange("next")}
        >
          Siguiente
        </Button>
      </Box>

      {/* MODAL */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            p: 4,
            bgcolor: "#fff",
            borderRadius: 2,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
          }}
        >
          <Typography variant="h6" mb={2}>
            {editingId ? "Editar" : "Agregar"} Mantenimiento
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* SELECT MAQUINARIA SIN DUPLICADOS */}
            <FormControl fullWidth error={!!errors.maquinaria}>
              <TextField
                select
                label="Maquinaria"
                name="maquinaria"
                value={form.maquinaria}
                onChange={handleChange}
              >
                <MenuItem value="" disabled>
                  Selecciona una maquinaria
                </MenuItem>
                {uniqueMaquinariasList.map((maq) => {
                  const _id = maq._id?.$oid || maq._id;
                  return (
                    <MenuItem key={_id} value={_id}>
                      {maq.detalle}
                    </MenuItem>
                  );
                })}
              </TextField>
              <FormHelperText>{errors.maquinaria}</FormHelperText>
            </FormControl>

            {/* SELECT TIPO SIN DUPLICADOS */}
            <FormControl fullWidth error={!!errors.tipo}>
              <TextField
                select
                label="Tipo"
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
              >
                <MenuItem value="" disabled>
                  Selecciona un tipo
                </MenuItem>
                {uniqueTiposList.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo}
                  </MenuItem>
                ))}
              </TextField>
              <FormHelperText>{errors.tipo}</FormHelperText>
            </FormControl>

            {/* SELECT UNIDAD SIN DUPLICADOS */}
            <FormControl fullWidth error={!!errors.unidad}>
              <TextField
                select
                label="Unidad"
                name="unidad"
                value={form.unidad}
                onChange={handleChange}
              >
                <MenuItem value="" disabled>
                  Selecciona una unidad
                </MenuItem>
                {uniqueUnidadesList.map((unidad) => (
                  <MenuItem key={unidad} value={unidad}>
                    {unidad}
                  </MenuItem>
                ))}
              </TextField>
              <FormHelperText>{errors.unidad}</FormHelperText>
            </FormControl>

            {/* Otros campos */}
            <TextField
              label="Cantidad"
              name="cantidad"
              type="number"
              value={form.cantidad}
              onChange={handleChange}
              error={!!errors.cantidad}
              helperText={errors.cantidad}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Recorrido (km)"
              name="recorrido"
              type="number"
              step="any"
              value={form.recorrido}
              onChange={handleChange}
              error={!!errors.recorrido}
              helperText={errors.recorrido}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Horas de operación por día"
              name="horasOperacion"
              type="number"
              value={form.horasOperacion}
              onChange={handleChange}
              error={!!errors.horasOperacion}
              helperText={errors.horasOperacion}
              inputProps={{ min: 0 }}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSubmit}
              disabled={loading}
            >
              Guardar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default MantenimientoActual;