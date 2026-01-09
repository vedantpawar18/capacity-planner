import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
} from "@mui/material";
import { formatDDMMYYYY, parseDDMMYYYY } from "../utils/dateUtils";
import { LOCATIONS, ROLE_OPTIONS } from "../constants/dashboardConstants";

export default function MemberDialog({ open, onClose, onSubmit, initial, project }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [pod, setPod] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name || "");
      setRole(
        ROLE_OPTIONS.includes(initial.role) ? initial.role : ROLE_OPTIONS[0]
      );
      setPod(initial.pod || 1);
      setStartDate(
        initial.startDate
          ? parseDDMMYYYY(initial.startDate)?.toISOString().slice(0, 10)
          : project
            ? parseDDMMYYYY(project.startDate)?.toISOString().slice(0, 10)
            : ""
      );
      setEndDate(
        initial.endDate
          ? parseDDMMYYYY(initial.endDate)?.toISOString().slice(0, 10)
          : project
            ? parseDDMMYYYY(project.endDate)?.toISOString().slice(0, 10)
            : ""
      );
      setLocation(initial.location || LOCATIONS[0]);
    } else {
      setName("");
      setRole(ROLE_OPTIONS[0]);
      setPod(1);
      setStartDate(
        project ? parseDDMMYYYY(project.startDate)?.toISOString().slice(0, 10) : ""
      );
      setEndDate(
        project ? parseDDMMYYYY(project.endDate)?.toISOString().slice(0, 10) : ""
      );
      setLocation(LOCATIONS[0]);
    }
  }, [open, initial, project]);

  const handleSubmit = () => {
    if (!name || !startDate) return;
    onSubmit({
      name,
      role,
      startDate: formatDDMMYYYY(startDate),
      endDate: endDate ? formatDDMMYYYY(endDate) : "",
      pod: Number(pod),
      location,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initial ? "Edit member" : "Add member"}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              SelectProps={{ native: true }}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="POD"
              value={pod}
              onChange={(e) => setPod(Number(e.target.value))}
              SelectProps={{ native: true }}
              helperText={
                project
                  ? `Label: ${
                      project.podNames?.[Number(pod)] || `P${pod || ""}`
                    }`
                  : ""
              }
            >
              {project
                ? Array.from({ length: project.podCount || 1 }).map((_, idx) => {
                    const podIndex = idx + 1;
                    const label =
                      project.podNames?.[podIndex] || `P${podIndex}`;
                    return (
                      <option key={podIndex} value={podIndex}>
                        {label}
                      </option>
                    );
                  })
                : [1, 2, 3].map((i) => (
                    <option key={i} value={i}>
                      {`P${i}`}
                    </option>
                  ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              SelectProps={{ native: true }}
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Start date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="End date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              helperText={project ? `Defaults to project end date: ${project.endDate}` : ""}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

