export function formatDateOnly(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr.split('T')[0];
  return d.toLocaleDateString('es-BO');
}

export function formatCurrency(value) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(value);
}

export function cleanRow(row, includeAuditFields = false) {
  const cleaned = {};
  Object.entries(row).forEach(([k, v]) => {
    // Campos que siempre se excluyen
    if (k.endsWith('_id') || k === 'maquinaria' || k === 'fecha_ingreso' || k === 'created_at' || k === 'updated_at') return;
    
    // Campos de auditoría que se pueden incluir opcionalmente
    if (!includeAuditFields && (k === 'fecha_creacion' || k === 'fecha_actualizacion')) return;
    
    if (k.toLowerCase().includes('fecha') && v) {
      cleaned[k] = formatDateOnly(v);
    } else {
      cleaned[k] = Array.isArray(v) ? v.join('; ') : v;
    }
  });
  return cleaned;
}

export function formatHeader(key) {
  // Si el key ya tiene espacios y parece estar bien formateado, devolverlo tal como está
  if (key.includes(' ') && /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+$/.test(key)) {
    return key;
  }
  // Si es un string con guiones bajos, procesarlo
  if (key.includes('_')) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  // Para otros casos, solo capitalizar la primera letra
  return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
}

export function formatMethod(method) {
  if (!method) return '-';
  // Si el method ya tiene espacios y parece estar bien formateado, devolverlo tal como está
  if (method.includes(' ') && /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+$/.test(method)) {
    return method;
  }
  // Si es un string con guiones bajos, procesarlo
  if (method.includes('_')) {
    return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  // Para otros casos, solo capitalizar la primera letra
  return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
}

export function formatFileName(fileName, fileData = null) {
  if (!fileName) return '-';
  
  // Si tenemos datos del archivo, mostrar con ícono y formato especial
  if (fileData && fileData.archivo_pdf) {
    return `📄 ${fileName} (Descargable)`;
  }
  
  // Si solo tenemos el nombre, mostrar como texto
  return fileName;
}

export function createDownloadLink(fileName, fileData) {
  if (!fileData || !fileData.archivo_pdf) return fileName;
  
  try {
    const byteCharacters = atob(fileData.archivo_pdf);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'documento.pdf';
    link.style.textDecoration = 'underline';
    link.style.color = '#1976d2';
    link.style.cursor = 'pointer';
    link.title = 'Hacer clic para descargar';
    
    // Agregar evento para limpiar la URL después de la descarga
    link.addEventListener('click', () => {
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    });
    
    return link;
  } catch (error) {
    console.error('Error creando enlace de descarga:', error);
    return fileName;
  }
}

export function createPDFDownloadLink(doc, fileName, fileData, x, y, width, height) {
  if (!fileData || !fileData.archivo_pdf) return false;
  
  try {
    // Crear enlace clickeable en el PDF
    doc.link(x, y, width, height, {
      url: `data:application/pdf;base64,${fileData.archivo_pdf}`,
      target: '_blank'
    });
    
    // Cambiar estilo visual para indicar que es clickeable
    doc.setTextColor(25, 118, 210); // Azul
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    // Agregar texto del enlace
    doc.text(`📄 ${fileName}`, x, y + 5);
    
    // Agregar indicador visual
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('(Click para descargar)', x, y + 8);
    
    return true;
  } catch (error) {
    console.error('Error creando enlace de descarga en PDF:', error);
    return false;
  }
}
