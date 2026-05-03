const { query } = require('../database/connection');

// Get all projects for the current user
const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let projectsQuery;
    let queryParams;

    if (userRole === 'Admin') {
      // Admins can see all projects
      projectsQuery = `
        SELECT p.*, u.name as creator_name,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
      `;
      queryParams = [];
    } else {
      // Members can only see projects they're members of or created
      projectsQuery = `
        SELECT DISTINCT p.*, u.name as creator_name,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.created_by = $1 OR pm.user_id = $1
        ORDER BY p.created_at DESC
      `;
      queryParams = [userId];
    }

    const result = await query(projectsQuery, queryParams);
    res.json({ projects: result.rows });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new project (Admin only)
const createProject = async (req, res) => {
  try {
    const { title, description } = req.validatedBody;
    const createdBy = req.user.id;

    const result = await query(
      'INSERT INTO projects (title, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [title, description, createdBy]
    );

    const project = result.rows[0];

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, project_id, details) VALUES ($1, $2, $3, $4)',
      [createdBy, 'Project Created', project.id, `Created project: ${project.title}`]
    );

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get project details with members
const getProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    // Get project details
    const projectResult = await query(`
      SELECT p.*, u.name as creator_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [projectId]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Get project members
    const membersResult = await query(`
      SELECT u.id, u.name, u.email, u.role, pm.created_at as joined_at
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.created_at ASC
    `, [projectId]);

    res.json({
      project,
      members: membersResult.rows
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add member to project (Admin only)
const addMember = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { userId } = req.validatedBody;

    // Check if user exists
    const userResult = await query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    // Add member
    const result = await query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) RETURNING *',
      [projectId, userId]
    );

    const user = userResult.rows[0];

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, project_id, details) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'Member Added', projectId, `Added ${user.name} to project`]
    );

    res.status(201).json({
      message: 'Member added successfully',
      member: {
        id: user.id,
        name: user.name,
        email: user.email,
        joined_at: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove member from project (Admin only)
const removeMember = async (req, res) => {
  try {
    const projectId = req.params.id;
    const memberId = req.params.memberId;

    // Check if member exists
    const memberResult = await query(
      'SELECT pm.*, u.name FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = $1 AND pm.user_id = $2',
      [projectId, memberId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberResult.rows[0];

    // Remove member
    await query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, memberId]
    );

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, project_id, details) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'Member Removed', projectId, `Removed ${member.name} from project`]
    );

    res.json({
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get available users to add to project (Admin only)
const getAvailableUsers = async (req, res) => {
  try {
    const projectId = req.params.id;

    const result = await query(`
      SELECT u.id, u.name, u.email, u.role
      FROM users u
      WHERE u.id NOT IN (
        SELECT pm.user_id 
        FROM project_members pm 
        WHERE pm.project_id = $1
      )
      ORDER BY u.name ASC
    `, [projectId]);

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get available users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update project (Admin or project creator only)
const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, description } = req.validatedBody;
    const userId = req.user.id;

    // Check if project exists and user has permission
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Check permissions: Admin or project creator can update
    const canUpdate = req.user.role === 'Admin' || project.created_by === userId;

    if (!canUpdate) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update project
    const result = await query(
      'UPDATE projects SET title = $1, description = $2 WHERE id = $3 RETURNING *',
      [title, description, projectId]
    );

    const updatedProject = result.rows[0];

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, project_id, details) VALUES ($1, $2, $3, $4)',
      [userId, 'Project Updated', projectId, `Updated project: ${updatedProject.title}`]
    );

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete project (Admin or project creator only)
const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    // Check if project exists and user has permission
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Check permissions: Admin or project creator can delete
    const canDelete = req.user.role === 'Admin' || project.created_by === userId;

    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete project (cascading will delete related tasks, members, etc.)
    await query('DELETE FROM projects WHERE id = $1', [projectId]);

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'Project Deleted', `Deleted project: ${project.title}`]
    );

    res.json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getAvailableUsers
};
