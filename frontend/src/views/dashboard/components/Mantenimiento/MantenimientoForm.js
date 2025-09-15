import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useUser } from '../../../../components/UserContext';
import { useUnidades } from '../../../../components/hooks';

const MantenimientoForm = ({ onSubmit, initialData, isEditing, isReadOnly, submitLoading = false }) => {
  const [form, setForm] = useState(initialData || {});
  const [errors, setErrors] = useState({});
  const { user } = useUser();
  const { unidades } = useUnidades();
  const isEncargado = user?.Cargo?.toLowerCase() === 'encargado';
  const isAdmin = user?.Cargo?.toLowerCase() === 'admin';
  const canEditAuthFields = isEncargado || isAdmin;

  const fieldLabels = {
    // Información básica del mantenimiento
    informacionBasica: [
      { name: 'tipo_mantenimiento', label: 'Tipo de Mantenimiento', required: true },
      { name: 'fecha_mantenimiento', label: 'Fecha de Mantenimiento', type: 'date', required: true },
      { name: 'numero_salida_materiales', label: 'N° Salida de Materiales', required: false },
      { name: 'descripcion_danos_eventos', label: 'Descripción, Daños, Eventos', multiline: true, required: false },
      { name: 'reparacion_realizada', label: 'Reparación Realizada', multiline: true, required: false },
      { name: 'costo_total', label: 'Costo Total (Bs.)', type: 'number', required: false },
      { name: 'horas_kilometros', label: 'Horas/Kilómetros', type: 'number', required: false },
    ],
    
    // Personal involucrado
    personalInvolucrado: [
      { name: 'operador', label: 'Operador', required: false },
      { name: 'atendido_por', label: 'Atendido por', required: false },
      { name: 'encargado_activos_fijos', label: 'Encargado de Activos Fijos', required: false },
      { name: 'unidad_empresa', label: 'Unidad/Empresa', required: false },
      { name: 'ubicacion_fisico_proyecto', label: 'Ubicación Físico/Proyecto', required: false },
    ],
    
    // Tipo de desplazamiento
    tipoDesplazamiento: [
      { name: 'tipo_desplazamiento_cantidad', label: 'Cantidad', type: 'number', required: false },
      { name: 'tipo_desplazamiento_numero_llanta', label: 'Número de Llanta', required: false },
      { name: 'tipo_desplazamiento_numero_llanta_delantera', label: 'Número de Llanta Delantera', required: false },
      { name: 'tipo_desplazamiento_vida_util', label: 'Vida Útil', required: false },
    ],
    
    // Sistema eléctrico
    sistemaElectrico: [
      { name: 'cantidad_sistema_electrico', label: 'Cantidad Sistema Eléctrico', type: 'number', required: false },
      { name: 'voltaje_sistema_electrico', label: 'Voltaje (V)', type: 'number', required: false },
      { name: 'amperaje_sistema_electrico', label: 'Amperaje (A)', type: 'number', required: false },
      { name: 'vida_util_sistema_electrico', label: 'Vida Útil Sistema Eléctrico', required: false },
    ],
    
    // Aceite de motor
    aceiteMotor: [
      { name: 'aceite_motor_cantidad', label: 'Cantidad', type: 'number', required: false },
      { name: 'aceite_motor_numero', label: 'Número', required: false },
      { name: 'aceite_motor_cambio_km_hr', label: 'Cambio (KM/HR)', required: false },
      { name: 'aceite_motor_numero_filtro', label: 'Número de Filtro', required: false },
    ],
    
    // Aceite hidráulico
    aceiteHidraulico: [
      { name: 'aceite_hidraulico_cantidad', label: 'Cantidad', type: 'number', required: false },
      { name: 'aceite_hidraulico_numero', label: 'Número', required: false },
      { name: 'aceite_hidraulico_cambio_km_hr', label: 'Cambio (KM/HR)', required: false },
      { name: 'aceite_hidraulico_numero_filtro', label: 'Número de Filtro', required: false },
    ],
    
    // Aceite de transmisión
    aceiteTransmision: [
      { name: 'aceite_transmision_cantidad', label: 'Cantidad', type: 'number', required: false },
      { name: 'aceite_transmision_numero', label: 'Número', required: false },
      { name: 'aceite_transmision_cambio_km_hr', label: 'Cambio (KM/HR)', required: false },
      { name: 'aceite_transmision_numero_filtro', label: 'Número de Filtro', required: false },
    ],
    
    // Líquido de freno
    liquidoFreno: [
      { name: 'liquido_freno_cantidad', label: 'Cantidad', type: 'number', required: false },
      { name: 'liquido_freno_numero', label: 'Número', required: false },
      { name: 'liquido_freno_cambio_km_hr', label: 'Cambio (KM/HR)', required: false },
      { name: 'liquido_freno_numero_filtro_combustible', label: 'Número de Filtro Combustible', required: false },
    ],
    
    // Líquido refrigerante
    liquidoRefrigerante: [
      { name: 'liquido_refrigerante_tipo', label: 'Tipo de Refrigerante', required: false },
      { name: 'liquido_refrigerante_cantidad_lt', label: 'Cantidad (Lt)', type: 'number', required: false },
      { name: 'liquido_refrigerante_frecuencia_cambio', label: 'Frecuencia de Cambio', required: false },
    ],
    
    // Otros aceites
    otrosAceites: [
      { name: 'otros_aceites_tipo', label: 'Tipo de Refrigerante', required: false },
      { name: 'otros_aceites_cantidad_lt', label: 'Cantidad (Lt)', type: 'number', required: false },
      { name: 'otros_aceites_frecuencia_cambio', label: 'Frecuencia de Cambio', required: false },
    ],
    
    // Sistema de combustible
    sistemaCombustible: [
      { name: 'gasolina', label: 'Gasolina', required: false },
      { name: 'gasolina_cantidad_lt', label: 'Gasolina - Cantidad (Lt)', type: 'number', required: false },
      { name: 'cantidad_filtros', label: 'Cantidad de Filtros', type: 'number', required: false },
      { name: 'codigo_filtro_combustible', label: 'Código Filtro Combustible', required: false },
    ],
    
    // Otros filtros
    otrosFiltros: [
      { name: 'otros_filtros_cantidad', label: 'Cantidad', type: 'number', required: false },
      { name: 'otros_filtros_numero', label: 'Número', required: false },
      { name: 'otros_filtros_cambio', label: 'Cambio (HR/KM)', required: false },
      { name: 'otros_filtros_descripcion', label: 'Descripción del Filtro', required: false },
    ],
    
    // Trabajos a realizar
    trabajosRealizar: [
      { name: 'trabajos_destinados_realizar', label: 'Trabajos Destinados a Realizar', multiline: true, required: false },
    ],
    
    // Campos de control
    camposControl: [
      { name: 'registrado_por', label: 'Registrado por', readonly: true },
      { name: 'validado_por', label: 'Validado por', readonly: true },
      { name: 'autorizado_por', label: 'Autorizado por', readonly: true },
    ],
  };

  const validateForm = () => {
    const newErrors = {};
    Object.values(fieldLabels).flat().forEach(field => {
      if (field.required && !form[field.name]) {
        newErrors[field.name] = `${field.label} es obligatorio`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSubmit(form);
  };

  const renderFieldGroup = (groupName, fields, title) => (
    <Accordion key={groupName} defaultExpanded={groupName === 'informacionBasica'}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {fields.filter(field => 
            isEditing || !['registrado_por', 'validado_por', 'autorizado_por'].includes(field.name)
          ).map((field) => (
            <Grid item xs={12} sm={field.multiline ? 12 : 6} key={field.name}>
              <TextField
                fullWidth
                label={field.label}
                name={field.name}
                type={field.type || 'text'}
                value={form[field.name] || ''}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                error={!!errors[field.name]}
                helperText={errors[field.name]}
                required={field.required}
                multiline={field.multiline}
                rows={field.multiline ? 3 : 1}
                disabled={
                  isReadOnly || 
                  (field.name === 'registrado_por') ||
                  (field.name === 'validado_por' && !canEditAuthFields) ||
                  (field.name === 'autorizado_por' && !canEditAuthFields)
                }
              />
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
        {isEditing ? 'Editar Mantenimiento' : 'Nuevo Registro de Mantenimiento'}
      </Typography>
      
      {renderFieldGroup('tipoDesplazamiento', fieldLabels.tipoDesplazamiento, 'Tipo de Desplazamiento')}
      {renderFieldGroup('sistemaElectrico', fieldLabels.sistemaElectrico, 'Sistema Eléctrico')}
      {renderFieldGroup('aceiteMotor', fieldLabels.aceiteMotor, 'Aceite de Motor')}
      {renderFieldGroup('aceiteHidraulico', fieldLabels.aceiteHidraulico, 'Aceite Hidráulico')}
      {renderFieldGroup('aceiteTransmision', fieldLabels.aceiteTransmision, 'Aceite de Transmisión')}
      {renderFieldGroup('liquidoFreno', fieldLabels.liquidoFreno, 'Líquido de Freno')}
      {renderFieldGroup('liquidoRefrigerante', fieldLabels.liquidoRefrigerante, 'Líquido Refrigerante')}
      {renderFieldGroup('otrosAceites', fieldLabels.otrosAceites, 'Otros Aceites')}
      {renderFieldGroup('sistemaCombustible', fieldLabels.sistemaCombustible, 'Sistema de Combustible')}
      {renderFieldGroup('otrosFiltros', fieldLabels.otrosFiltros, 'Otros Filtros')}
      {renderFieldGroup('trabajosRealizar', fieldLabels.trabajosRealizar, 'Trabajos a Realizar')}
      
      {/* Tabla de Información del Mantenimiento */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
          Información del Mantenimiento
        </Typography>
        
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Campo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Valor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* FECHA */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '40%' }}>FECHA</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    name="fecha_mantenimiento"
                    type="date"
                    value={form.fecha_mantenimiento || ''}
                    onChange={(e) => setForm({ ...form, fecha_mantenimiento: e.target.value })}
                    error={!!errors.fecha_mantenimiento}
                    helperText={errors.fecha_mantenimiento}
                    required={true}
                    disabled={isReadOnly}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </TableCell>
              </TableRow>

              {/* N° SALIDA DE MATERIALES */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '40%' }}>N° SALIDA DE MATERIALES</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    name="numero_salida_materiales"
                    type="text"
                    value={form.numero_salida_materiales || ''}
                    onChange={(e) => setForm({ ...form, numero_salida_materiales: e.target.value })}
                    error={!!errors.numero_salida_materiales}
                    helperText={errors.numero_salida_materiales}
                    disabled={isReadOnly}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>

              {/* DESCRIPCION, DAÑOS, EVENTOS, REPARACION REALIZADA */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '40%' }}>DESCRIPCION, DAÑOS, EVENTOS, REPARACION REALIZADA</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    name="descripcion_danos_eventos"
                    type="text"
                    value={form.descripcion_danos_eventos || ''}
                    onChange={(e) => setForm({ ...form, descripcion_danos_eventos: e.target.value })}
                    error={!!errors.descripcion_danos_eventos}
                    helperText={errors.descripcion_danos_eventos}
                    multiline
                    rows={3}
                    disabled={isReadOnly}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>

              {/* COSTO TOTAL Bs. */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '40%' }}>COSTO TOTAL Bs.</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    name="costo_total"
                    type="number"
                    value={form.costo_total || ''}
                    onChange={(e) => setForm({ ...form, costo_total: e.target.value })}
                    error={!!errors.costo_total}
                    helperText={errors.costo_total}
                    disabled={isReadOnly}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>

              {/* HOR/KM. */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '40%' }}>HOR/KM.</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    name="horas_kilometros"
                    type="number"
                    value={form.horas_kilometros || ''}
                    onChange={(e) => setForm({ ...form, horas_kilometros: e.target.value })}
                    error={!!errors.horas_kilometros}
                    helperText={errors.horas_kilometros}
                    disabled={isReadOnly}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>

              {/* OPERADOR */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '40%' }}>OPERADOR</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    name="operador"
                    type="text"
                    value={form.operador || ''}
                    onChange={(e) => setForm({ ...form, operador: e.target.value })}
                    error={!!errors.operador}
                    helperText={errors.operador}
                    disabled={isReadOnly}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>

              {/* ATENDIDO POR */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '40%' }}>ATENDIDO POR</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    name="atendido_por"
                    type="text"
                    value={form.atendido_por || ''}
                    onChange={(e) => setForm({ ...form, atendido_por: e.target.value })}
                    error={!!errors.atendido_por}
                    helperText={errors.atendido_por}
                    disabled={isReadOnly}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>

              {/* ENCARGADO DE ACTIVOS FIJOS */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '40%' }}>ENCARGADO DE ACTIVOS FIJOS</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    name="encargado_activos_fijos"
                    type="text"
                    value={form.encargado_activos_fijos || ''}
                    onChange={(e) => setForm({ ...form, encargado_activos_fijos: e.target.value })}
                    error={!!errors.encargado_activos_fijos}
                    helperText={errors.encargado_activos_fijos}
                    disabled={isReadOnly}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>

              {/* UNIDAD */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '40%' }}>UNIDAD</TableCell>
                <TableCell>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="unidad_empresa"
                    value={form.unidad_empresa || ''}
                    onChange={(e) => setForm({ ...form, unidad_empresa: e.target.value })}
                    error={!!errors.unidad_empresa}
                    helperText={errors.unidad_empresa}
                    disabled={isReadOnly}
                    variant="outlined"
                  >
                    <MenuItem value="">Seleccione una unidad</MenuItem>
                    {unidades.map((unidad) => (
                      <MenuItem key={unidad} value={unidad}>
                        {unidad}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
              </TableRow>

              {/* UBICACIÓN FISICO/PROYECTO */}
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '40%' }}>UBICACIÓN FISICO/PROYECTO</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    name="ubicacion_fisico_proyecto"
                    type="text"
                    value={form.ubicacion_fisico_proyecto || ''}
                    onChange={(e) => setForm({ ...form, ubicacion_fisico_proyecto: e.target.value })}
                    error={!!errors.ubicacion_fisico_proyecto}
                    helperText={errors.ubicacion_fisico_proyecto}
                    disabled={isReadOnly}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {isEditing && (
        <>
          <Divider sx={{ my: 2 }} />
          {renderFieldGroup('camposControl', fieldLabels.camposControl, 'Campos de Control')}
        </>
      )}
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 2, 
        mt: 3,
        flexWrap: 'wrap'
      }}>
        <Button 
          variant="contained" 
          color="success"
          onClick={handleSubmit}
          disabled={isReadOnly || submitLoading}
          startIcon={submitLoading ? <CircularProgress size={16} color="inherit" /> : null}
          size="large"
        >
          {submitLoading ? (isEditing ? 'Actualizando...' : 'Guardando...') : (isEditing ? 'Actualizar' : 'Guardar')}
        </Button>
      </Box>
    </Paper>
  );
};

MantenimientoForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  submitLoading: PropTypes.bool
};

export default MantenimientoForm; 