import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  ZoomIn,
  Download,
  PictureAsPdf,
  Close
} from '@mui/icons-material';

const PDFViewer = ({ 
  pdfData, 
  fileName, 
  open, 
  onClose, 
  title = "Visualizador de PDF" 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = () => {
    if (!pdfData) {
      alert('No hay datos de archivo disponibles para descargar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Limpiar el base64 removiendo el prefijo data:application/pdf;base64,
      let base64Data = pdfData;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }
      
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'archivo.pdf';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar la URL después de un tiempo
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
    } catch (error) {
      console.error('Error descargando PDF:', error);
      setError('Error al descargar el archivo PDF');
      alert('Error al descargar el archivo PDF');
    } finally {
      setLoading(false);
    }
  };


  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PictureAsPdf color="error" />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Descargar archivo">
            <IconButton
              size="small"
              onClick={handleDownload}
              disabled={loading}
              sx={{ 
                bgcolor: 'success.main', 
                color: 'white',
                '&:hover': { bgcolor: 'success.dark' }
              }}
            >
              {loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Download />
              )}
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ 
              bgcolor: 'grey.500', 
              color: 'white',
              '&:hover': { bgcolor: 'grey.700' }
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ 
        flex: 1, 
        p: 0, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {pdfData ? (
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            bgcolor: 'grey.100'
          }}>
            <iframe
              src={`data:application/pdf;base64,${pdfData.includes(',') ? pdfData.split(',')[1] : pdfData}`}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title={fileName || 'PDF Viewer'}
            />
          </Box>
        ) : (
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <PictureAsPdf sx={{ fontSize: 64, color: 'grey.400' }} />
            <Typography variant="h6" color="text.secondary">
              No hay archivo PDF disponible
            </Typography>
          </Box>
        )}
        
        {error && (
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            bgcolor: 'error.light',
            color: 'error.contrastText',
            p: 2,
            borderRadius: 1,
            boxShadow: 2
          }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

PDFViewer.propTypes = {
  pdfData: PropTypes.string,
  fileName: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string
};

PDFViewer.defaultProps = {
  pdfData: null,
  fileName: '',
  title: "Visualizador de PDF"
};

export default PDFViewer;
