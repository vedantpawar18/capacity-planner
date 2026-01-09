// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LeavesPage from "./pages/LeavesPage";
import HolidaysPage from "./pages/HolidaysPage";
import RequireAuth from "./components/RequireAuth";
import { logout } from "./features/authSlice";
import ProjectionsPage from "./pages/ProjectionsPage";

function AppLayout({ children }) {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const user = useSelector((s) => s.auth.user);
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: (t) =>
          t.palette.mode === "light" ? "#f3f4f6" : "background.default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar
        position="sticky"
        elevation={3}
        sx={{
          backgroundColor: theme.palette.primary.main,
        }}
      >
        <Toolbar
          sx={{
            maxWidth: 1240,
            width: "100%",
            mx: "auto",
            px: { xs: 1.5, sm: 2 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "10px",
                bgcolor: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DashboardCustomizeIcon fontSize="small" />
            </Box>
            <Box sx={{ overflow: "hidden" }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, lineHeight: 1.1 }}
                noWrap
              >
                Project Planner
              </Typography>
              <Typography
                variant="caption"
                sx={{ opacity: 0.85, display: "block" }}
                noWrap
              >
                Internal workforce allocation dashboard
              </Typography>
            </Box>
          </Box>

          {isAuthenticated && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                ml: 2,
              }}
            >
              <Box
                sx={{
                  textAlign: "right",
                  display: { xs: "none", sm: "block" },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                  {user?.email}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  Admin
                </Typography>
              </Box>
              <IconButton
                color="inherit"
                onClick={() => dispatch(logout())}
                size="small"
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: 1240,
          mx: "auto",
          px: { xs: 1.5, sm: 2 },
          py: { xs: 2, sm: 3 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AppLayout>
            <LoginPage />
          </AppLayout>
        }
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/leaves"
        element={
          <RequireAuth>
            <AppLayout>
              <LeavesPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/holidays"
        element={
          <RequireAuth>
            <AppLayout>
              <HolidaysPage />
            </AppLayout>
          </RequireAuth>
        }
      />

      {/* optional projections placeholder */}
      <Route
        path="/projections"
        element={
          <RequireAuth>
            <AppLayout>
        <ProjectionsPage />
      </AppLayout>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
