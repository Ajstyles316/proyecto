import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  FileDownload as ExcelIcon
} from '@mui/icons-material';
import { useUser } from 'src/components/UserContext.jsx';
import * as XLSX from 'xlsx';

const CSVButtons = ({ onDataUpdated }) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const { user } = useUser();
  const permisosPronostico = user?.permisos?.['Pronóstico'] || {};
  const isAdmin = user?.Cargo?.toLowerCase() === 'admin';
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isTecnico = user?.Cargo?.toLowerCase() === 'técnico';
  const canEdit = isEncargado || isTecnico || permisosPronostico.editar;

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    } else {
      alert('Por favor selecciona un archivo Excel válido (.xlsx o .xls).');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('excel_file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/api/pronostico/excel-upload/', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResults(result);
        if (onDataUpdated) {
          onDataUpdated();
        }
      } else {
        setUploadResults({
          error: result.error || 'Error al procesar el archivo Excel',
          debug_info: result.debug_info
        });
      }
    } catch (error) {
      setUploadResults({
        error: 'Error de conexión: ' + error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/pronostico/');
      const data = await response.json();
      
      // Crear el contenido del Excel usando la librería XLSX
      const headers = ['Placa', 'Detalle', 'Fecha Asignación', 'Horas Operación', 'Recorrido', 'Resultado', 'Riesgo', 'Probabilidad', 'Fecha Mantenimiento', 'Urgencia', 'Recomendaciones'];
      const rows = data.map(item => [
        item.placa || '',
        item.detalle || '',
        item.fecha_asig || '',
        item.horas_op || '',
        item.recorrido || '',
        item.resultado || '',
        item.riesgo || '',
        item.probabilidad || '',
        item.fecha_mantenimiento || '',
        item.urgencia || '',
        Array.isArray(item.recomendaciones) ? item.recomendaciones.join('; ') : (item.recomendaciones || '')
      ]);
      
      // Crear el workbook y worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      
      // Agregar el worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Pronósticos');
      
      // Generar el archivo Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Descargar el archivo
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pronosticos_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      alert('Error al exportar el archivo Excel');
    }
  };


  const handleCloseDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setUploadResults(null);
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'creado':
      case 'actualizado':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'creado':
      case 'actualizado':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  if (isAdmin) {
    return (
      <Box display="flex" gap={2} mb={2}>
        <Tooltip title="Esta función no está disponible para Administradores">
          <span>
            <Button
              variant="contained"
              startIcon={<ExcelIcon />}
              disabled
              sx={{ 
                backgroundColor: '#9e9e9e',
                '&:hover': {
                  backgroundColor: '#757575'
                }
              }}
            >
              Exportar Excel
            </Button>
          </span>
        </Tooltip>
      </Box>
    );
  }

  if (!canEdit) {
    return null;
  }

  return (
    <Box display="flex" gap={2} mb={2}>
      {/* Botón de Excel - Solo para Encargado y Técnico */}
      <Tooltip title="Exportar pronósticos a Excel">
        <Button
          variant="contained"
          startIcon={<ExcelIcon />}
          onClick={handleExportExcel}
          sx={{ 
            backgroundColor: '#2196f3',
            '&:hover': {
              backgroundColor: '#1976d2'
            }
          }}
        >
          Exportar Excel
        </Button>
      </Tooltip>
      
      {/* Botón de Cargar Excel - Solo para Encargado y Técnico */}
      <Tooltip title="Cargar pronósticos desde Excel">
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
          disabled={uploading}
          sx={{ 
            backgroundColor: '#4caf50',
            '&:hover': {
              backgroundColor: '#45a049'
            }
          }}
        >
          Cargar Excel
        </Button>
      </Tooltip>

             <Dialog open={uploadDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
         <DialogTitle>
           Cargar Pronósticos desde Excel
         </DialogTitle>
        <DialogContent>
                     <Typography variant="body2" color="text.secondary" mb={2}>
             El archivo Excel debe contener las siguientes columnas:
           </Typography>
          
          <Box mb={2}>
            <Typography variant="body2" component="div">
              <strong>Columnas requeridas:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="placa - Identificador de la maquinaria" />
              </ListItem>
              <ListItem>
                <ListItemText primary="fecha_asig - Fecha de asignación (YYYY-MM-DD)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="horas_op - Horas de operación" />
              </ListItem>
              <ListItem>
                <ListItemText primary="recorrido - Kilómetros recorridos" />
              </ListItem>
            </List>
          </Box>

                     <Box mb={2}>
             <input
               accept=".xlsx,.xls"
               style={{ display: 'none' }}
               id="excel-file-input"
               type="file"
               onChange={handleFileSelect}
             />
             <label htmlFor="excel-file-input">
               <Button variant="outlined" component="span" disabled={uploading}>
                 Seleccionar archivo Excel
               </Button>
             </label>
             {selectedFile && (
               <Typography variant="body2" mt={1}>
                 Archivo seleccionado: <strong>{selectedFile.name}</strong>
               </Typography>
             )}
           </Box>

          {uploadResults && (
            <Box mt={2}>
              {uploadResults.error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {uploadResults.error}
                  </Typography>
                  {uploadResults.debug_info && (
                    <Box mt={1}>
                      <Typography variant="caption" component="div">
                        <strong>Información de debug:</strong>
                      </Typography>
                      <Typography variant="caption" component="div">
                        Columnas detectadas: {uploadResults.debug_info.columnas_detectadas?.join(', ')}
                      </Typography>
                      <Typography variant="caption" component="div">
                        Columnas requeridas: {uploadResults.debug_info.columnas_requeridas?.join(', ')}
                      </Typography>
                      <Typography variant="caption" component="div">
                        Columnas faltantes: {uploadResults.debug_info.columnas_faltantes?.join(', ')}
                      </Typography>
                    </Box>
                  )}
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {uploadResults.mensaje}
                  </Typography>
                  <Box mt={1}>
                    <Typography variant="caption" component="div">
                      <strong>Resumen:</strong>
                    </Typography>
                    <Typography variant="caption" component="div">
                      Total de filas: {uploadResults.resumen?.total_filas}
                    </Typography>
                    <Typography variant="caption" component="div">
                      Exitosos: {uploadResults.resumen?.exitosos}
                    </Typography>
                    <Typography variant="caption" component="div">
                      Errores: {uploadResults.resumen?.errores}
                    </Typography>
                  </Box>
                </Alert>
              )}

              {uploadResults.resultados && uploadResults.resultados.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" mb={1}>
                    Detalles por fila:
                  </Typography>
                  <List dense>
                    {uploadResults.resultados.slice(0, 10).map((resultado, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {getStatusIcon(resultado.estado)}
                        </ListItemIcon>
                        <ListItemText
                          primary={`Fila ${resultado.fila}: ${resultado.placa}`}
                          secondary={
                            resultado.estado === 'error' 
                              ? resultado.error 
                              : `${resultado.estado} - ${resultado.resultado}`
                          }
                        />
                        <Chip
                          label={resultado.estado}
                          color={getStatusColor(resultado.estado)}
                          size="small"
                        />
                      </ListItem>
                    ))}
                    {uploadResults.resultados.length > 10 && (
                      <ListItem>
                        <ListItemText
                          secondary={`... y ${uploadResults.resultados.length - 10} resultados más`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={uploading}>
            Cerrar
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : null}
          >
            {uploading ? 'Procesando...' : 'Cargar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CSVButtons; 