import { useEffect, useState } from "react";
import "../styles.css";
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
  Avatar,
  Pagination,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  Paper,
  TableContainer
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
// Importar componentes de secciones
import ControlMain from "../Control/ControlMain";
import AsignacionMain from "../Asignacion/AsignacionMain";
import MantenimientoMain from "../Mantenimiento/MantenimientoMain";
import SeguroMain from "../Seguros/SeguroMain";
import ITVMain from "../ITV/ITVMain";
import SOATMain from "../SOAT/SOATMain";
import ImpuestoMain from "../Impuestos/ImpuestoMain";

// Definición de secciones y formularios
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
    { name: 'nro_motor', label: 'Nro Motor' },
    { name: 'nro_chasis', label: 'Nro. Chasis' },
    { name: 'fecha_registro', label: 'Fecha Registro', type: 'date' },
    { name: 'imagen', label: 'Imagen', type: 'file' },
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
const maquinariaImage = 'https://images.unsplash.com/photo-1511918984145-48de785d4c4e?auto=format&fit=crop&w=400&q=80';

const Maquinaria = () => {
  const [maquinarias, setMaquinarias] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [detailView, setDetailView] = useState(false);
  const [activeSection, setActiveSection] = useState('Maquinaria');
  const [sectionForm, setSectionForm] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({});
  const [modalErrors, setModalErrors] = useState({});
  const [newMaquinariaModalOpen, setNewMaquinariaModalOpen] = useState(false);
  const [newMaquinariaForm, setNewMaquinariaForm] = useState({});
  const [newMaquinariaErrors, setNewMaquinariaErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  // Cargar maquinarias
  useEffect(() => {
    fetchMaquinarias();
  }, []);

  const fetchMaquinarias = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
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
        Maquinaria: { ...data, imagen: data.imagen || '' },
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

  // Manejo de archivo y previsualización
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewMaquinariaForm({
          ...newMaquinariaForm,
          imagen: reader.result  // Guarda como base64
        });
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para eliminar maquinaria
  const handleDeleteMaquinaria = async () => {
    const id = sectionForm.Maquinaria?._id?.$oid || sectionForm.Maquinaria?._id;
    if (!id) {
      setSnackbar({ open: true, message: 'ID de maquinaria no encontrado', severity: 'error' });
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/maquinaria/${id}/`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar la maquinaria');
      }
      
      setSnackbar({ open: true, message: 'Maquinaria eliminada exitosamente', severity: 'success' });
      setDetailView(false);
      fetchMaquinarias(); // Refrescar lista
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  // Actualizar maquinaria
  const handleUpdateMaquinaria = async () => {
    const errors = {};
    fieldLabels.Maquinaria.forEach(field => {
      if (!['adqui', 'codigo', 'tipo', 'marca', 'modelo', 'color', 'nro_motor', 'nro_chasis'].includes(field.name)) {
        if (!sectionForm.Maquinaria[field.name] || !sectionForm.Maquinaria[field.name].toString().trim()) {
          errors[field.name] = 'Este campo es obligatorio';
        }
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setNewMaquinariaErrors(errors);
      return;
    }

    try {
      const formattedData = {
        ...sectionForm.Maquinaria,
        fecha_registro: sectionForm.Maquinaria.fecha_registro ? 
          new Date(sectionForm.Maquinaria.fecha_registro).toISOString().split('T')[0] : '',
      };

      const cleanData = (obj) => {
        const newObj = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
            newObj[key] = obj[key];
          }
        });
        return newObj;
      };

      const cleanedData = cleanData(formattedData);
      
      const response = await fetch(`http://localhost:8000/api/maquinaria/${sectionForm.Maquinaria._id?.$oid || sectionForm.Maquinaria._id}/`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      setSnackbar({ open: true, message: 'Maquinaria actualizada exitosamente', severity: 'success' });
      fetchMaquinarias();
    } catch (error) {
      setSnackbar({ open: true, message: `Error al actualizar maquinaria: ${error.message}`, severity: 'error' });
    }
  };

  // Renderizar el formulario de la sección activa
  const renderSectionForm = () => {
    const maquinariaId = sectionForm.Maquinaria?._id?.$oid || sectionForm.Maquinaria?._id;
    const maquinariaPlaca = sectionForm.Maquinaria?.placa;

    switch (activeSection) {
      case 'Control':
        return <ControlMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      case 'Asignación':
        return <AsignacionMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      case 'Mantenimiento':
        return <MantenimientoMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      case 'Seguros':
        return <SeguroMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      case 'ITV':
        return <ITVMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      case 'Impuestos':
        return <ImpuestoMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      case 'SOAT':
        return <SOATMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      default:
        return (
          <Grid container spacing={2}>
            {fieldLabels.Maquinaria.map((field) => (
              <Grid item xs={12} md={6} key={field.name}>
                {field.name === 'imagen' ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ marginTop: '8px' }}
                    />
                  </>
                ) : (
                  <TextField
                    fullWidth
                    label={field.label}
                    name={field.name}
                    type={field.type || 'text'}
                    value={sectionForm.Maquinaria[field.name] || ''}
                    onChange={e => {
                      setSectionForm((prev) => ({
                        ...prev,
                        [activeSection]: {
                          ...prev[activeSection],
                          [field.name]: e.target.value,
                        },
                      }));
                      
                      // Validación en tiempo real
                      if (!e.target.value && !['adqui', 'codigo', 'tipo', 'marca', 'modelo', 'color', 'nro_motor', 'nro_chasis', 'imagen'].includes(field.name)) {
                        setNewMaquinariaErrors({
                          ...newMaquinariaErrors,
                          [field.name]: 'Este campo es obligatorio'
                        });
                      } else {
                        const newErrors = { ...newMaquinariaErrors };
                        delete newErrors[field.name];
                        setNewMaquinariaErrors(newErrors);
                      }
                    }}
                    size="small"
                    error={!!newMaquinariaErrors[field.name]}
                    helperText={newMaquinariaErrors[field.name] || ''}
                    InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                    disabled={field.name === 'placa' && activeSection !== 'Maquinaria'}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        );
    }
  };

  // Renderizar el modal de nuevo registro
  const renderModal = () => (
    <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
      <Paper sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        p: 3, 
        minWidth: 320,
        width: { xs: '90%', sm: 500 },
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
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
      if (!['adqui', 'codigo', 'tipo', 'marca', 'modelo', 'color', 'nro_motor', 'nro_chasis'].includes(field.name)) {
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
        fecha_registro: newMaquinariaForm.fecha_registro ? 
          new Date(newMaquinariaForm.fecha_registro).toISOString().split('T')[0] : '',
      };
      
      if (newMaquinariaForm.imagen) {
        formattedData.imagen = newMaquinariaForm.imagen;
      }
      
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
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      setNewMaquinariaModalOpen(false);
      setNewMaquinariaForm(() => {
        const initialForm = {};
        fieldLabels.Maquinaria.forEach(field => {
          initialForm[field.name] = field.type === 'number' ? 0 : '';
          if (field.name === 'fecha_registro') {
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

  const renderNewMaquinariaModal = () => (
    <Modal open={newMaquinariaModalOpen} onClose={() => setNewMaquinariaModalOpen(false)}>
      <Paper sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        p: 3, 
        width: { xs: '90%', sm: '95%' },
        maxWidth: 800,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Crear Nueva Maquinaria</Typography>
        <Grid container spacing={2}>
          {fieldLabels.Maquinaria.map((field) => (
            <Grid item xs={12} sm={6} key={field.name}>
              {field.name === 'imagen' ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ marginTop: '8px' }}
                />
              ) : (
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
              )}
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

  // Paginación y datos mostrados
  const totalPages = pageSize === "Todos" ? 1 : Math.ceil(maquinarias.length / parseInt(pageSize, 10));
  
  const getDisplayedData = () => {
    if (!Array.isArray(maquinarias)) return [];
    if (pageSize === "Todos") return maquinarias;
    const start = (currentPage - 1) * parseInt(pageSize, 10);
    const end = start + parseInt(pageSize, 10);
    return maquinarias.slice(start, end);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: { xs: 2, md: 4 },
          mb: 4
        }}>
          {/* Panel principal: formulario */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              {renderSectionForm()}
              
              {/* Mostrar botones solo en la sección Maquinaria */}
              {activeSection === 'Maquinaria' && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: 1, 
                  mt: 3,
                  flexWrap: 'wrap'
                }}>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      bgcolor: 'yellow', 
                      color: 'black',
                      minWidth: 120 
                    }}
                    onClick={() => setDetailView(false)}
                  >
                    Volver
                  </Button>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      bgcolor: 'red', 
                      color: 'white',
                      minWidth: 120 
                    }}
                    onClick={handleDeleteMaquinaria}
                  >
                    Eliminar
                  </Button>
                  <Button 
                    variant="contained" 
                    color="info"
                    sx={{ minWidth: 120 }}
                    onClick={handleUpdateMaquinaria}
                  >
                    Guardar
                  </Button>
                </Box>
              )}
            </Paper>
            {renderModal()}
          </Box>
          
          {/* Panel derecho: imagen y navegación */}
          <Box sx={{ 
            width: { xs: '100%', md: 200 },
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            pt: 4
          }}>
            <Avatar 
              src={selectedImage || sectionForm.Maquinaria?.imagen || maquinariaImage} 
              sx={{ 
                width: 100, 
                height: 100, 
                mb: 3, 
                boxShadow: 2,
                borderRadius: 2
              }} 
            />
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1, 
              width: '100%',
              px: 1
            }}>
              {SECTIONS.map(sec => (
                <Button
                  key={sec}
                  variant={activeSection === sec ? 'contained' : 'outlined'}
                  onClick={() => setActiveSection(sec)}
                  sx={{ 
                    minWidth: 120,
                    justifyContent: 'flex-start',
                    py: 1
                  }}
                >
                  {sec}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      ) : (
        <>
          <Box sx={{ 
            display: "flex", 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: "space-between",
            alignItems: { sm: 'center' },
            mb: 2,
            gap: 2
          }}>
            <Typography variant="h5">Maquinaria</Typography>
            <Box sx={{ 
              display: "flex", 
              gap: 2,
              flexWrap: 'wrap'
            }}>
              <TextField
                select
                label="Mostrar"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value);
                  setCurrentPage(1);
                }}
                size="small"
                sx={{ width: { xs: '100%', sm: 120 } }}
              >
                <MenuItem key="Todos" value="Todos">Todos</MenuItem>
                <MenuItem key="5" value={5}>5 registros</MenuItem>
                <MenuItem key="10" value={10}>10 registros</MenuItem>
                <MenuItem key="20" value={20}>20 registros</MenuItem>
                <MenuItem key="50" value={50}>50 registros</MenuItem>
                <MenuItem key="100" value={100}>100 registros</MenuItem>
              </TextField>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<AddIcon />} 
                onClick={() => setNewMaquinariaModalOpen(true)}
                sx={{ 
                  width: { xs: '100%', sm: 'auto' },
                  whiteSpace: 'nowrap'
                }}
              >
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
              <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                <Table stickyHeader sx={{ minWidth: 800 }} size="medium">
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
                      <TableCell align="left">Acciones</TableCell>
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
                          <TableCell>{m.nro_motor || ''}</TableCell>
                          <TableCell>{m.nro_chasis || ''}</TableCell>
                          <TableCell>
                            {m.fecha_registro ? new Date(m.fecha_registro).toLocaleDateString() : ''}
                          </TableCell>
                          <TableCell align="right">
                            <Button 
                              onClick={() => handleDetailsClick(cleanId)}
                              size="small" 
                              variant="outlined" 
                              color="primary"
                              sx={{p:0.05}}
                            >
                              Historial
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {maquinarias.length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  mt: 3
                }}>
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