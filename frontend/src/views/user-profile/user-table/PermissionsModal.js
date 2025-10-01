import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableHead, TableRow, TableCell, TableBody, Switch, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';

const MODULOS = [
  'Maquinaria',
  'Control',
  'ControlOdometro',
  'Asignación',
  'Liberación',
  'Mantenimiento',
  'SOAT',
  'Impuestos',
  'Seguros',
  'Inspección Técnica Vehicular',
  'Depreciaciones',
  'Activos',
  'Pronóstico',
  'Reportes'
];

const PermissionsModal = ({ 
  open, 
  onClose, 
  usuario, 
  permisos, 
  onPermisosChange, 
  onGuardar, 
  isReadOnly, 
  loading 
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Permisos de {usuario?.Nombre || ''}</DialogTitle>
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Módulo</TableCell>
              <TableCell>Habilitar</TableCell>
              <TableCell>Denegar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MODULOS.map((mod, idx) => {
              const value = permisos[mod]?.eliminar
                ? 'denegado'
                : permisos[mod]?.editar
                ? 'editor'
                : '';
              return (
                <TableRow key={mod}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{mod}</TableCell>
                  <TableCell>
                    <Switch
                      checked={value === 'editor'}
                      onChange={e => {
                        if (e.target.checked) {
                          onPermisosChange(mod, { ver: true, editar: true, eliminar: false });
                        } else {
                          // Si se desmarca, poner en estado neutro (solo ver)
                          onPermisosChange(mod, { ver: true, editar: false, eliminar: false });
                        }
                      }}
                      color="primary"
                      disabled={isReadOnly}
                    />
                    Habilitar
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={value === 'denegado'}
                      onChange={e => {
                        if (e.target.checked) {
                          onPermisosChange(mod, { ver: false, editar: false, eliminar: true });
                        } else {
                          // Si se desmarca, poner en estado neutro (solo ver)
                          onPermisosChange(mod, { ver: true, editar: false, eliminar: false });
                        }
                      }}
                      color="error"
                      disabled={isReadOnly}
                    />
                    Denegar
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onGuardar} 
          variant="contained" 
          color="success" 
          disabled={isReadOnly || loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button onClick={onClose} variant="contained" color="error">Salir</Button>
      </DialogActions>
    </Dialog>
  );
};

PermissionsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  usuario: PropTypes.object,
  permisos: PropTypes.object.isRequired,
  onPermisosChange: PropTypes.func.isRequired,
  onGuardar: PropTypes.func.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default PermissionsModal;
