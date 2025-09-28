import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Button,
  Typography,
  Alert
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import { getRiesgoColor, getRandomRecomendacionesPorTipo } from "./hooks";
import PropTypes from "prop-types";
// Utilidades para capitalizar y formatear probabilidad
function capitalizeSentence(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function formatProbabilidad(prob) {
  if (prob === undefined || prob === null) return '-';
  const num = Number(prob);
  return Number.isInteger(num) ? `${num}%` : `${num.toFixed(2)}%`;
}
// Componente reutilizable para mostrar un pronóstico con estilo
function PronosticoCard({ pronostico }) {
  if (!pronostico) return null;
  const {
    placa,
    fecha_asig,
    horas_op,
    recorrido,
    resultado,
    riesgo,
    probabilidad,
    fecha_sugerida,
    fecha_mantenimiento,
    fecha_recordatorio,
    dias_hasta_mantenimiento,
    urgencia,
    recomendaciones
  } = pronostico;
  // Mostrar solo 3 recomendaciones aleatorias relevantes
  const recomendacionesMostrar = getRandomRecomendacionesPorTipo(resultado, recomendaciones);
  return (
    <Box p={2} border={1} borderColor="primary.main" borderRadius={2} bgcolor="#f5faff" mb={2}>
      <Typography variant="subtitle1" color="primary" mb={1}>
        Resultado del Pronóstico
      </Typography>
      <Typography><b>Placa:</b> {placa || '-'}</Typography>
      <Typography><b>Fecha de Asignación:</b> {fecha_asig || '-'}</Typography>
      <Typography><b>Horas de Operación:</b> {horas_op || '-'}</Typography>
      <Typography><b>Recorrido (km):</b> {recorrido || '-'}</Typography>
      <Typography><b>Resultado:</b> <b>{capitalizeSentence(resultado)}</b></Typography>
      {resultado && resultado.toLowerCase() === 'correctivo' && (
        <Typography color="error" fontWeight={600}>¡Atención inmediata!</Typography>
      )}
      <Typography><b>Riesgo:</b> <span style={{ color: getRiesgoColor(riesgo), fontWeight: 600 }}>{capitalizeSentence(riesgo)}</span></Typography>
      <Typography><b>Probabilidad:</b> {formatProbabilidad(probabilidad)}</Typography>
      <Typography sx={{ color: 'teal', fontWeight: 600 }}>
        Fecha Sugerida de Mantenimiento: {fecha_sugerida || fecha_mantenimiento || (() => {
          try {
            if (fecha_asig) {
              const d = new Date(fecha_asig);
              if (resultado && resultado.toLowerCase().includes('correctivo')) {
                d.setDate(d.getDate() + 10);
              } else if (resultado && resultado.toLowerCase().includes('preventivo')) {
                d.setDate(d.getDate() + 60);
              } else {
                d.setDate(d.getDate() + 30);
              }
              return d.toISOString().split('T')[0];
            }
            return '-';
          } catch {
            return '-';
          }
        })()}
      </Typography>
      {fecha_recordatorio && (
        <Typography sx={{ color: 'orange', fontWeight: 600 }}>
          Fecha de Recordatorio: {fecha_recordatorio}
        </Typography>
      )}
      {dias_hasta_mantenimiento && (
        <Typography sx={{ color: 'blue', fontWeight: 600 }}>
          Días hasta Mantenimiento: {dias_hasta_mantenimiento}
        </Typography>
      )}
      {urgencia && (
        <Typography sx={{ color: 'red', fontWeight: 600 }}>
          Urgencia: {urgencia}
        </Typography>
      )}
      <Typography sx={{ color: 'info.main', fontWeight: 600, mt: 2 }}>Recomendaciones:</Typography>
      {Array.isArray(recomendacionesMostrar) && recomendacionesMostrar.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {recomendacionesMostrar.map((rec, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>{rec}</li>
          ))}
        </ul>
      ) : (
        <Typography color="text.secondary">No hay recomendaciones generadas.</Typography>
      )}
    </Box>
  );
}

// PropTypes para PronosticoCard
PronosticoCard.propTypes = {
  pronostico: PropTypes.shape({
    placa: PropTypes.string,
    fecha_asig: PropTypes.string,
    horas_op: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    recorrido: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    resultado: PropTypes.string,
    riesgo: PropTypes.string,
    probabilidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    fecha_sugerida: PropTypes.string,
    fecha_mantenimiento: PropTypes.string,
    fecha_recordatorio: PropTypes.string,
    dias_hasta_mantenimiento: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    urgencia: PropTypes.string,
    recomendaciones: PropTypes.array
  })
};

const ModalPronostico = ({ open, onClose, maquinaria, historial = [], onPredictionSaved }) => {
  const [form, setForm] = useState({
    fecha_asig: "",
    horas_op: "",
    recorrido: ""
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [iaResult, setIaResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Mostrar historial por defecto si existe, formulario si no hay historial
  const [showForm, setShowForm] = useState(!(Array.isArray(historial) && historial.length > 0));

  useEffect(() => {
    if (open) {
      setForm({ fecha_asig: "", horas_op: "", recorrido: "" });
      setFormError("");
      setSubmitting(false);
      setIaResult(null);
      setSaveSuccess(false);
      setShowForm(!(Array.isArray(historial) && historial.length > 0));
    }
  }, [open, maquinaria, historial]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIaResult(null);
    setSaveSuccess(false);

    if (!form.fecha_asig || !form.horas_op || !form.recorrido) {
      setFormError("Completa todos los campos.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        placa: maquinaria?.placa || "",
        fecha_asig: form.fecha_asig.includes('/') ? form.fecha_asig.split('/').reverse().join('-') : form.fecha_asig,
        horas_op: parseFloat(form.horas_op),
        recorrido: parseFloat(form.recorrido)
      };

      console.log('Pronóstico URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/pronostico/`); // Debug
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/pronostico/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      console.log('Pronóstico response status:', res.status); // Debug
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Pronóstico error:', err); // Debug
        throw new Error(err.error || "Error al obtener pronóstico");
      }

      const result = await res.json();
      console.log('Pronóstico result:', result); // Debug
      setIaResult(result);
      setSaveSuccess(true);
      onPredictionSaved();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Pronóstico para {maquinaria?.placa ? `${maquinaria.placa} - ` : ''}{maquinaria?.detalle}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Historial de pronósticos con estilo */}
        {showForm === false && Array.isArray(historial) && historial.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle1" color="primary" mb={1}>Historial de Pronósticos</Typography>
            {historial.map((h, idx) => (
              <PronosticoCard key={idx} pronostico={h} />
            ))}
            <Button variant="outlined" color="primary" sx={{ mt: 1 }} onClick={() => { setShowForm(true); setIaResult(null); setSaveSuccess(false); }}>Generar otro pronóstico</Button>
          </Box>
        )}
        {/* Formulario para nuevo pronóstico */}
        {showForm && (
          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Fecha de asignación"
              name="fecha_asig"
              type="date"
              value={form.fecha_asig}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Horas de operación"
              name="horas_op"
              type="number"
              value={form.horas_op}
              onChange={handleFormChange}
              required
            />
            <TextField
              label="Recorrido (km)"
              name="recorrido"
              type="number"
              value={form.recorrido}
              onChange={handleFormChange}
              required
            />
            {formError && <Alert severity="error">{formError}</Alert>}
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>
              {submitting ? "Calculando..." : "Solicitar Pronóstico"}
            </Button>
          </Box>
        )}
        {/* Resultado del pronóstico */}
        {iaResult && (
          <Box mt={3}>
            <PronosticoCard pronostico={iaResult} />
            {saveSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>¡Información guardada exitosamente!</Alert>
            )}
            <Button variant="outlined" color="primary" sx={{ mt: 1 }} onClick={() => { setShowForm(false); setIaResult(null); setSaveSuccess(false); }}>Ver historial</Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
ModalPronostico.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  maquinaria: PropTypes.shape({
    placa: PropTypes.string,
    detalle: PropTypes.string,
  }),
  historial: PropTypes.array,
  onPredictionSaved: PropTypes.func.isRequired,
};
export default ModalPronostico;
