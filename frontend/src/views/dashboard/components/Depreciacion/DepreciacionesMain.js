import { useEffect, useState } from 'react';
import DepreciacionTabla from './DepreciacionTabla';
import DetalleDepreciacionModal from './DetalleDepreciacionModal';
import {
  fetchDepreciaciones,
  createDepreciacion,
  updateDepreciacion,
  fetchMaquinarias,
} from './utils/api';

function normalizaFecha(fecha) {
  if (!fecha) return '';
  if (typeof fecha === 'string') return fecha.split('T')[0];
  if (typeof fecha === 'object' && fecha.$date) return fecha.$date.split('T')[0];
  return '';
}

const getMaquinariaId = (maquinaria) =>
  maquinaria._id?.$oid || maquinaria._id || maquinaria.maquinaria_id || maquinaria.id;

const DepreciacionesMain = () => {
  const [maquinarias, setMaquinarias] = useState([]);
  const [maquinariaSeleccionada, setMaquinariaSeleccionada] = useState(null);
  const [depreciacionActual, setDepreciacionActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = async (maquinaria) => {
    setMaquinariaSeleccionada(maquinaria);
    setIsModalOpen(true);
    setLoading(true);
    try {
      const maquinariaId = getMaquinariaId(maquinaria);
      const lista = await fetchDepreciaciones(maquinariaId);
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
          advertencia: 'Datos temporales (sin historial previo). Puede guardar para crear el registro.',
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

  const cargarMaquinarias = async () => {
    setLoading(true);
    try {
      const data = await fetchMaquinarias();
      const maquinarias = Array.isArray(data) ? data : [];

      const maquinariasConDepreciacion = await Promise.all(
        maquinarias.map(async (maquinaria) => {
          try {
            const depreciaciones = await fetchDepreciaciones(getMaquinariaId(maquinaria));
            const ultimaDepreciacion =
              Array.isArray(depreciaciones) && depreciaciones.length > 0
                ? depreciaciones.sort(
                    (a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
                  )[0]
                : null;
            return {
              ...maquinaria,
              bien_de_uso: ultimaDepreciacion?.bien_uso || '',
              costo_activo: ultimaDepreciacion?.costo_activo || 0,
              vida_util: ultimaDepreciacion?.vida_util || '',
            };
          } catch {
            return maquinaria;
          }
        })
      );

      setMaquinarias(maquinariasConDepreciacion);
    } catch (error) {
      setMaquinarias([]);
    } finally {
      setLoading(false);
    }
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
        const existentes = await fetchDepreciaciones(maquinariaId);
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
      await cargarMaquinarias();
    } catch (error) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMaquinarias();
  }, []);

  return (
    <div className="depreciacion">
      <DepreciacionTabla
        maquinarias={maquinarias}
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
