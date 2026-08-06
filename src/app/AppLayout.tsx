import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import CodeIcon from "@mui/icons-material/Code";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

import { NavLink, Outlet, useLocation } from "react-router";

const drawerWidth = 240;

const navigationItems = [
  {
    label: "Base64",
    path: "/base64",
    icon: <CodeIcon />,
  },
  {
    label: "JSONPath",
    path: "/jsonpath",
    icon: <AccountTreeIcon />,
  },
];

function AppLayout() {
  const location = useLocation();

  return (
    <Box
      sx={{
        display: "flex",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" noWrap>
            Dev Tools
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRightColor: "divider",
          },
        }}
      >
        <Toolbar />

        <List sx={{ padding: 1 }}>
          {navigationItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                marginBottom: 0.5,
                borderRadius: 1,
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>

              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          height: "100dvh",
          padding: 3,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Toolbar sx={{ flexShrink: 0 }} />

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default AppLayout;
