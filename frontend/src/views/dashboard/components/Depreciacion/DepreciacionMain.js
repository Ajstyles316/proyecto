import { useEffect, useState } from 'react';
import axios from 'axios';
import DepreciacionTabla from './DepreciacionTabla';
import DetalleDepreciacionModal from './DetalleDepreciacionModal';
import {
  fetchDepreciaciones,
  createDepreciacion,
  updateDepreciacion,
} from './utils/api';

function normalizaFecha(fecha) {
  if (!fecha) return '';
  if (typeof fecha === 'string') return fecha.split('T')[0];
  if (typeof fecha === 'object' && fecha.$date) return fecha.$date.split('T')[0];
  return '';
}

const DepreciacionMain = ({ activos = [] }) => {
  const [depreciaciones, setDepreciaciones] = useState([]);
  const [maquinariaSeleccionada, setMaquinariaSeleccionada] = useState(null);
  const [depreciacionActual, setDepreciacionActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = async (maquinaria) => {
    setMaquinariaSeleccionada(maquinaria);
    setIsModalOpen(true);
    setLoading(true);
    try {
      const lista = await fetchDepreciaciones(maquinaria.maquinaria_id);
      const ordenadas = Array.isArray(lista)
        ? lista.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
        : [];

      let datosIniciales;
      if (ordenadas.length > 0) {
        datosIniciales = {
          ...ordenadas[0],
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

        const tabla = [];
        let fecha = new Date(fecha_compra);
        if (metodo === 'linea_recta') {
          const anual = costo_activo / vida_util;
          for (let i = 0; i < vida_util; i++) {
            tabla.push({ anio: fecha.getFullYear() + i, valor: parseFloat(anual.toFixed(2)) });
          }
        } else if (metodo === 'saldo_decreciente') {
          let en_libros = costo_activo;
          const tasa = (1 / vida_util) * 2;
          for (let i = 0; i < vida_util; i++) {
            const dep = en_libros * tasa;
            en_libros -= dep;
            tabla.push({ anio: fecha.getFullYear() + i, valor: parseFloat(dep.toFixed(2)) });
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
      console.error('Error al abrir modal:', error);
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

  const cargarDepreciaciones = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/depreciacion/');
      const data = response.data;
      setDepreciaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar depreciaciones:', error);
      setDepreciaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarCambios = async (datosActualizados) => {
    if (!maquinariaSeleccionada) return;
    setLoading(true);
    try {
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

      const { _id } = depreciacionActual || {};
      
      const payload = {
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
        console.error("No se generó la tabla de depreciación para guardar.");
        // Optionally, add user-facing error handling here
        setLoading(false);
        return;
      }
      
      if (_id) {
        await updateDepreciacion(maquinariaSeleccionada.maquinaria_id, _id, payload);
      } else {
        await createDepreciacion(maquinariaSeleccionada.maquinaria_id, payload);
      }
      handleCloseModal();
      await cargarDepreciaciones();
    } catch (error) {
      console.error('Error al guardar depreciación:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDepreciaciones();
  }, []);

  const depreciacionesPorMaquinaria = {};
  if (Array.isArray(depreciaciones)) {
    depreciaciones.forEach((item) => {
      if (!item.maquinaria_id) return;
      const actual = depreciacionesPorMaquinaria[item.maquinaria_id];
      if (!actual || new Date(item.fecha_creacion) > new Date(actual.fecha_creacion)) {
        depreciacionesPorMaquinaria[item.maquinaria_id] = item;
      }
    });
  }

  return (
    <div className='depreciacion'>
      <DepreciacionTabla
        depreciaciones={depreciaciones}
        handleVerDetalleClick={handleOpenModal}
        loading={loading}
        depreciacionesPorMaquinaria={depreciacionesPorMaquinaria}
        activos={activos}
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

export default DepreciacionMain;
