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
import { getRiesgoColor, getRecomendacion, getAccionPorTipo, FIELD_LABELS } from "./hooks";
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
const ModalPronostico = ({ open, onClose, maquinaria, onPredictionSaved }) => {
  const [form, setForm] = useState({
    fecha_asig: "",
    horas_op: "",
    recorrido: ""
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [iaResult, setIaResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ fecha_asig: "", horas_op: "", recorrido: "" });
      setFormError("");
      setSubmitting(false);
      setIaResult(null);
      setSaveSuccess(false);
    }
  }, [open, maquinaria]);

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

      const res = await fetch("http://localhost:8000/api/pronostico/", {
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

        {iaResult && (
          <Box mt={3}>
            <Box p={2} border={1} borderColor="primary.main" borderRadius={2} bgcolor="#f5faff">
              <Typography variant="subtitle1" color="primary" mb={1}>
                Resultado del Pronóstico
              </Typography>
              {Object.entries(iaResult)
                .filter(([key]) => key !== '_id' && key !== 'creado_en' && key !== 'fecha_prediccion' && key !== 'recomendaciones' && key !== 'fechas_futuras')
                .map(([key, value]) => {
                  if (key === "riesgo") {
                    return (
                      <Typography key={key} sx={{ color: getRiesgoColor(value), fontWeight: 600 }}>
                        {FIELD_LABELS[key] || capitalizeSentence(key)}: {capitalizeSentence(String(value))}
                      </Typography>
                    );
                  }
                  if (key === "probabilidad") {
                    return (
                      <Typography key={key}>
                        {FIELD_LABELS[key] || capitalizeSentence(key)}: {formatProbabilidad(value)}
                      </Typography>
                    );
                  }
                  if (key === "resultado") {
                    return (
                      <Typography key={key}>
                        {FIELD_LABELS[key] || capitalizeSentence(key)}: <b>{capitalizeSentence(String(value))}</b> <br />
                        <span style={{ fontStyle: 'italic', color: '#1976d2' }}>{getRecomendacion(String(value))}</span>
                      </Typography>
                    );
                  }
                  if (key === "fecha_sugerida") {
                    return (
                      <Typography key={key} sx={{ color: 'success.dark', fontWeight: 600 }}>
                        {FIELD_LABELS[key] || capitalizeSentence(key)}: {String(value)}
                      </Typography>
                    );
                  }
                  return (
                    <Typography key={key}>
                      {FIELD_LABELS[key] || capitalizeSentence(key)}: {String(value)}
                    </Typography>
                  );
                })}
              {!iaResult.fecha_sugerida && (
                <Typography sx={{ color: 'success.dark', fontWeight: 600 }}>
                  Fecha Sugerida de Mantenimiento: {(() => {
                    try {
                      const base = iaResult.fecha_asig || iaResult.fecha_prediccion;
                      if (!base) return 'No disponible';
                      const d = new Date(base);
                      d.setDate(d.getDate() + 180);
                      return d.toISOString().split('T')[0];
                    } catch {
                      return 'No disponible';
                    }
                  })()}
                </Typography>
              )}
              <Typography sx={{ color: 'info.main', fontWeight: 600, mt: 2 }}>
                Recomendaciones:
              </Typography>
              {Array.isArray(iaResult.recomendaciones) && iaResult.recomendaciones.length > 0 && iaResult.recomendaciones[0] !== 'Consultar con el área de mantenimiento.' ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {iaResult.recomendaciones.map((rec, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{rec}</li>
                  ))}
                </ul>
              ) : (
                <Typography color="text.secondary">No hay recomendaciones generadas.</Typography>
              )}
              <Typography sx={{ color: 'info.main', fontWeight: 600, mt: 2 }}>
                Acciones a tomar: {getAccionPorTipo(iaResult.resultado)}
              </Typography>
              {saveSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>¡Información guardada exitosamente!</Alert>
              )}
            </Box>
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
  onPredictionSaved: PropTypes.func.isRequired,
};
export default ModalPronostico;
