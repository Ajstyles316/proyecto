import {
  Box, Typography, Button, TextField, MenuItem, CircularProgress, Snackbar, Alert
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import useMaquinariaLogic from "./hooks/useMaquinariaLogic";
import NuevoModalMaquinaria from "./components/NuevoModalMaquinaria";
import MaquinariaTabla from "./components/MaquinariaTabla";
import MaquinariaDetalle from "./components/MaquinariaDetalle";

const Maquinaria = () => {
  const {
    maquinarias,
    pageSize,
    setPageSize,
    currentPage,
    unidadesUnicas,
    setCurrentPage,
    loading,
    newMaquinariaModalOpen,
    setNewMaquinariaModalOpen,
    newMaquinariaForm,
    setNewMaquinariaForm,
    newMaquinariaErrors,
    setNewMaquinariaErrors,
    handleNewMaquinariaSubmit,
    handleDetailsClick,
    handleFileChange,
    searchQuery,
    setSearchQuery,
    unidadFilter,
    setUnidadFilter,
    snackbar,
    setSnackbar,
    detailView,
    setDetailView,
    sectionForm,
    setSectionForm,
    activeSection,
    setActiveSection,
    handleUpdateMaquinaria,
    handleDeleteMaquinaria,
    selectedImage
  } = useMaquinariaLogic();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {detailView ? (
        <MaquinariaDetalle
    sectionForm={sectionForm}
    setSectionForm={setSectionForm}
    activeSection={activeSection}
    setActiveSection={setActiveSection}
    setDetailView={setDetailView}
    handleUpdateMaquinaria={handleUpdateMaquinaria}
    handleDeleteMaquinaria={handleDeleteMaquinaria}
    selectedImage={selectedImage}
    newMaquinariaErrors={newMaquinariaErrors}
    setNewMaquinariaErrors={setNewMaquinariaErrors}
    handleFileChange={handleFileChange}
  />
      ) : (
        <>
          {/* Encabezado con filtros */}
          <Box sx={{
            display: "flex",
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            gap: 2
          }}>
            <Typography variant="h5">Maquinaria</Typography>

            <Box sx={{ display: "flex", flexWrap: 'wrap', gap: 2 }}>
              <TextField
                label="Buscar"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ minWidth: 250 }}
                color="black"
              />
              <TextField
                select
                label="Filtrar por unidad"
                value={unidadFilter}
                onChange={(e) => setUnidadFilter(e.target.value)}
                size="small"
                sx={{ minWidth: 250 }}
              >
                <MenuItem value="">Todas</MenuItem>
                 {unidadesUnicas.map((unidad) => (
                  <MenuItem key={unidad} value={unidad}>
                   {unidad}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Mostrar"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value);
                  setCurrentPage(1);
                }}
                size="small"
                sx={{ width: 180 }}
                color="black"
              >
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value={5}>5 registros</MenuItem>
                <MenuItem value={10}>10 registros</MenuItem>
                <MenuItem value={20}>20 registros</MenuItem>
                <MenuItem value={50}>50 registros</MenuItem>
                <MenuItem value={100}>100 registros</MenuItem>
              </TextField>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => setNewMaquinariaModalOpen(true)}
              >
                Nuevo
              </Button>
            </Box>
          </Box>

          {/* Tabla o loading */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <MaquinariaTabla
    maquinarias={maquinarias}
    pageSize={pageSize}
    setPageSize={setPageSize}
    currentPage={currentPage}
    setCurrentPage={setCurrentPage}
    handleDetailsClick={handleDetailsClick}
    setNewMaquinariaModalOpen={setNewMaquinariaModalOpen}
    searchQuery={searchQuery}
    setSearchQuery={setSearchQuery}
    unidadFilter={unidadFilter}
    setUnidadFilter={setUnidadFilter}
    loading={loading}
  />
          )}
        </>
      )}

      {/* Modal */}
      <NuevoModalMaquinaria
        open={newMaquinariaModalOpen}
        onClose={() => setNewMaquinariaModalOpen(false)}
        newMaquinariaForm={newMaquinariaForm}
        setNewMaquinariaForm={setNewMaquinariaForm}
        newMaquinariaErrors={newMaquinariaErrors}
        setNewMaquinariaErrors={setNewMaquinariaErrors}
        handleNewMaquinariaSubmit={handleNewMaquinariaSubmit}
        handleFileChange={handleFileChange}
      />
    </Box>
  );
};

export default Maquinaria;
