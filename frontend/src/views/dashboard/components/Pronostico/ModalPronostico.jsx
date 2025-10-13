import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Button,
  Typography,
  Alert,
  Chip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import { getRiesgoColor, getRandomRecomendacionesPorTipo } from "./hooks";
import PropTypes from "prop-types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
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
// Visual de urgencia (coherente con el historial)
function getUrgenciaStyle(urgencia) {
  if (!urgencia) return { color: '#8bc34a', bg: '#8bc34a15' };
  const map = {
    'CRÍTICA': { color: '#d32f2f', bg: '#d32f2f15' },
    'ALTA': { color: '#f57c00', bg: '#f57c0015' },
    'MODERADA': { color: '#ff9800', bg: '#ff980015' },
    'NORMAL': { color: '#4caf50', bg: '#4caf5015' },
    'MÍNIMA': { color: '#8bc34a', bg: '#8bc34a15' }
  };
  return map[urgencia] || { color: '#8bc34a', bg: '#8bc34a15' };
}
function normalizeTipo(resultado) {
  if (!resultado) return 'otro';
  const val = String(resultado).toLowerCase();
  if (val.includes('prevent')) return 'preventivo';
  if (val.includes('correct')) return 'correctivo';
  return 'otro';
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
      <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
        {/* Chip por tipo de mantenimiento */}
        <Chip
          size="small"
          label={resultado ? capitalizeSentence(normalizeTipo(resultado)) : 'Sin tipo'}
          sx={{
            color: normalizeTipo(resultado) === 'correctivo' ? '#d32f2f' : normalizeTipo(resultado) === 'preventivo' ? '#2e7d32' : '#1976d2',
            backgroundColor: normalizeTipo(resultado) === 'correctivo' ? '#d32f2f15' : normalizeTipo(resultado) === 'preventivo' ? '#2e7d3215' : '#1976d215',
            fontWeight: 600
          }}
        />
        {/* Chip de urgencia (si existe) */}
        {urgencia && (() => {
          const s = getUrgenciaStyle(urgencia);
          return (
            <Chip
              size="small"
              label={`Urgencia: ${urgencia}`}
              sx={{ color: s.color, backgroundColor: s.bg, fontWeight: 600 }}
            />
          );
        })()}
      </Box>
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

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/pronostico/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al obtener pronóstico");
      }

      const result = await res.json();
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
            {/* Gráfico compacto de evolución */}
            <Box sx={{ width: '100%', height: 220, mb: 2 }} aria-label="Gráfico de evolución de pronósticos">
              {(() => {
                const tipos = (historial || []).map(h => normalizeTipo(h.resultado));
                const countPreventivo = tipos.filter(t => t === 'preventivo').length;
                const countCorrectivo = tipos.filter(t => t === 'correctivo').length;
                const predominant = countCorrectivo > countPreventivo ? 'correctivo' : countPreventivo > 0 ? 'preventivo' : 'otro';
                const strokeColor = predominant === 'correctivo' ? '#d32f2f' : predominant === 'preventivo' ? '#2e7d32' : '#1976d2';
                const gradientId = 'colorValorModal';
                const dataSerie = [...historial]
                  .map((h, idx) => {
                    const fecha = (() => {
                      const raw = h.fecha_asig || h.fecha_mantenimiento || h.fecha_sugerida;
                      if (!raw) return `#${idx + 1}`;
                      try {
                        const d = new Date(String(raw));
                        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                        return String(raw).split('T')[0].split(' ')[0];
                      } catch {
                        return `#${idx + 1}`;
                      }
                    })();
                    const prob = h.probabilidad !== undefined && h.probabilidad !== null ? Number(h.probabilidad) : null;
                    const horas = h.horas_op !== undefined && h.horas_op !== null ? Number(h.horas_op) : null;
                    const recorrido = h.recorrido !== undefined && h.recorrido !== null ? Number(h.recorrido) : null;
                    const yVal = prob ?? horas ?? recorrido ?? null;
                    const serie = prob !== null ? 'Probabilidad (%)' : horas !== null ? 'Horas Operación' : 'Recorrido (km)';
                    return { fecha, valor: yVal, serie };
                  })
                  .filter(d => d.valor !== null);
                return (
                  <>
                    {/* Leyenda simple por tipo */}
                    <Box display="flex" gap={2} mb={1} alignItems="center">
                      {countPreventivo > 0 && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2e7d32' }} />
                          <Typography variant="caption">Preventivo</Typography>
                        </Box>
                      )}
                      {countCorrectivo > 0 && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#d32f2f' }} />
                          <Typography variant="caption">Correctivo</Typography>
                        </Box>
                      )}
                    </Box>
                    <ResponsiveContainer>
                      <AreaChart data={dataSerie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} width={40} />
                        <Tooltip
                          formatter={(val, name, ctx) => [val, ctx?.payload?.serie || 'Valor']}
                          labelFormatter={(label) => `Fecha: ${label}`}
                        />
                        <Area type="monotone" dataKey="valor" stroke={strokeColor} fillOpacity={1} fill={`url(#${gradientId})`} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                );
              })()}
            </Box>
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
