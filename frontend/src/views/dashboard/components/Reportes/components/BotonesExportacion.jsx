import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';

const BotonesExportacion = ({ onExportPDF, onExportExcel }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
      <Button
        variant="contained"
        color="error"
        startIcon={<PictureAsPdfIcon />}
        onClick={onExportPDF}
        sx={{ 
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 'bold'
        }}
      >
        Exportar PDF
      </Button>
      <Button
        variant="contained"
        color="success"
        startIcon={<TableChartIcon />}
        onClick={onExportExcel}
        sx={{ 
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 'bold'
        }}
      >
        Exportar Excel
      </Button>
    </Box>
  );
};

BotonesExportacion.propTypes = {
  onExportPDF: PropTypes.func.isRequired,
  onExportExcel: PropTypes.func.isRequired,
};

export default BotonesExportacion;