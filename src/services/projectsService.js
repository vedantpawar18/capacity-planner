/**
 * Projects Service
 * Centralized service for all project-related data operations
 * This makes it easy to swap local storage/state with API calls later
 */

import { transformProjectsFromAPI, transformProjectToAPI, transformMemberToAPI } from '../utils/dataTransformers';
import { nanoid } from '@reduxjs/toolkit';

/**
 * Get all projects
 * TODO: Replace with actual API call: return api.projects.getAll()
 */
export const getProjects = async () => {
  // Currently returns null - data is managed in Redux slice
  // When integrating API, uncomment:
  // const response = await api.projects.getAll();
  // return transformProjectsFromAPI(response);
  return null;
};

/**
 * Get project by ID
 * TODO: Replace with actual API call
 */
export const getProjectById = async (id) => {
  // return api.projects.getById(id);
  return null;
};

/**
 * Create a new project
 * TODO: Replace with actual API call
 */
export const createProject = async (projectData) => {
  // const apiData = transformProjectToAPI(projectData);
  // return await api.projects.create(apiData);
  return projectData;
};

/**
 * Update an existing project
 * TODO: Replace with actual API call
 */
export const updateProject = async (projectId, updates) => {
  // const apiData = transformProjectToAPI(updates);
  // return await api.projects.update(projectId, apiData);
  return { projectId, updates };
};

/**
 * Delete a project
 * TODO: Replace with actual API call
 */
export const deleteProject = async (projectId) => {
  // return await api.projects.delete(projectId);
  return projectId;
};

/**
 * Add a member to a project
 * TODO: Replace with actual API call
 */
export const addMember = async (projectId, memberData) => {
  // const apiData = transformMemberToAPI(memberData);
  // return await api.members.create(projectId, apiData);
  return { projectId, member: { ...memberData, id: memberData.id || nanoid() } };
};

/**
 * Update a member
 * TODO: Replace with actual API call
 */
export const updateMember = async (projectId, memberId, updates) => {
  // const apiData = transformMemberToAPI(updates);
  // return await api.members.update(projectId, memberId, apiData);
  return { projectId, memberId, updates };
};

/**
 * Delete a member
 * TODO: Replace with actual API call
 */
export const deleteMember = async (projectId, memberId) => {
  // return await api.members.delete(projectId, memberId);
  return { projectId, memberId };
};

/**
 * Bulk add members to a project
 * TODO: Replace with actual API call
 */
export const bulkAddMembers = async (projectId, members) => {
  // const apiData = members.map(transformMemberToAPI);
  // return await api.members.bulkCreate(projectId, apiData);
  return { projectId, members };
};

/**
 * Move a member from one project to another
 * TODO: Replace with actual API call
 */
export const moveMember = async (memberId, fromProjectId, toProjectId) => {
  // This might require a special endpoint or multiple API calls
  // return await api.members.move(memberId, fromProjectId, toProjectId);
  return { memberId, fromProjectId, toProjectId };
};

/**
 * Set leave for a member
 * TODO: Replace with actual API call
 */
export const setLeaveForMember = async (projectId, memberId, date, value) => {
  // return await api.leaves.setLeave(projectId, memberId, date, value);
  return { projectId, memberId, date, value };
};

/**
 * Get all leaves for a member
 * TODO: Replace with actual API call
 */
export const getLeavesForMember = async (projectId, memberId) => {
  // return await api.leaves.getByMember(projectId, memberId);
  return null;
};

/**
 * Replace all projects (useful for bulk updates or imports)
 * TODO: Replace with actual API call
 */
export const replaceAllProjects = async (projects) => {
  // This might be a bulk update endpoint
  // return await api.projects.bulkUpdate(projects.map(transformProjectToAPI));
  return projects;
};
