import { useEffect, useState, useMemo } from 'react';
import DepreciacionTabla from './DepreciacionTabla';
import DetalleDepreciacionModal from './DetalleDepreciacionModal';
import {
  fetchDepreciaciones,
  createDepreciacion,
  updateDepreciacion,
  fetchMaquinarias,
} from './utils/api';
import { useCanView, useIsPermissionDenied } from 'src/components/hooks';

function normalizaFecha(fecha) {
  if (!fecha) return '';
  if (typeof fecha === 'string') return fecha.split('T')[0];
  if (typeof fecha === 'object' && fecha.$date) return fecha.$date.split('T')[0];
  return '';
}

const getMaquinariaId = (maquinaria) =>
  maquinaria._id?.$oid || maquinaria._id || maquinaria.maquinaria_id || maquinaria.id;

const DepreciacionesMain = () => {
  const canView = useCanView('Depreciaciones');
  const isPermissionDenied = useIsPermissionDenied('Depreciaciones');
  
  // Si el permiso está denegado, mostrar mensaje de acceso denegado
  if (isPermissionDenied) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ color: '#f44336' }}>Acceso Denegado</h2>
        <p>No tienes permisos para acceder al módulo de Depreciaciones.</p>
      </div>
    );
  }
  
  // Si no tiene permisos para ver, no mostrar nada
  if (!canView) {
    return null;
  }
  
  const [maquinarias, setMaquinarias] = useState([]);
  const [depreciaciones, setDepreciaciones] = useState([]);
  const [maquinariaSeleccionada, setMaquinariaSeleccionada] = useState(null);
  const [depreciacionActual, setDepreciacionActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Enriquecer maquinarias con bien de uso y vida útil desde depreciaciones
  const enriquecerMaquinarias = (maquinarias, depreciaciones) => {
    return maquinarias.map(maquinaria => {
      const id = getMaquinariaId(maquinaria);
      // Buscar la última depreciación de esta maquinaria
      const depreciacionesDeMaquinaria = depreciaciones.filter(dep => {
        return getMaquinariaId(dep) === id || dep.maquinaria === id || dep.maquinaria_id === id;
      });
      let ultimaDepreciacion = null;
      if (depreciacionesDeMaquinaria.length > 0) {
        ultimaDepreciacion = depreciacionesDeMaquinaria.sort(
          (a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
        )[0];
      }
      return {
        ...maquinaria,
        bien_de_uso: ultimaDepreciacion?.bien_uso || maquinaria.bien_de_uso || '',
        costo_activo: ultimaDepreciacion?.costo_activo || maquinaria.costo_activo || 0,
        vida_util: ultimaDepreciacion?.vida_util || maquinaria.vida_util || '',
      };
    });
  };

  // Enriquecer maquinarias SOLO con el costo_activo de la última depreciación guardada
  const enriquecerMaquinariasConCostoActivo = (maquinarias, depreciaciones) => {
    return maquinarias.map(maquinaria => {
      const id = getMaquinariaId(maquinaria);
      // Buscar la última depreciación de esta maquinaria
      const depreciacionesDeMaquinaria = depreciaciones.filter(dep => {
        return getMaquinariaId(dep) === id || dep.maquinaria === id || dep.maquinaria_id === id;
      });
      let ultimaDepreciacion = null;
      if (depreciacionesDeMaquinaria.length > 0) {
        ultimaDepreciacion = depreciacionesDeMaquinaria.sort(
          (a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
        )[0];
      }
      return {
        ...maquinaria,
        costo_activo: ultimaDepreciacion?.costo_activo !== undefined && ultimaDepreciacion?.costo_activo !== null ? ultimaDepreciacion.costo_activo : '',
      };
    });
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const maquinariasData = await fetchMaquinarias();
      setMaquinarias(Array.isArray(maquinariasData) ? maquinariasData : []);
      setDepreciaciones([]); // No cargar depreciaciones globales
    } catch (error) {
      setMaquinarias([]);
      setDepreciaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (maquinaria) => {
    setMaquinariaSeleccionada(maquinaria);
    setIsModalOpen(true);
    setLoading(true);
    try {
      const id = getMaquinariaId(maquinaria);
      // Consultar depreciaciones solo de la maquinaria seleccionada
      const lista = await fetchDepreciaciones(id);
      const ordenadas = Array.isArray(lista)
        ? lista.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
        : [];
      let datosIniciales;
      if (ordenadas.length > 0) {
        datosIniciales = {
          ...ordenadas[0],
          _id: ordenadas[0]._id,
          fecha_compra: normalizaFecha(ordenadas[0].fecha_compra),
          depreciacion_por_anio: ordenadas[0].depreciacion_por_anio || [],
          advertencia: 'Datos de depreciación guardados en el sistema.',
        };
      } else {
        const vida_util = maquinaria.vida_util || 5;
        const metodo = maquinaria.metodo_depreciacion || 'linea_recta';
        const fecha_compra =
          normalizaFecha(maquinaria.fecha_compra) || new Date().toISOString().slice(0, 10);
        const costo_activo = parseFloat(maquinaria.costo_activo || 0);
        const valor_residual = maquinaria.valor_residual ? parseFloat(maquinaria.valor_residual) : 0;
        let tabla = [];
        let fecha = new Date(fecha_compra);
        if (metodo === 'linea_recta') {
          const anual = (costo_activo - valor_residual) / vida_util;
          let depreciacionAcumulada = 0;
          let valorEnLibros = costo_activo;
          for (let i = 0; i < vida_util; i++) {
            depreciacionAcumulada += anual;
            valorEnLibros -= anual;
            tabla.push({
              anio: fecha.getFullYear() + i,
              valor_anual_depreciado: parseFloat(anual.toFixed(2)),
              depreciacion_acumulada: parseFloat(depreciacionAcumulada.toFixed(2)),
              valor_en_libros: parseFloat(Math.max(valorEnLibros, 0).toFixed(2)),
            });
          }
        }
        datosIniciales = {
          costo_activo,
          fecha_compra,
          metodo,
          vida_util,
          depreciacion_por_anio: tabla,
          advertencia: 'Solo puedes visualizar los registros',
        };
      }
      setDepreciacionActual(datosIniciales);
    } catch (error) {
      setDepreciacionActual(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMaquinariaSeleccionada(null);
    setDepreciacionActual(null);
  };

  const handleGuardarCambios = async (datosActualizados) => {
    if (!maquinariaSeleccionada) return;
    setLoading(true);
    try {
      const maquinariaId = getMaquinariaId(maquinariaSeleccionada);
      const {
        costo_activo,
        fecha_compra,
        metodo,
        vida_util,
        coeficiente,
        valor_residual,
        bien_uso,
        depreciacion_por_anio,
      } = datosActualizados;

      let { _id } = depreciacionActual || {};
      if (!_id) {
        // Buscar en las depreciaciones ya cargadas
        const existentes = depreciaciones.filter(dep => {
          return getMaquinariaId(dep) === maquinariaId || dep.maquinaria === maquinariaId || dep.maquinaria_id === maquinariaId;
        });
        if (Array.isArray(existentes) && existentes.length > 0 && existentes[0]._id) {
          _id = existentes[0]._id;
        }
      }

      const payload = {
        maquinaria: String(maquinariaId),
        costo_activo: parseFloat(costo_activo),
        fecha_compra,
        metodo,
        vida_util: Number(vida_util),
        coeficiente: coeficiente ? Number(coeficiente) : undefined,
        valor_residual: valor_residual ? Number(valor_residual) : 0,
        bien_uso: bien_uso || maquinariaSeleccionada.bien_de_uso || '',
        depreciacion_por_anio,
      };

      if (!payload.depreciacion_por_anio || payload.depreciacion_por_anio.length === 0) {
        setLoading(false);
        return;
      }

      if (_id) {
        await updateDepreciacion(maquinariaId, _id, payload);
      } else {
        await createDepreciacion(maquinariaId, payload);
      }

      handleCloseModal();
      // Recargar datos después de guardar
      await cargarDatos();
      // Refuerzo: actualizar la maquinaria en el estado con los datos de la última depreciación
      setMaquinarias(prev => prev.map(m => {
        const id = getMaquinariaId(m);
        if (id === String(maquinariaId)) {
          return {
            ...m,
            bien_de_uso: payload.bien_uso,
            costo_activo: payload.costo_activo,
            vida_util: payload.vida_util,
          };
        }
        return m;
      }));
    } catch (error) {
      // Mostrar error si ocurre
      alert('Error al guardar la depreciación: ' + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // En el render, usa la función para enriquecer los datos antes de pasarlos a la tabla
  const maquinariasConCostoActivo = useMemo(() => enriquecerMaquinariasConCostoActivo(maquinarias, depreciaciones), [maquinarias, depreciaciones]);

  return (
    <div className="depreciacion">
      <DepreciacionTabla
        maquinarias={maquinariasConCostoActivo}
        handleVerDetalleClick={handleOpenModal}
        loading={loading}
      />
      {isModalOpen && maquinariaSeleccionada && (
        <DetalleDepreciacionModal
          open={isModalOpen}
          handleClose={handleCloseModal}
          maquinariaInfo={{ ...maquinariaSeleccionada, ...(depreciacionActual || {}) }}
          onSave={handleGuardarCambios}
        />
      )}
    </div>
  );
};

export default DepreciacionesMain;