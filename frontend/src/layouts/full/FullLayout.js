import React, { useState } from "react";
import { styled, Container, Box, useMediaQuery } from '@mui/material';



import Header from './header/Header';
import Sidebar from './sidebar/Sidebar';
import { Outlet } from "react-router";
import Topbar from "./header/Topbar";

const MainWrapper = styled('div')(() => ({
  display: 'flex',
  width: '100%',
  backgroundColor: '#d7dbdd',
  minHeight: '100vh',
}));

const PageWrapper = styled('div')(() => ({
  display: 'flex',
  flexGrow: 1,
  flexDirection: 'column',
  zIndex: 1,
  backgroundColor: 'transparent',
}));

const FullLayout = () => {

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const isTablet = useMediaQuery((theme) => theme.breakpoints.between('md', 'lg'));

  // Ajustar sidebar automáticamente en móviles
  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  return (
    <>
      {/* ------------------------------------------- */}
      {/* Topbar */}
      {/* ------------------------------------------- */}
      
      <MainWrapper
        className='mainwrapper'
      >

        {/* ------------------------------------------- */}
        {/* Sidebar */}
        {/* ------------------------------------------- */}
        <Sidebar isSidebarOpen={isSidebarOpen}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onSidebarClose={() => setMobileSidebarOpen(false)} />


        {/* ------------------------------------------- */}
        {/* Main Wrapper */}
        {/* ------------------------------------------- */}
        <PageWrapper
          className="page-wrapper"
        >
          {/* ------------------------------------------- */}
          {/* Header */}
          {/* ------------------------------------------- */}
          <Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} toggleMobileSidebar={() => setMobileSidebarOpen(true)} />
          {/* ------------------------------------------- */}
          {/* PageContent */}
          {/* ------------------------------------------- */}
          <Container sx={{
            paddingTop: { xs: "10px", sm: "15px", md: "20px" },
            paddingBottom: { xs: "10px", sm: "15px", md: "20px" },
            maxWidth: '1200px',
            px: { xs: 1, sm: 2, md: 3 },
          }}
          >
            {/* ------------------------------------------- */}
            {/* Page Route */}
            {/* ------------------------------------------- */}
            <Box sx={{ 
              minHeight: { xs: 'calc(100vh - 140px)', sm: 'calc(100vh - 160px)', md: 'calc(100vh - 170px)' },
              width: '100%',
            }}>
              <Outlet />
            </Box>
            {/* ------------------------------------------- */}
            {/* End Page */}
            {/* ------------------------------------------- */}
          </Container>
        </PageWrapper>
      </MainWrapper>
    </>
  );
};

export default FullLayout;
