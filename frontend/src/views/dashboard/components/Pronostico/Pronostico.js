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
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import TablaPronostico from "./TablaPronostico";
import ModalPronostico from "./ModalPronostico";
import GraficoPronosticos from "./GraficoPronosticos";
import HistorialPronosticos from "./HistorialPronosticos";
import { getRecomendacionesPorTipo } from "./hooks";

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
        const resPronostico = await fetch("http://localhost:8000/api/pronostico/");
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
      fetch('http://localhost:8000/api/pronostico/')
        .then(res => res.json())
        .then(data => setAllForecasts(data));
    }
  }, [mainTab]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando datos...</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 1100, margin: '0 auto', mt: 3 }}>
      <Tabs value={mainTab} onChange={(e, v) => setMainTab(v)} sx={{ mb: 2 }}>
        <Tab label="Pronóstico de Mantenimiento" />
        <Tab label="Ver Pronóstico" />
      </Tabs>

      {mainTab === 0 && (
        <TablaPronostico
          maquinarias={maquinarias}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          openModal={(maq) => {
            setSelectedMaquinaria(maq);
            setModalOpen(true);
          }}
        />
      )}

      {mainTab === 1 && (
        <Box display="flex" flexDirection="column" alignItems="center">
          <GraficoPronosticos data={allForecasts} />
          <HistorialPronosticos
            data={allForecasts}
            onRecomendacionClick={(e, resultado) =>
              handleOpenPopover(e, getRecomendacionesPorTipo(resultado))
            }
          />
        </Box>
      )}

      <ModalPronostico
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maquinaria={selectedMaquinaria}
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
