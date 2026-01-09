import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
} from "@mui/material";
import { formatDDMMYYYY, parseDDMMYYYY } from "../utils/dateUtils";

export default function ProjectDialog({ open, onClose, onSubmit, initialProject }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [podCount, setPodCount] = useState(3);
  const [podNames, setPodNames] = useState({});
  const [podNameError, setPodNameError] = useState("");

  useEffect(() => {
    if (!open) {
      setPodNameError("");
      return;
    }
    setPodNameError("");
    if (initialProject) {
      setName(initialProject.name || "");
      setStartDate(
        initialProject.startDate
          ? parseDDMMYYYY(initialProject.startDate)?.toISOString().slice(0, 10)
          : ""
      );
      setEndDate(
        initialProject.endDate
          ? parseDDMMYYYY(initialProject.endDate)?.toISOString().slice(0, 10)
          : ""
      );
      const existingPodCount =
        initialProject.podCount ||
        Math.max(1, ...(initialProject.members || []).map((m) => m.pod || 1));
      setPodCount(existingPodCount);
      const existingNames = initialProject.podNames || {};
      const nextNames = {};
      for (let i = 1; i <= existingPodCount; i++) {
        // Use existing name as-is, or default to just the number without "P" prefix
        nextNames[i] = existingNames[i] || String(i);
      }
      setPodNames(nextNames);
    } else {
      setName("");
      setStartDate("");
      setEndDate("");
      const defaultCount = 3;
      setPodCount(defaultCount);
      const defaults = {};
      for (let i = 1; i <= defaultCount; i++) {
        // Default to just the number without "P" prefix
        defaults[i] = String(i);
      }
      setPodNames(defaults);
    }
  }, [open, initialProject]);

  const handlePodCountChange = (value) => {
    const num = Math.max(1, Number(value) || 1);
    setPodCount(num);
    setPodNames((prev) => {
      const next = { ...prev };
      // trim any higher pods
      Object.keys(next).forEach((k) => {
        const n = Number(k);
        if (n > num) delete next[n];
      });
      // ensure labels up to num - use just the number without "P" prefix
      for (let i = 1; i <= num; i++) {
        if (!next[i]) next[i] = String(i);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (!name || !startDate || !endDate) return;
    
    // Validate that all pod names are not empty
    const trimmedPodNames = {};
    for (let i = 1; i <= podCount; i++) {
      const lbl = (podNames[i] ?? "").toString().trim();
      if (!lbl || lbl === "") {
        // Pod name is empty, validation failed
        setPodNameError(`POD ${i} name is required. Please enter a name for all PODs.`);
        return;
      }
      trimmedPodNames[i] = lbl;
    }
    
    setPodNameError("");
    const startFormatted = formatDDMMYYYY(startDate);
    const endFormatted = formatDDMMYYYY(endDate);
    
    onSubmit({
      name,
      startDate: startFormatted,
      endDate: endFormatted,
      podCount,
      podNames: trimmedPodNames,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialProject ? "Edit project" : "New project"}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Number of PODs"
              type="number"
              inputProps={{ min: 1 }}
              value={podCount}
              onChange={(e) => handlePodCountChange(e.target.value)}
            />
          </Grid>
          {Array.from({ length: podCount }).map((_, idx) => {
            const podIndex = idx + 1;
            return (
              <Grid item xs={12} md={6} key={podIndex}>
                <TextField
                  fullWidth
                  label={`POD ${podIndex} name`}
                  value={podNames[podIndex] ?? ""}
                  onChange={(e) => {
                    setPodNames((prev) => ({
                      ...prev,
                      [podIndex]: e.target.value,
                    }));
                    // Clear error when user starts typing
                    if (podNameError) {
                      setPodNameError("");
                    }
                  }}
                  placeholder={`Enter name for POD ${podIndex}`}
                  required
                  error={!podNames[podIndex] || podNames[podIndex].trim() === ""}
                  helperText={
                    !podNames[podIndex] || podNames[podIndex].trim() === ""
                      ? "Pod name is required"
                      : ""
                  }
                />
              </Grid>
            );
          })}
        </Grid>
        {podNameError && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 2, display: "block" }}
          >
            {podNameError}
          </Typography>
        )}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block" }}
        >
          Dates stored internally as DD/MM/YYYY.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {initialProject ? "Update project" : "Create project"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

