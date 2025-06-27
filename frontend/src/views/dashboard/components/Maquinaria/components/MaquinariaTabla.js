import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination
} from '@mui/material';
import PropTypes from 'prop-types';

const MaquinariaTabla = ({
  maquinarias,
  pageSize,
  currentPage,
  setCurrentPage,
  loading,
  handleDetailsClick,
}) => {
  const totalPages = pageSize === "Todos" ? 1 : Math.ceil(maquinarias.length / parseInt(pageSize, 10));
  const getDisplayedData = () => {
    if (!Array.isArray(maquinarias)) return [];
    if (pageSize === "Todos") return maquinarias;
    const start = (currentPage - 1) * parseInt(pageSize, 10);
    return maquinarias.slice(start, start + parseInt(pageSize, 10));
  };

  return (
    <>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : maquinarias.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="textSecondary">
            No hay registros disponibles
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Gestión</TableCell>
                  <TableCell>Placa</TableCell>
                  <TableCell>Detalle</TableCell>
                  <TableCell>Unidad</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Marca</TableCell>
                  <TableCell>Modelo</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getDisplayedData().map((m) => {
                  const id = m._id?.$oid || m._id || m.id;
                  const cleanId = id?.toString().replace(/[^a-zA-Z0-9]/g, '');
                  return (
                    <TableRow key={cleanId}>
                      <TableCell>{m.gestion}</TableCell>
                      <TableCell>{m.placa}</TableCell>
                      <TableCell>{m.detalle}</TableCell>
                      <TableCell>{m.unidad}</TableCell>
                      <TableCell>{m.codigo}</TableCell>
                      <TableCell>{m.marca}</TableCell>
                      <TableCell>{m.modelo}</TableCell>
                      <TableCell>{m.color}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleDetailsClick(cleanId)}
                        >
                          Historial
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {maquinarias.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                disabled={pageSize === "Todos"}
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </>
  );
};

MaquinariaTabla.propTypes = {
  maquinarias: PropTypes.array.isRequired,
  pageSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setPageSize: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
  setCurrentPage: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  handleDetailsClick: PropTypes.func.isRequired,
  setNewMaquinariaModalOpen: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  unidadFilter: PropTypes.string.isRequired,
  setUnidadFilter: PropTypes.func.isRequired,
};

export default MaquinariaTabla;
