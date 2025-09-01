import { useState, useEffect } from 'react';
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
  fetchLiberacion,
  fetchMantenimiento,
  fetchSOAT,
  fetchSeguros,
  fetchITV,
  fetchImpuestos
} from './serviciosAPI';
import { 
  maquinariaFields, 
  depFields, 
  pronosticoFields,
  controlFields,
  asignacionFields,
  liberacionFields,
  mantenimientoFields,
  soatFields,
  seguroFields,
  itvFields,
  impuestoFields
} from './fields';
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
  const [liberacion, setLiberacion] = useState([]);
  const [mantenimiento, setMantenimiento] = useState([]);
  const [soat, setSOAT] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [itv, setITV] = useState([]);
  const [impuestos, setImpuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // useEffect para monitorear cambios en el estado
  useEffect(() => {
    console.log('🔍 ESTADO CAMBIÓ:');
    console.log('Control:', control.length);
    console.log('Asignación:', asignacion.length);
    console.log('Liberación:', liberacion.length);
    console.log('Mantenimiento:', mantenimiento.length);
    console.log('SOAT:', soat.length);
    console.log('Seguros:', seguros.length);
    console.log('ITV:', itv.length);
    console.log('Impuestos:', impuestos.length);
  }, [control, asignacion, liberacion, mantenimiento, soat, seguros, itv, impuestos]);

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
      setLiberacion([]);
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
      const [deps, pros, ctrl, asig, lib, mant, soat, seg, itv, imp] = await Promise.all([
        fetchDepreciaciones(maqId),
        fetchPronosticos(maqId),
        fetchControl(maqId),
        fetchAsignacion(maqId),
        fetchLiberacion(maqId),
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
      
      // Debug logs para ver qué datos llegan
      console.log('🔍 DATOS DE CONTROL:', ctrl);
      console.log('🔍 DATOS DE ASIGNACIÓN:', asig);
      console.log('🔍 DATOS DE LIBERACIÓN:', lib);
      console.log('🔍 DATOS DE MANTENIMIENTO:', mant);
      console.log('🔍 DATOS DE SOAT:', soat);
      console.log('🔍 DATOS DE SEGUROS:', seg);
      console.log('🔍 DATOS DE ITV:', itv);
      console.log('🔍 DATOS DE IMPUESTOS:', imp);
      
      // Verificar estructura de datos
      if (Array.isArray(ctrl) && ctrl.length > 0) {
        console.log('🔍 ESTRUCTURA CONTROL:', Object.keys(ctrl[0]));
      }
      if (Array.isArray(asig) && asig.length > 0) {
        console.log('🔍 ESTRUCTURA ASIGNACIÓN:', Object.keys(asig[0]));
      }
      if (Array.isArray(lib) && lib.length > 0) {
        console.log('🔍 ESTRUCTURA LIBERACIÓN:', Object.keys(lib[0]));
      }
      if (Array.isArray(soat) && soat.length > 0) {
        console.log('🔍 ESTRUCTURA SOAT:', Object.keys(soat[0]));
      }
      if (Array.isArray(seg) && seg.length > 0) {
        console.log('🔍 ESTRUCTURA SEGUROS:', Object.keys(seg[0]));
      }
      if (Array.isArray(itv) && itv.length > 0) {
        console.log('🔍 ESTRUCTURA ITV:', Object.keys(itv[0]));
      }
      if (Array.isArray(imp) && imp.length > 0) {
        console.log('🔍 ESTRUCTURA IMPUESTOS:', Object.keys(imp[0]));
      }
      
      setPronosticos(filteredPros);
      // Función para mapear campos de la API a los campos esperados
      const mapearCampos = (datos, mapeo) => {
        if (!Array.isArray(datos)) return [];
        return datos.map(item => {
          const nuevoItem = {};
          Object.keys(mapeo).forEach(apiField => {
            const expectedField = mapeo[apiField];
            if (item[apiField] !== undefined) {
              nuevoItem[expectedField] = item[apiField];
            }
          });
          return nuevoItem;
        });
      };

      // Función para mapear campos automáticamente
      const mapearCamposAuto = (datos, camposEsperados) => {
        if (!Array.isArray(datos) || datos.length === 0) return [];
        
        const primerItem = datos[0];
        const camposDisponibles = Object.keys(primerItem);
        
        console.log('🔍 CAMPOS DISPONIBLES EN API:', camposDisponibles);
        console.log('🔍 CAMPOS ESPERADOS:', camposEsperados);
        
        return datos.map(item => {
          const nuevoItem = {};
          camposEsperados.forEach(campo => {
            // Buscar el campo en los datos de la API (case insensitive)
            const campoEncontrado = camposDisponibles.find(c => 
              c.toLowerCase() === campo.toLowerCase()
            );
            if (campoEncontrado && item[campoEncontrado] !== undefined) {
              nuevoItem[campo] = item[campoEncontrado];
            }
          });
          return nuevoItem;
        });
      };

      // Mapear campos para cada tabla usando campos de fields.js
      const controlMapeado = mapearCamposAuto(ctrl, controlFields.map(f => f.key));
      const asignacionMapeada = mapearCamposAuto(asig, asignacionFields.map(f => f.key));
      const liberacionMapeada = mapearCamposAuto(lib, liberacionFields.map(f => f.key));
      const mantenimientoMapeado = mapearCamposAuto(mant, mantenimientoFields.map(f => f.key));
      const soatMapeado = mapearCamposAuto(soat, soatFields.map(f => f.key));
      const segurosMapeados = mapearCamposAuto(seg, seguroFields.map(f => f.key));
      const itvMapeado = mapearCamposAuto(itv, itvFields.map(f => f.key));
      const impuestosMapeados = mapearCamposAuto(imp, impuestoFields.map(f => f.key));

      setControl(controlMapeado);
      setAsignacion(asignacionMapeada);
      setLiberacion(liberacionMapeada);
      setMantenimiento(mantenimientoMapeado);
      setSOAT(soatMapeado);
      setSeguros(segurosMapeados);
      setITV(itvMapeado);
      setImpuestos(impuestosMapeados);

      // Logs para verificar datos mapeados
      console.log('🔍 DATOS MAPEADOS:');
      console.log('SOAT mapeado:', soatMapeado);
      if (soatMapeado.length > 0) {
        console.log('🔍 SOAT primer registro:', soatMapeado[0]);
        console.log('🔍 SOAT tiene archivo_pdf:', !!soatMapeado[0].archivo_pdf);
      }
      console.log('Seguros mapeados:', segurosMapeados);
      if (segurosMapeados.length > 0) {
        console.log('🔍 Seguros primer registro:', segurosMapeados[0]);
        console.log('🔍 Seguros tiene archivo_pdf:', !!segurosMapeados[0].archivo_pdf);
      }
      console.log('ITV mapeado:', itvMapeado);
      if (itvMapeado.length > 0) {
        console.log('🔍 ITV primer registro:', itvMapeado[0]);
        console.log('🔍 ITV tiene archivo_pdf:', !!itvMapeado[0].archivo_pdf);
      }
      console.log('Impuestos mapeados:', impuestosMapeados);
      if (impuestosMapeados.length > 0) {
        console.log('🔍 Impuestos primer registro:', impuestosMapeados[0]);
        console.log('🔍 Impuestos tiene archivo_pdf:', !!impuestosMapeados[0].archivo_pdf);
      }
      
      // Logs adicionales para verificar el estado
      console.log('🔍 ESTADO ACTUALIZADO:');
      console.log('Control:', Array.isArray(ctrl) ? ctrl.length : 'No es array');
      console.log('Asignación:', Array.isArray(asig) ? asig.length : 'No es array');
      console.log('Liberación:', Array.isArray(lib) ? lib.length : 'No es array');
      console.log('Mantenimiento:', Array.isArray(mant) ? mant.length : 'No es array');
      console.log('SOAT:', Array.isArray(soat) ? soat.length : 'No es array');
      console.log('Seguros:', Array.isArray(seg) ? seg.length : 'No es array');
      console.log('ITV:', Array.isArray(itv) ? itv.length : 'No es array');
      console.log('Impuestos:', Array.isArray(imp) ? imp.length : 'No es array');
    } catch {
      setError('Error al buscar la maquinaria.');
    } finally {
      setLoading(false);
    }
  };

  const ocultarCampos = ['bien_de_uso', 'vida_util', 'costo_activo', 'fecha_creacion', 'fecha_actualizacion', 'created_at', 'updated_at'];

  // Funciones para exportación
  const handleExportPDF = () => {
    console.log('🔍 EXPORTANDO PDF con datos:', {
      maquinaria: !!maquinaria,
      depreciaciones: depreciaciones.length,
      pronosticos: pronosticos.length,
      control: control.length,
      asignacion: asignacion.length,
      liberacion: liberacion.length,
      mantenimiento: mantenimiento.length,
      soat: soat.length,
      seguros: seguros.length,
      itv: itv.length,
      impuestos: impuestos.length
    });
    
    exportPDF({ 
      maquinaria, 
      depreciaciones, 
      pronosticos, 
      control, 
      asignacion, 
      liberacion, 
      mantenimiento, 
      soat, 
      seguros, 
      itv, 
      impuestos 
    });
  };

  const handleExportXLS = () => {
    console.log('🔍 EXPORTANDO XLS con datos:', {
      maquinaria: !!maquinaria,
      depreciaciones: depreciaciones.length,
      pronosticos: pronosticos.length,
      control: control.length,
      asignacion: asignacion.length,
      liberacion: liberacion.length,
      mantenimiento: mantenimiento.length,
      soat: soat.length,
      seguros: seguros.length,
      itv: itv.length,
      impuestos: impuestos.length
    });
    
    exportXLS({ 
      maquinaria: maquinaria ? [maquinaria] : [], 
      depreciaciones, 
      pronosticos, 
      control, 
      asignacion, 
      liberacion, 
      mantenimiento, 
      soat, 
      seguros, 
      itv, 
      impuestos 
    });
  };

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
                                        onExportPDF={() => handleExportPDF()}
              onExportXLS={() => handleExportXLS()}
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
          liberacion={liberacion}
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
              {/* Debug logs */}
              {console.log('🔍 RENDERIZANDO TABLAS:')}
              {console.log('Control data:', control)}
              {console.log('Asignación data:', asignacion)}
              {console.log('Liberación data:', liberacion)}
              {console.log('Mantenimiento data:', mantenimiento)}
              {console.log('SOAT data:', soat)}
              {console.log('Seguros data:', seguros)}
              {console.log('ITV data:', itv)}
              {console.log('Impuestos data:', impuestos)}
              
              {/* Verificar campos específicos */}
              {soat.length > 0 && console.log('🔍 CAMPOS SOAT:', Object.keys(soat[0]))}
              {seguros.length > 0 && console.log('🔍 CAMPOS SEGUROS:', Object.keys(seguros[0]))}
              {itv.length > 0 && console.log('🔍 CAMPOS ITV:', Object.keys(itv[0]))}
              {impuestos.length > 0 && console.log('🔍 CAMPOS IMPUESTOS:', Object.keys(impuestos[0]))}
              
              {/* Verificar datos completos */}
              {soat.length > 0 && console.log('🔍 DATOS COMPLETOS SOAT:', soat[0])}
              {seguros.length > 0 && console.log('🔍 DATOS COMPLETOS SEGUROS:', seguros[0])}
              {itv.length > 0 && console.log('🔍 DATOS COMPLETOS ITV:', itv[0])}
              {impuestos.length > 0 && console.log('🔍 DATOS COMPLETOS IMPUESTOS:', impuestos[0])}
              <TablaGenericaAvanzada
                title="Datos de la Maquinaria"
                data={[maquinaria]}
                fields={maquinariaFields}
                emptyMessage="No hay datos de maquinaria"
              />
              <TablaGenerica 
                title="Control" 
                data={control} 
                ocultarCampos={['maquinaria']} 
                reemplazos={{ 
                  'fecha_inicio': 'Fecha de Inicio', 
                  'fecha_final': 'Fecha Final', 
                  'proyecto': 'Proyecto', 
                  'ubicacion': 'Ubicación', 
                  'estado': 'Estado', 
                  'tiempo': 'Tiempo', 
                  'operador': 'Operador' 
                }} 
              />
              <TablaGenerica 
                title="Asignación" 
                data={asignacion} 
                ocultarCampos={['maquinaria']} 
                reemplazos={{ 
                  'unidad': 'Unidad', 
                  'fecha_asignacion': 'Fecha de Asignación', 
                  'kilometraje': 'Kilometraje', 
                  'gerente': 'Gerente', 
                  'encargado': 'Encargado' 
                }} 
              />
              <TablaGenerica 
                title="Liberación" 
                data={liberacion} 
                ocultarCampos={['maquinaria']} 
                reemplazos={{ 
                  'unidad': 'Unidad', 
                  'fecha_liberacion': 'Fecha de Liberación', 
                  'kilometraje_entregado': 'Kilometraje Entregado', 
                  'gerente': 'Gerente', 
                  'encargado': 'Encargado' 
                }} 
              />
              <TablaGenerica 
                title="Mantenimiento" 
                data={mantenimiento} 
                ocultarCampos={['maquinaria']} 
                reemplazos={{ 
                  'tipo_mantenimiento': 'Tipo de Mantenimiento', 
                  'consumo_combustible': 'Consumo de Combustible', 
                  'consumo_lubricantes': 'Consumo de Lubricantes', 
                  'mano_obra': 'Mano de Obra', 
                  'tecnico_responsable': 'Técnico Responsable' 
                }} 
              />
              <TablaGenerica 
                title="SOAT" 
                data={soat} 
                ocultarCampos={['maquinaria']} 
                reemplazos={{ 
                  'gestion': 'Gestión', 
                  'nombre_archivo': 'Archivo' 
                }} 
              />
              <TablaGenerica 
                title="Seguros" 
                data={seguros} 
                ocultarCampos={['maquinaria']} 
                reemplazos={{ 
                  'fecha_inicial': 'Fecha Inicial', 
                  'fecha_final': 'Fecha Final', 
                  'numero_poliza': 'Nº Póliza', 
                  'compania_aseguradora': 'Compañía Aseguradora', 
                  'importe': 'Importe', 
                  'nombre_archivo': 'Archivo' 
                }} 
              />
              <TablaGenerica 
                title="ITV" 
                data={itv} 
                ocultarCampos={['maquinaria']} 
                reemplazos={{ 
                  'gestion': 'Gestión', 
                  'nombre_archivo': 'Archivo' 
                }} 
              />
              <TablaGenerica 
                title="Impuestos" 
                data={impuestos} 
                ocultarCampos={['maquinaria']} 
                reemplazos={{ 
                  'gestion': 'Gestión', 
                  'nombre_archivo': 'Archivo' 
                }} 
              />
              <TablaGenericaAvanzada
                title="Depreciaciones"
                data={depreciaciones}
                fields={depFields}
                emptyMessage="No hay depreciaciones para esta maquinaria"
                ocultarCampos={['maquinaria']}
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
                fields={pronosticoFields}
                emptyMessage="No hay pronósticos para esta maquinaria"
                ocultarCampos={['maquinaria', 'placa']}
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