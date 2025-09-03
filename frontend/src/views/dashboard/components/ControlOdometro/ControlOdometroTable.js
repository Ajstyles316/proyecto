import PropTypes from 'prop-types';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardMedia,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DownloadIcon from '@mui/icons-material/Download';
import { useState } from 'react';

const ControlOdometroTable = ({
  controlesOdometro,
  onEdit,
  onDelete,
  loading,
  isReadOnly,
  canEdit,
  canDelete,
  deleteLoading
}) => {
  const [selectedFotos, setSelectedFotos] = useState([]);
  const [fotosDialogOpen, setFotosDialogOpen] = useState(false);
  const [selectedFotoIndex, setSelectedFotoIndex] = useState(null);
  const [maximizeDialogOpen, setMaximizeDialogOpen] = useState(false);

  const handleViewFotos = (fotos) => {
    setSelectedFotos(fotos || []);
    setFotosDialogOpen(true);
  };

  const handleCloseFotosDialog = () => {
    setFotosDialogOpen(false);
    setSelectedFotos([]);
  };

  const handleMaximizeFoto = (foto, index) => {
    setSelectedFotoIndex(index);
    setMaximizeDialogOpen(true);
  };

  const handleCloseMaximizeDialog = () => {
    setMaximizeDialogOpen(false);
    setSelectedFotoIndex(null);
  };

  const handleDownloadFoto = (foto, index) => {
    const link = document.createElement('a');
    link.href = foto;
    link.download = `foto_odometro_${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (controlesOdometro.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No hay controles de odómetro registrados para esta maquinaria.
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Unidad</TableCell>
              <TableCell>Odómetro Inicial</TableCell>
              <TableCell>Odómetro Final</TableCell>
              <TableCell>Odómetro del Mes</TableCell>
              <TableCell>Fotos</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {controlesOdometro.map((control) => (
              <TableRow key={control._id}>
                <TableCell>{control.unidad || '-'}</TableCell>
                <TableCell>{control.odometro_inicial ? control.odometro_inicial.toLocaleString() : '-'}</TableCell>
                <TableCell>{control.odometro_final ? control.odometro_final.toLocaleString() : '-'}</TableCell>
                <TableCell>{control.odometro_mes ? control.odometro_mes.toLocaleString() : '-'}</TableCell>
                <TableCell>
                  {control.fotos && control.fotos.length > 0 ? (
                    <Chip
                      label={`${control.fotos.length} foto${control.fotos.length > 1 ? 's' : ''}`}
                      color="primary"
                      size="small"
                      onClick={() => handleViewFotos(control.fotos)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin fotos
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {control.fotos && control.fotos.length > 0 && (
                      <IconButton
                        size="small"
                        onClick={() => handleViewFotos(control.fotos)}
                        title="Ver fotos"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    )}
                                         {canEdit && (
                       <IconButton
                         size="small"
                         onClick={() => onEdit(control)}
                         disabled={isReadOnly}
                         title="Editar (Solo Encargado)"
                       >
                         <EditIcon sx={{ color: '#03a9f4' }} />
                       </IconButton>
                     )}
                    {canDelete && (
                                             <IconButton
                         size="small"
                         color="error"
                         onClick={() => onDelete(control._id)}
                         disabled={isReadOnly || deleteLoading[control._id]}
                         title="Desactivar"
                       >
                                                 {deleteLoading[control._id] ? (
                           <CircularProgress size={16} color="error" />
                         ) : (
                           <BlockIcon sx={{ color: '#f44336' }} />
                         )}
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

             {/* Dialog para mostrar fotos */}
       <Dialog
         open={fotosDialogOpen}
         onClose={handleCloseFotosDialog}
         maxWidth="md"
         fullWidth
       >
         <DialogTitle>
           Fotos del Control de Odómetro
         </DialogTitle>
         <DialogContent>
           <Grid container spacing={2}>
             {selectedFotos.map((foto, index) => (
               <Grid item xs={12} sm={6} md={4} key={index}>
                 <Card sx={{ position: 'relative' }}>
                   <CardMedia
                     component="img"
                     height="200"
                     image={foto}
                     alt={`Foto ${index + 1}`}
                     sx={{ objectFit: 'cover' }}
                   />
                   <Box sx={{ 
                     position: 'absolute', 
                     top: 8, 
                     right: 8, 
                     display: 'flex', 
                     gap: 1 
                   }}>
                     <IconButton
                       size="small"
                       onClick={() => handleMaximizeFoto(foto, index)}
                       sx={{ 
                         bgcolor: 'rgba(0,0,0,0.5)', 
                         color: 'white',
                         '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                       }}
                     >
                       <ZoomInIcon />
                     </IconButton>
                     <IconButton
                       size="small"
                       onClick={() => handleDownloadFoto(foto, index)}
                       sx={{ 
                         bgcolor: 'rgba(0,0,0,0.5)', 
                         color: 'white',
                         '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                       }}
                     >
                       <DownloadIcon />
                     </IconButton>
                   </Box>
                 </Card>
               </Grid>
             ))}
           </Grid>
         </DialogContent>
         <DialogActions>
           <Button onClick={handleCloseFotosDialog}>
             Cerrar
           </Button>
         </DialogActions>
       </Dialog>

       {/* Dialog para maximizar foto */}
       <Dialog
         open={maximizeDialogOpen}
         onClose={handleCloseMaximizeDialog}
         maxWidth="lg"
         fullWidth
       >
         <DialogTitle>
           Foto del Control de Odómetro
         </DialogTitle>
         <DialogContent>
           {selectedFotoIndex !== null && selectedFotos[selectedFotoIndex] && (
             <Box sx={{ textAlign: 'center' }}>
               <img
                 src={selectedFotos[selectedFotoIndex]}
                 alt={`Foto ${selectedFotoIndex + 1}`}
                 style={{
                   maxWidth: '100%',
                   maxHeight: '70vh',
                   objectFit: 'contain'
                 }}
               />
             </Box>
           )}
         </DialogContent>
         <DialogActions>
           <Button onClick={() => handleDownloadFoto(selectedFotos[selectedFotoIndex], selectedFotoIndex)}>
             Descargar
           </Button>
           <Button onClick={handleCloseMaximizeDialog}>
             Cerrar
           </Button>
         </DialogActions>
       </Dialog>
    </>
  );
};

ControlOdometroTable.propTypes = {
  controlesOdometro: PropTypes.array.isRequired,
  maquinariaPlaca: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
  deleteLoading: PropTypes.object,
};

export default ControlOdometroTable;
