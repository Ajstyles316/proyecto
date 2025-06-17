import { useEffect, useState } from "react";
import { fieldLabels } from "../utils/fieldLabels";

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

  const [searchQuery, setSearchQuery] = useState('');
  const [unidadFilter, setUnidadFilter] = useState('');

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
        setNewMaquinariaForm(prev => ({
          ...prev,
          imagen: reader.result,
        }));
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewMaquinariaSubmit = async () => {
    const errors = {};
    fieldLabels.Maquinaria.forEach(field => {
      if (!['adqui', 'codigo', 'tipo', 'marca', 'modelo', 'color', 'nro_motor', 'nro_chasis'].includes(field.name)) {
        if (!newMaquinariaForm[field.name]?.toString().trim()) {
          errors[field.name] = 'Este campo es obligatorio';
        }
      }
    });

    setNewMaquinariaErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const formattedData = {
        ...newMaquinariaForm,
        fecha_registro: newMaquinariaForm.fecha_registro
          ? new Date(newMaquinariaForm.fecha_registro).toISOString().split('T')[0]
          : '',
      };

      const cleanData = (obj) => {
        const result = {};
        for (const key in obj) {
          if (obj[key] !== '' && obj[key] !== null && obj[key] !== undefined) {
            result[key] = obj[key];
          }
        }
        return result;
      };

      const cleanedData = cleanData(formattedData);

      const response = await fetch("http://localhost:8000/api/maquinaria/", {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) throw new Error('Error al guardar');

      setSnackbar({ open: true, message: 'Maquinaria registrada exitosamente', severity: 'success' });
      setNewMaquinariaModalOpen(false);
      setNewMaquinariaForm({});
      setNewMaquinariaErrors({});
      fetchMaquinarias();
    } catch (error) {
      setSnackbar({ open: true, message: `Error al guardar: ${error.message}`, severity: 'error' });
    }
  };

  const filteredMaquinarias = maquinarias.filter(m =>
    m.detalle?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    m.unidad?.toLowerCase().includes(unidadFilter.toLowerCase())
  );

  const handleDetailsClick = async (id) => {
  try {
    const cleanId = id.toString().replace(/[^a-zA-Z0-9]/g, '');
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

    setActiveSection('Maquinaria');
    setDetailView(true);
  } catch (error) {
    setSnackbar({
      open: true,
      message: `Error al cargar detalles: ${error.message}`,
      severity: 'error',
    });
  }
  console.log("Clic en historial:", id);

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
    searchQuery,
    setSearchQuery,
    unidadFilter,
    setUnidadFilter,
    snackbar,
    setSnackbar,
    sectionForm,
  setSectionForm,
  detailView,
  setDetailView,
  activeSection,
  setActiveSection,
  selectedImage
  };
};

export default useMaquinariaLogic;
