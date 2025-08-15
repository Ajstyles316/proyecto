import { useEffect, useState } from "react";
import { fieldLabels } from "../utils/fieldLabels";
import { useUser } from "../../../../../components/UserContext";

const useMaquinariaLogic = () => {
  const [maquinarias, setMaquinarias] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [sectionForm, setSectionForm] = useState({});
  const [detailView, setDetailView] = useState(false);
  const [activeSection, setActiveSection] = useState('Maquinaria');
  const [newMaquinariaModalOpen, setNewMaquinariaModalOpen] = useState(false);
  const [newMaquinariaForm, setNewMaquinariaForm] = useState({});
  const [newMaquinariaErrors, setNewMaquinariaErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentMaquinariaId, setCurrentMaquinariaId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [unidadFilter, setUnidadFilter] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    fetchMaquinarias();
  }, []);

  const fetchMaquinarias = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/maquinaria/");
      if (!response.ok) throw new Error("Error al cargar datos");
      const data = await response.json();
      setMaquinarias(Array.isArray(data) ? data : []);
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: "error" });
      setMaquinarias([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        // Si estamos en modo detalle, actualizar la imagen de la maquinaria específica
        if (detailView && currentMaquinariaId) {
          setSectionForm(prev => ({
            ...prev,
            Maquinaria: {
              ...prev.Maquinaria,
              imagen: reader.result,
            },
          }));
        } else {
          // Si estamos creando una nueva maquinaria
          setNewMaquinariaForm(prev => ({
            ...prev,
            imagen: reader.result,
          }));
        }
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateMaquinaria = async () => {
    setUpdateLoading(true);
    const maquinariaId = sectionForm.Maquinaria?._id?.$oid || sectionForm.Maquinaria?._id;
    if (!maquinariaId) {
      setSnackbar({
        open: true,
        message: 'ID de maquinaria no encontrado',
        severity: 'error',
      });
      setUpdateLoading(false);
      return;
    }

    try {
      const cleanData = (obj) => {
        const result = {};
        for (const key in obj) {
          if (obj[key] !== '' && obj[key] !== null && obj[key] !== undefined) {
            result[key] = obj[key];
          }
        }
        return result;
      };

      const maquinariaData = cleanData(sectionForm.Maquinaria);
      
      // Asegurar que la fecha esté en el formato correcto
      if (maquinariaData.fecha_registro) {
        maquinariaData.fecha_registro = new Date(maquinariaData.fecha_registro).toISOString().split('T')[0];
      }

      const response = await fetch(`http://localhost:8000/api/maquinaria/${maquinariaId}/`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-User-Email": user?.Email || ''
        },
        body: JSON.stringify(maquinariaData)
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'No tienes permisos para editar maquinaria');
        }
        throw new Error('Error al actualizar la maquinaria');
      }

      setSnackbar({
        open: true,
        message: 'Maquinaria actualizada exitosamente',
        severity: 'success',
      });

      // Recargar los datos de la maquinaria específica
      await handleDetailsClick(maquinariaId);
      
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleNewMaquinariaSubmit = async () => {
  setCreateLoading(true);
  const errors = {};
  fieldLabels.Maquinaria.forEach(field => {
    if (field.name !== 'imagen' && !['registrado_por', 'validado_por', 'autorizado_por'].includes(field.name)) {
      const value = newMaquinariaForm[field.name];
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors[field.name] = 'Este campo es obligatorio';
      }
    }
  });

  setNewMaquinariaErrors(errors);
  if (Object.keys(errors).length > 0) {
    setCreateLoading(false);
    return;
  }

  try {
    const formattedData = {
      ...newMaquinariaForm,
      registrado_por: user?.Nombre || user?.Email || 'Usuario',
      fecha_registro: newMaquinariaForm.fecha_registro
        ? new Date(newMaquinariaForm.fecha_registro).toISOString().split('T')[0]
        : undefined, // Evita enviar "" si no hay fecha
    };

    // Limpia campos vacíos
    const cleanData = (obj) => {
      const result = {};
      for (const key in obj) {
        const value = obj[key];
        if (value !== '' && value !== null && value !== undefined) {
          result[key] = value;
        }
      }
      return result;
    };

    const cleanedData = cleanData(formattedData);
    console.log("Body a enviar:", cleanedData); // <- Agregado

    const response = await fetch("http://localhost:8000/api/maquinaria/", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-User-Email": user?.Email || ''
      },
      body: JSON.stringify(cleanedData)
    });

    if (!response.ok) {
      if (response.status === 403) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No tienes permisos para crear maquinaria');
      }
      const errorText = await response.text(); // Agregado para ver el detalle del error
      throw new Error(`Error al guardar: ${errorText}`);
    }

    setSnackbar({ open: true, message: 'Maquinaria registrada exitosamente', severity: 'success' });
    setNewMaquinariaModalOpen(false);
    setNewMaquinariaForm({});
    setNewMaquinariaErrors({});
    setSelectedImage(null);
    fetchMaquinarias();
  } catch (error) {
    setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
  } finally {
    setCreateLoading(false);
  }
};


  const filteredMaquinarias = maquinarias.filter((m) => {
  const search = searchQuery.toLowerCase();
  const matchesSearch =
    m.detalle?.toLowerCase().includes(search) ||
    m.unidad?.toLowerCase().includes(search) ||
    m.modelo?.toLowerCase().includes(search) ||
    m.codigo?.toLowerCase().includes(search) ||
    m.color?.toLowerCase().includes(search) ||
    m.placa?.toLowerCase().includes(search) ||
    m.marca?.toLowerCase().includes(search);

  const matchesUnidad = !unidadFilter || m.unidad === unidadFilter;

  return matchesSearch && matchesUnidad;
});


  const handleDeleteMaquinaria = async () => {
  setDeleteLoading(true);
  const id = sectionForm.Maquinaria?._id?.$oid || sectionForm.Maquinaria?._id;
  if (!id) {
    setSnackbar({
      open: true,
      message: 'ID de maquinaria no encontrado',
      severity: 'error',
    });
    setDeleteLoading(false);
    return;
  }

  try {
    const response = await fetch(`http://localhost:8000/api/maquinaria/${id}/`, {
      method: 'DELETE',
      headers: {
        "X-User-Email": user?.Email || ''
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No tienes permisos para desactivar maquinaria');
      }
      throw new Error('Error al desactivar la maquinaria');
    }

    setSnackbar({
      open: true,
      message: 'Maquinaria desactivada exitosamente',
      severity: 'success',
    });

    setDetailView(false);
    setSelectedImage(null);
    setCurrentMaquinariaId(null);
    fetchMaquinarias(); // actualizar tabla
  } catch (error) {
    setSnackbar({
      open: true,
      message: `Error: ${error.message}`,
      severity: 'error',
    });
  } finally {
    setDeleteLoading(false);
  }
};
  
  const unidadesUnicas = [...new Set(
  maquinarias
    .map(m => m.unidad?.trim())
    .filter(u => u && u !== "")
)].sort();

  const adquisicionesUnicas = [...new Set(
  maquinarias.map(m => m.adqui?.trim()).filter(a => a && a !== "")
)].sort();

const metodosUnicos = [...new Set(
  maquinarias.map(m => m.metodo_depreciacion?.trim()).filter(m => m && m !== "")
)].sort();

  const handleDetailsClick = async (id) => {
  setActionLoading(prev => ({ ...prev, [id]: true }));
  try {
    const cleanId = id.toString().replace(/[^a-zA-Z0-9]/g, '');
    setCurrentMaquinariaId(cleanId);
    
    const response = await fetch(`http://localhost:8000/api/maquinaria/${cleanId}/`);
    if (!response.ok) throw new Error('Error al cargar detalles');

    const data = await response.json();

    setSectionForm({
      Maquinaria: { ...data, imagen: data.imagen || '' },
      Control: { ...data.historial?.control },
      Asignación: { ...data.actaAsignacion },
      Mantenimiento: { ...data.mantenimiento },
      Seguros: { ...data.seguros },
      ITV: { ...data.itv },
      Impuestos: { ...data.impuestos },
      SOAT: { ...data.soat },
    });

    // Establecer la imagen actual de la maquinaria
    setSelectedImage(data.imagen || null);

    setActiveSection('Maquinaria');
    setDetailView(true);
  } catch (error) {
    setSnackbar({
      open: true,
      message: `Error al cargar detalles: ${error.message}`,
      severity: 'error',
    });
  } finally {
    setActionLoading(prev => ({ ...prev, [id]: false }));
  }
  };

  return {
    maquinarias: filteredMaquinarias,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    loading,
    newMaquinariaModalOpen,
    setNewMaquinariaModalOpen,
    newMaquinariaForm,
    setNewMaquinariaForm,
    newMaquinariaErrors,
    setNewMaquinariaErrors,
    handleNewMaquinariaSubmit,
    handleDetailsClick,
    handleFileChange,
    handleUpdateMaquinaria,
    searchQuery,
    setSearchQuery,
    unidadFilter,
    setUnidadFilter,
    unidadesUnicas,
    adquisicionesUnicas,
    metodosUnicos,
    snackbar,
    setSnackbar,
    sectionForm,
    setSectionForm,
    detailView,
    handleDeleteMaquinaria,
    setDetailView,
    activeSection,
    setActiveSection,
    selectedImage,
    actionLoading,
    updateLoading,
    deleteLoading,
    createLoading
  };
};

export default useMaquinariaLogic;
