import { useEffect, useState } from "react";
import "./styles.css"
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
  Pagination,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  Paper,
  Avatar
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const fieldLabels = {
  Maquinaria: [
    { name: 'gestion', label: 'Gestión' },
    { name: 'placa', label: 'Placa' },
    { name: 'detalle', label: 'Detalle' },
    { name: 'unidad', label: 'Unidad' },
    { name: 'adqui', label: 'Adqui.' },
    { name: 'codigo', label: 'Código' },
    { name: 'tipo', label: 'Tipo' },
    { name: 'marca', label: 'Marca' },
    { name: 'modelo', label: 'Modelo' },
    { name: 'color', label: 'Color' },
    { name: 'nroMotor', label: 'Nro Motor' },
    { name: 'nroChasis', label: 'Nro. Chasis' },
    { name: 'fechaRegistro', label: 'Fecha Registro', type: 'date' },
  ],
  Control: [
    { name: 'ubicacion', label: 'Ubicación' },
    { name: 'gerente', label: 'Gerente/Director' },
    { name: 'encargado', label: 'Encargado de Activos' },
    { name: 'hojaTramite', label: 'Hoja de Trámite' },
    { name: 'fechaIngreso', label: 'Fecha de Ingreso', type: 'date' },
    { name: 'observacion', label: 'Observación' },
  ],
  'Asignación': [
    { name: 'fechaAsignacion', label: 'Fecha Asignación', type: 'date' },
    { name: 'fechaLiberacion', label: 'Fecha Liberación', type: 'date' },
    { name: 'recorridoKm', label: 'Recorrido Asignado (Km)', type: 'number' },
    { name: 'recorridoEntregado', label: 'Recorrido Entregado (Km)', type: 'number' },
  ],
  Mantenimiento: [
    { name: 'tipo', label: 'Tipo' },
    { name: 'gestion', label: 'Gestión' },
    { name: 'lugarMantenimiento', label: 'Lugar de Mantenimiento' },
  ],
  Seguros: [
    { name: 'placa', label: 'Placa' },
    { name: 'numero2024', label: 'Número 2024' },
    { name: 'importeAsegurado2024', label: 'Importe Asegurado 2024', type: 'number' },
    { name: 'detalle', label: 'Detalle' },
  ],
  ITV: [
    { name: 'placa', label: 'Placa' },
    { name: 'detalle2024', label: 'Detalle 2024' },
    { name: 'importe2024', label: 'Importe 2024', type: 'number' },
  ],
  Impuestos: [
    { name: 'placa', label: 'Placa' },
    { name: 'importe2023', label: 'Importe 2023', type: 'number' },
    { name: 'importe2024', label: 'Importe 2024', type: 'number' },
  ],
  SOAT: [
    { name: 'placa', label: 'Placa' },
    { name: 'importe2024', label: 'Importe 2024', type: 'number' },
    { name: 'importe2025', label: 'Importe 2025', type: 'number' },
  ]
};

const SECTIONS = [
  'Maquinaria',
  'Control',
  'Asignación',
  'Mantenimiento',
  'Seguros',
  'ITV',
  'Impuestos',
  'SOAT',
];

const maquinariaImage = 'https://images.unsplash.com/photo-1511918984145-48de785d4c4e?auto=format&fit=crop&w=400&q=80';

const Maquinaria = () => {
  const [maquinarias, setMaquinarias] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [5, 10, 20, 50, "Todos"];
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Detalle y edición
  const [detailView, setDetailView] = useState(false);
  const [activeSection, setActiveSection] = useState('Maquinaria');
  const [sectionForm, setSectionForm] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({});
  const [modalErrors, setModalErrors] = useState({});

  // Estados para crear nueva maquinaria desde la vista de lista
  const [newMaquinariaModalOpen, setNewMaquinariaModalOpen] = useState(false);
  const [newMaquinariaForm, setNewMaquinariaForm] = useState(() => {
    const initialForm = {};
    fieldLabels.Maquinaria.forEach(field => {
      initialForm[field.name] = field.type === 'number' ? 0 : '';
      if (field.name === 'fechaRegistro') {
        initialForm[field.name] = new Date().toISOString().split('T')[0];
      }
    });
    return initialForm;
  });
  const [newMaquinariaErrors, setNewMaquinariaErrors] = useState({});

  // Cargar maquinarias
  useEffect(() => {
    fetchMaquinarias();
  }, []);

  const fetchMaquinarias = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/", {
        method: 'GET',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) throw new Error('Error al cargar datos');
      const data = await response.json();
      setMaquinarias(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error al cargar datos: ${error.message}`, severity: "error" });
      setMaquinarias([]);
    } finally {
      setLoading(false);
    }
  };

  // Detalle
  const handleDetailsClick = async (id) => {
    try {
      const cleanId = id.toString().replace(/[^a-zA-Z0-9]/g, '');
      const response = await fetch(`http://localhost:8000/api/maquinaria/${cleanId}/`);
      if (!response.ok) throw new Error('Error al cargar detalles');
      const data = await response.json();
      setSectionForm({
        Maquinaria: { ...data },
        Control: { ...data.historial?.control },
        'Asignación': { ...data.actaAsignacion },
        Mantenimiento: { ...data.mantenimiento },
        Seguros: { ...data.seguros },
        ITV: { ...data.itv },
        Impuestos: { ...data.impuestos },
        SOAT: { ...data.soat },
      });
      setActiveSection('Maquinaria');
      setDetailView(true);
    } catch (error) {
      setSnackbar({ open: true, message: `Error al cargar detalles: ${error.message}`, severity: "error" });
    }
  };

  // Renderiza el formulario de la sección activa
  const renderSectionForm = () => {
    const fields = fieldLabels[activeSection];
    const values = sectionForm[activeSection] || {};
    return (
      <Grid container spacing={2}>
        {fields.map((field) => (
          <Grid item xs={12} md={6} key={field.name}>
            <TextField
              fullWidth
              label={field.label}
              name={field.name}
              type={field.type || 'text'}
              value={values[field.name] || ''}
              onChange={e => setSectionForm((prev) => ({
                ...prev,
                [activeSection]: {
                  ...prev[activeSection],
                  [field.name]: e.target.value,
                },
              }))}
              size="small"
              InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
              disabled={field.name === 'placa' && activeSection !== 'Maquinaria'}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  // Modal para Nuevo registro
  const renderModal = () => (
    <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
      <Paper sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', p: 3, minWidth: 320 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Crear nuevo registro en {activeSection}</Typography>
        <Grid container spacing={2}>
          {(fieldLabels[activeSection] || []).map((field) => (
            <Grid item xs={12} key={field.name}>
              <TextField
                fullWidth
                label={field.label}
                name={field.name}
                type={field.type || 'text'}
                value={modalForm[field.name] || ''}
                onChange={e => setModalForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                size="small"
                error={!!modalErrors[field.name]}
                helperText={modalErrors[field.name] || ''}
                InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
              />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => {
            // Validación simple
            const errors = {};
            (fieldLabels[activeSection] || []).forEach(field => {
              if (!modalForm[field.name] || !modalForm[field.name].toString().trim()) {
                errors[field.name] = 'Este campo es obligatorio';
              }
            });
            setModalErrors(errors);
            if (Object.keys(errors).length > 0) return;
            setSnackbar({ open: true, message: 'Nuevo registro creado (simulado)', severity: 'success' });
            setModalForm({});
            setModalErrors({});
            setModalOpen(false);
          }}>Guardar</Button>
        </Box>
      </Paper>
    </Modal>
  );

  // Guardar nueva maquinaria desde el modal principal
  const handleNewMaquinariaSubmit = async () => {
    const errors = {};
    fieldLabels.Maquinaria.forEach(field => {
      if (field.name !== 'adqui' && field.name !== 'codigo' && field.name !== 'tipo' && field.name !== 'marca' && field.name !== 'modelo' && field.name !== 'color' && field.name !== 'nroMotor' && field.name !== 'nroChasis') { // Marcar los campos no obligatorios aquí
        if (!newMaquinariaForm[field.name] || !newMaquinariaForm[field.name].toString().trim()) {
          errors[field.name] = 'Este campo es obligatorio';
        }
      }
    });
    setNewMaquinariaErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const formattedData = {
        ...newMaquinariaForm,
        fechaRegistro: newMaquinariaForm.fechaRegistro ? new Date(newMaquinariaForm.fechaRegistro).toISOString().split('T')[0] : '',
      };

      const cleanData = (obj) => {
        Object.keys(obj).forEach(key => {
          if (obj[key] === undefined || obj[key] === null || obj[key] === '') {
            delete obj[key];
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            cleanData(obj[key]);
            if (Object.keys(obj[key]).length === 0) {
              delete obj[key];
            }
          }
        });
        return obj;
      };

      const cleanedData = cleanData(formattedData);

      const response = await fetch("http://localhost:8000/api/maquinaria/", {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      setNewMaquinariaModalOpen(false);
      setNewMaquinariaForm(() => {
        const initialForm = {};
        fieldLabels.Maquinaria.forEach(field => {
          initialForm[field.name] = field.type === 'number' ? 0 : '';
          if (field.name === 'fechaRegistro') {
            initialForm[field.name] = new Date().toISOString().split('T')[0];
          }
        });
        return initialForm;
      });
      setNewMaquinariaErrors({});
      fetchMaquinarias();
      setSnackbar({ open: true, message: 'Nueva maquinaria creada exitosamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: `Error al crear maquinaria: ${error.message}`, severity: 'error' });
    }
  };

  // Renderiza el modal para crear nueva maquinaria
  const renderNewMaquinariaModal = () => (
    <Modal open={newMaquinariaModalOpen} onClose={() => setNewMaquinariaModalOpen(false)}>
      <Paper sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', p: 3, width: '90%', maxWidth: 600 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Crear Nueva Maquinaria</Typography>
        <Grid container spacing={2}>
          {fieldLabels.Maquinaria.map((field) => (
            <Grid item xs={12} md={6} key={field.name}>
              <TextField
                fullWidth
                label={field.label}
                name={field.name}
                type={field.type || 'text'}
                value={newMaquinariaForm[field.name] || ''}
                onChange={e => setNewMaquinariaForm({ ...newMaquinariaForm, [field.name]: e.target.value })}
                size="small"
                error={!!newMaquinariaErrors[field.name]}
                helperText={newMaquinariaErrors[field.name] || ''}
                InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
              />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button onClick={() => setNewMaquinariaModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleNewMaquinariaSubmit}>Guardar Nueva Maquinaria</Button>
        </Box>
      </Paper>
    </Modal>
  );

  const totalPages = pageSize === "Todos" ? 1 : Math.ceil(maquinarias.length / parseInt(pageSize, 10));
  const getDisplayedData = () => {
    if (!Array.isArray(maquinarias)) return [];
    if (pageSize === "Todos") return maquinarias;
    const start = (currentPage - 1) * parseInt(pageSize, 10);
    const end = start + parseInt(pageSize, 10);
    return maquinarias.slice(start, end);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {detailView ? (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          {/* Panel principal: formulario */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" sx={{ mb: 3 }}>Historial de {activeSection}</Typography>
              {renderSectionForm()}
              {['Control', 'Asignación', 'Mantenimiento', 'Seguros', 'ITV', 'Impuestos', 'SOAT'].includes(activeSection) && (
                <Button variant="outlined" color="primary" sx={{ mt: 3 }} onClick={() => setModalOpen(true)}>
                  Nuevo
                </Button>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                <Button variant="outlined" color="error" onClick={() => setDetailView(false)}>Cancelar</Button>
                <Button variant="contained" color="info" onClick={async () => {
                  try {
                    const cleanId = sectionForm.Maquinaria._id.$oid || sectionForm.Maquinaria._id || sectionForm.Maquinaria.id;
                    const url = `http://localhost:8000/api/maquinaria/${cleanId}/`;

                    const formatDate = (dateStr) => {
                      if (!dateStr) return '';
                      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
                      return new Date(dateStr).toISOString().split('T')[0];
                    };

                    const maquinariaPayload = {
                      gestion: sectionForm.Maquinaria?.gestion || '',
                      detalle: sectionForm.Maquinaria?.detalle || '',
                      placa: sectionForm.Maquinaria?.placa || '',
                      unidad: sectionForm.Maquinaria?.unidad || '',
                      adqui: sectionForm.Maquinaria?.adqui || '',
                      codigo: sectionForm.Maquinaria?.codigo || '',
                      tipo: sectionForm.Maquinaria?.tipo || '',
                      marca: sectionForm.Maquinaria?.marca || '',
                      modelo: sectionForm.Maquinaria?.modelo || '',
                      color: sectionForm.Maquinaria?.color || '',
                      nroMotor: sectionForm.Maquinaria?.nroMotor || '',
                      nroChasis: sectionForm.Maquinaria?.nroChasis || '',
                      fechaRegistro: formatDate(sectionForm.Maquinaria?.fechaRegistro),
                      historial: {
                        control: {
                          ubicacion: sectionForm.Control?.ubicacion || '',
                          gerente: sectionForm.Control?.gerente || '',
                          encargado: sectionForm.Control?.encargado || '',
                          hojaTramite: sectionForm.Control?.hojaTramite || '',
                          fechaIngreso: formatDate(sectionForm.Control?.fechaIngreso),
                          observacion: sectionForm.Control?.observacion || ''
                        }
                      },
                      actaAsignacion: {
                        fechaAsignacion: formatDate(sectionForm['Asignación']?.fechaAsignacion),
                        fechaLiberacion: formatDate(sectionForm['Asignación']?.fechaLiberacion),
                        recorridoKm: Number(sectionForm['Asignación']?.recorridoKm) || 0,
                        recorridoEntregado: Number(sectionForm['Asignación']?.recorridoEntregado) || 0
                      },
                      mantenimiento: {
                        tipo: sectionForm.Mantenimiento?.tipo || '',
                        gestion: sectionForm.Mantenimiento?.gestion || '',
                        lugarMantenimiento: sectionForm.Mantenimiento?.lugarMantenimiento || ''
                      },
                      seguros: {
                        placa: sectionForm.Seguros?.placa || '',
                        numero2024: sectionForm.Seguros?.numero2024 || '',
                        importeAsegurado2024: Number(sectionForm.Seguros?.importeAsegurado2024) || 0,
                        detalle: sectionForm.Seguros?.detalle || ''
                      },
                      itv: {
                        placa: sectionForm.ITV?.placa || '',
                        detalle2024: sectionForm.ITV?.detalle2024 || '',
                        importe2024: Number(sectionForm.ITV?.importe2024) || 0
                      },
                      soat: {
                        placa: sectionForm.SOAT?.placa || '',
                        importe2024: Number(sectionForm.SOAT?.importe2024) || 0,
                        importe2025: Number(sectionForm.SOAT?.importe2025) || 0
                      },
                      impuestos: {
                        placa: sectionForm.Impuestos?.placa || '',
                        importe2023: Number(sectionForm.Impuestos?.importe2023) || 0,
                        importe2024: Number(sectionForm.Impuestos?.importe2024) || 0
                      }
                    };

                    const cleanData = (obj) => {
                      Object.keys(obj).forEach(key => {
                        if (obj[key] === undefined || obj[key] === null || obj[key] === '') {
                          delete obj[key];
                        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                          cleanData(obj[key]);
                          if (Object.keys(obj[key]).length === 0) {
                            delete obj[key];
                          }
                        }
                      });
                      return obj;
                    };

                    const cleanedData = cleanData({ ...maquinariaPayload });
                    
                    const response = await fetch(url, {
                      method: 'PUT',
                      headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                      },
                      body: JSON.stringify(cleanedData),
                    });

                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({}));
                      throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
                    }
                    fetchMaquinarias();
                    setSnackbar({ open: true, message: 'Información actualizada', severity: 'success' });
                  } catch (error) {
                    setSnackbar({ open: true, message: `Error al guardar: ${error.message}`, severity: 'error' });
                  }
                }}>Guardar</Button>
              </Box>
            </Paper>
            {renderModal()}
          </Box>
          {/* Panel derecho: imagen y navegación */}
          <Box sx={{ width: { xs: '100%', md: 260 }, minWidth: { xs: 'auto', md: 200 }, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4 }}>
            <Avatar src={maquinariaImage} sx={{ width: 120, height: 120, mb: 3, boxShadow: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
              {SECTIONS.map(sec => (
                <Button
                  key={sec}
                  variant={activeSection === sec ? 'contained' : 'outlined'}
                  onClick={() => setActiveSection(sec)}
                  sx={{ minWidth: 120 }}
                  fullWidth
                >
                  {sec}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h5">Maquinaria</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                select
                label="Mostrar"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value);
                  setCurrentPage(1);
                }}
                size="small"
                sx={{ width: 120 }}
              >
                {pageSizeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option === "Todos" ? "Todos" : `${option} registros`}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => setNewMaquinariaModalOpen(true)}>
                Nuevo
              </Button>
            </Box>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : maquinarias.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant="h6" color="textSecondary">
                No hay registros disponibles
              </Typography>
            </Box>
          ) : (
            <>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Gestión</TableCell>
                    <TableCell>Placa</TableCell>
                    <TableCell>Detalle</TableCell>
                    <TableCell>Unidad</TableCell>
                    <TableCell>Adqui.</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Marca</TableCell>
                    <TableCell>Modelo</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell>Nro. Motor</TableCell>
                    <TableCell>Nro. Chasis</TableCell>
                    <TableCell>Fecha Registro</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getDisplayedData().map((m) => {
                    const id = m._id?.$oid || m._id || m.id;
                    if (!id) return null;
                    const cleanId = id.toString().replace(/[^a-zA-Z0-9]/g, '');
                    return (
                      <TableRow key={cleanId}>
                        <TableCell>{m.gestion || ''}</TableCell>
                        <TableCell>{m.placa || ''}</TableCell>
                        <TableCell>{m.detalle || ''}</TableCell>
                        <TableCell>{m.unidad || ''}</TableCell>
                        <TableCell>{m.adqui || ''}</TableCell>
                        <TableCell>{m.codigo || ''}</TableCell>
                        <TableCell>{m.tipo || ''}</TableCell>
                        <TableCell>{m.marca || ''}</TableCell>
                        <TableCell>{m.modelo || ''}</TableCell>
                        <TableCell>{m.color || ''}</TableCell>
                        <TableCell>{m.nroMotor || ''}</TableCell>
                        <TableCell>{m.nroChasis || ''}</TableCell>
                        <TableCell>
                          {m.fechaRegistro ? new Date(m.fechaRegistro).toLocaleDateString() : ''}
                        </TableCell>
                        <TableCell align="right">
                          <Button 
                            onClick={() => handleDetailsClick(cleanId)}
                            size="small" 
                            variant="outlined" 
                            color="primary"
                          >
                            Historial
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {maquinarias.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, page) => setCurrentPage(page)}
                    disabled={pageSize === "Todos"}
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}
      {renderNewMaquinariaModal()}
    </Box>
  );
};

export default Maquinaria;