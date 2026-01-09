import React from "react";
import { Stack, Chip } from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";

export default function ProjectInfoChips({
  displayedMembers,
  projects,
  showAllProjects,
  selectedProjects,
  isSingleProjectSelected,
  selectedProject,
}) {
  return (
    <>
      {displayedMembers.length > 0 && (
        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" rowGap={0.5}>
          <Chip
            size="small"
            label={`Members: ${displayedMembers.length}`}
            icon={<PeopleAltIcon fontSize="small" />}
            variant="outlined"
          />
          {showAllProjects && (
            <Chip size="small" label={`Projects: ${projects.length}`} variant="outlined" />
          )}
          {!showAllProjects && selectedProjects.size > 0 && (
            <Chip
              size="small"
              label={`Projects: ${selectedProjects.size}`}
              variant="outlined"
            />
          )}
        </Stack>
      )}

      {/* Show start date and end date when single project is selected */}
      {isSingleProjectSelected && selectedProject && (
        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" rowGap={0.5}>
          {selectedProject.startDate && (
            <Chip
              size="small"
              label={`Start: ${selectedProject.startDate}`}
              variant="outlined"
              color="primary"
            />
          )}
          {selectedProject.endDate && (
            <Chip
              size="small"
              label={`End: ${selectedProject.endDate}`}
              variant="outlined"
              color="primary"
            />
          )}
        </Stack>
      )}
    </>
  );
}

