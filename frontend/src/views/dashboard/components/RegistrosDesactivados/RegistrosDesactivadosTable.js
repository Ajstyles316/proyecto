import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';

const RegistrosDesactivadosTable = ({ registrosDesactivados, onReactivar, loading, isAdmin = false }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [reactivarModal, setReactivarModal] = useState({ open: false, tipo: '', recordId: null, maquinariaId: null });
  
  const handleToggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handleReactivar = async (tipo, recordId, maquinariaId) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden reactivar registros');
      return;
    }
    
    setReactivarModal({
      open: true,
      tipo,
      recordId,
      maquinariaId
    });
  };
  
  const confirmarReactivar = async () => {
    const { tipo, recordId, maquinariaId } = reactivarModal;
    await onReactivar(tipo, recordId, maquinariaId);
    setReactivarModal({ open: false, tipo: '', recordId: null, maquinariaId: null });
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const hasRecords = Object.values(registrosDesactivados).some(records => records && records.length > 0);
  if (!hasRecords) {
    return (
      <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 5 }}>
        No hay registros desactivados.
      </Typography>
    );
  }
  
  const getRecordDisplayData = (tipo, record) => {
    // Filtrar campos que no queremos mostrar (IDs y campos técnicos)
    const camposOcultos = ['_id', 'maquinaria_id', 'id', 'fecha_creacion', 'fecha_actualizacion'];
    const camposDisponibles = Object.keys(record).filter(campo => !camposOcultos.includes(campo));
    
    // Función para mostrar valores tal como se ingresaron
    const formatValue = (value, fieldName) => {
      if (!value) return '—';
      // Para estos campos específicos, aplicar formateo
      if (fieldName === 'desactivado_por' || fieldName === 'justificacion_desactivacion') {
        if (typeof value === 'string') {
          // Si el string ya tiene espacios y parece estar bien formateado, devolverlo tal como está
          if (value.includes(' ') && /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+$/.test(value)) {
            return value;
          }
          // Si es un string con guiones bajos, procesarlo
          if (value.includes('_')) {
            return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
          // Para otros casos, solo capitalizar la primera letra
          return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        }
      }
      // Para el resto de campos, mostrar tal como se ingresó
      return value;
    };
    
    switch (tipo) {
      case 'Maquinaria':
        return {
          title: 'Maquinaria',
          fields: [
            { label: 'Gestión', value: formatValue(record['Gestión'] || record['gestion']) },
            { label: 'Placa', value: formatValue(record['Placa'] || record['placa']) },
            { label: 'Detalle', value: formatValue(record['Detalle'] || record['detalle']) },
            
          ]
        };
      case 'Control':
        return {
          title: 'Control',
          fields: [
            { label: 'Detalle', value: formatValue(record['Detalle'] || record['detalle']) },
            { label: 'Estado', value: formatValue(record['Estado'] || record['estado']) },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Desactivado por', value: formatValue(record['desactivado_por'], 'desactivado_por') },
            { label: 'Justificación', value: formatValue(record['justificacion_desactivacion'], 'justificacion_desactivacion') },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Asignación':
        return {
          title: 'Asignación',
          fields: [
            { label: 'Encargado', value: formatValue(record['Encargado'] || record['encargado']) },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Desactivado por', value: formatValue(record['desactivado_por'], 'desactivado_por') },
            { label: 'Justificación', value: formatValue(record['justificacion_desactivacion'], 'justificacion_desactivacion') },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Mantenimiento':
        return {
          title: 'Mantenimiento',
          fields: [
            { label: 'Tipo', value: formatValue(record['Tipo'] || record['tipo']) },
            { label: 'Cantidad', value: record['Cantidad'] || record['cantidad'] || '—' },
            { label: 'Ubicación', value: formatValue(record['Ubicación'] || record['ubicacion']) },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Desactivado por', value: formatValue(record['desactivado_por'], 'desactivado_por') },
            { label: 'Justificación', value: formatValue(record['justificacion_desactivacion'], 'justificacion_desactivacion') },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Seguro':
        return {
          title: 'Seguro',
          fields: [
            { label: 'N° 2024', value: record['N° 2024'] || record['numero_2024'] || '—' },
            { label: 'Importe', value: record['Importe'] || record['importe'] || '—' },
            { label: 'Detalle', value: formatValue(record['Detalle'] || record['detalle']) },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Desactivado por', value: formatValue(record['desactivado_por'], 'desactivado_por') },
            { label: 'Justificación', value: formatValue(record['justificacion_desactivacion'], 'justificacion_desactivacion') },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'ITV':
        return {
          title: 'ITV',
          fields: [
            { label: 'Detalle', value: formatValue(record['Detalle'] || record['detalle']) },
            { label: 'Importe', value: record['Importe'] || record['importe'] || '—' },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Desactivado por', value: formatValue(record['desactivado_por'], 'desactivado_por') },
            { label: 'Justificación', value: formatValue(record['justificacion_desactivacion'], 'justificacion_desactivacion') },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'SOAT':
        return {
          title: 'SOAT',
          fields: [
            { label: 'Importe 2024', value: record['Importe 2024'] || record['importe_2024'] || '—' },
            { label: 'Importe 2025', value: record['Importe 2025'] || record['importe_2025'] || '—' },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Desactivado por', value: formatValue(record['desactivado_por'], 'desactivado_por') },
            { label: 'Justificación', value: formatValue(record['justificacion_desactivacion'], 'justificacion_desactivacion') },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Impuesto':
        return {
          title: 'Impuesto',
          fields: [
            { label: 'Importe 2023', value: record['Importe 2023'] || record['importe_2023'] || '—' },
            { label: 'Importe 2024', value: record['Importe 2024'] || record['importe_2024'] || '—' },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Desactivado por', value: formatValue(record['desactivado_por'], 'desactivado_por') },
            { label: 'Justificación', value: formatValue(record['justificacion_desactivacion'], 'justificacion_desactivacion') },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Depreciación':
        return {
          title: 'Depreciación',
          fields: [
            { label: 'Método', value: formatValue(record['Método'] || record['metodo']) },
            { label: 'Bien de Uso', value: formatValue(record['Bien de Uso'] || record['bien_uso']) },
            { label: 'Vida Útil', value: record['Vida Útil'] || record['vida_util'] || '—' },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Desactivado por', value: formatValue(record['desactivado_por'], 'desactivado_por') },
            { label: 'Justificación', value: formatValue(record['justificacion_desactivacion'], 'justificacion_desactivacion') },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Usuario':
        return {
          title: 'Usuario',
          fields: [
            { label: 'Nombre', value: formatValue(record['Nombre'] || record['nombre'])  },
            { label: 'Cargo', value: formatValue(record['Cargo']) },
            { label: 'Unidad', value: formatValue(record['Unidad']) },
            { label: 'Email', value: formatValue(record['Email']) },
            { label: 'Desactivado por', value: formatValue(record['desactivado_por'], 'desactivado_por') },
            { label: 'Justificación', value: formatValue(record['justificacion'], 'justificacion') },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      default:
        return {
          title: tipo,
          fields: camposDisponibles.map(key => ({
            label: key,
            value: formatValue(record[key], key)
          }))
        };
    }
  };
  
  return (
    <Box>
      {Object.entries(registrosDesactivados).map(([tipo, records]) => {
        if (!records || records.length === 0) return null;
        const displayData = getRecordDisplayData(tipo, records[0]);
        const isExpanded = expandedSections[tipo];
        return (
          <Box key={tipo} sx={{ mb: 3 }}>
            <Button
              onClick={() => handleToggleSection(tipo)}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 1,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              {displayData.title} ({records.length})
              <Chip 
                label="Desactivado" 
                color="error" 
                size="small" 
                sx={{ ml: 1 }}
              />
            </Button>
            <Collapse in={isExpanded}>
              <Table size="small" sx={{
                '& .MuiTableCell-root': {
                  borderBottom: '1px solid rgba(224, 224, 224, 1)',
                },
                '& .MuiTableRow-root:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  borderBottom: '2px solid rgba(224, 224, 224, 1)',
                  fontWeight: 600,
                }
              }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    {displayData.fields.map((field, index) => (
                      <TableCell key={index} sx={{ fontWeight: 600 }}>{field.label}</TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record, index) => {
                    // Obtener el ID correcto del registro
                    const recordId = record._id || record.id || record.Email || record.Codigo;
                    // Para maquinaria, usar su propio ID como maquinariaId
                    const maqId = tipo === 'Maquinaria' ? recordId : record.maquinaria_id || record.maquinaria;
                    
                    return (
                      <TableRow key={recordId} sx={{
                        '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                      }}>
                        {displayData.fields.map((field, fieldIndex) => (
                          <TableCell key={fieldIndex}>
                            {field.value || '—'}
                          </TableCell>
                        ))}
                        <TableCell align="right">
                          {isAdmin ? (
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                console.log('Reactivando:', { tipo, recordId, maquinariaId: maqId, record });
                                handleReactivar(tipo, recordId, maqId);
                              }}
                            >
                              <RestoreIcon sx={{ color: '#4caf50' }} />
                            </IconButton>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              Solo administradores
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Collapse>
          </Box>
        );
      })}
      
      {/* Modal de confirmación para reactivar */}
      <Dialog open={reactivarModal.open} onClose={() => setReactivarModal({ open: false, tipo: '', recordId: null, maquinariaId: null })}>
        <DialogTitle>Confirmar reactivación</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que quieres reactivar este {reactivarModal.tipo.toLowerCase()}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReactivarModal({ open: false, tipo: '', recordId: null, maquinariaId: null })} 
            color="primary"
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmarReactivar} 
            color="success"
            variant="contained"
          >
            Reactivar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

RegistrosDesactivadosTable.propTypes = {
  registrosDesactivados: PropTypes.object.isRequired,
  onReactivar: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool,
};

export default RegistrosDesactivadosTable;