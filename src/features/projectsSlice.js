// src/features/projectsSlice.js
import { createSlice, nanoid } from "@reduxjs/toolkit";
import { transformProjectsFromAPI } from "../utils/dataTransformers";
import { initialProjectsJSON } from "../data/initialProjectsData";

// Transform initial data
const initialProjects = transformProjectsFromAPI(initialProjectsJSON.projects);

const projectsSlice = createSlice({
  name: "projects",
  initialState: {
    projects: initialProjects,
    selectedProjectId: initialProjects[0]?.id || null,
  },
  reducers: {
    selectProject(state, action) {
      state.selectedProjectId = action.payload;
    },
    addProject: {
      reducer(state, action) {
        state.projects.push(action.payload);
      },
      prepare({ name, startDate, endDate, podCount = 3, podNames }) {
        const effectivePodCount = Math.max(1, Number(podCount) || 1);
        const defaultPodNames = {};
        for (let i = 1; i <= effectivePodCount; i++) {
          defaultPodNames[i] = String(i);
        }
        return {
          payload: {
            id: nanoid(),
            name,
            startDate,
            endDate,
            podCount: effectivePodCount,
            podNames: podNames || defaultPodNames,
            members: [],
            leaves: {},
            buffer: 2,
            discount: 0,
          },
        };
      },
    },
    addMember: {
      reducer(state, action) {
        const { projectId, member } = action.payload;
        const project = state.projects.find((p) => p.id === projectId);
        if (project) {
          if (!member.endDate) member.endDate = project.endDate;
          if (!member.location) member.location = "Pune";
          project.members.push(member);
          if (!project.leaves[member.id]) project.leaves[member.id] = {};
        }
      },
      prepare({ projectId, name, role, code, startDate, endDate, pod, location }) {
        return {
          payload: {
            projectId,
            member: {
              id: nanoid(),
              name,
              role,
              code,
              startDate,
              endDate,
              pod,
              location,
            },
          },
        };
      },
    },
    updateMember(state, action) {
      const { projectId, memberId, updates } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return;
      const member = project.members.find((m) => m.id === memberId);
      if (member) {
        Object.assign(member, updates);
        if (!member.endDate) member.endDate = project.endDate;
      }
    },
    updateProject(state, action) {
      const { projectId, updates } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return;

      const previousEndDate = project.endDate;
      Object.assign(project, updates);

      // Ensure pod metadata is sane
      if (!project.podCount || project.podCount < 1) {
        project.podCount = 1;
      }
      if (!project.podNames) {
        const names = {};
        for (let i = 1; i <= project.podCount; i++) names[i] = String(i);
        project.podNames = names;
      }

      // If project end date changed, update all member end dates to match
      if (updates.endDate && updates.endDate !== previousEndDate) {
        project.members.forEach((m) => {
          m.endDate = updates.endDate;
        });
      }
    },
    deleteMember(state, action) {
      const { projectId, memberId } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return;
      project.members = project.members.filter((m) => m.id !== memberId);
      delete project.leaves[memberId];
    },
    setLeaveForMember(state, action) {
      const { projectId, memberId, date, value } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return;
      if (!project.leaves[memberId]) project.leaves[memberId] = {};
      if (value === null || value === "") delete project.leaves[memberId][date];
      else project.leaves[memberId][date] = Number(value);
    },
    bulkAddMembers(state, action) {
      const { projectId, members } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return;
      members.forEach((m) => {
        const mm = {
          id: nanoid(),
          name: m.name,
          role: m.role || "Backend Engineer",
          code: m.code || `EMP-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          startDate: m.startDate || project.startDate,
          endDate: m.endDate || project.endDate,
          pod: Number(m.pod || 1),
          location: m.location || "Pune",
        };
        project.members.push(mm);
        project.leaves[mm.id] = {};
      });
    },
    moveMember(state, action) {
      const { memberId, fromProjectId, toProjectId } = action.payload;
      const fromProject = state.projects.find((p) => p.id === fromProjectId);
      const toProject = state.projects.find((p) => p.id === toProjectId);
      if (!fromProject || !toProject || fromProjectId === toProjectId) return;
      
      const member = fromProject.members.find((m) => m.id === memberId);
      if (!member) return;
      
      // Remove member from source project
      fromProject.members = fromProject.members.filter((m) => m.id !== memberId);
      const memberLeaves = fromProject.leaves[memberId] || {};
      delete fromProject.leaves[memberId];
      
      // Add member to target project
      const updatedMember = { ...member };
      if (!updatedMember.endDate) updatedMember.endDate = toProject.endDate;
      toProject.members.push(updatedMember);
      toProject.leaves[memberId] = memberLeaves;
    },
    replaceAllProjects(state, action) {
      state.projects = action.payload;
      // Select first project if available
      state.selectedProjectId = action.payload.length > 0 ? action.payload[0].id : null;
    },
  },
});

export const {
  selectProject,
  addProject,
  addMember,
  updateMember,
  deleteMember,
  setLeaveForMember,
  bulkAddMembers,
  updateProject,
  moveMember,
  replaceAllProjects,
} = projectsSlice.actions;

export const selectProjectsState = (state) => state.projects;
export const selectSelectedProject = (state) =>
  state.projects.projects.find((p) => p.id === state.projects.selectedProjectId) || null;

export default projectsSlice.reducer;
