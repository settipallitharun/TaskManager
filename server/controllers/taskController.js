const { query } = require('../database/connection');

// Get all tasks for a project
const getTasks = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    const userRole = req.user.role;

    let tasksQuery;
    let queryParams;

    if (userRole === 'Admin') {
      // Admins can see all tasks in the project
      tasksQuery = `
        SELECT t.*, 
               u.name as assigned_to_name,
               u.email as assigned_to_email
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = $1
        ORDER BY 
          CASE t.priority 
            WHEN 'High' THEN 1 
            WHEN 'Medium' THEN 2 
            WHEN 'Low' THEN 3 
          END,
          t.due_date ASC NULLS LAST,
          t.created_at DESC
      `;
      queryParams = [projectId];
    } else {
      // Members can only see tasks assigned to them or in their projects
      tasksQuery = `
        SELECT t.*, 
               u.name as assigned_to_name,
               u.email as assigned_to_email
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = $1 AND (t.assigned_to = $2 OR t.assigned_to IS NULL)
        ORDER BY 
          CASE t.priority 
            WHEN 'High' THEN 1 
            WHEN 'Medium' THEN 2 
            WHEN 'Low' THEN 3 
          END,
          t.due_date ASC NULLS LAST,
          t.created_at DESC
      `;
      queryParams = [projectId, userId];
    }

    const result = await query(tasksQuery, queryParams);
    
    // Add overdue status to each task
    const tasks = result.rows.map(task => {
      const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';
      return { ...task, is_overdue: isOverdue };
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new task
const createTask = async (req, res) => {
  try {
    const { title, description, priority = 'Medium', assigned_to, project_id, due_date } = req.validatedBody;
    const createdBy = req.user.id;

    // Verify project access
    const projectCheck = await query(
      'SELECT id FROM projects WHERE id = $1',
      [project_id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Create task
    const result = await query(
      'INSERT INTO tasks (title, description, priority, assigned_to, project_id, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, priority, assigned_to, project_id, due_date]
    );

    const task = result.rows[0];

    // Get assigned user info for response
    let assignedUserInfo = null;
    if (assigned_to) {
      const userResult = await query(
        'SELECT name, email FROM users WHERE id = $1',
        [assigned_to]
      );
      if (userResult.rows.length > 0) {
        assignedUserInfo = userResult.rows[0];
      }
    }

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, task_id, project_id, details) VALUES ($1, $2, $3, $4, $5)',
      [createdBy, 'Task Created', task.id, project_id, `Created task: ${task.title}`]
    );

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        ...task,
        assigned_to_name: assignedUserInfo?.name,
        assigned_to_email: assignedUserInfo?.email,
        is_overdue: isOverdue
      }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a task
const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.validatedBody;
    const userId = req.user.id;

    // Check if task exists and user has access
    const taskResult = await query(
      'SELECT t.*, p.created_by as project_creator FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Check permissions: Admin, project creator, or assigned user can update
    const canUpdate = req.user.role === 'Admin' || 
                     task.project_creator === userId || 
                     task.assigned_to === userId;

    if (!canUpdate) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(taskId);

    const updateQuery = `
      UPDATE tasks 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const updatedTask = result.rows[0];

    // Get assigned user info for response
    let assignedUserInfo = null;
    if (updatedTask.assigned_to) {
      const userResult = await query(
        'SELECT name, email FROM users WHERE id = $1',
        [updatedTask.assigned_to]
      );
      if (userResult.rows.length > 0) {
        assignedUserInfo = userResult.rows[0];
      }
    }

    // Log activity
    const changes = Object.keys(updates).map(key => `${key}: ${updates[key]}`).join(', ');
    await query(
      'INSERT INTO activity_logs (user_id, action, task_id, project_id, details) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'Task Updated', taskId, task.project_id, `Updated task ${task.title}: ${changes}`]
    );

    const isOverdue = updatedTask.due_date && new Date(updatedTask.due_date) < new Date() && updatedTask.status !== 'Done';

    res.json({
      message: 'Task updated successfully',
      task: {
        ...updatedTask,
        assigned_to_name: assignedUserInfo?.name,
        assigned_to_email: assignedUserInfo?.email,
        is_overdue: isOverdue
      }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    // Check if task exists and user has access
    const taskResult = await query(
      'SELECT t.*, p.created_by as project_creator FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Check permissions: Admin or project creator can delete
    const canDelete = req.user.role === 'Admin' || task.project_creator === userId;

    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete task
    await query('DELETE FROM tasks WHERE id = $1', [taskId]);

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, project_id, details) VALUES ($1, $2, $3, $4)',
      [userId, 'Task Deleted', task.project_id, `Deleted task: ${task.title}`]
    );

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get task statistics for a project
const getTaskStats = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = 'WHERE project_id = $1';
    let queryParams = [projectId];

    if (userRole !== 'Admin') {
      whereClause += ' AND (assigned_to = $2 OR assigned_to IS NULL)';
      queryParams.push(userId);
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Done' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'Todo' THEN 1 END) as pending,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'Done' THEN 1 END) as overdue,
        COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_priority,
        COUNT(CASE WHEN priority = 'Medium' THEN 1 END) as medium_priority,
        COUNT(CASE WHEN priority = 'Low' THEN 1 END) as low_priority
      FROM tasks 
      ${whereClause}
    `;

    const result = await query(statsQuery, queryParams);
    const stats = result.rows[0];

    res.json({
      stats: {
        total: parseInt(stats.total),
        completed: parseInt(stats.completed),
        in_progress: parseInt(stats.in_progress),
        pending: parseInt(stats.pending),
        overdue: parseInt(stats.overdue),
        high_priority: parseInt(stats.high_priority),
        medium_priority: parseInt(stats.medium_priority),
        low_priority: parseInt(stats.low_priority),
        completion_rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
};
