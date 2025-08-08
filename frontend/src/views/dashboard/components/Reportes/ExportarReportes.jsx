import { useState, useEffect } from 'react';
import { Box, Button, Grid, Checkbox, FormControlLabel, FormGroup, FormControl, FormLabel, TextField, MenuItem, Typography, Modal, CircularProgress } from '@mui/material';
import exportXLS from './exportacionExcel';
import exportPDF, { exportPDFMasivo } from './exportacionPDF';
import { maquinariaFields } from './fields';
import { fetchMaquinarias, fetchControl, fetchITV, fetchDepreciaciones, fetchPronosticos, fetchAsignacion, fetchMantenimiento, fetchSOAT, fetchSeguros, fetchImpuestos } from './serviciosAPI';
import { useIsReadOnlyForModule } from 'src/components/hooks';

const tablas = [
  { key: 'maquinaria', label: 'Maquinaria' },
  { key: 'control', label: 'Control' },
  { key: 'itv', label: 'ITV' },
  { key: 'depreciaciones', label: 'Depreciación' },
  { key: 'pronosticos', label: 'Pronóstico' },
  { key: 'asignacion', label: 'Asignación' },
  { key: 'mantenimiento', label: 'Mantenimiento' },
  { key: 'soat', label: 'SOAT' },
  { key: 'seguros', label: 'Seguros' },
  { key: 'impuestos', label: 'Impuestos' },
];

const fetchers = {
  maquinaria: fetchMaquinarias,
  control: fetchControl,
  itv: fetchITV,
  depreciaciones: fetchDepreciaciones,
  pronosticos: fetchPronosticos,
  asignacion: fetchAsignacion,
  mantenimiento: fetchMantenimiento,
  soat: fetchSOAT,
  seguros: fetchSeguros,
  impuestos: fetchImpuestos,
};

const ExportarReportes = () => {
  const [tablasSeleccionadas, setTablasSeleccionadas] = useState(['maquinaria']);
  const [unidad, setUnidad] = useState('');
  const [opcionesUnidad, setOpcionesUnidad] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const isReadOnly = useIsReadOnlyForModule('reporte');
  
  // Debug para verificar permisos
  console.log('🔍 DEBUG ExportarReportes - isReadOnly:', isReadOnly);

  // Cargar opciones de unidad
  useEffect(() => {
    fetchMaquinarias().then(maqs => {
      const unidades = Array.from(new Set(maqs.map(m => m.unidad).filter(Boolean)));
      setOpcionesUnidad(unidades);
    });
  }, []);

  // Exportar según tablas seleccionadas y filtros
  const handleExport = async (tipo) => {
    setLoading(true);
    try {
      // 1. Obtener todas las maquinarias filtradas por unidad
      const todasMaqs = await fetchMaquinarias();
      let maqsFiltradas = todasMaqs;
      if (unidad) {
        maqsFiltradas = maqsFiltradas.filter(m => m.unidad === unidad);
      }

      // 2. Para cada tabla seleccionada, obtener todos los registros de las maquinarias filtradas
      const exportData = {
        maquinaria: [], control: [], itv: [], depreciaciones: [], pronosticos: [], asignacion: [], mantenimiento: [], soat: [], seguros: [], impuestos: []
      };
      if (tablasSeleccionadas.includes('maquinaria')) {
        // Exportar todos los campos relevantes de cada maquinaria filtrada (horizontal)
        exportData.maquinaria = maqsFiltradas.map(m => {
          const obj = {};
          maquinariaFields.forEach(f => { obj[f.key] = m[f.key] ?? ''; });
          return obj;
        });
      }
      for (const tabla of tablasSeleccionadas) {
        if (tabla === 'maquinaria') continue;
        const all = [];
        for (const m of maqsFiltradas) {
          const id = m._id?.$oid || m._id || m.id;
          if (!id) continue;
          let rows = await (fetchers[tabla]?.(id) || Promise.resolve([]));
          if (!Array.isArray(rows)) rows = [rows];
          
          // Solo incluir placa y detalle de la maquinaria, más los campos propios de la tabla
          rows = rows.map(r => {
            const { placa, detalle } = m;
            
            // Crear objeto limpio solo con los campos que queremos
            const cleaned = { placa, detalle };
            
            // Lista de campos que SÍ queremos incluir (campos específicos de cada tabla)
            const camposPermitidos = {
              control: ['ubicacion', 'gerente', 'encargado', 'hoja_tramite', 'fecha_ingreso', 'observacion', 'estado'],
              asignacion: ['fecha_asignacion', 'fecha_liberacion', 'recorrido_km', 'recorrido_entregado', 'encargado'],
              mantenimiento: ['tipo', 'cantidad', 'gestion', 'ubicacion', 'registrado_por', 'validado_por', 'autorizado_por'],
              soat: ['importe_2024', 'importe_2025'],
              seguros: ['numero_2024', 'importe', 'detalle'],
              itv: ['detalle', 'importe'],
              impuestos: ['importe_2023', 'importe_2024'],
              depreciaciones: ['costo_activo', 'fecha_compra', 'vida_util', 'bien_uso', 'metodo_depreciacion', 'valor_residual', 'coeficiente'],
              pronosticos: ['riesgo', 'resultado', 'probabilidad', 'fecha_asig', 'recorrido', 'horas_op', 'recomendaciones', 'fecha_mantenimiento', 'fecha_recordatorio', 'dias_hasta_mantenimiento', 'urgencia']
            };
            
            // Obtener los campos permitidos para esta tabla
            const camposTabla = camposPermitidos[tabla] || [];
            
            // Solo agregar los campos permitidos
            camposTabla.forEach(campo => {
              if (r[campo] !== undefined) {
                cleaned[campo] = r[campo];
              }
            });
            
            // EXCLUIR EXPLÍCITAMENTE las fechas de creación y actualización
            delete cleaned.fecha_creacion;
            delete cleaned.fecha_actualizacion;
            
            return cleaned;
          });
          all.push(...rows);
        }
        exportData[tabla] = all;
      }
      // Nombre de archivo personalizado
      let nombre = 'reporte';
      if (unidad) nombre += `_${unidad}`;

      
      // TEMPORAL: Verificar qué datos llegan a la exportación
      console.log('🔍 DATOS PARA EXPORTAR:', JSON.stringify(exportData, null, 2));
      
      if (tipo === 'excel') {
        exportXLS(exportData, nombre);
      } else {
        exportPDFMasivo(exportData, nombre);
      }
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  // Checkbox handler
  const handleCheckbox = (key) => {
    setTablasSeleccionadas(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  // Modal content (igual que antes, sin año)
  const modalContent = (
    <Box p={3} bgcolor="#fff" borderRadius={2} boxShadow={3} minWidth={340} maxWidth={500} mx="auto">
      <Typography variant="h6" mb={2}>Exportar registros masivos</Typography>
      {loading ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
          <CircularProgress size={60} sx={{ mb: 2, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
            Exportando reportes...
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Por favor espera mientras se procesan los datos
          </Typography>
        </Box>
      ) : (
        <>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Tablas a exportar</FormLabel>
            <FormGroup row>
              {tablas.map(t => (
                <FormControlLabel
                  key={t.key}
                  control={
                    <Checkbox
                      checked={tablasSeleccionadas.includes(t.key)}
                      onChange={() => handleCheckbox(t.key)}
                    />
                  }
                  label={t.label}
                />
              ))}
            </FormGroup>
          </FormControl>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6} md={12}>
              <TextField
                select
                label="Unidad"
                value={unidad}
                onChange={e => setUnidad(e.target.value)}
                fullWidth
              >
                <MenuItem value="">Todas</MenuItem>
                {opcionesUnidad.map(u => (
                  <MenuItem key={u} value={u}>{u}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Box display="flex" gap={2}>
            <Button variant="contained" color="success" onClick={() => handleExport('excel')} disabled={loading}>
              Exportar Excel
            </Button>
            <Button variant="contained" color="error" onClick={() => handleExport('pdf')} disabled={loading}>
              Exportar PDF
            </Button>
            <Button variant="outlined" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <Box mb={3}>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => setOpen(true)}
        disabled={isReadOnly}
      >
        Exportar reportes masivos
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
          {modalContent}
        </Box>
      </Modal>
    </Box>
  );
};

export default ExportarReportes; 