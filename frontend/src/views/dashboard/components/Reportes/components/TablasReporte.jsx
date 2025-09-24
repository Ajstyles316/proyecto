import PropTypes from 'prop-types';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { formatDateOnly } from '../helpers';
import FileDownloadCell from '../FileDownloadCell';

const TablasReporte = ({ 
  control, 
  asignacion, 
  liberacion, 
  depreciaciones, 
  pronosticos, 
  seguros, 
  itv, 
  soat, 
  impuestos 
}) => {
  return (
    <>
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
    </>
  );
};

TablasReporte.propTypes = {
  control: PropTypes.array,
  asignacion: PropTypes.array,
  liberacion: PropTypes.array,
  depreciaciones: PropTypes.array,
  pronosticos: PropTypes.array,
  seguros: PropTypes.array,
  itv: PropTypes.array,
  soat: PropTypes.array,
  impuestos: PropTypes.array,
};

export default TablasReporte;