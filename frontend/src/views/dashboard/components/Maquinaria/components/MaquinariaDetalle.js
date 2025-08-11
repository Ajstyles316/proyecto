import PropTypes from 'prop-types';
import { Box, Paper, Button, Avatar, Typography, Grid, TextField, MenuItem } from '@mui/material';
import { SECTIONS } from '../utils/constants';
import ControlMain from '../../Control/ControlMain';
import AsignacionMain from '../../Asignacion/AsignacionMain';
import MantenimientoMain from '../../Mantenimiento/MantenimientoMain';
import SeguroMain from '../../Seguros/SeguroMain';
import ITVMain from '../../ITV/ITVMain';
import SOATMain from '../../SOAT/SOATMain';
import ImpuestoMain from '../../Impuestos/ImpuestoMain';
import { fieldLabels } from '../utils/fieldLabels';
import { useIsReadOnly, useUser, useCanEditMaquinaria, useCanDeleteMaquinaria } from '../../../../../components/hooks';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';


const LABEL_OVERRIDES = { Control: 'Control y Seguimiento' };

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
  handleFileChange,
  unidadesUnicas
}) => {
  const maquinariaId = sectionForm.Maquinaria?._id?.$oid || sectionForm.Maquinaria?._id;
  const maquinariaPlaca = sectionForm.Maquinaria?.placa;
  const isReadOnly = useIsReadOnly();
  const { user } = useUser();
  const canEditMaquinaria = useCanEditMaquinaria();
  const canDeleteMaquinaria = useCanDeleteMaquinaria();
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isAdmin = user?.Cargo?.toLowerCase() === 'admin';
  const canEditAuthFields = isEncargado || isAdmin;

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
                      disabled={isReadOnly}
                    />
                    {sectionForm.Maquinaria?.imagen && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                        Imagen actual guardada
                      </Typography>
                    )}
                  </Box>
                ) : field.name === 'unidad' ? (
                  <TextField
                    select
                    fullWidth
                    label={field.label}
                    name={field.name}
                    value={sectionForm.Maquinaria[field.name] || ''}
                    onChange={e => {
                      setSectionForm((prev) => ({
                        ...prev,
                        [activeSection]: {
                          ...prev[activeSection],
                          [field.name]: e.target.value,
                        },
                      }));
                      if (!e.target.value) {
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
                    disabled={isReadOnly}
                  >
                    <MenuItem value="">Seleccione una unidad</MenuItem>
                    {unidadesUnicas.map((unidad) => (
                      <MenuItem key={unidad} value={unidad}>{unidad}</MenuItem>
                    ))}
                  </TextField>
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
                    disabled={
                      isReadOnly || 
                      !canEditMaquinaria ||
                      (field.name === 'placa' && activeSection !== 'Maquinaria') ||
                      (field.name === 'registrado_por') ||
                      (field.name === 'validado_por' && !canEditAuthFields) ||
                      (field.name === 'autorizado_por' && !canEditAuthFields)
                    }
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
            sx={{ bgcolor: 'grey.600', color: 'white', minWidth: 120, '&:hover': { bgcolor: 'grey.700' } }}
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
              sx={{ bgcolor: 'red', color: 'white', minWidth: 120, display: 'flex', alignItems: 'center', gap: 1 }}
              onClick={handleDeleteMaquinaria}
              disabled={isReadOnly || !canDeleteMaquinaria}
            >
              <BlockIcon sx={{ color: '#fff', mr: 1 }} />
              Desactivar
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: '#03a9f4', color: 'white', minWidth: 120, display: 'flex', alignItems: 'center', gap: 1, '&:hover': { bgcolor: '#0288d1' } }}
              onClick={handleUpdateMaquinaria}
              disabled={isReadOnly || !canEditMaquinaria}
            >
              <EditIcon sx={{ color: '#fff', mr: 1 }} />
              Actualizar
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ width: { xs: '100%', md: 240 }, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, px: 2 }}>
        <Avatar
          src={selectedImage || sectionForm.Maquinaria?.imagen || maquinariaImage}
          sx={{ width: 200, height: 200, mb: 2, boxShadow: 1, borderRadius: 1 }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
          {SECTIONS.map(sec => (
            <Button
              key={sec}
              variant={activeSection === sec ? 'contained' : 'outlined'}
              onClick={() => setActiveSection(sec)}
              sx={{ minWidth: 120, justifyContent: 'flex-start', py: 1 }}
            >
              {LABEL_OVERRIDES[sec] || sec}
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
  handleFileChange: PropTypes.func,
  unidadesUnicas: PropTypes.array.isRequired,
};

export default MaquinariaDetalle;
