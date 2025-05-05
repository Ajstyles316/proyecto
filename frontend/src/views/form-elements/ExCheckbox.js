import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  Button,
  Modal,
  TextField,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const AssignmentTable = () => {
  const [assignments, setAssignments] = useState([]);
  const [maquinarias, setMaquinarias] = useState([]);
  const [controles, setControles] = useState([]);
  const [form, setForm] = useState({
    maquinaria: "",
    fechaAsignacion: new Date().toISOString().split("T")[0],
    gestion: "",
    encargado: "",
  });
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  // Función para obtener el nombre de la maquinaria
  const getMaquinariaNombre = (maqId) => {
    const maq = maquinarias.find(m => m._id?.$oid === maqId || m._id === maqId);
    return maq?.detalle || "Desconocido";
  };

  // Función para obtener el nombre del encargado desde controles
  const getEncargadoNombre = (encId) => {
    const enc = controles.find(c => c._id?.$oid === encId || c._id === encId);
    return enc?.encargado || "Desconocido";
  };

  useEffect(() => {
    fetchAssignments();
    fetchMaquinarias();
    fetchControles();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/asignacion/");
      if (!response.ok) throw new Error("Error al cargar las asignaciones");
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error("Error:", error.message);
      alert("No se pudieron cargar las asignaciones.");
    }
  };

  const fetchMaquinarias = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
      const data = await response.json();
      setMaquinarias(data);
    } catch (error) {
      console.error("Error al cargar máquinas:", error.message);
    }
  };

  const fetchControles = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/control/");
      const data = await response.json();
      setControles(data);
    } catch (error) {
      console.error("Error al cargar controles:", error.message);
    }
  };

  const handleOpen = () => {
    setForm({
      maquinaria: "",
      fechaAsignacion: new Date().toISOString().split("T")[0],
      gestion: "",
      encargado: "",
    });
    setEditingId(null);
    setErrors({});
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
    setErrors({});
    setForm({
      maquinaria: "",
      fechaAsignacion: new Date().toISOString().split("T")[0],
      gestion: "",
      encargado: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.maquinaria || form.maquinaria.trim() === "") {
      newErrors.maquinaria = "Seleccione una maquinaria";
    }

    if (!form.fechaAsignacion || form.fechaAsignacion.trim() === "") {
      newErrors.fechaAsignacion = "Ingrese la fecha de asignación";
    }

    if (!form.gestion || form.gestion.trim() === "") {
      newErrors.gestion = "Seleccione una gestión";
    }

    if (!form.encargado || form.encargado.trim() === "") {
      newErrors.encargado = "Seleccione un encargado";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        maquinaria_id: form.maquinaria,
        fechaAsignacion: form.fechaAsignacion,
        gestion: form.gestion,
        encargado_id: form.encargado,
      };

      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `http://localhost:8000/api/asignacion/${editingId}/`
        : "http://localhost:8000/api/asignacion/";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error al guardar");

      fetchAssignments();
      handleClose();
    } catch (error) {
      console.error("Error al guardar:", error.message);
      alert("Ocurrió un error al guardar.");
    }
  };

  const handleEdit = (item) => {
    const _id = item._id?.$oid || item._id;
    setForm({
      maquinaria: item.maquinaria_id?.$oid || item.maquinaria_id || item.maquinaria || "",
      fechaAsignacion: item.fechaAsignacion || "",
      gestion: item.gestion || "",
      encargado: item.encargado_id?.$oid || item.encargado_id || item.encargado || "",
    });
    setEditingId(_id);
    setOpenModal(true);
    setErrors({});
  };

  const handleDelete = async (_id) => {
    const id = _id?.$oid || _id;
    if (!id) return alert("ID inválido");

    try {
      const response = await fetch(`http://localhost:8000/api/asignacion/${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar");

      fetchAssignments();
    } catch (error) {
      alert("No se pudo eliminar la asignación");
      console.error("Error al eliminar:", error.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Asignación
        </Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleOpen}>
          Nuevo
        </Button>
      </Box>

      <Table aria-label="simple table" sx={{ whiteSpace: "nowrap" }}>
        <TableHead>
          <TableRow>
            <TableCell><Typography fontWeight={600}>N°</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Maquinaria</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Encargado</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Fecha Asignación</Typography></TableCell>
            <TableCell><Typography fontWeight={600}>Gestión</Typography></TableCell>
            <TableCell align="right"><Typography fontWeight={600}>Acciones</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assignments.map((a, index) => {
            const _id = a._id?.$oid || a._id || index.toString();
            return (
              <TableRow key={_id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{getMaquinariaNombre(a.maquinaria_id || a.maquinaria)}</TableCell>
                <TableCell>{getEncargadoNombre(a.encargado_id || a.encargado)}</TableCell>
                <TableCell>{new Date(a.fechaAsignacion).toLocaleDateString()}</TableCell>
                <TableCell>{a.gestion}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleEdit(a)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(_id)}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Modal open={openModal} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" mb={2}>
            {editingId ? "Editar Asignación" : "Agregar Asignación"}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              label="Maquinaria"
              name="maquinaria"
              value={form.maquinaria}
              onChange={handleChange}
              error={!!errors.maquinaria}
              helperText={errors.maquinaria}
            >
              <MenuItem value="" disabled>
                Seleccione una maquinaria
              </MenuItem>
              {maquinarias.map((maq) => {
                const _id = maq._id?.$oid || maq._id;
                return (
                  <MenuItem key={_id} value={_id}>
                    {maq.detalle}
                  </MenuItem>
                );
              })}
            </TextField>

            <TextField
              type="date"
              label="Fecha Asignación"
              name="fechaAsignacion"
              value={form.fechaAsignacion}
              onChange={handleChange}
              error={!!errors.fechaAsignacion}
              helperText={errors.fechaAsignacion}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Gestión"
              name="gestion"
              value={form.gestion}
              onChange={handleChange}
              error={!!errors.gestion}
              helperText={errors.gestion}
            >
              <MenuItem value="" disabled>
                Seleccione una gestión
              </MenuItem>
              <MenuItem value="CUSTODIA">CUSTODIA</MenuItem>
              <MenuItem value="UPCM">UPCM</MenuItem>
            </TextField>

            <TextField
              select
              label="Encargado"
              name="encargado"
              value={form.encargado}
              onChange={handleChange}
              error={!!errors.encargado}
              helperText={errors.encargado}
            >
              <MenuItem value="" disabled>
                Seleccione un encargado
              </MenuItem>
              {controles.map((c) => {
                const _id = c._id?.$oid || c._id;
                return (
                  <MenuItem key={_id} value={_id}>
                    {c.encargado}
                  </MenuItem>
                );
              })}
            </TextField>

            <Button variant="contained" color="error" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="contained" color="secondary" onClick={handleSubmit}>
              {editingId ? "Actualizar" : "Guardar"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default AssignmentTable;