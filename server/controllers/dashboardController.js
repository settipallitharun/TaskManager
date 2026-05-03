const { query } = require('../database/connection');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let projectWhereClause = '';
    let taskWhereClause = '';
    let projectParams = [];
    let taskParams = [];

    if (userRole !== 'Admin') {
      projectWhereClause = 'WHERE created_by = $1 OR id IN (SELECT project_id FROM project_members WHERE user_id = $1)';
      taskWhereClause = 'WHERE (t.assigned_to = $1 OR t.assigned_to IS NULL) AND (p.created_by = $1 OR pm.user_id = $1)';
      projectParams = [userId];
      taskParams = [userId];
    }

    // Get project statistics
    const projectStatsQuery = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_projects
      FROM projects 
      ${projectWhereClause}
    `;

    // Get task statistics
    const taskStatsQuery = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN t.status = 'Done' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.status = 'In Progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN t.status = 'Todo' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'Done' THEN 1 END) as overdue_tasks,
        COUNT(CASE WHEN t.priority = 'High' AND t.status != 'Done' THEN 1 END) as high_priority_tasks
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      ${taskWhereClause}
    `;

    // Get recent activity
    const activityQuery = `
      SELECT 
        al.action,
        al.details,
        al.created_at,
        u.name as user_name,
        p.title as project_title,
        t.title as task_title
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      LEFT JOIN projects p ON al.project_id = p.id
      LEFT JOIN tasks t ON al.task_id = t.id
      ${userRole !== 'Admin' ? 'WHERE al.user_id = $1' : ''}
      ORDER BY al.created_at DESC
      LIMIT 10
    `;
    const activityParams = userRole !== 'Admin' ? [userId] : [];

    // Get upcoming deadlines
    const deadlinesQuery = userRole !== 'Admin'
      ? `SELECT t.id, t.title, t.due_date, t.priority, t.status,
              p.title as project_title, u.name as assigned_to_name
         FROM tasks t
         JOIN projects p ON t.project_id = p.id
         LEFT JOIN users u ON t.assigned_to = u.id
         JOIN project_members pm ON p.id = pm.project_id
         WHERE (t.assigned_to = $1 OR t.assigned_to IS NULL)
           AND (p.created_by = $1 OR pm.user_id = $1)
           AND t.status != 'Done'
           AND t.due_date IS NOT NULL
           AND t.due_date >= CURRENT_DATE
           AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'
         ORDER BY t.due_date ASC LIMIT 5`
      : `SELECT t.id, t.title, t.due_date, t.priority, t.status,
              p.title as project_title, u.name as assigned_to_name
         FROM tasks t
         JOIN projects p ON t.project_id = p.id
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE t.status != 'Done'
           AND t.due_date IS NOT NULL
           AND t.due_date >= CURRENT_DATE
           AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'
         ORDER BY t.due_date ASC LIMIT 5`;
    const deadlinesParams = userRole !== 'Admin' ? [userId] : [];

    // Execute all queries in parallel
    const [projectStats, taskStats, activities, deadlines] = await Promise.all([
      query(projectStatsQuery, projectParams),
      query(taskStatsQuery, taskParams),
      query(activityQuery, activityParams),
      query(deadlinesQuery, deadlinesParams)
    ]);

    const projectStatsData = projectStats.rows[0] || { total_projects: 0, recent_projects: 0 };
    const taskStatsData = taskStats.rows[0] || { 
      total_tasks: 0, 
      completed_tasks: 0, 
      in_progress_tasks: 0, 
      pending_tasks: 0, 
      overdue_tasks: 0,
      high_priority_tasks: 0
    };

    // Calculate completion rate
    const completionRate = taskStatsData.total_tasks > 0 
      ? Math.round((taskStatsData.completed_tasks / taskStatsData.total_tasks) * 100)
      : 0;

    res.json({
      stats: {
        projects: {
          total: parseInt(projectStatsData.total_projects),
          recent: parseInt(projectStatsData.recent_projects)
        },
        tasks: {
          total: parseInt(taskStatsData.total_tasks),
          completed: parseInt(taskStatsData.completed_tasks),
          in_progress: parseInt(taskStatsData.in_progress_tasks),
          pending: parseInt(taskStatsData.pending_tasks),
          overdue: parseInt(taskStatsData.overdue_tasks),
          high_priority: parseInt(taskStatsData.high_priority_tasks),
          completion_rate: completionRate
        }
      },
      recent_activity: activities.rows,
      upcoming_deadlines: deadlines.rows.map(deadline => ({
        ...deadline,
        days_until_due: Math.ceil((new Date(deadline.due_date) - new Date()) / (1000 * 60 * 60 * 24))
      }))
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user productivity analytics
const getProductivityAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (userRole !== 'Admin') {
      whereClause += ' AND (t.assigned_to = $1 OR t.assigned_to IS NULL)';
      params.push(userId);
    }

    // Task completion by week (last 8 weeks)
    const weeklyCompletionQuery = `
      SELECT 
        DATE_TRUNC('week', updated_at) as week,
        COUNT(CASE WHEN status = 'Done' THEN 1 END) as completed,
        COUNT(CASE WHEN status != 'Done' THEN 1 END) as created
      FROM tasks t
      ${whereClause}
      AND updated_at >= CURRENT_DATE - INTERVAL '8 weeks'
      GROUP BY DATE_TRUNC('week', updated_at)
      ORDER BY week ASC
    `;

    // Task distribution by priority
    const priorityDistributionQuery = `
      SELECT 
        priority,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'Done' THEN 1 END) as completed
      FROM tasks t
      ${whereClause}
      GROUP BY priority
      ORDER BY 
        CASE priority 
          WHEN 'High' THEN 1 
          WHEN 'Medium' THEN 2 
          WHEN 'Low' THEN 3 
        END
    `;

    // Task distribution by status
    const statusDistributionQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        AVG(CASE WHEN due_date IS NOT NULL THEN EXTRACT(DAY FROM (updated_at - created_at)) ELSE NULL END) as avg_completion_days
      FROM tasks t
      ${whereClause}
      GROUP BY status
      ORDER BY 
        CASE status 
          WHEN 'Todo' THEN 1 
          WHEN 'In Progress' THEN 2 
          WHEN 'Done' THEN 3 
        END
    `;

    const [weeklyData, priorityData, statusData] = await Promise.all([
      query(weeklyCompletionQuery, params),
      query(priorityDistributionQuery, params),
      query(statusDistributionQuery, params)
    ]);

    res.json({
      weekly_completion: weeklyData.rows.map(row => ({
        week: row.week,
        completed: parseInt(row.completed),
        created: parseInt(row.created)
      })),
      priority_distribution: priorityData.rows.map(row => ({
        priority: row.priority,
        total: parseInt(row.count),
        completed: parseInt(row.completed),
        completion_rate: parseInt(row.count) > 0 ? Math.round((parseInt(row.completed) / parseInt(row.count)) * 100) : 0
      })),
      status_distribution: statusData.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count),
        avg_completion_days: row.avg_completion_days ? Math.round(parseFloat(row.avg_completion_days)) : null
      }))
    });
  } catch (error) {
    console.error('Get productivity analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats,
  getProductivityAnalytics
};
