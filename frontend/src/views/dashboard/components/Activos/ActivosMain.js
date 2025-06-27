import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import ActivosTabla from './ActivosTabla';
import { fetchActivos } from './utils/api';

const ActivosMain = () => {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarActivos = async () => {
      setLoading(true);
      try {
        const data = await fetchActivos();
        setActivos(Array.isArray(data) ? data : []);
      } catch (error) {
        setActivos([]);
      } finally {
        setLoading(false);
      }
    };
    cargarActivos();
  }, []);

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Activos
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ActivosTabla activos={activos} />
      )}
    </Paper>
  );
};

export default ActivosMain; 