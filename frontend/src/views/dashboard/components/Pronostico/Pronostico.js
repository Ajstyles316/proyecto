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
  Tabs,
  Tab,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ScatterChart, Scatter } from 'recharts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

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

  // Utilidades para mostrar títulos amigables y recomendaciones
  const FIELD_LABELS = {
    placa: 'Placa',
    fecha_asig: 'Fecha de Asignación',
    horas_op: 'Horas de Operación',
    recorrido: 'Recorrido (km)',
    riesgo: 'Riesgo',
    resultado: 'Resultado',
    fecha_sugerida: 'Fecha Sugerida de Mantenimiento',
  };
  const getRecomendacion = (resultado) => {
    if (resultado === 'Correctivo') return '¡Atención inmediata!';
    if (resultado === 'Preventivo') return 'Programar mantenimiento.';
    if (resultado === 'Predictivo') return 'Monitorear condición.';
    return '';
  };
  const getRiesgoColor = (riesgo) => {
    if (riesgo === 'Alto') return 'error.main';
    if (riesgo === 'Medio') return 'warning.main';
    if (riesgo === 'Bajo') return 'success.main';
    return 'text.primary';
  };

  // ... existing code ...
  const [showSave, setShowSave] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [lastForecastData, setLastForecastData] = useState(null);
  const [forecastChartData, setForecastChartData] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [allForecasts, setAllForecasts] = useState([]);
  const [mainTab, setMainTab] = useState(0);

  // Estado para popover de recomendaciones en la tabla
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverRecs, setPopoverRecs] = useState([]);

  // Estados para paginación de la tabla de historial de pronósticos
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);

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
    setTabIndex(0);
    // Cargar todos los pronósticos
    fetch('http://localhost:8000/api/pronostico/')
      .then(res => res.json())
      .then(data => {
        setAllForecasts(data);
        setForecastChartData(
          data.map(item => ({
            fecha: item.fecha_asig,
            valor: item.riesgo || item.resultado || 0,
            placa: item.placa
          }))
        );
      });
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
    setShowSave(false);
    setSaveSuccess(false);
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
      setLastForecastData(result);
      setForecastChartData([{ fecha: result.fecha_asig, valor: result.riesgo || result.resultado }]);
      setShowSave(true);
      setSaveSuccess(false);
      // Refrescar historial
      const resPronostico = await fetch("http://localhost:8000/api/pronostico/");
      setPronosticos(await resPronostico.json());
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuardar = async () => {
    if (!iaResult) return;
    const payload = {
      ...iaResult,
      fecha_sugerida: iaResult.fecha_sugerida || (() => {
        try {
          const base = iaResult.fecha_asig;
          if (!base) return '';
          const d = new Date(base);
          d.setDate(d.getDate() + 180);
          return d.toISOString().split('T')[0];
        } catch {
          return '';
        }
      })(),
    };
    setSubmitting(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("http://localhost:8000/api/pronostico/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al guardar en la base de datos");
      setSaveSuccess(true);
      setShowSave(false);
      // Refrescar historial
      const resPronostico = await fetch("http://localhost:8000/api/pronostico/");
      setPronosticos(await resPronostico.json());
    } catch (e) {
      setFormError(e.message);
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

  // Función para obtener acciones según tipo de mantenimiento (resultado)
  function getAccionPorTipo(resultado) {
    if (resultado === 'Correctivo') return '¡Atención inmediata! Revisar y reparar fallas.';
    if (resultado === 'Preventivo') return 'Programar mantenimiento preventivo.';
    if (resultado === 'Predictivo') return 'Monitorear condición y programar revisión.';
    return 'Consultar con el área de mantenimiento.';
  }

  // Función para obtener recomendaciones según tipo de mantenimiento (resultado)
  function getRecomendacionesPorTipo(resultado) {
    if (resultado === 'Correctivo') return [
      'Diagnóstico preciso: uso de herramientas de diagnóstico o software.',
      'Inspección técnica detallada por un mecánico especializado.',
      'Reemplazo de partes dañadas: motores, correas, rodamientos, etc.',
      'Reparación estructural: soldaduras, enderezado de chasis, refuerzos.',
      'Análisis de causa raíz: documentar para evitar que se repita.',
      'Actualización del historial de la máquina.',
      'Medidas de seguridad post-reparación: pruebas antes de volver a operar.'
    ];
    if (resultado === 'Preventivo') return [
      'Revisión periódica del equipo.',
      'Inspección visual de componentes.',
      'Verificación de ruidos anómalos, vibraciones o fugas.',
      'Lubricación regular de partes móviles.',
      'Cambio de filtros y fluidos según cronograma.',
      'Calibraciones y ajustes: sensores, frenos, presión hidráulica.',
      'Monitoreo de horas de uso y recorrido.',
      'Capacitación del operador y revisión diaria básica.',
      'Checklist preventiva y documentación en cada revisión.'
    ];
    if (resultado === 'Predictivo') return [
      'Monitoreo de condición con sensores o IoT.',
      'Análisis de vibraciones, temperatura y ruidos.',
      'Programar revisión cuando se detecten anomalías.',
      'Actualizar historial de monitoreo y mantenimiento.'
    ];
    return ['Consultar con el área de mantenimiento.'];
  }

  // useEffect para recargar pronósticos cada vez que se selecciona la pestaña 'Ver Pronóstico'
  useEffect(() => {
    if (mainTab === 1) {
      fetch('http://localhost:8000/api/pronostico/')
        .then(res => res.json())
        .then(data => setAllForecasts(data));
    }
  }, [mainTab]);

  const handleOpenPopover = (event, recs) => {
    setAnchorEl(event.currentTarget);
    setPopoverRecs(recs);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setPopoverRecs([]);
  };

  const openPopover = Boolean(anchorEl);

  // Filtrado y paginación para historial de pronósticos
  const paginatedForecasts = allForecasts.slice(
    (historyPage - 1) * historyRowsPerPage,
    historyPage * historyRowsPerPage
  );
  const totalHistoryPages = Math.ceil(allForecasts.length / historyRowsPerPage);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando datos...</Typography>
      </Box>
    );
  }
  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 1100, margin: '0 auto', mt: 3 }}>
      <Tabs value={mainTab} onChange={(e, v) => setMainTab(v)} sx={{ mb: 2 }}>
        <Tab label="Pronóstico de Mantenimiento" />
        <Tab label="Ver Pronóstico" />
      </Tabs>
      {mainTab === 0 && (
        <>
          <Typography variant="h5" mb={2} fontWeight={600}>Pronóstico de Mantenimiento</Typography>
          {/* Filtros de búsqueda y cantidad de registros para la tabla de maquinarias */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <TextField
                label="Buscar"
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
                        Generar Pronóstico
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
        </>
      )}
      {mainTab === 1 && (
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h6" mb={2} align="center">Gráfica de Recorrido vs Horas</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis dataKey="recorrido" name="Recorrido (km)" />
              <YAxis dataKey="horas_op" name="Horas de Operación" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Pronósticos" data={allForecasts} fill="#8884d8" />
              <Line type="monotone" dataKey="horas_op" data={allForecasts} stroke="#1976d2" dot={false} legendType="plainline" name="Evolución real" />
            </ScatterChart>
          </ResponsiveContainer>
          <Typography variant="h6" mt={4} mb={2} align="center">Historial de Pronósticos</Typography>
          <Box width="100%" maxWidth={1100}>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <TextField
                select
                label="Mostrar"
                value={historyRowsPerPage}
                onChange={e => { setHistoryRowsPerPage(parseInt(e.target.value, 10)); setHistoryPage(1); }}
                size="small"
                sx={{ width: 180 }}
              >
                <MenuItem value={5}>5 registros</MenuItem>
                <MenuItem value={10}>10 registros</MenuItem>
                <MenuItem value={20}>20 registros</MenuItem>
                <MenuItem value={50}>50 registros</MenuItem>
                <MenuItem value={100}>100 registros</MenuItem>
              </TextField>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">Placa</TableCell>
                  <TableCell align="center">Fecha Asignación</TableCell>
                  <TableCell align="center">Horas Op.</TableCell>
                  <TableCell align="center">Recorrido</TableCell>
                  <TableCell align="center">Riesgo</TableCell>
                  <TableCell align="center">Resultado</TableCell>
                  <TableCell align="center">Fecha de Mantenimiento Programada</TableCell>
                  <TableCell align="center">Recomendaciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedForecasts.map((item, idx) => (
                  <TableRow key={item._id || idx}>
                    <TableCell align="center">{item.placa}</TableCell>
                    <TableCell align="center">{item.fecha_asig}</TableCell>
                    <TableCell align="center">{item.horas_op}</TableCell>
                    <TableCell align="center">{item.recorrido}</TableCell>
                    <TableCell align="center">{item.riesgo || '-'}</TableCell>
                    <TableCell align="center">{item.resultado || '-'}</TableCell>
                    <TableCell align="center">{item.fecha_sugerida || (() => {
                      try {
                        const base = item.fecha_asig;
                        if (!base) return 'No disponible';
                        const d = new Date(base);
                        d.setDate(d.getDate() + 180);
                        return d.toISOString().split('T')[0];
                      } catch {
                        return 'No disponible';
                      }
                    })()}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="info" onClick={e => handleOpenPopover(e, getRecomendacionesPorTipo(item.resultado))}>
                        <InfoIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalHistoryPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalHistoryPages}
                  page={historyPage}
                  onChange={(e, page) => setHistoryPage(page)}
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </Box>
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
            <Box mt={3}>
              <Box p={2} border={1} borderColor="primary.main" borderRadius={2} bgcolor="#f5faff">
                <Typography variant="subtitle1" color="primary" mb={1}>
                  Resultado del Pronóstico
                </Typography>
                {/* Mostrar campos amigables, ocultar _id y creado_en */}
                {Object.entries(iaResult)
                  .filter(([key]) => key !== '_id' && key !== 'creado_en' && key !== 'fecha_prediccion')
                  .map(([key, value]) => {
                    if (key === "riesgo") {
                      return (
                        <Typography key={key} sx={{ color: getRiesgoColor(value), fontWeight: 600 }}>
                          {FIELD_LABELS[key] || key}: {String(value)}
                        </Typography>
                      );
                    }
                    if (key === "resultado") {
                      return (
                        <Typography key={key}>
                          {FIELD_LABELS[key] || key}: <b>{String(value)}</b> <br />
                          <span style={{ fontStyle: 'italic', color: '#1976d2' }}>{getRecomendacion(String(value))}</span>
                        </Typography>
                      );
                    }
                    if (key === "probabilidad") {
                      return (
                        <Typography key={key} sx={{ color: 'info.main', fontWeight: 600 }}>
                          Probabilidad: {String(value)}%
                        </Typography>
                      );
                    }
                    if (key === "fecha_sugerida") {
                      return (
                        <Typography key={key} sx={{ color: 'success.dark', fontWeight: 600 }}>
                          {FIELD_LABELS[key] || key}: {String(value)}
                        </Typography>
                      );
                    }
                    // Otros campos
                    return (
                      <Typography key={key}>
                        {FIELD_LABELS[key] || key}: {String(value)}
                      </Typography>
                    );
                  })}
                {/* Si no hay fecha sugerida, mostrar una estimada */}
                {!iaResult.fecha_sugerida && (
                  <Typography sx={{ color: 'success.dark', fontWeight: 600 }}>
                    Fecha Sugerida de Mantenimiento: {(() => {
                      try {
                        const base = iaResult.fecha_asig || iaResult.fecha_prediccion;
                        if (!base) return 'No disponible';
                        const d = new Date(base);
                        d.setDate(d.getDate() + 180);
                        return d.toISOString().split('T')[0];
                      } catch {
                        return 'No disponible';
                      }
                    })()}
                  </Typography>
                )}
                {/* Acciones recomendadas según tipo de mantenimiento */}
                <Typography sx={{ color: 'info.main', fontWeight: 600, mt: 2 }}>
                  Acciones a tomar: {getAccionPorTipo(iaResult.resultado)}
                </Typography>
                {saveSuccess && (
                  <Alert severity="success" sx={{ mt: 2 }}>¡Información guardada exitosamente!</Alert>
                )}
              </Box>
              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button variant="contained" color="success" onClick={handleGuardar} disabled={submitting}>
                  Guardar Información
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box p={2} maxWidth={350}>
          <Typography variant="subtitle1" color="primary" mb={1}>Recomendaciones</Typography>
          <List dense>
            {popoverRecs.map((rec, idx) => (
              <ListItem key={idx}>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={rec} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </Paper>
  );
};

export default Pronostico;