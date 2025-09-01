import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useUser } from '../../../../components/UserContext';

const SeguroTable = ({ seguros, onEdit, onDelete, loading, isReadOnly, canEdit = false, canDelete = false, deleteLoading = {} }) => {
  const { user } = useUser();
  const isTechnician = user?.Cargo?.toLowerCase() === 'tecnico' || user?.Cargo?.toLowerCase() === 'técnico';
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  
  const handleDownloadPDF = (seguro) => {
    if (seguro.archivo_pdf) {
      try {
        // Convertir base64 a blob
        const byteCharacters = atob(seguro.archivo_pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Crear URL y descargar
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = seguro.nombre_archivo || 'seguro.pdf';
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
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      return '';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
        <CircularProgress color="primary" />
        <Typography variant="body1" sx={{ ml: 2 }}>Cargando seguros...</Typography>
      </Box>
    );
  }

  if (seguros.length === 0) {
    return (
      <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
        No hay registros de seguro para esta maquinaria.
      </Typography>
    );
  }

  // Mostrar columna de acciones para encargados y otros roles con permisos (excepto técnicos)
  const showActionsColumn = (isEncargado || (!isTechnician && (canEdit || canDelete)));

  return (
    <Table sx={{
      '& .MuiTableCell-root': {
        borderBottom: '1px solid rgba(224, 224, 224, 1)',
      },
      '& .MuiTableRow-root:hover': {
        backgroundColor: 'rgba(25, 118, 210, 0.04)',
      },
      '& .MuiTableHead-root .MuiTableCell-root': {
        borderBottom: '2px solid rgba(224, 224, 224, 1)',
        fontWeight: 600,
      }
    }}>
      <TableHead>
        <TableRow sx={{ bgcolor: 'grey.50' }}>
          <TableCell sx={{ fontWeight: 600 }}>Fecha Inicial</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Fecha Final</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>N° Póliza</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Compañía</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Importe</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Archivo</TableCell>
          {showActionsColumn && <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {seguros.map((seguro) => (
          <TableRow key={seguro._id} sx={{
            '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
          }}>
            <TableCell>{formatDate(seguro.fecha_inicial)}</TableCell>
            <TableCell>{formatDate(seguro.fecha_final)}</TableCell>
            <TableCell>{seguro.numero_poliza}</TableCell>
            <TableCell>{seguro.compania_aseguradora}</TableCell>
            <TableCell>{seguro.importe ? `Bs. ${seguro.importe}` : '-'}</TableCell>
            <TableCell>
              {seguro.archivo_pdf ? (
                <Tooltip title="Descargar PDF">
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleDownloadPDF(seguro)}
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
                {(isEncargado || canEdit) && (
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => onEdit(seguro)}
                  >
                    <EditIcon sx={{ color: '#03a9f4' }} />
                  </IconButton>
                )}
                {(isEncargado || canDelete) && (
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => onDelete(seguro._id)}
                    disabled={deleteLoading[seguro._id]}
                  >
                    {deleteLoading[seguro._id] ? (
                      <CircularProgress size={16} color="error" />
                    ) : (
                      <BlockIcon sx={{ color: '#f44336' }} />
                    )}
                  </IconButton>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

SeguroTable.propTypes = {
  seguros: PropTypes.array.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
};

export default SeguroTable; 