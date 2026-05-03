const { query } = require('../database/connection');

// GET /api/team
const getTeamMembers = async (req, res) => {
  try {
    const result = await query(`
      SELECT tm.id, tm.role, tm.created_at, u.name, u.email, u.id as user_id, adder.name as added_by_name
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      LEFT JOIN users adder ON tm.added_by = adder.id
      ORDER BY tm.created_at DESC
    `);
    
    res.json({ members: result.rows });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/team
const addTeamMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const addedBy = req.user.id;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Lookup user by email
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User with this email not found' });
    }

    const userId = userResult.rows[0].id;

    // Check if already in team
    const existingMember = await query('SELECT id FROM team_members WHERE user_id = $1', [userId]);
    
    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a team member' });
    }

    // Insert into team_members
    const result = await query(
      'INSERT INTO team_members (user_id, role, added_by) VALUES ($1, $2, $3) RETURNING *',
      [userId, role, addedBy]
    );

    // Fetch full details to return
    const newMemberResult = await query(`
      SELECT tm.id, tm.role, tm.created_at, u.name, u.email, u.id as user_id, adder.name as added_by_name
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      LEFT JOIN users adder ON tm.added_by = adder.id
      WHERE tm.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({ 
      message: 'Team member added successfully',
      member: newMemberResult.rows[0]
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/team/:id
const updateTeamMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['Admin', 'Member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role provided' });
    }

    const result = await query(
      'UPDATE team_members SET role = $1 WHERE id = $2 RETURNING *',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.json({
      message: 'Role updated successfully',
      member: result.rows[0]
    });
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/team/:id
const removeTeamMember = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM team_members WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTeamMembers,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember
};
