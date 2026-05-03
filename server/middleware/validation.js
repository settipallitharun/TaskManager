const Joi = require('joi');

// User validation schemas
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('Admin', 'Member').default('Member')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Project validation schemas
const createProjectSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional().allow('')
});

const addMemberSchema = Joi.object({
  userId: Joi.number().integer().positive().required()
});

// Task validation schemas
const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(2000).optional().allow(''),
  priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
  assigned_to: Joi.number().integer().positive().optional().allow(null),
  project_id: Joi.number().integer().positive().required(),
  due_date: Joi.date().optional().allow(null)
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(2000).optional().allow(''),
  status: Joi.string().valid('Todo', 'In Progress', 'Done').optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High').optional(),
  assigned_to: Joi.number().integer().positive().optional().allow(null),
  due_date: Joi.date().optional().allow(null)
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errorMessage 
      });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  createProjectSchema,
  addMemberSchema,
  createTaskSchema,
  updateTaskSchema
};
