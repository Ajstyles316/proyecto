
import { TextField, MenuItem, Box, Button, Typography } from "@mui/material";
import PropTypes from "prop-types";

PaginatedTableControls.propTypes = {
  pageSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  setPageSize: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
  setCurrentPage: PropTypes.func.isRequired,
  dataLength: PropTypes.number.isRequired,
};
const PaginatedTableControls = ({ pageSize, setPageSize, currentPage, setCurrentPage, dataLength }) => {
  const pageSizeOptions = [5, 10, 20, 50, "Todos"];
  const totalPages = pageSize === "Todos" ? 1 : Math.ceil(dataLength / parseInt(pageSize, 10));


  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            select
            label="Mostrar"
            value={pageSize}
            onChange={(e) => {
              setPageSize(e.target.value);
              setCurrentPage(1); // Reiniciar página al cambiar tamaño
            }}
            size="small"
            sx={{ width: 120 }}
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option === "Todos" ? "Todos" : `${option} registros`}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {pageSize !== "Todos" && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}>
          <Button
            variant="outlined"
            color="warning"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Anterior
          </Button>
          <Typography sx={{ alignSelf: "center" }}>
            Página {currentPage}
          </Typography>
          <Button
            variant="outlined"
            color="warning"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Siguiente
          </Button>
        </Box>
      )}
    </>
  );
};