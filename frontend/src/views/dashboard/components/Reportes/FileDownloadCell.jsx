import PropTypes from 'prop-types';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const FileDownloadCell = ({ fileName, fileData, showIcon = true }) => {
  if (!fileName) {
    return <Typography variant="body2" color="text.secondary">Sin archivo</Typography>;
  }

  const handleDownload = () => {
    console.log('🔍 FileDownloadCell - Datos recibidos:', { fileName, fileData });
    
    if (!fileData || !fileData.archivo_pdf) {
      console.warn('No hay datos de archivo para descargar', { fileData });
      return;
    }

    try {
      const byteCharacters = atob(fileData.archivo_pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar la URL después de un tiempo
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      alert('Error al descargar el archivo');
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {showIcon && (
        <Tooltip title="Hacer clic para descargar">
          <IconButton 
            size="small" 
            color="primary"
            onClick={handleDownload}
            sx={{ 
              p: 0.5,
              '&:hover': { 
                backgroundColor: 'primary.light',
                transform: 'scale(1.1)'
              }
            }}
          >
            {fileName.toLowerCase().endsWith('.pdf') ? (
              <PictureAsPdfIcon fontSize="small" />
            ) : (
              <AttachFileIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}
      <Typography 
        variant="body2" 
        sx={{ 
          cursor: 'pointer',
          textDecoration: 'underline',
          color: 'primary.main',
          '&:hover': { color: 'primary.dark' }
        }}
        onClick={handleDownload}
      >
        {fileName}
      </Typography>
    </Box>
  );
};

FileDownloadCell.propTypes = {
  fileName: PropTypes.string,
  fileData: PropTypes.shape({
    archivo_pdf: PropTypes.string
  }),
  showIcon: PropTypes.bool
};

FileDownloadCell.defaultProps = {
  fileName: '',
  fileData: null,
  showIcon: true
};

export default FileDownloadCell;
