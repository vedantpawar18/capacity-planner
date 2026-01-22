/**
 * Custom hook for project operations
 * Provides a clean interface for components to interact with projects
 */

import { useSelector, useDispatch } from 'react-redux';
import {
  selectProjectsState,
  selectSelectedProject,
  selectProject,
  addProject as addProjectAction,
  updateProject as updateProjectAction,
  addMember as addMemberAction,
  updateMember as updateMemberAction,
  deleteMember as deleteMemberAction,
  bulkAddMembers as bulkAddMembersAction,
  moveMember as moveMemberAction,
  setLeaveForMember as setLeaveForMemberAction,
  replaceAllProjects as replaceAllProjectsAction,
} from '../features/projectsSlice';
import * as projectsService from '../services/projectsService';

/**
 * Hook for managing projects
 */
export const useProjects = () => {
  const dispatch = useDispatch();
  const { projects, selectedProjectId } = useSelector(selectProjectsState);
  const selectedProject = useSelector(selectSelectedProject);

  const selectProjectById = (projectId) => {
    dispatch(selectProject(projectId));
  };

  const createProject = async (projectData) => {
    const result = await projectsService.createProject(projectData);
    dispatch(addProjectAction(result));
    return result;
  };

  const updateProjectById = async (projectId, updates) => {
    await projectsService.updateProject(projectId, updates);
    dispatch(updateProjectAction({ projectId, updates }));
  };

  const addMemberToProject = async (projectId, memberData) => {
    const result = await projectsService.addMember(projectId, memberData);
    dispatch(addMemberAction({ projectId, ...result.member }));
  };

  const updateMemberInProject = async (projectId, memberId, updates) => {
    await projectsService.updateMember(projectId, memberId, updates);
    dispatch(updateMemberAction({ projectId, memberId, updates }));
  };

  const removeMemberFromProject = async (projectId, memberId) => {
    await projectsService.deleteMember(projectId, memberId);
    dispatch(deleteMemberAction({ projectId, memberId }));
  };

  const bulkAddMembersToProject = async (projectId, members) => {
    const result = await projectsService.bulkAddMembers(projectId, members);
    dispatch(bulkAddMembersAction({ projectId, members: result.members }));
  };

  const moveMemberBetweenProjects = async (memberId, fromProjectId, toProjectId) => {
    await projectsService.moveMember(memberId, fromProjectId, toProjectId);
    dispatch(moveMemberAction({ memberId, fromProjectId, toProjectId }));
  };

  const setMemberLeave = async (projectId, memberId, date, value) => {
    await projectsService.setLeaveForMember(projectId, memberId, date, value);
    dispatch(setLeaveForMemberAction({ projectId, memberId, date, value }));
  };

  const replaceProjects = async (newProjects) => {
    await projectsService.replaceAllProjects(newProjects);
    dispatch(replaceAllProjectsAction(newProjects));
  };

  return {
    projects,
    selectedProject,
    selectedProjectId,
    selectProject: selectProjectById,
    createProject,
    updateProject: updateProjectById,
    addMember: addMemberToProject,
    updateMember: updateMemberInProject,
    deleteMember: removeMemberFromProject,
    bulkAddMembers: bulkAddMembersToProject,
    moveMember: moveMemberBetweenProjects,
    setLeaveForMember: setMemberLeave,
    replaceAllProjects: replaceProjects,
  };
};
