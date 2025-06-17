import PropTypes from 'prop-types';
import { Box, Paper, Button, Avatar, Typography, Grid, TextField } from '@mui/material';
import { SECTIONS } from '../utils/constants';
import ControlMain from '../../Control/ControlMain';
import AsignacionMain from '../../Asignacion/AsignacionMain';
import MantenimientoMain from '../../Mantenimiento/MantenimientoMain';
import SeguroMain from '../../Seguros/SeguroMain';
import ITVMain from '../../ITV/ITVMain';
import SOATMain from '../../SOAT/SOATMain';
import ImpuestoMain from '../../Impuestos/ImpuestoMain';
import { fieldLabels } from '../utils/fieldLabels';

const maquinariaImage = 'https://images.unsplash.com/photo-1511918984145-48de785d4c4e?auto=format&fit=crop&w=400&q=80';

const MaquinariaDetalle = ({
  sectionForm,
  activeSection,
  setActiveSection,
  setDetailView,
  handleDeleteMaquinaria,
  handleUpdateMaquinaria,
  selectedImage,
  setSectionForm,
  newMaquinariaErrors,
  setNewMaquinariaErrors,
  handleFileChange
}) => {
  const maquinariaId = sectionForm.Maquinaria?._id?.$oid || sectionForm.Maquinaria?._id;
  const maquinariaPlaca = sectionForm.Maquinaria?.placa;

  const renderSectionForm = () => {
    switch (activeSection) {
      case 'Control': return <ControlMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      case 'Asignación': return <AsignacionMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      case 'Mantenimiento': return <MantenimientoMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      case 'Seguros': return <SeguroMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      case 'ITV': return <ITVMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      case 'Impuestos': return <ImpuestoMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      case 'SOAT': return <SOATMain maquinariaId={maquinariaId} maquinariaPlaca={maquinariaPlaca} />;
      default:
        return (
          <Grid container spacing={2}>
            {fieldLabels.Maquinaria.map((field) => (
              <Grid item xs={12} md={6} key={field.name}>
                {field.name === 'imagen' ? (
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      {field.label}
                    </Typography>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      style={{ marginTop: '8px' }}
                    />
                    {sectionForm.Maquinaria?.imagen && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                        Imagen actual guardada
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    label={field.label}
                    name={field.name}
                    type={field.type || 'text'}
                    value={sectionForm.Maquinaria[field.name] || ''}
                    onChange={e => {
                      setSectionForm((prev) => ({
                        ...prev,
                        [activeSection]: {
                          ...prev[activeSection],
                          [field.name]: e.target.value,
                        },
                      }));
                      if (!e.target.value && !['adqui', 'codigo', 'tipo', 'marca', 'modelo', 'color', 'nro_motor', 'nro_chasis', 'imagen'].includes(field.name)) {
                        setNewMaquinariaErrors({
                          ...newMaquinariaErrors,
                          [field.name]: 'Este campo es obligatorio'
                        });
                      } else {
                        const newErrors = { ...newMaquinariaErrors };
                        delete newErrors[field.name];
                        setNewMaquinariaErrors(newErrors);
                      }
                    }}
                    size="small"
                    error={!!newMaquinariaErrors[field.name]}
                    helperText={newMaquinariaErrors[field.name] || ''}
                    InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                    disabled={field.name === 'placa' && activeSection !== 'Maquinaria'}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 }, mb: 4 }}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {sectionForm.Maquinaria?.placa && sectionForm.Maquinaria?.detalle
              ? `${sectionForm.Maquinaria.placa} - ${sectionForm.Maquinaria.detalle}`
              : 'Maquinaria'}
          </Typography>
          <Button
            variant="contained"
            sx={{ bgcolor: 'yellow', color: 'black', minWidth: 120 }}
            onClick={() => setDetailView(false)}
          >
            Volver
          </Button>
        </Box>
        <Paper sx={{ p: 3, mb: 3 }}>{renderSectionForm()}</Paper>
        {activeSection === 'Maquinaria' && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              sx={{ bgcolor: 'red', color: 'white', minWidth: 120 }}
              onClick={handleDeleteMaquinaria}
            >
              Eliminar
            </Button>
            <Button
              variant="contained"
              color="info"
              sx={{ minWidth: 120 }}
              onClick={handleUpdateMaquinaria}
            >
              Actualizar
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ width: { xs: '100%', md: 240 }, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, px: 2 }}>
        <Avatar
          src={selectedImage || sectionForm.Maquinaria?.imagen || maquinariaImage}
          sx={{ width: 170, height: 170, mb: 3, boxShadow: 2, borderRadius: 2 }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
          {SECTIONS.map(sec => (
            <Button
              key={sec}
              variant={activeSection === sec ? 'contained' : 'outlined'}
              onClick={() => setActiveSection(sec)}
              sx={{ minWidth: 120, justifyContent: 'flex-start', py: 1 }}
            >
              {sec}
            </Button>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

MaquinariaDetalle.propTypes = {
  sectionForm: PropTypes.object.isRequired,
  activeSection: PropTypes.string.isRequired,
  setActiveSection: PropTypes.func.isRequired,
  setDetailView: PropTypes.func.isRequired,
  handleDeleteMaquinaria: PropTypes.func.isRequired,
  handleUpdateMaquinaria: PropTypes.func.isRequired,
  selectedImage: PropTypes.string,
  setSectionForm: PropTypes.func.isRequired,
  newMaquinariaErrors: PropTypes.object,
  setNewMaquinariaErrors: PropTypes.func,
  handleFileChange: PropTypes.func
};

export default MaquinariaDetalle;
