import React, { useRef } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, CardMedia, Button } from '@mui/material';
import { formatDateOnly } from './helpers';
import FileDownloadCell from './FileDownloadCell';
import logoCofa from 'src/assets/images/logos/logo_cofa_new.png';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';

const HojaVidaReporte = ({ maquinaria, mantenimientos, control, asignacion, liberacion, seguros, itv, soat, impuestos, depreciaciones, pronosticos }) => {
  const reportRef = useRef(null);

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // Crear un elemento temporal con el contenido del reporte + sección de firmas
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      
      // Clonar el contenido del reporte
      const reportClone = reportRef.current.cloneNode(true);
      
      // Crear la sección de firmas
      const firmasDiv = document.createElement('div');
      firmasDiv.innerHTML = `
        <div style="margin-top: 40px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between;">
            <div style="text-align: center; width: 30%;">
              <div style="font-weight: bold; margin-bottom: 20px; font-size: 14px;">RESPONSABLE DE MANTENIMIENTO</div>
              <div style="height: 40px; border-bottom: 1px solid #000; margin-bottom: 10px; margin: 0 10px;"></div>
              <div style="font-size: 12px;">Nombre y Apellido</div>
            </div>
            <div style="text-align: center; width: 30%;">
              <div style="font-weight: bold; margin-bottom: 20px; font-size: 14px;">ENCARGADO DE ACTIVOS FIJOS</div>
              <div style="height: 40px; border-bottom: 1px solid #000; margin-bottom: 10px; margin: 0 10px;"></div>
              <div style="font-size: 12px;">Nombre y Apellido</div>
            </div>
            <div style="text-align: center; width: 30%;">
              <div style="font-weight: bold; margin-bottom: 20px; font-size: 14px;">DIRECTOR GENERAL</div>
              <div style="height: 40px; border-bottom: 1px solid #000; margin-bottom: 10px; margin: 0 10px;"></div>
              <div style="font-size: 12px;">Nombre y Apellido</div>
            </div>
          </div>
        </div>
      `;
      
      // Agregar contenido al div temporal
      tempDiv.appendChild(reportClone);
      tempDiv.appendChild(firmasDiv);
      document.body.appendChild(tempDiv);

      // Capturar el contenido completo
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Limpiar el elemento temporal
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Agregar la primera página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Agregar páginas adicionales si es necesario
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generar nombre del archivo
      const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      const placa = maquinaria?.placa || 'maquinaria';
      const filename = `Hoja_Vida_${placa}_${fecha}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar el PDF. Por favor, inténtelo de nuevo.');
    }
  };

  const handleExportExcel = () => {
    try {
      // Importar dinámicamente la función específica de exportación Excel para Hoja de Vida
      import('./exportacionExcel').then(({ exportHojaVidaExcel }) => {
        // Preparar datos para Excel - INCLUYENDO DEPRECIACIONES Y PRONÓSTICOS
        const excelData = {
          maquinaria: maquinaria,
          depreciaciones: depreciaciones || [],
          pronosticos: pronosticos || [],
          mantenimientos: mantenimientos,
          control: control,
          asignacion: asignacion,
          liberacion: liberacion,
          seguros: seguros,
          itv: itv,
          soat: soat,
          impuestos: impuestos
        };

        console.log('🔍 DATOS PARA EXCEL:', excelData);

        const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
        const placa = maquinaria?.placa || 'maquinaria';
        const filename = `Hoja_Vida_${placa}_${fecha}`;

        exportHojaVidaExcel(excelData, filename);
      });
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error al exportar el Excel. Por favor, inténtelo de nuevo.');
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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<PictureAsPdfIcon />}
          onClick={handleExportPDF}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Exportar PDF
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<TableChartIcon />}
          onClick={handleExportExcel}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Exportar Excel
        </Button>
      </Box>

      {/* Contenido del Reporte */}
      <Box ref={reportRef} sx={{ backgroundColor: 'white' }}>
        {/* Header con Logo y Título */}
        <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #1e4db7', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Box sx={{ 
              width: 100, 
              height: 80, 
              mr: 3,
              borderRadius: 2,
              overflow: 'hidden',
              border: '2px solid #1e4db7',
              bgcolor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={logoCofa} 
                alt="Logo COFADENA"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }} 
              />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e4db7', mb: 0.5 }}>
                MINISTERIO DE DEFENSA
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e4db7', mb: 0.5 }}>
                CORPORACIÓN DE LAS FF.AA. PARA EL DESARROLLO NACIONAL
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e4db7' }}>
                EMPRESA PÚBLICA NACIONAL ESTRATÉGICA
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Título Principal */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#1e4db7' }}>
            HOJA DE VIDA HISTORIAL DE MANTENIMIENTO
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
            CODIGO: {maquinaria?.codigo || 'N/A'}
          </Typography>
        </Box>


        {/* Datos del Vehículo/Maquinaria */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
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
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.cantidad_sistema_electrico || '1'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.voltaje_sistema_electrico || '12V'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.amperaje_sistema_electrico || '100A'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.vida_util_sistema_electrico || '5 años'}</TableCell>
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
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>ACEITE HIDRÁULICO</Typography>
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
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_cantidad || '30 LT'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_numero || 'AW46'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_cambio_km_hr || '2000 HR'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_hidraulico_numero_filtro || 'HF6167'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Grid>

            <Grid item xs={12} md={6}>
              {/* Líquido Refrigerante */}
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>LÍQUIDO REFRIGERANTE</Typography>
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
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_refrigerante_tipo || 'Anticongelante'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_refrigerante_cantidad_lt || '20 LT'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.liquido_refrigerante_frecuencia_cambio || '2 años'}</TableCell>
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
            TRABAJOS A DESTINADOS REALIZAR
          </Typography>
          
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#f5f5f5', p: 1 }}>
            TRASLADO DE MATERIAL
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

        {/* Control */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
            CONTROL
          </Typography>
          
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>FECHA INICIO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>FECHA FINAL</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>PROYECTO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>UBICACIÓN</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>ESTADO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>TIEMPO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>OPERADOR</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {control && control.length > 0 ? (
                  control.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{formatDateOnly(item.fecha_inicio)}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{formatDateOnly(item.fecha_final)}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.proyecto || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.ubicacion || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.estado || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.tiempo || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.operador || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Asignación */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
            ASIGNACIÓN
          </Typography>
          
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>UNIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>FECHA ASIGNACIÓN</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>KILOMETRAJE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>GERENTE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>ENCARGADO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asignacion && asignacion.length > 0 ? (
                  asignacion.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.unidad || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{formatDateOnly(item.fecha_asignacion)}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.kilometraje || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.gerente || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.encargado || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Liberación */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
            LIBERACIÓN
          </Typography>
          
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>UNIDAD</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>FECHA LIBERACIÓN</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>KILOMETRAJE ENTREGADO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>GERENTE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>ENCARGADO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {liberacion && liberacion.length > 0 ? (
                  liberacion.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.unidad || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{formatDateOnly(item.fecha_liberacion)}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.kilometraje_entregado || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.gerente || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.encargado || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Seguros */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
            SEGUROS
          </Typography>
          
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>FECHA INICIAL</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>FECHA FINAL</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>Nº PÓLIZA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>COMPAÑÍA ASEGURADORA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>IMPORTE</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>ARCHIVO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {seguros && seguros.length > 0 ? (
                  seguros.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{formatDateOnly(item.fecha_inicial)}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{formatDateOnly(item.fecha_final)}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.numero_poliza || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.compania_aseguradora || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.importe ? `${item.importe.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>
                        {item.nombre_archivo ? (
                          <FileDownloadCell 
                            fileName={item.nombre_archivo} 
                            fileData={item} 
                            showIcon={true}
                          />
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* ITV */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
            ITV
          </Typography>
          
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>GESTIÓN</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>ARCHIVO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itv && itv.length > 0 ? (
                  itv.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.gestion || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>
                        {item.nombre_archivo ? (
                          <FileDownloadCell 
                            fileName={item.nombre_archivo} 
                            fileData={item} 
                            showIcon={true}
                          />
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* SOAT */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
            SOAT
          </Typography>
          
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>GESTIÓN</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>ARCHIVO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {soat && soat.length > 0 ? (
                  soat.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.gestion || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>
                        {item.nombre_archivo ? (
                          <FileDownloadCell 
                            fileName={item.nombre_archivo} 
                            fileData={item} 
                            showIcon={true}
                          />
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Impuestos */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#1e4db7', color: 'white', p: 1, borderRadius: 1 }}>
            IMPUESTOS
          </Typography>
          
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>GESTIÓN</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', border: '1px solid #ddd' }}>ARCHIVO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {impuestos && impuestos.length > 0 ? (
                  impuestos.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>{item.gestion || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>
                        {item.nombre_archivo ? (
                          <FileDownloadCell 
                            fileName={item.nombre_archivo} 
                            fileData={item} 
                            showIcon={true}
                          />
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
         </Box>

      </Box> {/* Cierre del contenido del reporte */}
    </Box>
  );
};

export default HojaVidaReporte;
