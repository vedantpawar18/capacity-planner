// src/pages/LoginPage.js
import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Alert,
  FormControlLabel,
  Checkbox,
  Link,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useDispatch, useSelector } from "react-redux";
import { login, clearError } from "../features/authSlice";
import { useNavigate, useLocation } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const error = useSelector((s) => s.auth.error);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(login({ email, password }));
    // simple redirect – credentials are demo / hardcoded
    navigate(from, { replace: true });
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          maxWidth: 960,
          width: "100%",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          mx: "auto",
          px: { xs: 1, sm: 0 },
          my: { xs: 1, sm: 3 },
        }}
      >
        {/* Left: branding (hidden background-heavy on small) */}
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            p: { xs: 2.5, sm: 4 },
            borderRadius: { xs: 3, md: 3 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            minHeight: { xs: "auto", md: 420 },
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Sign in to your workspace
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Track project allocations and leaves in one place with a clean,
            responsive dashboard.
          </Typography>

          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ opacity: 0.9 }}>
              Demo credentials
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.16)",
                fontSize: 13,
              }}
            >
              <div>
                <b>Email:</b> admin@example.com
              </div>
              <div>
                <b>Password:</b> password123
              </div>
            </Box>
          </Box>
        </Paper>

        {/* Right: actual form */}
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            p: { xs: 2.5, sm: 4 },
            borderRadius: { xs: 3, md: 3 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: { xs: "auto", md: 420 },
          }}
        >
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Welcome back 👋
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Use your organization email to sign in.
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mt: 2, mb: 1 }}
              onClose={() => dispatch(clearError())}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                mt: 1,
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Remember me
                  </Typography>
                }
              />
              {!isSmall && (
                <Link component="button" variant="body2" underline="hover">
                  Forgot password?
                </Link>
              )}
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 1.5, py: 1.3, borderRadius: 2, textTransform: "none" }}
            >
              Sign in
            </Button>

            <Divider sx={{ my: 3 }} />

            <Typography variant="caption" color="text.secondary">
              By signing in, you agree to the internal usage policy of your
              organization.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
