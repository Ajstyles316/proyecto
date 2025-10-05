import PropTypes from 'prop-types';
import { useState, useRef } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, CardMedia, Button } from '@mui/material';
import { formatDateOnly } from './helpers';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';

const HojaVidaMantenimiento = ({ maquinaria, mantenimientos }) => {
  const reportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Función para exportar PDF
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        quality: 0.8,
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Agregar imagen a la primera página
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

      // Si la imagen es más alta que una página, agregar páginas adicionales
      let heightLeft = imgHeight;
      let position = 0;
      
      while (heightLeft > pageHeight) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Guardar el PDF
      const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      const placa = maquinaria?.placa || 'maquinaria';
      const filename = `Hoja_Vida_Mantenimiento_${placa}_${fecha}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar el PDF. Por favor, inténtelo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  // Función para exportar Excel
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const XLSX = await import('xlsx');
      
      // Crear un nuevo workbook
      const workbook = XLSX.utils.book_new();
      
      // Preparar los datos para Excel manteniendo el mismo formato
      const excelData = [];
      
      // Título principal
      excelData.push(['HOJA DE VIDA HISTORIAL DE MANTENIMIENTO']);
      excelData.push([]);
      excelData.push([`CÓDIGO: ${maquinaria?.codigo || 'N/A'}`]);
      excelData.push([]);
      
      // Datos del Vehículo/Maquinaria
      excelData.push(['DATOS VEHICULO, MAQUINARIA, EQUIPO']);
      excelData.push([]);
      
      // Datos Generales
      excelData.push(['DATOS GENERALES']);
      excelData.push(['Equipo:', maquinaria?.detalle || '']);
      excelData.push(['Placa:', maquinaria?.placa || '']);
      excelData.push(['Marca:', maquinaria?.marca || '']);
      excelData.push(['Modelo:', maquinaria?.modelo || '']);
      excelData.push(['Chasis:', maquinaria?.nro_chasis || '']);
      excelData.push(['Tipo:', maquinaria?.tipo || '']);
      excelData.push(['Color:', maquinaria?.color || '']);
      excelData.push(['Tracción:', maquinaria?.tipo_vehiculo || '']);
      excelData.push(['No. del Motor:', maquinaria?.nro_motor || '']);
      excelData.push(['Estado:', 'OPERABLE']);
      excelData.push([]);
      
      // Tipo de Desplazamiento
      excelData.push(['TIPO DE DESPLAZAMIENTO']);
      excelData.push(['CANTIDAD', 'NUMERO DE LLANTA', 'NUMERO DE LLANTA DELANTERA', 'VIDA UTIL']);
      excelData.push([
        mantenimientos[0]?.tipo_desplazamiento_cantidad || '10',
        mantenimientos[0]?.tipo_desplazamiento_numero_llanta || '11R22,5',
        mantenimientos[0]?.tipo_desplazamiento_numero_llanta_delantera || '11R22,5',
        mantenimientos[0]?.tipo_desplazamiento_vida_util || '3'
      ]);
      excelData.push([]);
      
      // Sistema Eléctrico
      excelData.push(['SISTEMA ELÉCTRICO']);
      excelData.push(['CANTIDAD', 'VOLTAJE', 'AMPERAJE', 'VIDA UTIL']);
      excelData.push([
        mantenimientos[0]?.cantidad_sistema_electrico || '3',
        mantenimientos[0]?.voltaje_sistema_electrico || '12',
        mantenimientos[0]?.amperaje_sistema_electrico || '100',
        mantenimientos[0]?.vida_util_sistema_electrico || 'AÑOS'
      ]);
      excelData.push([]);
      
      // Aceites y Fluidos
      excelData.push(['ACEITES Y FLUIDOS']);
      excelData.push([]);
      
      // Aceite de Motor
      excelData.push(['ACEITE DE MOTOR']);
      excelData.push(['CANTIDAD', 'NUMERO', 'CAMBIO (HR/KM)', 'NUMERO DE FILTRO']);
      excelData.push([
        mantenimientos[0]?.aceite_motor_cantidad || '45 LT',
        mantenimientos[0]?.aceite_motor_numero || '15W40',
        mantenimientos[0]?.aceite_motor_cambio_km_hr || '5000 KM',
        mantenimientos[0]?.aceite_motor_numero_filtro || 'P559000'
      ]);
      excelData.push([]);
      
      // Aceite Hidráulico
      excelData.push(['ACEITE DE HIDRAULICO']);
      excelData.push(['CANTIDAD', 'NUMERO', 'CAMBIO (HR/KM)', 'NUMERO DE FILTRO']);
      excelData.push([
        mantenimientos[0]?.aceite_hidraulico_cantidad || '100',
        mantenimientos[0]?.aceite_hidraulico_numero || 'ISO VG68',
        mantenimientos[0]?.aceite_hidraulico_cambio_km_hr || '4000 H',
        mantenimientos[0]?.aceite_hidraulico_numero_filtro || 'P550388'
      ]);
      excelData.push([]);
      
      // Aceite de Transmisión
      excelData.push(['ACEITE DE TRANSMISION']);
      excelData.push(['CANTIDAD', 'NUMERO', 'CAMBIO (HR/KM)', 'NUMERO DE FILTRO']);
      excelData.push([
        mantenimientos[0]?.aceite_transmision_cantidad || '6LTS',
        mantenimientos[0]?.aceite_transmision_numero || '-',
        mantenimientos[0]?.aceite_transmision_cambio_km_hr || '20.000 KM',
        mantenimientos[0]?.aceite_transmision_numero_filtro || '-'
      ]);
      excelData.push([]);
      
      // Líquido de Freno
      excelData.push(['LIQUIDO DE FRENO']);
      excelData.push(['CANTIDAD', 'NUMERO', 'CAMBIO (HR/KM)', 'NUMERO DE FILTRO COMB.']);
      excelData.push([
        mantenimientos[0]?.liquido_freno_cantidad || '20',
        mantenimientos[0]?.liquido_freno_numero || '80W90',
        mantenimientos[0]?.liquido_freno_cambio_km_hr || '40000 KM',
        mantenimientos[0]?.liquido_freno_numero_filtro_combustible || '-'
      ]);
      excelData.push([]);
      
      // Líquido Refrigerante
      excelData.push(['LIQUIDO REFRIGERANTE']);
      excelData.push(['TIPO DE REFRIGERANTE', 'CANTIDAD REFRIGERANTE (Lt)', 'FRECUENCIA DE CAMBIO (HR/KM)']);
      excelData.push([
        mantenimientos[0]?.liquido_refrigerante_tipo || '-',
        mantenimientos[0]?.liquido_refrigerante_cantidad_lt || '-',
        mantenimientos[0]?.liquido_refrigerante_frecuencia_cambio || '-'
      ]);
      excelData.push([]);
      
      // Otros Aceites
      excelData.push(['OTROS ACEITES']);
      excelData.push(['TIPO DE REFRIGERANTE', 'CANTIDAD (Lt)', 'FRECUENCIA DE CAMBIO (HR/KM)']);
      excelData.push([
        mantenimientos[0]?.otros_aceites_tipo || '-',
        mantenimientos[0]?.otros_aceites_cantidad_lt || '-',
        mantenimientos[0]?.otros_aceites_frecuencia_cambio || '-'
      ]);
      excelData.push([]);
      
      // Trabajos Destinados a Realizar
      excelData.push(['TRABAJOS DESTINADOS A REALIZAR']);
      excelData.push([mantenimientos[0]?.trabajos_destinados_realizar || '-']);
      excelData.push([]);
      
      // Sistema de Combustible
      excelData.push(['SISTEMA DE COMBUSTIBLE']);
      excelData.push(['GASOLINA', 'CANTIDAD (Lt)', 'CANTIDAD FILTROS', 'CODIGO FILTRO COMBUSTIBLE']);
      excelData.push([
        mantenimientos[0]?.gasolina || '-',
        mantenimientos[0]?.gasolina_cantidad_lt || '-',
        mantenimientos[0]?.cantidad_filtros || '-',
        mantenimientos[0]?.codigo_filtro_combustible || '-'
      ]);
      excelData.push([]);
      
      // Otros Filtros
      excelData.push(['OTROS FILTROS']);
      excelData.push(['CANTIDAD', 'NUMERO', 'CAMBIO (HR/KM)', 'DESCRIPCION DEL FILTRO']);
      excelData.push([
        mantenimientos[0]?.otros_filtros_cantidad || '1',
        mantenimientos[0]?.otros_filtros_numero || 'AB39-9601-AB',
        mantenimientos[0]?.otros_filtros_cambio || '-',
        'FILTRO DE AIRE'
      ]);
      excelData.push([]);
      
      // Historial de Mantenimiento
      excelData.push(['HISTORIAL DE MANTENIMIENTO']);
      excelData.push([
        'FECHA',
        'N° SALIDA DE MATERIALES',
        'DESCRIPCION, DAÑOS, EVENTOS, REPARACION REALIZADA',
        'COSTO TOTAL Bs.',
        'HOR/KM.',
        'OPERADOR',
        'ATENDIDO POR',
        'ENCARGADO DE ACTIVOS FIJOS',
        'UNIDAD/ EMPRESA',
        'UBICACIÓN FISICO/ PROYECTO'
      ]);
      
      // Agregar datos de mantenimientos
      mantenimientos.forEach((mantenimiento) => {
        excelData.push([
          formatDateOnly(mantenimiento.fecha_mantenimiento),
          mantenimiento.numero_salida_materiales || '-',
          mantenimiento.descripcion_danos_eventos || mantenimiento.reparacion_realizada || '-',
          mantenimiento.costo_total ? mantenimiento.costo_total.toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '-',
          mantenimiento.horas_kilometros ? mantenimiento.horas_kilometros.toLocaleString('es-BO') : '-',
          mantenimiento.operador || '-',
          mantenimiento.atendido_por || '-',
          mantenimiento.encargado_activos_fijos || '-',
          mantenimiento.unidad_empresa || '-',
          mantenimiento.ubicacion_fisico_proyecto || '-'
        ]);
      });
      
      // Crear la hoja de trabajo
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // Configurar el ancho de las columnas
      const columnWidths = [
        { wch: 15 }, // FECHA
        { wch: 20 }, // N° SALIDA DE MATERIALES
        { wch: 50 }, // DESCRIPCION
        { wch: 15 }, // COSTO TOTAL
        { wch: 15 }, // HOR/KM
        { wch: 20 }, // OPERADOR
        { wch: 20 }, // ATENDIDO POR
        { wch: 25 }, // ENCARGADO DE ACTIVOS FIJOS
        { wch: 20 }, // UNIDAD/ EMPRESA
        { wch: 25 }  // UBICACIÓN FISICO/ PROYECTO
      ];
      worksheet['!cols'] = columnWidths;
      
      // Agregar la hoja al workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Hoja de Vida Mantenimiento');
      
      // Generar el archivo Excel
      const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      const placa = maquinaria?.placa || 'maquinaria';
      const filename = `Hoja_Vida_Mantenimiento_${placa}_${fecha}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error al exportar el Excel. Por favor, inténtelo de nuevo.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (!mantenimientos || mantenimientos.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No hay registros de mantenimiento para generar la hoja de vida
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Botones de Exportar */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<TableChartIcon />}
          onClick={handleExportExcel}
          disabled={isExportingExcel}
          sx={{ minWidth: 150 }}
        >
          {isExportingExcel ? 'Exportando...' : 'Exportar Excel'}
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<PictureAsPdfIcon />}
          onClick={handleExportPDF}
          disabled={isExporting}
          sx={{ minWidth: 150 }}
        >
          {isExporting ? 'Exportando...' : 'Exportar PDF'}
        </Button>
      </Box>

      {/* Contenido del Reporte */}
      <Box ref={reportRef} sx={{ backgroundColor: 'white' }}>

      {/* Título Principal */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
          CÓDIGO: {maquinaria?.codigo || 'N/A'}
        </Typography>
      </Box>

      {/* Datos del Vehículo/Maquinaria */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
          DATOS VEHICULO, MAQUINARIA, EQUIPO
        </Typography>
        
        <Grid container spacing={2}>
          {/* Columna Izquierda - Imagen y Datos Generales */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              {/* Imagen */}
              <Grid item xs={12} md={6}>
                {maquinaria?.imagen && (
                  <CardMedia
                    component="img"
                    image={maquinaria.imagen}
                    alt={`Imagen de ${maquinaria?.detalle || 'maquinaria'}`}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '2px solid #e0e0e0'
                    }}
                  />
                )}
              </Grid>
              
              {/* Datos Generales */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#f5f5f5', p: 1 }}>
                  DATOS GENERALES
                </Typography>
                <Table size="small" sx={{ border: '1px solid #ddd' }}>
                  <TableBody>
                    {maquinaria?.detalle && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Equipo:</TableCell>
                        <TableCell>{maquinaria.detalle}</TableCell>
                      </TableRow>
                    )}
                    {maquinaria?.placa && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Placa:</TableCell>
                        <TableCell>{maquinaria.placa}</TableCell>
                      </TableRow>
                    )}
                    {maquinaria?.marca && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Marca:</TableCell>
                        <TableCell>{maquinaria.marca}</TableCell>
                      </TableRow>
                    )}
                    {maquinaria?.modelo && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Modelo:</TableCell>
                        <TableCell>{maquinaria.modelo}</TableCell>
                      </TableRow>
                    )}
                    {maquinaria?.nro_chasis && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Chasis:</TableCell>
                        <TableCell>{maquinaria.nro_chasis}</TableCell>
                      </TableRow>
                    )}
                    {maquinaria?.tipo && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Tipo:</TableCell>
                        <TableCell>{maquinaria.tipo}</TableCell>
                      </TableRow>
                    )}
                    {maquinaria?.color && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Color:</TableCell>
                        <TableCell>{maquinaria.color}</TableCell>
                      </TableRow>
                    )}
                    {maquinaria?.tipo_vehiculo && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Tracción:</TableCell>
                        <TableCell>{maquinaria.tipo_vehiculo}</TableCell>
                      </TableRow>
                    )}
                    {maquinaria?.nro_motor && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>No. del Motor:</TableCell>
                        <TableCell>{maquinaria.nro_motor}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Estado:</TableCell>
                      <TableCell>OPERABLE</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          </Grid>

          {/* Columna Derecha - Datos Técnicos */}
          <Grid item xs={12} md={6}>
            {/* Tipo de Desplazamiento */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>TIPO DE DESPLAZAMIENTO</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE LLANTA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE LLANTA DELANTERA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VIDA UTIL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.tipo_desplazamiento_cantidad || '10'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.tipo_desplazamiento_numero_llanta || '11R22,5'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.tipo_desplazamiento_numero_llanta_delantera || '11R22,5'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.tipo_desplazamiento_vida_util || '3'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Sistema Eléctrico */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>SISTEMA ELÉCTRICO</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VOLTAJE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>AMPERAJE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>VIDA UTIL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.cantidad_sistema_electrico || '3'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.voltaje_sistema_electrico || '12'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.amperaje_sistema_electrico || '100'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.vida_util_sistema_electrico || 'AÑOS'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </Box>

      {/* Aceites y Fluidos */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
          ACEITES Y FLUIDOS
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {/* Aceite de Motor */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>ACEITE DE MOTOR</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE FILTRO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_motor_cantidad || '45 LT'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_motor_numero || '15W40'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_motor_cambio_km_hr || '5000 KM'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_motor_numero_filtro || 'P559000'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Aceite Hidráulico */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>ACEITE DE HIDRAULICO</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE FILTRO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_cantidad || '100'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_numero || 'ISO VG68'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_cambio_km_hr || '4000 H'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_numero_filtro || 'P550388'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Aceite de Transmisión */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>ACEITE DE TRANSMISION</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE FILTRO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_cantidad || '6LTS'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_numero || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_cambio_km_hr || '20.000 KM'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_numero_filtro || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Líquido de Freno */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>LIQUIDO DE FRENO</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO DE FILTRO COMB.</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_freno_cantidad || '20'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_freno_numero || '80W90'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_freno_cambio_km_hr || '40000 KM'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_freno_numero_filtro_combustible || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
          
          <Grid item xs={12} md={6}>
            {/* Líquido Refrigerante */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>LIQUIDO REFRIGERANTE</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>TIPO DE REFRIGERANTE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD REFRIGERANTE (Lt)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>FRECUENCIA DE CAMBIO (HR/KM)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_refrigerante_tipo || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_refrigerante_cantidad_lt || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_refrigerante_frecuencia_cambio || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            {/* Otros Aceites */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>OTROS ACEITES</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>TIPO DE REFRIGERANTE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD (Lt)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>FRECUENCIA DE CAMBIO (HR/KM)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_aceites_tipo || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_aceites_cantidad_lt || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_aceites_frecuencia_cambio || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </Box>

      {/* Trabajos a Destinados Realizar */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
          TRABAJOS DESTINADOS A REALIZAR
        </Typography>
        
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#f5f5f5', p: 1 }}>
          {mantenimientos[0]?.trabajos_destinados_realizar || '-'}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {/* Sistema de Combustible */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>SISTEMA DE COMBUSTIBLE</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>GASOLINA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD (Lt)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD FILTROS</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CODIGO FILTRO COMBUSTIBLE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.gasolina || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.gasolina_cantidad_lt || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.cantidad_filtros || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.codigo_filtro_combustible || '-'}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
          
          <Grid item xs={12} md={6}>
            {/* Otros Filtros */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>OTROS FILTROS</Typography>
            <Table size="small" sx={{ border: '1px solid #ddd', mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CANTIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NUMERO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>CAMBIO (HR/KM)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>DESCRIPCION DEL FILTRO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_filtros_cantidad || '1'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_filtros_numero || 'AB39-9601-AB'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.otros_filtros_cambio || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>FILTRO DE AIRE</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </Box>

      {/* Historial de Mantenimiento */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
          HISTORIAL DE MANTENIMIENTO
        </Typography>
        
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>FECHA</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>N° SALIDA DE MATERIALES</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>DESCRIPCION, DAÑOS, EVENTOS, REPARACION REALIZADA</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>COSTO TOTAL Bs.</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>HOR/KM.</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>OPERADOR</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>ATENDIDO POR</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>ENCARGADO DE ACTIVOS FIJOS</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>UNIDAD/ EMPRESA</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>UBICACIÓN FISICO/ PROYECTO</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mantenimientos.map((mantenimiento, index) => (
                <TableRow key={index} sx={{ '&:nth-of-type(even)': { bgcolor: '#f9f9f9' } }}>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{formatDateOnly(mantenimiento.fecha_mantenimiento)}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.numero_salida_materiales || '-'}</TableCell>
                  <TableCell sx={{ maxWidth: 200, fontSize: '0.75rem', border: '1px solid #ddd' }}>
                    {mantenimiento.descripcion_danos_eventos || mantenimiento.reparacion_realizada || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>
                    {mantenimiento.costo_total ? `${mantenimiento.costo_total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.horas_kilometros ? mantenimiento.horas_kilometros.toLocaleString('es-BO') : '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.operador || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.atendido_por || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.encargado_activos_fijos || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.unidad_empresa || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{mantenimiento.ubicacion_fisico_proyecto || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      </Box> {/* Cierre del contenido del reporte */}
    </Box>
  );
};
HojaVidaMantenimiento.propTypes = {
  maquinaria: PropTypes.object,
  mantenimientos: PropTypes.array,
  control: PropTypes.array,
  asignacion: PropTypes.array,
  liberacion: PropTypes.array,
  seguros: PropTypes.array,
  itv: PropTypes.array,
  soat: PropTypes.array,
  impuestos: PropTypes.array,
  depreciaciones: PropTypes.array,
  pronosticos: PropTypes.array
};
export default HojaVidaMantenimiento;
