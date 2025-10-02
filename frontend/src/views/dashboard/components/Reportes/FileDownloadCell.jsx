import PropTypes from 'prop-types';
import { useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PDFViewer from '../../../../components/PDFViewer';

// Función auxiliar para validar y limpiar base64
const validateAndCleanBase64 = (base64String) => {
  if (!base64String || typeof base64String !== 'string') {
    return null;
  }

  // Limpiar espacios y caracteres de nueva línea
  let cleaned = base64String.trim().replace(/\s/g, '');
  
  // Remover prefijos comunes de data URLs
  if (cleaned.startsWith('data:application/pdf;base64,')) {
    cleaned = cleaned.replace('data:application/pdf;base64,', '');
  }
  
  // Verificar que solo contenga caracteres válidos de base64
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    return null;
  }
  
  // Asegurar que la longitud sea múltiplo de 4
  while (cleaned.length % 4 !== 0) {
    cleaned += '=';
  }
  
  return cleaned;
};

const FileDownloadCell = ({ fileName, fileData, showIcon = true }) => {
  // Estados para el visor de PDF
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  
  const handleViewPDF = () => {
    if (fileData?.archivo_pdf) {
      setPdfViewerOpen(true);
    }
  };
  
  const handleClosePdfViewer = () => {
    setPdfViewerOpen(false);
  };
  
  if (!fileName) {
    return <Typography variant="body2" color="text.secondary">Sin archivo</Typography>;
  }

  const handleDownload = () => {
    console.log('🔍 FileDownloadCell - Datos recibidos:', { fileName, fileData });
    
    if (!fileData || !fileData.archivo_pdf) {
      console.warn('No hay datos de archivo para descargar', { fileData });
      alert('No hay datos de archivo disponibles para descargar');
      return;
    }

    try {
      // Verificar que los datos no estén vacíos
      if (fileData.archivo_pdf.trim() === '') {
        alert('El archivo está vacío');
        return;
      }

      // Validar y limpiar la cadena base64
      const cleanedBase64 = validateAndCleanBase64(fileData.archivo_pdf);
      
      if (!cleanedBase64) {
        console.error('❌ Cadena base64 inválida:', fileData.archivo_pdf.substring(0, 100) + '...');
        alert('El archivo no está en formato válido para descarga. Por favor, contacte al administrador.');
        return;
      }

      console.log('🔍 Intentando decodificar base64 limpio...');
      const byteCharacters = atob(cleanedBase64);
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
      
      console.log('✅ Archivo descargado exitosamente:', fileName);
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      console.error('❌ Datos problemáticos:', { 
        fileName, 
        dataLength: fileData.archivo_pdf?.length,
        dataPreview: fileData.archivo_pdf?.substring(0, 100) + '...'
      });
      alert(`Error al descargar el archivo: ${error.message}\n\nPor favor, contacte al administrador del sistema.`);
    }
  };

  return (
    <>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {showIcon && (
        <Tooltip title={fileName.toLowerCase().endsWith('.pdf') && fileData?.archivo_pdf ? "Ver PDF" : "Descargar archivo"}>
          <IconButton 
            size="small" 
            color="primary"
            onClick={fileName.toLowerCase().endsWith('.pdf') && fileData?.archivo_pdf ? handleViewPDF : handleDownload}
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
        onClick={fileName.toLowerCase().endsWith('.pdf') && fileData?.archivo_pdf ? handleViewPDF : handleDownload}
      >
        {fileName}
      </Typography>
    </Box>
    
    {/* Visor de PDF */}
    <PDFViewer
      open={pdfViewerOpen}
      onClose={handleClosePdfViewer}
      pdfData={fileData?.archivo_pdf}
      fileName={fileName}
      title="Archivo - Visualizador de PDF"
    />
    </>
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
