import { useState } from 'react';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from 'src/components/shared/DashboardCard';
import BusquedaForm from './BusquedaForm';
import TablaGenerica from './TablaGenerica';
import TablaGenericaAvanzada from './TablaGenerica.jsx';
import ExportarReportes from './ExportarReportes';
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
import { CircularProgress, Typography, Box} from '@mui/material';

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
      const q = search.toLowerCase().trim().replace(/\s+/g, '');
      const maq = maqs.find(m =>
        m.placa?.toLowerCase().trim().replace(/\s+/g, '') === q ||
        m.codigo?.toLowerCase().trim().replace(/\s+/g, '') === q ||
        m.detalle?.toLowerCase().trim().replace(/\s+/g, '') === q
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

  const ocultarCampos = ['bien_de_uso', 'vida_util', 'costo_activo'];

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
        {loading && <Box p={3} textAlign="center"><CircularProgress /></Box>}
        {error && <Typography color="error" mb={2}>{error}</Typography>}
        {maquinaria && (
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
              customCellRender={(key, value) => key.toLowerCase().includes('fecha') ? (value ? value.split('T')[0] : '-') : (value ?? '-')}
            />
            <TablaGenericaAvanzada
              title="Pronósticos"
              data={pronosticos}
              fields={proFields}
              emptyMessage="No hay pronósticos para esta maquinaria"
              customCellRender={(key, value, row) => {
                if (key === 'recomendaciones') {
                  return Array.isArray(value) ? value.join('; ') : (value || '-');
                }
                if (key.toLowerCase().includes('fecha')) {
                  return value ? value.split('T')[0] : '-';
                }
                return value ?? '-';
              }}
            />
          </Box>
        )}
        {searched && !maquinaria && !loading && !error && (
          <Typography color="text.secondary">Busca una maquinaria por placa, código o detalle.</Typography>
        )}
      </DashboardCard>
    </PageContainer>
  );
};

export default ReportesMain;