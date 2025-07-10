import React from "react";
import { useLocation, NavLink } from 'react-router';
import { Box, Typography } from "@mui/material";
import {
  Logo,
  Sidebar as MUI_Sidebar,
  Menu,
  MenuItem,
  Submenu,
} from "react-mui-sidebar";
import { IconPoint } from '@tabler/icons-react';
import { getMenuItems } from "./MenuItems";
import logo from '../../../assets/images/logos/logo_cofadena_white.png';
import './SidebarItems.css'
import { useUser } from '../../../components/UserContext';

const renderMenuItems = (items, pathDirect) => {


  return items.map((item) => {


    const Icon = item.icon ? item.icon : IconPoint;
    const itemIcon = <Icon stroke={1.5} size="1.3rem" color="white"/>;

    if (item.subheader) {
      // Display Subheader

      return (
        <Box sx={{ margin: "0 -24px", textTransform: 'uppercase' }} key={item.subheader}>
          <Menu
            subHeading={<Typography color="white">{item.subheader}</Typography>}
            key={item.subheader}

          />
        </Box>
      );
    }

    //If the item has children (submenu)
    if (item.children) {
      return (
        <Submenu
          key={item.id}
          title={<Typography color="white">{item.title}</Typography>}
          icon={itemIcon}
          sx={{ color: 'white' }}
        >
          {renderMenuItems(item.children, pathDirect)}
        </Submenu>
      );
    }

    // If the item has no children, render a MenuItem

    return (
      <MenuItem
        key={item.id}
        isSelected={pathDirect === item?.href}
        icon={itemIcon}
        component={NavLink}
        link={item.href ? item.href : "#"}
        target={item.href && item.href.startsWith("https") ? "_blank" : "_self"}
        badge={!!item.chip} 
        badgeContent={item.chip || ""}
        badgeColor='secondary'
        badgeTextColor="#1a97f5"
        disabled={item.disabled}
        borderRadius='9px'
        sx={{ color: 'white' }}
      >
        <Typography color="white">{item.title}</Typography>
      </MenuItem>


    );
  });
};

const SidebarItems = () => {
  const location = useLocation();
  const pathDirect = location.pathname;
  const { user } = useUser();
  const menuItems = getMenuItems(user);

  return (
    <Box sx={{ px: "24px", overflowX: 'hidden' }}>
      <MUI_Sidebar width={"100%"} showProfile={false} themeColor={"#1e4db7"} themeSecondaryColor={'#1a97f51a'} textColor="white">
        <Box sx={{
          margin: "0 -24px",
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 80,
          py: 0,
          mb: 1
        }}>
          <Logo img={logo} component={NavLink} to="/" className="logo-img" style={{ maxWidth: 80, maxHeight: 50, objectFit: 'contain', display: 'block', margin: '0 auto' }}>Activos Fijos</Logo>
        </Box>
        <Box sx={{ color: 'inherit' }}>
          {renderMenuItems(menuItems, pathDirect)}
        </Box>
      </MUI_Sidebar>
    </Box>
  );
};

export default SidebarItems;

