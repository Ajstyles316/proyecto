import { useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, Button, Grid } from '@mui/material';
import { useIsReadOnly, useUser } from 'src/components/UserContext.jsx';
import ExportButtons from './ExportButtons';

const BusquedaForm = ({ onBuscar, onExportPDF, onExportXLS, maquinaria, loading }) => {
  const [search, setSearch] = useState('');
  const { user } = useUser();
  const permisosReportes = user?.permisos?.Reportes || {};
  // Permitir exportar siempre a admin/encargado
  const isAdminOrEncargado = user?.Cargo?.toLowerCase() === 'admin' || user?.Cargo?.toLowerCase() === 'encargado';
  const canExport = isAdminOrEncargado || permisosReportes.editar;
  const isReadOnly = useIsReadOnly();

  const handleSubmit = () => {
    onBuscar(search);
  };

  return (
    <Grid container alignItems="center" spacing={2} mb={3}>
      <Grid item xs={12} md={6}>
        <TextField
          label="Buscar"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading} sx={{ ml: 2 }}>
          Buscar
        </Button>
      </Grid>
      
    </Grid>
  );
};

BusquedaForm.propTypes = {
  onBuscar: PropTypes.func.isRequired,
  onExportPDF: PropTypes.func.isRequired,
  onExportXLS: PropTypes.func.isRequired,
  maquinaria: PropTypes.object,
  loading: PropTypes.bool.isRequired
};

export default BusquedaForm;
