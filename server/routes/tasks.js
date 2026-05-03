const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const { authenticateToken, checkProjectMembership } = require('../middleware/auth');
const { validate, createTaskSchema, updateTaskSchema } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// GET /api/tasks/:projectId - Get all tasks for a project
router.get('/:projectId', checkProjectMembership, taskController.getTasks);

// GET /api/tasks/:projectId/stats - Get task statistics for a project
router.get('/:projectId/stats', checkProjectMembership, taskController.getTaskStats);

// POST /api/tasks - Create a new task
router.post('/', validate(createTaskSchema), taskController.createTask);

// PATCH /api/tasks/:id - Update a task
router.patch('/:id', validate(updateTaskSchema), taskController.updateTask);

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
