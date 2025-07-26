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
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';

const RegistrosDesactivadosTable = ({ registrosDesactivados, onReactivar, loading, isEncargado = false }) => {
  const [expandedSections, setExpandedSections] = useState({});

  const handleToggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleReactivar = async (tipo, recordId, maquinariaId) => {
    if (!isEncargado) {
      alert('Solo los encargados pueden reactivar registros');
      return;
    }
    
    if (!window.confirm(`¿Estás seguro de que quieres reactivar este ${tipo.toLowerCase()}?`)) return;
    
    // Verificar que recordId y maquinariaId existan
    if (!recordId) {
      alert('Error: No se encontró el ID del registro');
      return;
    }
    
    if (!maquinariaId && tipo !== 'Usuario') {
      alert('Error: No se encontró la información de la maquinaria asociada');
      return;
    }
    
    await onReactivar(tipo, recordId, maquinariaId);
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
    console.log(`Datos para ${tipo}:`, record);
    
    // Filtrar campos que no queremos mostrar (IDs y campos técnicos)
    const camposOcultos = ['_id', 'maquinaria_id', 'id', 'fecha_creacion', 'fecha_actualizacion', 'fecha_desactivacion'];
    const camposDisponibles = Object.keys(record).filter(campo => !camposOcultos.includes(campo));
    
    // Función para capitalizar y formatear valores
    const formatValue = (value) => {
      if (!value) return '—';
      if (typeof value === 'string') {
        return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      return value;
    };
    
    // Función para obtener valor de campo con múltiples posibles nombres
    const getFieldValue = (record, possibleNames) => {
      for (const name of possibleNames) {
        if (record[name] !== undefined && record[name] !== null && record[name] !== '') {
          return formatValue(record[name]);
        }
      }
      return '—';
    };
    
    switch (tipo) {
      case 'Control':
        return {
          title: 'Control',
          fields: [
            { label: 'Detalle', value: getFieldValue(record, ['Detalle', 'detalle', 'observacion', 'Observacion']) },
            { label: 'Estado', value: getFieldValue(record, ['Estado', 'estado']) },
            { label: 'Maquinaria', value: getFieldValue(record, ['Maquinaria', 'maquinaria', 'placa']) },
            { label: 'Ubicación', value: getFieldValue(record, ['Ubicación', 'ubicacion']) },
            { label: 'Gerente', value: getFieldValue(record, ['Gerente', 'gerente']) },
            { label: 'Encargado', value: getFieldValue(record, ['Encargado', 'encargado']) }
          ]
        };
      case 'Asignación':
        return {
          title: 'Asignación',
          fields: [
            { label: 'Encargado', value: getFieldValue(record, ['Encargado', 'encargado']) },
            { label: 'Maquinaria', value: getFieldValue(record, ['Maquinaria', 'maquinaria', 'placa']) },
            { label: 'Fecha Asignación', value: getFieldValue(record, ['Fecha de Asignación', 'fecha_asignacion']) },
            { label: 'Fecha Liberación', value: getFieldValue(record, ['Fecha de Liberación', 'fecha_liberacion']) },
            { label: 'Recorrido (Km)', value: getFieldValue(record, ['Recorrido (Km)', 'recorrido_km']) },
            { label: 'Recorrido Entregado', value: getFieldValue(record, ['Recorrido Entregado', 'recorrido_entregado']) }
          ]
        };
      case 'Mantenimiento':
        return {
          title: 'Mantenimiento',
          fields: [
            { label: 'Tipo', value: getFieldValue(record, ['Tipo', 'tipo']) },
            { label: 'Cantidad', value: getFieldValue(record, ['Cantidad', 'cantidad']) },
            { label: 'Ubicación', value: getFieldValue(record, ['Ubicación', 'ubicacion']) },
            { label: 'Maquinaria', value: getFieldValue(record, ['Maquinaria', 'maquinaria', 'placa']) },
            { label: 'Detalle', value: getFieldValue(record, ['Detalle', 'detalle']) },
            { label: 'Costo', value: getFieldValue(record, ['Costo', 'costo']) }
          ]
        };
      case 'Seguro':
        return {
          title: 'Seguro',
          fields: [
            { label: 'N° 2024', value: getFieldValue(record, ['N° 2024', 'numero_2024']) },
            { label: 'Importe', value: getFieldValue(record, ['Importe', 'importe']) },
            { label: 'Detalle', value: getFieldValue(record, ['Detalle', 'detalle']) },
            { label: 'Maquinaria', value: getFieldValue(record, ['Maquinaria', 'maquinaria', 'placa']) }
          ]
        };
      case 'ITV':
        return {
          title: 'ITV',
          fields: [
            { label: 'Detalle', value: getFieldValue(record, ['Detalle', 'detalle']) },
            { label: 'Importe', value: getFieldValue(record, ['Importe', 'importe']) },
            { label: 'Maquinaria', value: getFieldValue(record, ['Maquinaria', 'maquinaria', 'placa']) }
          ]
        };
      case 'SOAT':
        return {
          title: 'SOAT',
          fields: [
            { label: 'Importe 2024', value: getFieldValue(record, ['Importe 2024', 'importe_2024']) },
            { label: 'Importe 2025', value: getFieldValue(record, ['Importe 2025', 'importe_2025']) },
            { label: 'Maquinaria', value: getFieldValue(record, ['Maquinaria', 'maquinaria', 'placa']) }
          ]
        };
      case 'Impuesto':
        return {
          title: 'Impuesto',
          fields: [
            { label: 'Importe 2023', value: getFieldValue(record, ['Importe 2023', 'importe_2023']) },
            { label: 'Importe 2024', value: getFieldValue(record, ['Importe 2024', 'importe_2024']) },
            { label: 'Maquinaria', value: getFieldValue(record, ['Maquinaria', 'maquinaria', 'placa']) }
          ]
        };
      case 'Depreciación':
        return {
          title: 'Depreciación',
          fields: [
            { label: 'Método', value: formatValue(record['Método'] || record['metodo']) },
            { label: 'Bien de Uso', value: formatValue(record['Bien de Uso'] || record['bien_uso']) },
            { label: 'Vida Útil', value: record['Vida Útil'] || record['vida_util'] || '—' },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) }
          ]
        };
      default:
        return {
          title: tipo,
          fields: camposDisponibles.map(key => ({
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: getFieldValue(record, [key])
          }))
        };
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Registros Desactivados
      </Typography>
      
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
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {displayData.fields.map((field, index) => (
                      <TableCell key={index}>{field.label}</TableCell>
                    ))}
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record, index) => (
                    <TableRow key={record._id || index}>
                      {displayData.fields.map((field, fieldIndex) => (
                        <TableCell key={fieldIndex}>
                          {field.value || '—'}
                        </TableCell>
                      ))}
                      <TableCell align="right">
                        {isEncargado ? (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              console.log('Reactivando:', { tipo, recordId: record._id, maquinariaId: record.maquinaria_id, record });
                              handleReactivar(tipo, record._id, record.maquinaria_id || null);
                            }}
                          >
                            <RestoreIcon sx={{ color: '#4caf50' }} />
                          </IconButton>
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            Solo encargados
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
};

RegistrosDesactivadosTable.propTypes = {
  registrosDesactivados: PropTypes.object.isRequired,
  onReactivar: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  isEncargado: PropTypes.bool,
};

export default RegistrosDesactivadosTable; 