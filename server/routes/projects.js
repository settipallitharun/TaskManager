const express = require('express');
const router = express.Router();

const projectController = require('../controllers/projectController');
const { authenticateToken, requireAdmin, checkProjectMembership } = require('../middleware/auth');
const { validate, createProjectSchema, addMemberSchema } = require('../middleware/validation');

// Validation schema for project updates
const updateProjectSchema = require('../middleware/validation').createProjectSchema;

// All routes require authentication
router.use(authenticateToken);

// GET /api/projects - Get all projects for current user
router.get('/', projectController.getProjects);

// POST /api/projects - Create new project (Admin only)
router.post('/', requireAdmin, validate(createProjectSchema), projectController.createProject);

// GET /api/projects/:id - Get project details
router.get('/:id', checkProjectMembership, projectController.getProject);

// PATCH /api/projects/:id - Update project (Admin or project creator only)
router.patch('/:id', checkProjectMembership, validate(updateProjectSchema), projectController.updateProject);

// DELETE /api/projects/:id - Delete project (Admin or project creator only)
router.delete('/:id', checkProjectMembership, projectController.deleteProject);

// GET /api/projects/:id/available-users - Get available users to add (Admin only)
router.get('/:id/available-users', requireAdmin, checkProjectMembership, projectController.getAvailableUsers);

// POST /api/projects/:id/members - Add member to project (Admin only)
router.post('/:id/members', requireAdmin, checkProjectMembership, validate(addMemberSchema), projectController.addMember);

// DELETE /api/projects/:id/members/:memberId - Remove member from project (Admin only)
router.delete('/:id/members/:memberId', requireAdmin, checkProjectMembership, projectController.removeMember);

module.exports = router;
