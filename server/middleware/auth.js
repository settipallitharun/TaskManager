const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

// JWT authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const userResult = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Admin role check middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Project membership check middleware
const checkProjectMembership = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  
  try {
    const membershipResult = await query(`
      SELECT pm.*, p.created_by as project_creator
      FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      WHERE pm.project_id = $1 AND pm.user_id = $2
    `, [projectId, req.user.id]);

    const projectResult = await query(
      'SELECT created_by FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Allow access if user is Admin, project creator, or member
    const isAdmin = req.user.role === 'Admin';
    const isCreator = projectResult.rows[0].created_by === req.user.id;
    const isMember = membershipResult.rows.length > 0;

    if (!isAdmin && !isCreator && !isMember) {
      return res.status(403).json({ error: 'Access denied: Not a project member' });
    }

    req.isProjectCreator = isCreator;
    next();
  } catch (error) {
    console.error('Project membership check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  checkProjectMembership
};
