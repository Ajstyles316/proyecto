import { Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PropTypes from 'prop-types';

// Helper functions para procesamiento de datos
const MODULO_MAP = {
  'ActaAsignacion': 'Asignación',
  'HistorialControl': 'Control',
  'ControlOdometro': 'Control de Odómetros',
  'SOAT': 'SOAT',
  'ITV': 'ITV',
  'Seguro': 'Seguro',
  'Mantenimiento': 'Mantenimiento',
  'Impuesto': 'Impuesto',
  'Depreciacion': 'Depreciación',
  'Maquinaria': 'Maquinaria',
  'Autenticacion': 'Autenticación',
  'Usuarios': 'Usuarios',
  'Pronostico': 'Pronóstico',
  'Reportes': 'Reportes',
  'Liberacion': 'Liberación'
};

const formatAccion = (accion) => {
  if (!accion) return 'N/A';
  
  const accionMap = {
    'crear_soat': 'Crear SOAT',
    'desactivar_soat': 'Desactivar SOAT',
    'editar_soat': 'Editar SOAT',
    'crear_seguro': 'Crear seguro',
    'editar_seguro': 'Editar seguro',
    'desactivar_seguro': 'Desactivar seguro',
    'crear_mantenimiento': 'Crear mantenimiento',
    'editar_mantenimiento': 'Editar mantenimiento',
    'desactivar_mantenimiento': 'Desactivar mantenimiento',
    'crear_control': 'Crear control',
    'editar_control': 'Editar control',
    'desactivar_control': 'Desactivar control',
    'editar_asignacion': 'Editar asignación',
    'desactivar_asignacion': 'Desactivar asignación',
    'crear_asignacion': 'Crear asignación',
    'editar_maquinaria': 'Editar maquinaria',
    'editar_depreciacion': 'Editar depreciación',
    'crear_depreciacion': 'Crear depreciación',
    'inicio_sesion': 'Inicio de sesión',
    'cambio_permisos': 'Cambio de permisos',
    'registro_usuario': 'Registro de usuario',
    'editar_perfil': 'Editar perfil',
    'crear_itv': 'Crear ITV',
    'editar_itv': 'Editar ITV',
    'crear_impuesto': 'Crear impuesto',
    'editar_impuesto': 'Editar impuesto',
    'crear_liberacion': 'Crear liberación',
    'editar_liberacion': 'Editar liberación',
    'desactivar_liberacion': 'Desactivar liberación',
    'crear_control_odometro': 'Crear control odómetro',
    'editar_control_odometro': 'Editar control odómetro',
    'desactivar_control_odometro': 'Desactivar control odómetro',
    'eliminar_control_odometro': 'Eliminar control odómetro',
    'eliminar_permanentemente_control_odometro': 'Eliminar permanentemente control odómetro',
    'reactivar_soat': 'Reactivar SOAT',
    'reactivar_seguro': 'Reactivar seguro',
    'reactivar_mantenimiento': 'Reactivar mantenimiento',
    'reactivar_control': 'Reactivar control',
    'reactivar_asignacion': 'Reactivar asignación',
    'reactivar_maquinaria': 'Reactivar maquinaria',
    'reactivar_depreciacion': 'Reactivar depreciación',
    'reactivar_itv': 'Reactivar ITV',
    'reactivar_impuesto': 'Reactivar impuesto',
    'reactivar_usuario': 'Reactivar usuario',
    'reactivar_pronostico': 'Reactivar pronóstico',
    'reactivar_liberacion': 'Reactivar liberación',
    'reactivar_control_odometro': 'Reactivar control odómetro',
    'desactivar_liberacion': 'Desactivar liberación',
    'desactivar_maquinaria': 'Desactivar maquinaria',
    'desactivar_depreciacion': 'Desactivar depreciación',
    'desactivar_itv': 'Desactivar ITV',
    'desactivar_impuesto': 'Desactivar impuesto',
    'desactivar_usuario': 'Desactivar usuario',
    'desactivar_pronostico': 'Desactivar pronóstico',
    'eliminar_permanentemente_control': 'Eliminar permanentemente control',
    'eliminar_permanentemente_soat': 'Eliminar permanentemente SOAT',
    'eliminar_permanentemente_seguro': 'Eliminar permanentemente seguro',
    'eliminar_permanentemente_mantenimiento': 'Eliminar permanentemente mantenimiento',
    'eliminar_permanentemente_asignacion': 'Eliminar permanentemente asignación',
    'eliminar_permanentemente_maquinaria': 'Eliminar permanentemente maquinaria',
    'eliminar_permanentemente_depreciacion': 'Eliminar permanentemente depreciación',
    'eliminar_permanentemente_itv': 'Eliminar permanentemente ITV',
    'eliminar_permanentemente_impuesto': 'Eliminar permanentemente impuesto',
    'eliminar_permanentemente_usuario': 'Eliminar permanentemente usuario',
    'eliminar_permanentemente_pronostico': 'Eliminar permanentemente pronóstico',
    'eliminar_permanentemente_liberacion': 'Eliminar permanentemente liberación'
  };

  return accionMap[accion] || 
    accion.charAt(0).toUpperCase() + 
    accion.slice(1)
      .replace(/_/g, ' ')
      .replace(/SesióN/g, 'Sesión')
      .replace(/AsignacióN/g, 'Asignación')
      .replace(/DepreciacióN/g, 'Depreciación');
};

const capitalizeWords = (str) => {
  if (!str) return '';
  
  // Verificar si es un módulo que necesita mapeo específico
  if (MODULO_MAP[str]) {
    return MODULO_MAP[str];
  }
  
  // Para otros strings, aplicar formato básico
  return str
    .replace(/cióN/g, 'ción')
    .replace(/sióN/g, 'sión')
    .replace(/DepreciaciónNes/g, 'Depreciaciones')
    .replace(/AsignacióN/g, 'Asignación')
    .replace(/DepreciacióN/g, 'Depreciación')
    .replace(/\bDe\b/g, 'de')
    .replace(/\bPara\b/g, 'para')
    .replace(/\bCon\b/g, 'con')
    .replace(/\bSin\b/g, 'sin');
};

const calcularTiempoConexion = (seguimientoData, row) => {
  if (row.accion === 'login') {
    const logoutRecord = seguimientoData.find(r => 
      r.accion === 'logout' && 
      r.usuario_email === row.usuario_email &&
      new Date(r.fecha_hora) > new Date(row.fecha_hora)
    );
    
    if (logoutRecord) {
      const diffMs = new Date(logoutRecord.fecha_hora) - new Date(row.fecha_hora);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`;
      if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
      return `${diffMins}m`;
    }
    return 'Conectado actualmente';
  }
  
  return '';
};

const ExportToPDFButton = ({ seguimientoData, filteredData, seguimientoUsuarios }) => {
  const handleExport = async () => {
  try {
    // Importaciones dinámicas correctas (ESM)
    const { jsPDF } = await import('jspdf');                 // named export
    const autoTable = (await import('jspdf-autotable')).default; // función

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Configurar márgenes más pequeños para aprovechar mejor el espacio
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10; // Reducir márgenes
    const tableWidth = pageWidth - (margin * 2);

    // Encabezado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('REGISTRO DE ACTIVIDAD DEL SISTEMA', margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Corporación de las Fuerzas Armadas de Desarrollo Nacional - COFADENA', margin, 28);
    doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`, margin, 34);
    doc.text(`Total de registros: ${filteredData.length}`, margin, 40);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 44, pageWidth - margin, 44);

    // Columnas y filas
    const tableColumn = ["Fecha/Hora", "Usuario", "Acción", "Módulo", "Mensaje"];
    const tableRows = [];

    filteredData.forEach(row => {
      const user = seguimientoUsuarios.find(u => u.email === row.usuario_email);
      const userName = user ? user.nombre : row.usuario_email || 'Usuario desconocido';

      let message = '';
      if (typeof row.mensaje === 'object' && row.mensaje !== null) {
        message = Object.entries(row.mensaje)
          .map(([k, v]) => `${capitalizeWords(k)}: ${capitalizeWords(String(v))}`)
          .join(' | ');
      } else {
        message = capitalizeWords(row.mensaje) || '-';
      }

      if (row.accion === 'login' || row.accion === 'logout') {
        const tiempoConexion = calcularTiempoConexion(seguimientoData, row);
        if (tiempoConexion) message += ` | Tiempo de conexión: ${tiempoConexion}`;
      }

      tableRows.push([
        row.fecha_hora ? new Date(row.fecha_hora).toLocaleString('es-ES') : '-',
        userName,
        formatAccion(row.accion),
        capitalizeWords(row.modulo),
        message
      ]);
    });

    // Usar la función autoTable(doc, options)
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 48,
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        overflow: 'linebreak',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left' },  // Fecha/Hora
        1: { cellWidth: 40, halign: 'left' },  // Usuario
        2: { cellWidth: 35, halign: 'left' },  // Acción
        3: { cellWidth: 45, halign: 'left' },  // Módulo - más ancho para mostrar completo
        4: { cellWidth: 'auto', halign: 'left' } // Mensaje - ancho automático
      },
      didDrawPage(data) {
        const str = `Página ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(str, margin, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`registro_actividad_${new Date().toISOString().slice(0,10)}.pdf`);
  } catch (err) {
    console.error('Error al generar PDF:', err);
    alert('Hubo un error al generar el PDF. Por favor, intente nuevamente.');
  }
};

  return (
    <Button
      variant="contained"
      onClick={handleExport}
      startIcon={<PictureAsPdfIcon />}
      sx={{
        ml: 2,
        px: 3,
        py: 1,
        fontWeight: 600,
        textTransform: 'none',
        borderRadius: 2,
        background: 'linear-gradient(145deg, #d21919ff 0%, #a10d0dff 100%)',
        boxShadow: '0 4px 12px rgba(210, 25, 25, 0.25)',
        '&:hover': {
          background: 'linear-gradient(145deg, #c01515ff 0%, #9d0a0aff 100%)',
          boxShadow: '0 6px 16px rgba(210, 25, 25, 0.35)',
          transform: 'translateY(-2px)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        },
        '&:active': {
          transform: 'translateY(0)',
          boxShadow: '0 2px 6px rgba(210, 25, 25, 0.25)'
        }
      }}
    >
      Exportar a PDF
    </Button>
  );
};

// Validación de props
ExportToPDFButton.propTypes = {
  seguimientoData: PropTypes.arrayOf(PropTypes.shape({
    usuario_email: PropTypes.string,
    accion: PropTypes.string,
    modulo: PropTypes.string,
    fecha_hora: PropTypes.string,
    mensaje: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ])
  })).isRequired,
  
  filteredData: PropTypes.arrayOf(PropTypes.shape({
    usuario_email: PropTypes.string,
    accion: PropTypes.string,
    modulo: PropTypes.string,
    fecha_hora: PropTypes.string,
    mensaje: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ])
  })).isRequired,
  
  seguimientoUsuarios: PropTypes.arrayOf(PropTypes.shape({
    email: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired
  })).isRequired
};

export default ExportToPDFButton;