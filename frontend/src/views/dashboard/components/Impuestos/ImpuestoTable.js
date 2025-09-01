import PropTypes from 'prop-types';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Typography, Box, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import BlockIcon from '@mui/icons-material/Block';

const ImpuestoTable = ({ 
  impuestos, 
  onEdit, 
  onDelete, 
  loading = false,
  isReadOnly = false,
  canEdit = true,
  canDelete = true,
  deleteLoading = {},
  showActionsColumn = true 
}) => {
  const handleDownloadPDF = (impuesto) => {
    if (impuesto.archivo_pdf) {
      try {
        const byteCharacters = atob(impuesto.archivo_pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = impuesto.nombre_archivo || 'impuesto.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error descargando PDF:', error);
        alert('Error al descargar el archivo PDF');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando Impuestos...
        </Typography>
      </Box>
    );
  }

  if (!impuestos || impuestos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No hay registros de Impuesto disponibles
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600 }}>Gestión</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Archivo</TableCell>
            {showActionsColumn && <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {impuestos.map((impuesto) => (
            <TableRow key={impuesto._id} sx={{
              '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
            }}>
              <TableCell>{impuesto.gestion}</TableCell>
              <TableCell>
                {impuesto.archivo_pdf ? (
                  <Tooltip title="Descargar PDF">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleDownloadPDF(impuesto)}
                    >
                      <PictureAsPdfIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Typography variant="body2" color="text.secondary">Sin archivo</Typography>
                )}
              </TableCell>
              {showActionsColumn && (
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    {canEdit && !isReadOnly && (
                      <Tooltip title="Editar">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => onEdit(impuesto)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && !isReadOnly && (
                      <Tooltip title="Eliminar">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => onDelete(impuesto._id)}
                          disabled={deleteLoading[impuesto._id]}
                        >
                          {deleteLoading[impuesto._id] ? (
                            <CircularProgress size={16} />
                          ) : (
                            <BlockIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

ImpuestoTable.propTypes = {
  impuestos: PropTypes.array.isRequired,
  maquinariaPlaca: PropTypes.string,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
  deleteLoading: PropTypes.object,
  showActionsColumn: PropTypes.bool
};

export default ImpuestoTable; 