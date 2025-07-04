import { useMediaQuery, Box, Drawer } from '@mui/material';
import SidebarItems from './SidebarItems';
import Scrollbar from "../../../components/custom-scroll/Scrollbar";


const Sidebar = (props) => {

  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const sidebarWidth = '270px';



  if (lgUp) {
    return (
      <Box
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
        }}
      >
        {/* ------------------------------------------- */}
        {/* Sidebar for desktop */}
        {/* ------------------------------------------- */}
        <Drawer
          anchor="left"
          open={props.isSidebarOpen}
          variant="permanent"
          PaperProps={{
            sx: {
              width: sidebarWidth,
              boxSizing: 'border-box',
              top: '0px',
              backgroundColor: '#154360',
              color: 'white'
            },
          }}
        >
          {/* ------------------------------------------- */}
          {/* Sidebar Box */}
          {/* ------------------------------------------- */}
          <Scrollbar sx={{ height: "calc(100% - 73px)" }}>
            <Box>
              {/* ------------------------------------------- */}
              {/* Sidebar Items */}
              {/* ------------------------------------------- */}
              <SidebarItems />
            </Box>
          </Scrollbar>
        </Drawer >
      </Box >
    );
  }
  return (
    <Drawer
      anchor="left"
      open={props.isMobileSidebarOpen}
      onClose={props.onSidebarClose}
      variant="temporary"
      PaperProps={{
        sx: {
          boxShadow: (theme) => theme.shadows[8],
          backgroundColor: '#5d6d7e',
          color: 'white',
        },
      }}
    >

      <Scrollbar sx={{ height: "calc(100% - 73px)" }}>
        {/* ------------------------------------------- */}
        {/* Sidebar For Mobile */}
        {/* ------------------------------------------- */}
        <Box color="white">
          <SidebarItems />
        </Box>
      </Scrollbar>
    </Drawer>
  );
};
export default Sidebar;
