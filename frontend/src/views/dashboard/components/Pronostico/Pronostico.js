import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import TablaPronostico from "./TablaPronostico";
import ModalPronostico from "./ModalPronostico";
import GraficoPronosticos from "./GraficoPronosticos";
import HistorialPronosticos from "./HistorialPronosticos";
import PronosticoDashboard from "./PronosticoDashboard";
import { useUser } from 'src/components/UserContext.jsx';

const Pronostico = () => {
  const [pronosticos, setPronosticos] = useState([]);
  const [maquinarias, setMaquinarias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados compartidos
  const [searchTerm, setSearchTerm] = useState("");
  const [mainTab, setMainTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMaquinaria, setSelectedMaquinaria] = useState(null);

  const [allForecasts, setAllForecasts] = useState([]);

  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverRecs, setPopoverRecs] = useState([]);

  const { user } = useUser();
  const permisosPronostico = user?.permisos?.['Pronóstico'] || {};
  // Permitir acceso total a admin/encargado
  const isAdminOrEncargado = user?.Cargo?.toLowerCase() === 'admin' || user?.Cargo?.toLowerCase() === 'encargado';
  const isDenied = !isAdminOrEncargado && permisosPronostico.eliminar;
  const canEdit = isAdminOrEncargado || permisosPronostico.editar;

  const handleOpenPopover = (event, recs) => {
    setAnchorEl(event.currentTarget);
    setPopoverRecs(recs);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setPopoverRecs([]);
  };

  const openPopover = Boolean(anchorEl);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const resPronostico = await fetch("http://localhost:8000/api/pronostico/?page_size=1000");
        const resMaquinarias = await fetch("http://localhost:8000/api/maquinaria/");
        const dataPronostico = await resPronostico.json();
        const dataMaquinarias = await resMaquinarias.json();
        setPronosticos(dataPronostico);
        setMaquinarias(dataMaquinarias);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (mainTab === 1) {
      fetch('http://localhost:8000/api/pronostico/?page_size=1000')
        .then(res => res.json())
        .then(data => setAllForecasts(data));
    }
  }, [mainTab]);

  // Función utilitaria para sumar meses a una fecha
  function sumarMeses(fecha, meses) {
    const d = new Date(fecha);
    d.setMonth(d.getMonth() + meses);
    return d.toISOString().split('T')[0];
  }

  // Formatea una fecha a DD-MM-YYYY
  function formatearFechaDMY(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Genera fechas futuras cada 4, 6, 12, 24 meses hasta hoy o fin de año
  function generarFechasFuturas(base) {
    if (!base) return [];
    const fechas = [];
    const baseDate = new Date(base);
    const hoy = new Date();
    const finAnio = new Date(hoy.getFullYear(), 11, 31);
    const endDate = hoy > finAnio ? hoy : finAnio;
    const saltos = [4, 6, 12, 24];
    for (let salto of saltos) {
      const nueva = new Date(baseDate);
      nueva.setMonth(nueva.getMonth() + salto);
      if (nueva <= endDate) {
        fechas.push(formatearFechaDMY(nueva));
      }
    }
    return fechas;
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando datos...</Typography>
      </Box>
    );
  }

  if (isDenied) {
    return <Typography variant="h6" color="error">Acceso denegado a Pronóstico</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, margin: '0 auto', mt: 3 }}>
      <Tabs value={mainTab} onChange={(e, v) => setMainTab(v)} sx={{ mb: 2 }}>
        <Tab label="Pronóstico de Mantenimiento" />
        <Tab label="Dashboard y Análisis" />
      </Tabs>

      {mainTab === 0 && (
        <>
          {/* Dashboard para la primera pestaña */}
          <PronosticoDashboard pronosticos={pronosticos} maquinarias={maquinarias} />
          
          <Divider sx={{ my: 4 }} />
          
          {/* Tabla de pronósticos */}
          <TablaPronostico
            maquinarias={maquinarias}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            openModal={canEdit ? (maq) => {
                setSelectedMaquinaria(maq);
                setModalOpen(true);
            } : () => {}}
            isReadOnly={!canEdit}
            pronosticos={pronosticos}
          />
        </>
      )}

      {mainTab === 1 && (
        <Box display="flex" flexDirection="column" alignItems="center">
          <GraficoPronosticos data={allForecasts} />
          <HistorialPronosticos
            data={allForecasts}
            onRecomendacionClick={handleOpenPopover}
          />
        </Box>
      )}

      <ModalPronostico
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maquinaria={selectedMaquinaria}
        historial={pronosticos.filter(p => p.placa === selectedMaquinaria?.placa)}
        onPredictionSaved={() => {
          fetch("http://localhost:8000/api/pronostico/")
            .then((res) => res.json())
            .then((data) => setPronosticos(data));
        }}
      />

      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box p={2} maxWidth={350}>
          <Typography variant="subtitle1" color="primary" mb={1}>Recomendaciones</Typography>
          <List dense>
            {popoverRecs.map((rec, idx) => (
              <ListItem key={idx}>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={rec} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </Paper>
  );
};

export default Pronostico;
