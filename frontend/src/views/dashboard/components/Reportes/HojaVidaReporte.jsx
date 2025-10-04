import { useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import MantenimientoSection from './MantenimientoSection';
import { formatDateOnly } from './helpers';
import logoCofa from 'src/assets/images/logos/logo_cofa_new.png';

// Importar componentes modulares
import HeaderReporte from './components/HeaderReporte';
import DatosGenerales from './components/DatosGenerales';
import AceitesFluidos from './components/AceitesFluidos';
import TrabajosDestinados from './components/TrabajosDestinados';
import HistorialMantenimiento from './components/HistorialMantenimiento';
import TablasReporte from './components/TablasReporte';
import BotonesExportacion from './components/BotonesExportacion';

const HojaVidaReporte = ({ 
  maquinaria, 
  mantenimientos, 
  control, 
  asignacion, 
  liberacion, 
  seguros, 
  itv, 
  soat, 
  impuestos, 
  depreciaciones, 
  pronosticos,
  odometerData 
}) => {
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
              <div style="font-weight: bold; color: #1e4db7; font-size: 16px;">CORPORACIÓN DE LAS FUERZAS ARMADAS PARA EL DESARROLLO NACIONAL</div>
            </div>
          </div>
        `;
        document.body.appendChild(headerDiv);
        
        const headerCanvas = await html2canvas(headerDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          height: 100,
          quality: 0.6,
          logging: false,
          removeContainer: true,
          foreignObjectRendering: false,
          imageTimeout: 15000
        });
        
        document.body.removeChild(headerDiv);
        
        const headerImgData = headerCanvas.toDataURL('image/jpeg', 0.5);
      const headerHeight = 28; // mm (altura ocupada por el encabezado)
        
      // Página A4
      const imgWidth = 210;
        pdfDoc.addImage(headerImgData, 'JPEG', 0, 0, imgWidth, headerHeight);
        return headerHeight;
      };

     const paginateSection = async (pdfDoc, sectionCanvas) => {
       const imgData = sectionCanvas.toDataURL('image/jpeg', 0.5);
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
         pdfDoc.addImage(imgData, 'JPEG', 0, headerHeight, imgWidth, Math.min(imgHeight, availableHeight));
         heightLeft -= availableHeight;

         // Páginas siguientes solo si es necesario
         while (heightLeft > 0) {
        position = heightLeft - imgHeight;
           pdfDoc.addPage();
           await addHeaderToPage(pdfDoc);
           pdfDoc.addImage(imgData, 'JPEG', 0, headerHeight + position, imgWidth, imgHeight);
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
    tempRoot.style.padding = '10px';

    // Clonar el contenido de la vista
    const reportClone = reportRef.current.cloneNode(true);

    // Sección de firmas (se añade al final de CADA sección renderizada)
    const firmasHTML = `
      <div style="margin-top: 60px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; gap: 8px;">
          <div style="text-align: center; width: 25%;">
            <div style="font-weight: bold; margin-bottom: 18px; font-size: 12px;">RESPONSABLE DE MANTENIMIENTO</div>
            <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 4px;"></div>
            <div style="font-size: 10px; margin-top: 6px;">........................................................................................................</div>
          </div>
          <div style="text-align: center; width: 25%;">
            <div style="font-weight: bold; margin-bottom: 18px; font-size: 12px;">ENCARGADO DE ACTIVOS FIJOS</div>
            <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 4px;"></div>
            <div style="font-size: 10px; margin-top: 6px;">........................................................................................................</div>
          </div>
          <div style="text-align: center; width: 25%;">
            <div style="font-weight: bold; margin-bottom: 18px; font-size: 12px;">JEFE DE LA UNIDAD ADMINISTRATIVA</div>
            <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 4px;"></div>
            <div style="font-size: 10px; margin-top: 6px;">........................................................................................................</div>
          </div>
          <div style="text-align: center; width: 25%;">
            <div style="font-weight: bold; margin-bottom: 18px; font-size: 12px;">GERENTE DE LA UNIDAD</div>
            <div style="height: 40px; border-bottom: 1px solid #000; margin: 0 4px;"></div>
            <div style="font-size: 10px; margin-top: 6px;">........................................................................................................</div>
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
         // Sección 1: Usar contenido de MantenimientoSection
         const mantenimientoDiv = document.createElement('div');
         mantenimientoDiv.innerHTML = MantenimientoSection({ maquinaria, mantenimientos });
         return mantenimientoDiv;
       }
       
       if (mode === 'middle') {
         // Sección 2: Desde Control hasta Impuestos (incluyendo ITV, SOAT, IMPUESTOS)
         const controlElement = Array.from(section.querySelectorAll('*')).find(el => 
           el.textContent && el.textContent.trim() === 'CONTROL'
         );
         const impuestosElement = Array.from(section.querySelectorAll('*')).find(el => 
           el.textContent && el.textContent.trim() === 'IMPUESTOS'
         );
         
         if (controlElement && impuestosElement) {
           const controlBox = controlElement.closest('[class*="Box"]') || controlElement.parentElement;
           const impuestosBox = impuestosElement.closest('[class*="Box"]') || impuestosElement.parentElement;
           
           // Eliminar todo antes de Control
           let currentNode = controlBox;
           while (currentNode && currentNode.parentNode) {
             while (currentNode.previousSibling) {
               currentNode.previousSibling.remove();
             }
             break;
           }
           
           // Eliminar todo después de Impuestos
           currentNode = impuestosBox;
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
         // Sección 3: Solo resumen de registros y firmas
         const resumenDiv = document.createElement('div');
         resumenDiv.style.backgroundColor = 'white';
         resumenDiv.style.padding = '20px';
         resumenDiv.style.fontFamily = 'Arial, sans-serif';
         
         // Resumen técnico detallado
         const resumenHTML = `
           <div style="margin-bottom: 50px;">
             <h2 style="color: #1e4db7; text-align: center; margin-bottom: 30px; font-size: 20px;">RESUMEN TÉCNICO DE MAQUINARIA</h2>
             
             <!-- Información del equipo -->
             <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #1e4db7;">
               <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">INFORMACIÓN DEL EQUIPO</h3>
               <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                 <div><strong>Equipo:</strong> ${maquinaria?.detalle || 'No especificado'}</div>
                 <div><strong>Placa:</strong> ${maquinaria?.placa || 'No asignada'}</div>
                 <div><strong>Marca:</strong> ${maquinaria?.marca || 'No especificada'}</div>
                 <div><strong>Modelo:</strong> ${maquinaria?.modelo || 'No especificado'}</div>
                 <div><strong>Chasis:</strong> ${maquinaria?.nro_chasis || 'No especificado'}</div>
                 <div><strong>Motor:</strong> ${maquinaria?.nro_motor || 'No especificado'}</div>
                 <div><strong>Tipo:</strong> ${maquinaria?.tipo || 'No especificado'}</div>
                 <div><strong>Estado:</strong> OPERABLE</div>
               </div>
             </div>
             
             <!-- Estadísticas técnicas -->
             <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #ddd;">
               <h3 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 16px;">ESTADÍSTICAS DE REGISTROS</h3>
               
               <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                 <div style="text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 6px; background-color: #f8f9fa;">
                   <h4 style="color: #2c3e50; margin: 0 0 8px 0; font-size: 14px;">MANTENIMIENTOS REALIZADOS</h4>
                   <p style="font-size: 28px; font-weight: bold; color: #1e4db7; margin: 0;">${mantenimientos ? mantenimientos.length : 0}</p>
                   <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Registros de mantenimiento preventivo y correctivo</p>
                 </div>
                 
                 <div style="text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 6px; background-color: #f8f9fa;">
                   <h4 style="color: #2c3e50; margin: 0 0 8px 0; font-size: 14px;">PRONÓSTICOS GENERADOS</h4>
                   <p style="font-size: 28px; font-weight: bold; color: #1e4db7; margin: 0;">${pronosticos ? pronosticos.length : 0}</p>
                   <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Análisis predictivos de mantenimiento</p>
                 </div>
                 
                 <div style="text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 6px; background-color: #f8f9fa;">
                   <h4 style="color: #2c3e50; margin: 0 0 8px 0; font-size: 14px;">DOCUMENTOS LEGALES</h4>
                   <p style="font-size: 28px; font-weight: bold; color: #1e4db7; margin: 0;">${(seguros ? seguros.length : 0) + (itv ? itv.length : 0) + (soat ? soat.length : 0) + (impuestos ? impuestos.length : 0)}</p>
                   <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Total de documentos administrativos</p>
                 </div>
               </div>
               
               <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                 <div style="text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background-color: #fff;">
                   <h5 style="color: #2c3e50; margin: 0 0 5px 0; font-size: 12px;">SEGUROS</h5>
                   <p style="font-size: 18px; font-weight: bold; color: #27ae60; margin: 0;">${seguros ? seguros.length : 0}</p>
                 </div>
                 
                 <div style="text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background-color: #fff;">
                   <h5 style="color: #2c3e50; margin: 0 0 5px 0; font-size: 12px;">ITV</h5>
                   <p style="font-size: 18px; font-weight: bold; color: #e74c3c; margin: 0;">${itv ? itv.length : 0}</p>
                 </div>
                 
                 <div style="text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background-color: #fff;">
                   <h5 style="color: #2c3e50; margin: 0 0 5px 0; font-size: 12px;">SOAT</h5>
                   <p style="font-size: 18px; font-weight: bold; color: #f39c12; margin: 0;">${soat ? soat.length : 0}</p>
                 </div>
                 
                 <div style="text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background-color: #fff;">
                   <h5 style="color: #2c3e50; margin: 0 0 5px 0; font-size: 12px;">IMPUESTOS</h5>
                   <p style="font-size: 18px; font-weight: bold; color: #8e44ad; margin: 0;">${impuestos ? impuestos.length : 0}</p>
                 </div>
               </div>
             </div>
             
             <!-- Información del reporte -->
             <div style="text-align: center; margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
               <p style="color: #666; font-size: 13px; margin: 0;">
                 <strong>Fecha de Generación del Reporte:</strong> ${new Date().toLocaleDateString('es-ES')} | 
                 <strong>Hora:</strong> ${new Date().toLocaleTimeString('es-ES')} | 
                 <strong>Sistema:</strong> COFADENA - Gestión de Maquinaria
               </p>
             </div>
           </div>
         `;
         
         resumenDiv.innerHTML = resumenHTML;
         
         // Añadir firmas al final
         const firmasDiv = document.createElement('div');
         firmasDiv.innerHTML = firmasHTML;
         resumenDiv.appendChild(firmasDiv);
         
         return resumenDiv;
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
      
      // Detectar si es la primera sección (hasta Historial de Mantenimiento)
      const isFirstSection = node.innerHTML.includes('HISTORIAL DE MAQUINARIA') && 
                            node.innerHTML.includes('DATOS VEHICULO, MAQUINARIA, EQUIPO');
      
      if (isFirstSection) {
        // Aplicar estilos CSS temporales SOLO para aumentar filas de tablas en la primera sección
        const style = document.createElement('style');
        style.textContent = `
          .pdf-first-section .MuiTableRow-root { 
            height: 80px !important; 
            min-height: 80px !important;
          }
          .pdf-first-section .MuiTableCell-root { 
            height: 80px !important; 
            min-height: 80px !important;
            padding: 12px 8px !important;
            font-size: 1rem !important;
            vertical-align: middle !important;
          }
          .pdf-first-section table { 
            border-collapse: collapse !important;
          }
          .pdf-first-section .MuiCardMedia-root { 
            height: 300px !important; 
            width: auto !important;
            object-fit: cover !important;
          }
          .pdf-first-section .MuiGrid-container { 
            gap: 0px !important; 
          }
        `;
        document.head.appendChild(style);
        
        // Aplicar clase a todos los elementos de la primera sección
        const allElements = tempRoot.querySelectorAll('*');
        allElements.forEach(el => {
          el.classList.add('pdf-first-section');
        });
        
        document.body.appendChild(tempRoot);

        const canvas = await html2canvas(tempRoot, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          quality: 0.6,
          logging: false,
          removeContainer: true,
          foreignObjectRendering: false,
          imageTimeout: 15000
        });

        document.body.removeChild(tempRoot);
        document.head.removeChild(style); // Limpiar estilos temporales
        return canvas;
      } else {
        // Para otras secciones, renderizar normalmente
        document.body.appendChild(tempRoot);

        const canvas = await html2canvas(tempRoot, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          quality: 0.6,
          logging: false,
          removeContainer: true,
          foreignObjectRendering: false,
          imageTimeout: 15000
        });

        document.body.removeChild(tempRoot);
        return canvas;
      }
    };

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      precision: 1,
      userUnit: 1.0,
      hotfixes: ["px_scaling"]
    });

     // ====== Sección 1 (hasta Historial de Mantenimiento) ======
     const canvasBefore = await renderToCanvas(sectionBefore);
     const imgDataBefore = canvasBefore.toDataURL('image/jpeg', 0.5);
     const imgWidth = 210;
     const pageHeight = 295;
     const imgHeightBefore = (canvasBefore.height * imgWidth) / canvasBefore.width;

     // Solo procesar si hay contenido
     if (imgHeightBefore > 0) {
       // Primera página de la primera sección - usar todo el espacio disponible
       const headerHeightFirst = await addHeaderToPage(pdf);
       const availableHeight = pageHeight - headerHeightFirst;
       pdf.addImage(imgDataBefore, 'JPEG', 0, headerHeightFirst, imgWidth, Math.min(imgHeightBefore, availableHeight));

       // Paginación de la primera sección (si excede)
       let heightLeft = imgHeightBefore - availableHeight;
       while (heightLeft > 0) {
         const position = heightLeft - imgHeightBefore;
         pdf.addPage();
         await addHeaderToPage(pdf);
         pdf.addImage(imgDataBefore, 'JPEG', 0, headerHeightFirst + position, imgWidth, imgHeightBefore);
         heightLeft -= pageHeight;
       }
     }

     // ====== Sección 2 (desde Control hasta Impuestos - incluyendo ITV, SOAT, IMPUESTOS) ======
     const canvasMiddle = await renderToCanvas(sectionMiddle);
     await paginateSection(pdf, canvasMiddle);

     // ====== Sección 3 (resumen de registros y firmas) ======
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
          impuestos: impuestos,
          odometerData: odometerData || []
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
      <BotonesExportacion 
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
      />

      {/* Contenido del Reporte */}
      <Box ref={reportRef} sx={{ backgroundColor: 'white', padding: '5px' }}>
        {/* Título Principal */}
        <HeaderReporte maquinaria={maquinaria} />

        {/* Datos del Vehículo/Maquinaria */}
        <DatosGenerales 
          maquinaria={maquinaria} 
          mantenimientos={mantenimientos} 
        />

        {/* Aceites y Fluidos */}
        <AceitesFluidos mantenimientos={mantenimientos} />

        {/* Trabajos a Destinados Realizar */}
        <TrabajosDestinados mantenimientos={mantenimientos} />

        {/* Historial de Mantenimiento */}
        <HistorialMantenimiento mantenimientos={mantenimientos} />

        {/* Tablas de Control, Asignación, Liberación, etc. */}
        <TablasReporte 
          control={control}
          asignacion={asignacion}
          liberacion={liberacion}
          depreciaciones={depreciaciones}
          pronosticos={pronosticos}
          seguros={seguros}
          itv={itv}
          soat={soat}
          impuestos={impuestos}
          odometerData={odometerData}
        />

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
  pronosticos: PropTypes.array,
  odometerData: PropTypes.array
};

export default HojaVidaReporte;