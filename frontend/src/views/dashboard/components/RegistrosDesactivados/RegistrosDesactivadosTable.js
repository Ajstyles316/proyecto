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
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';

const RegistrosDesactivadosTable = ({ registrosDesactivados, onReactivar, onEliminar, loading, isAdmin = false, maquinariaId }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [reactivarModal, setReactivarModal] = useState({ open: false, tipo: '', recordId: null, maquinariaId: null });
  const [eliminarModal, setEliminarModal] = useState({ open: false, tipo: '', recordId: null, maquinariaId: null });
  
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

  const handleEliminar = async (tipo, recordId, maquinariaId) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden eliminar registros');
      return;
    }
    setEliminarModal({ open: true, tipo, recordId, maquinariaId });
  };

  const confirmarEliminar = async () => {
    const { tipo, recordId, maquinariaId } = eliminarModal;
    if (onEliminar) {
      await onEliminar(tipo, recordId, maquinariaId);
    }
    setEliminarModal({ open: false, tipo: '', recordId: null, maquinariaId: null });
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
            { label: 'Placa', value: formatValue(record['Placa'] || record['placa']) },
            { label: 'Detalle', value: formatValue(record['Detalle'] || record['detalle']) },
            { label: 'Código', value: formatValue(record['Código'] || record['codigo']) },
            { label: 'Tipo', value: formatValue(record['Tipo'] || record['tipo']) },
            { label: 'Marca', value: formatValue(record['Marca'] || record['marca']) },
            { label: 'Modelo', value: formatValue(record['Modelo'] || record['modelo']) },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Control':
        return {
          title: 'Control',
          fields: [
            { label: 'Placa', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Fecha de inicio', value: formatValue(record['Fecha de inicio'] || record['fecha_inicio']) },
            { label: 'Fecha Final', value: formatValue(record['Fecha Final'] || record['fecha_final']) },
            { label: 'Proyecto', value: formatValue(record['Proyecto'] || record['proyecto']) },
            { label: 'Ubicación', value: formatValue(record['Ubicación'] || record['ubicacion']) },
            { label: 'Estado', value: formatValue(record['Estado'] || record['estado']) },
            { label: 'Tiempo', value: formatValue(record['Tiempo'] || record['tiempo']) },
            { label: 'Operador', value: formatValue(record['Operador'] || record['operador']) },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Control de Odómetros':
        return {
          title: 'Control de Odómetros',
          fields: [
            { label: 'Placa', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Unidad', value: formatValue(record['Unidad'] || record['unidad']) },
            { label: 'Odómetro Inicial', value: formatValue(record['Odómetro Inicial'] || record['odometro_inicial']) },
            { label: 'Odómetro Final', value: formatValue(record['Odómetro Final'] || record['odometro_final']) },
            { label: 'Odómetro del Mes', value: formatValue(record['Odómetro del Mes'] || record['odometro_mes']) },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Asignación':
        return {
          title: 'Asignación',
          fields: [
            { label: 'Placa', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Unidad', value: formatValue(record['Unidad'] || record['unidad']) },
            { label: 'Fecha de Asignación', value: formatValue(record['Fecha de Asignación'] || record['fecha_asignacion']) },
            { label: 'Kilometraje', value: formatValue(record['Kilometraje'] || record['kilometraje']) },
            { label: 'Gerente', value: formatValue(record['Gerente'] || record['gerente']) },
            { label: 'Encargado', value: formatValue(record['Encargado'] || record['encargado']) },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Liberación':
        return {
          title: 'Liberación',
          fields: [
            { label: 'Placa', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Unidad', value: formatValue(record['Unidad'] || record['unidad']) },
            { label: 'Fecha de Liberación', value: formatValue(record['Fecha de Liberación'] || record['fecha_liberacion']) },
            { label: 'Kilometraje Entregado', value: formatValue(record['Kilometraje Entregado'] || record['kilometraje_entregado']) },
            { label: 'Gerente', value: formatValue(record['Gerente'] || record['gerente']) },
            { label: 'Encargado', value: formatValue(record['Encargado'] || record['encargado']) },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Mantenimiento':
        return {
          title: 'Mantenimiento',
          fields: [
            { label: 'Placa', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Fecha', value: formatValue(record['Fecha de Mantenimiento'] || record['fecha_mantenimiento']) },
            { label: 'Descripción', value: formatValue(record['Descripción'] || record['descripcion_danos_eventos'] || record['reparacion_realizada']) },
            { label: 'Costo', value: record['Costo Total'] || record['costo_total'] || '—' },
            { label: 'Operador', value: formatValue(record['Operador'] || record['operador']) },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Seguro':
        return {
          title: 'Seguro',
          fields: [
            { label: 'Placa', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Fecha inicial', value: formatValue(record['Fecha inicial'] || record['fecha_inicial']) },
            { label: 'Fecha Final', value: formatValue(record['Fecha Final'] || record['fecha_final']) },
            { label: 'N° Póliza', value: record['N° Póliza'] || record['numero_poliza'] || '—' },
            { label: 'Compañía Aseguradora', value: formatValue(record['Compañía Aseguradora'] || record['compania_aseguradora']) },
            { label: 'Importe', value: record['Importe'] || record['importe'] || '—' },
            { label: 'Nombre del Archivo', value: formatValue(record['Nombre del Archivo'] || record['nombre_archivo']) },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'ITV':
        return {
          title: 'ITV',
          fields: [
            { label: 'Placa', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Gestión', value: formatValue(record['Gestión'] || record['gestion']) },
            { label: 'Nombre del Archivo', value: formatValue(record['Nombre del Archivo'] || record['nombre_archivo']) },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'SOAT':
        return {
          title: 'SOAT',
          fields: [
            { label: 'Placa', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Gestión', value: formatValue(record['Gestión'] || record['gestion']) },
            { label: 'Nombre del Archivo', value: formatValue(record['Nombre del Archivo'] || record['nombre_archivo']) },
            { label: 'Fecha de Desactivación', value: formatValue(record['Fecha de Desactivación']) }
          ]
        };
      case 'Impuesto':
        return {
          title: 'Impuesto',
          fields: [
            { label: 'Placa', value: formatValue(record['Maquinaria'] || record['maquinaria']) },
            { label: 'Gestión', value: formatValue(record['Gestión'] || record['gestion']) },
            { label: 'Nombre del Archivo', value: formatValue(record['Nombre del Archivo'] || record['nombre_archivo']) },
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
                    const maqId = tipo === 'Maquinaria' ? recordId : (record.maquinaria_id || maquinariaId);
                    // Obtener los datos de visualización para este registro (no reutilizar los del primero)
                    const rowDisplay = getRecordDisplayData(tipo, record);

                    return (
                      <TableRow key={recordId || index} sx={{
                        '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                      }}>
                        {rowDisplay.fields.map((field, fieldIndex) => (
                          <TableCell key={fieldIndex}>
                            {field.value || '—'}
                          </TableCell>
                        ))}
                        <TableCell align="right">
                          {isAdmin ? (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <IconButton
                                size="small"
                                color="success"
                                title="Reactivar"
                                onClick={() => handleReactivar(tipo, recordId, maqId)}
                              >
                                <RestoreIcon sx={{ color: '#4caf50' }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                title="Eliminar permanentemente"
                                onClick={() => handleEliminar(tipo, recordId, maqId)}
                              >
                                <DeleteForeverIcon sx={{ color: '#e53935' }} />
                              </IconButton>
                            </Box>
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

      {/* Modal de confirmación para eliminación permanente */}
      <Dialog open={eliminarModal.open} onClose={() => setEliminarModal({ open: false, tipo: '', recordId: null, maquinariaId: null })}>
        <DialogTitle>Eliminar permanentemente</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Esta acción no se puede deshacer. ¿Eliminar este {eliminarModal.tipo.toLowerCase()} para siempre?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEliminarModal({ open: false, tipo: '', recordId: null, maquinariaId: null })} 
            color="primary"
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmarEliminar} 
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

RegistrosDesactivadosTable.propTypes = {
  registrosDesactivados: PropTypes.object.isRequired,
  onReactivar: PropTypes.func.isRequired,
  onEliminar: PropTypes.func,
  loading: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool,
  maquinariaId: PropTypes.string,
};

export default RegistrosDesactivadosTable;