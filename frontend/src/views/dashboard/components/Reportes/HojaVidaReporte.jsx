import { useRef } from 'react';
import PropTypes from 'prop-types';
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

    // ====== Helpers ======
      const addHeaderToPage = async (pdfDoc) => {
      // Renderizar el header (logo + textos) como imagen para cada página
        const headerDiv = document.createElement('div');
        headerDiv.style.position = 'absolute';
        headerDiv.style.left = '-9999px';
        headerDiv.style.top = '0';
        headerDiv.style.backgroundColor = 'white';
        headerDiv.style.padding = '20px';
        headerDiv.style.borderBottom = '2px solid #1e4db7';
        headerDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 16px;">
            <div style="width: 90px; height: 70px; border-radius: 8px; overflow: hidden; border: 2px solid #1e4db7; background-color: white; display: flex; align-items: center; justify-content: center;">
                <img src="${logoCofa}" alt="Logo COFADENA" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
            <div style="line-height: 1.15;">
              <div style="font-weight: bold; color: #1e4db7; font-size: 16px;">MINISTERIO DE DEFENSA</div>
              <div style="font-weight: bold; color: #1e4db7; font-size: 14px;">CORPORACIÓN DE LAS FF.AA. PARA EL DESARROLLO NACIONAL</div>
              <div style="font-weight: bold; color: #1e4db7; font-size: 12px;">EMPRESA PÚBLICA NACIONAL ESTRATÉGICA</div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(headerDiv);
        
        const headerCanvas = await html2canvas(headerDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        height: 100
        });
        
        document.body.removeChild(headerDiv);
        
        const headerImgData = headerCanvas.toDataURL('image/png');
      const headerHeight = 28; // mm (altura ocupada por el encabezado)
        
      // Página A4
      const imgWidth = 210;
        pdfDoc.addImage(headerImgData, 'PNG', 0, 0, imgWidth, headerHeight);
        return headerHeight;
      };

     const paginateSection = async (pdfDoc, sectionCanvas) => {
       const imgData = sectionCanvas.toDataURL('image/png');
       const imgWidth = 210; // A4 width mm
       const pageHeight = 295; // A4 height mm
       const imgHeight = (sectionCanvas.height * imgWidth) / sectionCanvas.width;

       let heightLeft = imgHeight;
       let position = 0;

       // Agregar nueva página
       pdfDoc.addPage();
       const headerHeight = await addHeaderToPage(pdfDoc);
       
       // Solo agregar contenido si hay algo que mostrar
       if (imgHeight > 0) {
         // Primera página: usar todo el espacio disponible
         const availableHeight = pageHeight - headerHeight;
         pdfDoc.addImage(imgData, 'PNG', 0, headerHeight, imgWidth, Math.min(imgHeight, availableHeight));
         heightLeft -= availableHeight;

         // Páginas siguientes solo si es necesario
         while (heightLeft > 0) {
        position = heightLeft - imgHeight;
           pdfDoc.addPage();
           await addHeaderToPage(pdfDoc);
           pdfDoc.addImage(imgData, 'PNG', 0, headerHeight + position, imgWidth, imgHeight);
           heightLeft -= pageHeight;
         }
       }
     };

    // ====== Construir DOM temporal con contenido + firmas ======
    const tempRoot = document.createElement('div');
    tempRoot.style.position = 'absolute';
    tempRoot.style.left = '-9999px';
    tempRoot.style.top = '0';
    tempRoot.style.backgroundColor = 'white';
    tempRoot.style.padding = '20px';

    // Clonar el contenido de la vista
    const reportClone = reportRef.current.cloneNode(true);

    // Sección de firmas (se añade al final de CADA sección renderizada)
    const firmasHTML = `
      <div style="margin-top: 200px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; gap: 12px;">
          <div style="text-align: center; width: 33%;">
            <div style="font-weight: bold; margin-bottom: 18px; font-size: 13px;">RESPONSABLE DE MANTENIMIENTO</div>
            <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 8px;"></div>
            <div style="font-size: 11px; margin-top: 6px;">Nombre y Apellido</div>
          </div>
          <div style="text-align: center; width: 33%;">
            <div style="font-weight: bold; margin-bottom: 18px; font-size: 13px;">ENCARGADO DE ACTIVOS FIJOS</div>
            <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 8px;"></div>
            <div style="font-size: 11px; margin-top: 6px;">Nombre y Apellido</div>
          </div>
          <div style="text-align: center; width: 33%;">
            <div style="font-weight: bold; margin-bottom: 18px; font-size: 13px;">DIRECTOR GENERAL</div>
            <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 8px;"></div>
            <div style="font-size: 11px; margin-top: 6px;">Nombre y Apellido</div>
          </div>
        </div>
      </div>
    `;

    // ---- Clones por sección (antes / después del corte) ----
    // Base para clonar y partir
    const baseDiv = document.createElement('div');
    baseDiv.style.backgroundColor = 'white';
    baseDiv.style.padding = '0';
    baseDiv.appendChild(reportClone);

     const makeSectionDom = (mode) => {
       // Clonar base completa
       const section = baseDiv.cloneNode(true);
       
       if (mode === 'before') {
         // Sección 1: Todo hasta Historial de Mantenimiento (incluyendo Historial)
         const historialElement = Array.from(section.querySelectorAll('*')).find(el => 
           el.textContent && el.textContent.trim() === 'HISTORIAL DE MANTENIMIENTO'
         );
         
         if (historialElement) {
           const historialBox = historialElement.closest('[class*="Box"]') || historialElement.parentElement;
           let currentNode = historialBox;
           while (currentNode && currentNode.parentNode) {
             // Eliminar todos los hermanos siguientes
             while (currentNode.nextSibling) {
               currentNode.nextSibling.remove();
             }
             break;
           }
         }
         return section;
       }
       
       if (mode === 'middle') {
         // Sección 2: Desde Control hasta Seguros (sin ITV)
         const controlElement = Array.from(section.querySelectorAll('*')).find(el => 
           el.textContent && el.textContent.trim() === 'CONTROL'
         );
         const segurosElement = Array.from(section.querySelectorAll('*')).find(el => 
           el.textContent && el.textContent.trim() === 'SEGUROS'
         );
         
         if (controlElement && segurosElement) {
           const controlBox = controlElement.closest('[class*="Box"]') || controlElement.parentElement;
           const segurosBox = segurosElement.closest('[class*="Box"]') || segurosElement.parentElement;
           
           // Eliminar todo antes de Control
           let currentNode = controlBox;
           while (currentNode && currentNode.parentNode) {
             while (currentNode.previousSibling) {
               currentNode.previousSibling.remove();
             }
             break;
           }
           
           // Eliminar todo después de Seguros
           currentNode = segurosBox;
           while (currentNode && currentNode.parentNode) {
             while (currentNode.nextSibling) {
               currentNode.nextSibling.remove();
             }
             break;
           }
         }
         return section;
       }
       
       if (mode === 'after') {
         // Sección 3: Desde ITV hasta el final (con firmas al final)
         const itvElement = Array.from(section.querySelectorAll('*')).find(el => 
           el.textContent && el.textContent.trim() === 'ITV'
         );
         
         if (itvElement) {
           const itvBox = itvElement.closest('[class*="Box"]') || itvElement.parentElement;
           let currentNode = itvBox;
           while (currentNode && currentNode.parentNode) {
             while (currentNode.previousSibling) {
               currentNode.previousSibling.remove();
             }
             break;
           }
         }
         
         // Añadir firmas al final de la última sección
         const firmasDiv = document.createElement('div');
         firmasDiv.innerHTML = firmasHTML;
         section.appendChild(firmasDiv);
         
         return section;
       }
       
       return section;
     };

     // Construir DOMs de cada sección y convertirlos a canvas
     console.log('Creando secciones...');
     const sectionBefore = makeSectionDom('before');
     const sectionMiddle = makeSectionDom('middle');
     const sectionAfter  = makeSectionDom('after');
     
     console.log('Sección antes:', sectionBefore.innerHTML.length, 'caracteres');
     console.log('Sección medio:', sectionMiddle.innerHTML.length, 'caracteres');
     console.log('Sección después:', sectionAfter.innerHTML.length, 'caracteres');

    // Render helpers para html2canvas
    const renderToCanvas = async (node) => {
      tempRoot.innerHTML = ''; // limpiar
      tempRoot.appendChild(node);
      document.body.appendChild(tempRoot);

      const canvas = await html2canvas(tempRoot, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(tempRoot);
      return canvas;
    };

    const pdf = new jsPDF('p', 'mm', 'a4');

     // ====== Sección 1 (hasta Historial de Mantenimiento) ======
     const canvasBefore = await renderToCanvas(sectionBefore);
     const imgDataBefore = canvasBefore.toDataURL('image/png');
     const imgWidth = 210;
     const pageHeight = 295;
     const imgHeightBefore = (canvasBefore.height * imgWidth) / canvasBefore.width;

     // Solo procesar si hay contenido
     if (imgHeightBefore > 0) {
       // Primera página de la primera sección - usar todo el espacio disponible
       const headerHeightFirst = await addHeaderToPage(pdf);
       const availableHeight = pageHeight - headerHeightFirst;
       pdf.addImage(imgDataBefore, 'PNG', 0, headerHeightFirst, imgWidth, Math.min(imgHeightBefore, availableHeight));

       // Paginación de la primera sección (si excede)
       let heightLeft = imgHeightBefore - availableHeight;
       while (heightLeft > 0) {
         const position = heightLeft - imgHeightBefore;
         pdf.addPage();
         await addHeaderToPage(pdf);
         pdf.addImage(imgDataBefore, 'PNG', 0, headerHeightFirst + position, imgWidth, imgHeightBefore);
         heightLeft -= pageHeight;
       }
     }

     // ====== Sección 2 (desde Control hasta ITV) ======
     const canvasMiddle = await renderToCanvas(sectionMiddle);
     await paginateSection(pdf, canvasMiddle);

     // ====== Sección 3 (desde SOAT hasta firmas) ======
     const canvasAfter = await renderToCanvas(sectionAfter);
     await paginateSection(pdf, canvasAfter);

    // Nombre de archivo
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

        {/* Título Principal */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#1e4db7' }}>
            HISTORIAL DE MAQUINARIA
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
            CODIGO: {maquinaria?.codigo || 'N/A'}
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
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#eeeef0ff', color: 'black', p: 1 }}>
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
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
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

              {/* Líquido de Freno */}
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>LÍQUIDO DE FRENO</Typography>
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

              {/* Aceite de Transmisión */}
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>ACEITE DE TRANSMISIÓN</Typography>
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
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_cantidad || '15 LT'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_numero || '80W90'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_cambio_km_hr || '50000 KM'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{mantenimientos[0]?.aceite_transmision_numero_filtro || '-'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Grid>
          </Grid>
        </Box>

        {/* Trabajos a Destinados Realizar */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
            TRABAJOS A DESTINADOS REALIZAR
          </Typography>
          
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#eeeef0ff', color: 'black', p: 1 }}>
            {mantenimientos[0]?.trabajos_destinados_realizar || 'TRASLADO DE MATERIAL'}
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
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
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
                {mantenimientos && mantenimientos.length > 0 ? (
                  mantenimientos.map((mantenimiento, index) => (
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
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Control */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
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

        {/* Marcador de salto de página después de Control */}
        <div style={{ pageBreakAfter: 'always' }}></div>

        {/* Asignación */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
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
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
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

        {/* Salto de página después de Liberación */}
        <div id="break-after-liberacion" style={{ pageBreakAfter: 'always' }} />

        {/* Depreciaciones */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
            DEPRECIACIONES
          </Typography>
          
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ddd', padding: '8px' }}>AÑO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ddd', padding: '8px' }}>VALOR ANUAL DEPRECIADO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ddd', padding: '8px' }}>DEPRECIACIÓN ACUMULADA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ddd', padding: '8px' }}>VALOR EN LIBROS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {depreciaciones && depreciaciones.length > 0 ? (
                  depreciaciones.map((item, index) => (
                    item.depreciacion_por_anio && item.depreciacion_por_anio.length > 0 ? (
                      item.depreciacion_por_anio.map((dep, depIndex) => (
                        <TableRow key={`${index}-${depIndex}`}>
                          <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>{dep.anio || '-'}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>{dep.valor_anual_depreciado ? `${dep.valor_anual_depreciado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '-'}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>{dep.depreciacion_acumulada ? `${dep.depreciacion_acumulada.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '-'}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>{dep.valor_en_libros ? `${dep.valor_en_libros.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow key={index}>
                        <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>-</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>-</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>-</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>-</TableCell>
                      </TableRow>
                    )
                  ))
                ) : (
                  <TableRow>
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

        {/* Pronósticos */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
            PRONÓSTICOS
          </Typography>
          
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ddd', padding: '8px' }}>RIESGO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ddd', padding: '8px' }}>RESULTADO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ddd', padding: '8px' }}>PROBABILIDAD (%)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ddd', padding: '8px' }}>FECHA DE ASIGNACIÓN</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ddd', padding: '8px' }}>RECORRIDO</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ddd', padding: '8px' }}>HORAS DE OPERACIÓN</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ddd', padding: '8px' }}>RECOMENDACIONES</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #ddd', padding: '8px' }}>URGENCIA</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pronosticos && pronosticos.length > 0 ? (
                  pronosticos.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>{item.riesgo || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>{item.resultado || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>{item.probabilidad || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>{formatDateOnly(item.fecha_asig)}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>{item.recorrido || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>{item.horas_op || '-'}</TableCell>
                      <TableCell sx={{ 
                        fontSize: '0.85rem', 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        maxWidth: '200px',
                        whiteSpace: 'pre-line',
                        verticalAlign: 'top'
                      }}>
                        {item.recomendaciones ? 
                          (() => {
                            // Si es un array, mostrar como lista con guiones
                            if (Array.isArray(item.recomendaciones)) {
                              return item.recomendaciones.slice(0, 3).map(rec => `- ${rec}`).join('\n');
                            }
                            // Si es una cadena, convertir a array y mostrar como lista
                            if (typeof item.recomendaciones === 'string') {
                              const recomendaciones = item.recomendaciones.split('.').filter(r => r.trim()).slice(0, 3);
                              return recomendaciones.map(rec => `- ${rec.trim()}`).join('\n');
                            }
                            // Si es otro tipo, mostrar como está
                            return `- ${String(item.recomendaciones)}`;
                          })()
                          : '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '8px' }}>{item.urgencia || '-'}</TableCell>
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
                    <TableCell sx={{ fontSize: '0.75rem', border: '1px solid #ddd' }}>-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Seguros */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
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
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
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

        {/* Marcador de salto de página después de ITV */}
        <div style={{ pageBreakAfter: 'always' }}></div>

        {/* SOAT */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
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
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, bgcolor: '#e4ecfeff', color: 'black', p: 1, borderRadius: 1 }}>
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

// PropTypes validation
HojaVidaReporte.propTypes = {
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

export default HojaVidaReporte;
