import PropTypes from 'prop-types';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Typography, Box, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import BlockIcon from '@mui/icons-material/Block';
const SOATTable = ({ 
  soats, 
  onEdit, 
  onDelete, 
  loading = false,
  isReadOnly = false,
  canEdit = true,
  canDelete = true,
  deleteLoading = {},
  showActionsColumn = true 
}) => {
  const handleDownloadPDF = (soat) => {
    if (soat.archivo_pdf) {
      try {
        const byteCharacters = atob(soat.archivo_pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = soat.nombre_archivo || 'soat.pdf';
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
          Cargando SOATs...
        </Typography>
      </Box>
    );
  }

  if (!soats || soats.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No hay registros de SOAT disponibles
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
          {soats.map((soat) => (
            <TableRow key={soat._id} sx={{
              '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
            }}>
              <TableCell>{soat.gestion}</TableCell>
              <TableCell>
                {soat.archivo_pdf ? (
                  <Tooltip title="Descargar PDF">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleDownloadPDF(soat)}
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
                          onClick={() => onEdit(soat)}
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
                          onClick={() => onDelete(soat._id)}
                          disabled={deleteLoading[soat._id]}
                        >
                          {deleteLoading[soat._id] ? (
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

SOATTable.propTypes = {
  soats: PropTypes.array.isRequired,
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

export default SOATTable; 