import React from "react";
import { Box, Stack, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PublicIcon from "@mui/icons-material/Public";
import InsightsIcon from "@mui/icons-material/Insights";
import { selectProject } from "../features/projectsSlice";

export default function DashboardActionButtons({
  isSm,
  isSingleProjectSelected,
  selectedProject,
  onAddMember,
  onImportMembers,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleNavigateToLeaves = () => {
    if (selectedProject) {
      dispatch(selectProject(selectedProject.id));
    }
    navigate("/leaves");
  };

  const handleNavigateToProjections = () => {
    if (selectedProject) {
      dispatch(selectProject(selectedProject.id));
    }
    navigate("/projections");
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        justifyContent: { xs: "flex-start", md: "flex-end" },
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {/* Group A: Primary actions (vertical) */}
      <Stack spacing={1} sx={{ minWidth: isSm ? "100%" : 160 }}>
        <Button
          variant="contained"
          fullWidth={!isSm}
          disabled={!isSingleProjectSelected}
          onClick={handleNavigateToLeaves}
          sx={{ textTransform: "none" }}
        >
          Capacity planner
        </Button>
        <Button
          variant="outlined"
          fullWidth={!isSm}
          startIcon={<InsightsIcon />}
          disabled={!isSingleProjectSelected}
          onClick={handleNavigateToProjections}
          sx={{ textTransform: "none" }}
        >
          Projections
        </Button>
        <Button
          variant="outlined"
          fullWidth={!isSm}
          startIcon={<PublicIcon />}
          disabled={!selectedProject}
          onClick={() => navigate("/holidays")}
          sx={{ textTransform: "none" }}
        >
          Holidays
        </Button>
      </Stack>

      {/* Group B: Member actions (vertical) */}
      <Stack spacing={1} sx={{ minWidth: isSm ? "100%" : 160 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          fullWidth={!isSm}
          disabled={!isSingleProjectSelected}
          onClick={onAddMember}
          sx={{ textTransform: "none" }}
        >
          Add member
        </Button>
        <Button
          variant="text"
          startIcon={<CloudUploadIcon />}
          fullWidth={!isSm}
          disabled={!isSingleProjectSelected}
          onClick={onImportMembers}
          sx={{ textTransform: "none" }}
        >
          Import members
        </Button>
      </Stack>
    </Box>
  );
}

