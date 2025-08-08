import { useState } from 'react';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from 'src/components/shared/DashboardCard';
import BusquedaForm from './BusquedaForm';
import TablaGenericaAvanzada, { TablaGenerica } from './TablaGenerica.jsx';
import ExportarReportes from './ExportarReportes';
import ReportesDashboard from './ReportesDashboard';
import {
  fetchMaquinarias,
  fetchDepreciaciones,
  fetchPronosticos,
  fetchControl,
  fetchAsignacion,
  fetchMantenimiento,
  fetchSOAT,
  fetchSeguros,
  fetchITV,
  fetchImpuestos
} from './serviciosAPI';
import { maquinariaFields, depFields, proFields } from './fields';
import exportPDF from './exportacionPDF';
import exportXLS from './exportacionExcel';
import { CircularProgress, Typography, Box, Divider, Tooltip} from '@mui/material';
import { useCanView, useIsPermissionDenied } from 'src/components/hooks';

const ReportesMain = () => {
  const [maquinaria, setMaquinaria] = useState(null);
  const [depreciaciones, setDepreciaciones] = useState([]);
  const [pronosticos, setPronosticos] = useState([]);
  const [control, setControl] = useState([]);
  const [asignacion, setAsignacion] = useState([]);
  const [mantenimiento, setMantenimiento] = useState([]);
  const [soat, setSOAT] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [itv, setITV] = useState([]);
  const [impuestos, setImpuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const canView = useCanView('Reportes');
  const isPermissionDenied = useIsPermissionDenied('Reportes');
  
  // Si el permiso está denegado, mostrar mensaje de acceso denegado
  if (isPermissionDenied) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ color: '#f44336' }}>Acceso Denegado</h2>
        <p>No tienes permisos para acceder al módulo de Reportes.</p>
      </div>
    );
  }
  
  // Si no tiene permisos para ver, no mostrar nada
  if (!canView) {
    return null;
  }

  const handleBuscar = async (search) => {
    setLoading(true);
    setError('');
    setMaquinaria(null);
    setDepreciaciones([]);
    setPronosticos([]);
    setControl([]);
    setAsignacion([]);
    setMantenimiento([]);
    setSOAT([]);
    setSeguros([]);
    setITV([]);
    setImpuestos([]);
    setSearched(true);

    try {
      const maqs = await fetchMaquinarias();
      const q = search.toLowerCase();
      const maq = maqs.find(m =>
        m.placa?.toLowerCase() === q ||
        m.codigo?.toLowerCase() === q ||
        m.detalle?.toLowerCase() === q
      );
      if (!maq) {
        setError('No se encontró ninguna maquinaria con ese dato.');
        setLoading(false);
        return;
      }
      setMaquinaria(maq);
      const maqId = maq._id?.$oid || maq._id || maq.id;
      const [deps, pros, ctrl, asig, mant, soat, seg, itv, imp] = await Promise.all([
        fetchDepreciaciones(maqId),
        fetchPronosticos(maqId),
        fetchControl(maqId),
        fetchAsignacion(maqId),
        fetchMantenimiento(maqId),
        fetchSOAT(maqId),
        fetchSeguros(maqId),
        fetchITV(maqId),
        fetchImpuestos(maqId),
      ]);

      setDepreciaciones(Array.isArray(deps) ? deps : []);
      let filteredPros = Array.isArray(pros) ? pros : [];
      if (filteredPros.length > 0 && maq.placa) {
        filteredPros = filteredPros.filter(p => p.placa && p.placa.toLowerCase() === maq.placa.toLowerCase());
      }
      console.log('🔍 DATOS DE PRONÓSTICOS:', JSON.stringify(filteredPros, null, 2));
      if (filteredPros.length > 0) {
        console.log('🔍 CAMPOS DISPONIBLES:', Object.keys(filteredPros[0]));
      }
      setPronosticos(filteredPros);
      setControl(ctrl);
      setAsignacion(asig);
      setMantenimiento(mant);
      setSOAT(soat);
      setSeguros(seg);
      setITV(itv);
      setImpuestos(imp);
    } catch {
      setError('Error al buscar la maquinaria.');
    } finally {
      setLoading(false);
    }
  };

  const ocultarCampos = ['bien_de_uso', 'vida_util', 'costo_activo', 'fecha_creacion', 'fecha_actualizacion', 'created_at', 'updated_at'];

  // Función para renderizar recomendaciones con formato mejorado
  const renderRecomendaciones = (recomendaciones) => {
    if (!recomendaciones) return '-';
    
    let items = [];
    let fullText = '';
    
    // Si es un array, tomar solo los primeros 3 elementos
    if (Array.isArray(recomendaciones)) {
      items = recomendaciones.slice(0, 3);
      fullText = recomendaciones.join('; ');
    }
    // Si es un string, dividirlo por puntos y comas y tomar solo los primeros 3
    else if (typeof recomendaciones === 'string') {
      const allItems = recomendaciones.split(';').map(item => item.trim()).filter(item => item);
      items = allItems.slice(0, 3);
      fullText = recomendaciones;
    }
    
    const displayText = items.map((item, index) => `- ${item}`).join('\n');
    
    return (
      <Tooltip title={fullText} placement="top-start">
        <Box sx={{ 
          maxHeight: '100px', 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.4',
          fontSize: '0.875rem',
          whiteSpace: 'pre-line'
        }}>
          {displayText}
        </Box>
      </Tooltip>
    );
  };

  return (
    <PageContainer title="Reportes" description="Busca una maquinaria por placa, código o detalle y exporta sus datos">
      <DashboardCard>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h5" fontWeight={600}>Reportes</Typography>
        </Box>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <BusquedaForm
            onBuscar={handleBuscar}
            onExportPDF={() => exportPDF({ maquinaria, depreciaciones, pronosticos, control, asignacion, mantenimiento, soat, seguros, itv, impuestos })}
            onExportXLS={() => exportXLS({ maquinaria: maquinaria ? [maquinaria] : [], depreciaciones, pronosticos, control, asignacion, mantenimiento, soat, seguros, itv, impuestos })}
            maquinaria={maquinaria}
            loading={loading}
          />
        </Box>
        <ExportarReportes />
        
        {/* Dashboard de Reportes */}
        <ReportesDashboard
          maquinaria={maquinaria}
          depreciaciones={depreciaciones}
          pronosticos={pronosticos}
          control={control}
          asignacion={asignacion}
          mantenimiento={mantenimiento}
          soat={soat}
          seguros={seguros}
          itv={itv}
          impuestos={impuestos}
          searched={searched}
        />
        
        {error && <Typography color="error" mb={2}>{error}</Typography>}
        
        {maquinaria && !loading && (
          <>
            <Divider sx={{ my: 4 }} />
            <Typography variant="h5" sx={{ 
              mb: 3, 
              fontWeight: 600, 
              color: 'primary.main',
              borderBottom: '2px solid #1976d2',
              paddingBottom: 1,
              display: 'inline-block'
            }}>
              Detalles de la Maquinaria
            </Typography>
            <Box>
              <TablaGenericaAvanzada
                title="Datos de la Maquinaria"
                data={[maquinaria]}
                fields={maquinariaFields}
                emptyMessage="No hay datos de maquinaria"
              />
              <TablaGenerica title="Control" data={control} ocultarCampos={ocultarCampos} reemplazos={{ 'gerente': 'Gerente', 'encargado': 'Encargado', 'estado': 'Estado', 'ubicacion': 'Ubicación' }} />
              <TablaGenerica title="Asignación" data={asignacion} ocultarCampos={ocultarCampos} reemplazos={{ 'fecha_asignacion': 'Fecha de Asignación', 'recorrido_km': 'Recorrido Km', 'encargado': 'Encargado', 'ubicacion': 'Ubicación' }} />
              <TablaGenerica title="Mantenimiento" data={mantenimiento} ocultarCampos={ocultarCampos} />
              <TablaGenerica title="SOAT" data={soat} ocultarCampos={ocultarCampos} />
              <TablaGenerica title="Seguros" data={seguros} ocultarCampos={ocultarCampos} reemplazos={{ 'numero_2024': 'N° 2024' }} />
              <TablaGenerica title="ITV" data={itv} ocultarCampos={ocultarCampos} />
              <TablaGenerica title="Impuestos" data={impuestos} ocultarCampos={ocultarCampos} />
              <TablaGenericaAvanzada
                title="Depreciaciones"
                data={depreciaciones}
                fields={depFields}
                emptyMessage="No hay depreciaciones para esta maquinaria"
                customCellRender={(key, value) => {
                  if (key.toLowerCase().includes('fecha')) {
                    if (value && typeof value === 'string') {
                      // Manejar tanto formato ISO (T) como formato con espacios (00:00:00)
                      if (value.includes('T')) {
                        return value.split('T')[0];
                      } else if (value.includes(' ')) {
                        return value.split(' ')[0];
                      }
                      return value;
                    }
                    return value ?? '-';
                  }
                  return value ?? '-';
                }}
              />
              <TablaGenericaAvanzada
                title="Pronósticos"
                data={pronosticos}
                fields={proFields}
                emptyMessage="No hay pronósticos para esta maquinaria"
                ocultarCampos={['placa']}
                customCellRender={(key, value, row) => {
                  if (key === 'recomendaciones') {
                    return renderRecomendaciones(value);
                  }
                  if (key.toLowerCase().includes('fecha')) {
                    if (value && typeof value === 'string') {
                      // Manejar tanto formato ISO (T) como formato con espacios (00:00:00)
                      if (value.includes('T')) {
                        return value.split('T')[0];
                      } else if (value.includes(' ')) {
                        return value.split(' ')[0];
                      }
                      return value;
                    }
                    return value ?? '-';
                  }
                  return value ?? '-';
                }}
              />
            </Box>
          </>
        )}
        {searched && !maquinaria && !loading && !error && (
          <Typography color="text.secondary">Busca una maquinaria por placa, código o detalle.</Typography>
        )}
      </DashboardCard>
    </PageContainer>
  );
};

export default ReportesMain;