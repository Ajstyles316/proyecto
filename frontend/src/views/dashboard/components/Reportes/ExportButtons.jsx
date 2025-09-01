import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';

const ExportButtons = ({ onExportPDF, onExportExcel, disabled = false, size = 'medium' }) => {
  const buttonSx = {
    px: 3,
    py: 1,
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: 2,
    '&:hover': {
      transform: 'translateY(-2px)',
      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
    },
    '&:active': {
      transform: 'translateY(0)'
    },
    '&:disabled': {
      background: 'linear-gradient(145deg, #9e9e9e 0%, #757575 100%)',
      boxShadow: 'none',
      transform: 'none'
    }
  };

  const excelButtonSx = {
    ...buttonSx,
    background: 'linear-gradient(145deg, #43a047 0%, #2e7d32 100%)',
    boxShadow: '0 4px 12px rgba(67, 160, 71, 0.25)',
    '&:hover': {
      ...buttonSx['&:hover'],
      background: 'linear-gradient(145deg, #388e3c 0%, #1b5e20 100%)',
      boxShadow: '0 6px 16px rgba(67, 160, 71, 0.35)'
    },
    '&:active': {
      ...buttonSx['&:active'],
      boxShadow: '0 2px 6px rgba(67, 160, 71, 0.25)'
    }
  };

  const pdfButtonSx = {
    ...buttonSx,
    background: 'linear-gradient(145deg, #d21919ff 0%, #a10d0dff 100%)',
    boxShadow: '0 4px 12px rgba(210, 25, 25, 0.25)',
    '&:hover': {
      ...buttonSx['&:hover'],
      background: 'linear-gradient(145deg, #c01515ff 0%, #9d0a0aff 100%)',
      boxShadow: '0 6px 16px rgba(210, 25, 25, 0.35)'
    },
    '&:active': {
      ...buttonSx['&:active'],
      boxShadow: '0 2px 6px rgba(210, 25, 25, 0.25)'
    }
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={onExportExcel}
        disabled={disabled}
        startIcon={<TableChartIcon />}
        size={size}
        sx={excelButtonSx}
      >
        Exportar Excel
      </Button>
      <Button
        variant="contained"
        onClick={onExportPDF}
        disabled={disabled}
        startIcon={<PictureAsPdfIcon />}
        size={size}
        sx={pdfButtonSx}
      >
        Exportar PDF
      </Button>
    </>
  );
};

ExportButtons.propTypes = {
  onExportPDF: PropTypes.func.isRequired,
  onExportExcel: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default ExportButtons;
