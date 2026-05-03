const express = require('express');
const router = express.Router();

const teamController = require('../controllers/teamController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/team - Get all team members (accessible to all authenticated users)
router.get('/', teamController.getTeamMembers);

// POST /api/team - Add new team member (Admin only)
router.post('/', requireAdmin, teamController.addTeamMember);

// PUT /api/team/:id - Update member role (Admin only)
router.put('/:id', requireAdmin, teamController.updateTeamMemberRole);

// DELETE /api/team/:id - Remove member (Admin only)
router.delete('/:id', requireAdmin, teamController.removeTeamMember);

module.exports = router;
