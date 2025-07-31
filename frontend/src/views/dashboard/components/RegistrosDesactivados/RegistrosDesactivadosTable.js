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
      return value;
    };
    
    switch (tipo) {
      case 'Control':
        return {
          title: 'Control',
          fields: [
            { label: 'Detalle', value: formatValue(record['Detalle'] || record['detalle']) },
            { label: 'Estado', value: formatValue(record['Estado'] || record['estado']) },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) }
          ]
        };
      case 'Asignación':
        return {
          title: 'Asignación',
          fields: [
            { label: 'Encargado', value: formatValue(record['Encargado'] || record['encargado']) },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) }
          ]
        };
      case 'Mantenimiento':
        return {
          title: 'Mantenimiento',
          fields: [
            { label: 'Tipo', value: formatValue(record['Tipo'] || record['tipo']) },
            { label: 'Cantidad', value: record['Cantidad'] || record['cantidad'] || '—' },
            { label: 'Ubicación', value: formatValue(record['Ubicación'] || record['ubicacion']) },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) }
          ]
        };
      case 'Seguro':
        return {
          title: 'Seguro',
          fields: [
            { label: 'N° 2024', value: record['N° 2024'] || record['numero_2024'] || '—' },
            { label: 'Importe', value: record['Importe'] || record['importe'] || '—' },
            { label: 'Detalle', value: formatValue(record['Detalle'] || record['detalle']) },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) }
          ]
        };
      case 'ITV':
        return {
          title: 'ITV',
          fields: [
            { label: 'Detalle', value: formatValue(record['Detalle'] || record['detalle']) },
            { label: 'Importe', value: record['Importe'] || record['importe'] || '—' },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) }
          ]
        };
      case 'SOAT':
        return {
          title: 'SOAT',
          fields: [
            { label: 'Importe 2024', value: record['Importe 2024'] || record['importe_2024'] || '—' },
            { label: 'Importe 2025', value: record['Importe 2025'] || record['importe_2025'] || '—' },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) }
          ]
        };
      case 'Impuesto':
        return {
          title: 'Impuesto',
          fields: [
            { label: 'Importe 2023', value: record['Importe 2023'] || record['importe_2023'] || '—' },
            { label: 'Importe 2024', value: record['Importe 2024'] || record['importe_2024'] || '—' },
            { label: 'Maquinaria', value: formatValue(record['Maquinaria'] || record['maquinaria']) }
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
            label: (() => {
              // Si el key ya tiene espacios y parece estar bien formateado, devolverlo tal como está
              if (key.includes(' ') && /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+$/.test(key)) {
                return key;
              }
              // Si es un string con guiones bajos, procesarlo
              if (key.includes('_')) {
                return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              }
              // Para otros casos, solo capitalizar la primera letra
              return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
            })(),
            value: formatValue(record[key])
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