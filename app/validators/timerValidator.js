import Joi from 'joi';
import sanitizeHtml from 'sanitize-html';

// Helper to sanitize HTML
const sanitize = (value) => {
  if (typeof value === 'string') {
    return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
  }
  return value;
};

// Custom validation for hex color
const hexColor = Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);

// Base timer schema
const baseTimerSchema = {
  name: Joi.string()
    .trim()
    .required()
    .max(100)
    .custom(sanitize)
    .messages({
      'string.empty': 'Timer name is required',
      'string.max': 'Timer name must be less than 100 characters',
    }),

  type: Joi.string()
    .valid('fixed', 'evergreen')
    .required()
    .messages({
      'any.only': 'Timer type must be either "fixed" or "evergreen"',
    }),

  targetType: Joi.string()
    .valid('all', 'products', 'collections')
    .default('all')
    .messages({
      'any.only': 'Target type must be "all", "products", or "collections"',
    }),

  targetIds: Joi.array()
    .items(Joi.string())
    .default([])
    .when('targetType', {
      is: Joi.string().valid('products', 'collections'),
      then: Joi.array().min(1).required(),
      otherwise: Joi.array().optional(),
    })
    .messages({
      'array.min': 'Target IDs are required when target type is not "all"',
    }),

  priority: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .default(0)
    .messages({
      'number.base': 'Priority must be a number',
      'number.min': 'Priority must be at least 0',
      'number.max': 'Priority must be at most 100',
    }),

  status: Joi.string()
    .valid('active', 'scheduled', 'expired', 'draft')
    .default('draft')
    .messages({
      'any.only': 'Status must be one of: active, scheduled, expired, draft',
    }),

  customization: Joi.object({
    backgroundColor: hexColor.default('#ff0000').messages({
      'string.pattern.base': 'Background color must be a valid hex color',
    }),
    textColor: hexColor.default('#ffffff').messages({
      'string.pattern.base': 'Text color must be a valid hex color',
    }),
    position: Joi.string()
      .valid('top', 'bottom', 'custom')
      .default('top'),
    timerSize: Joi.string()
      .valid('small', 'medium', 'large')
      .default('medium'),
    title: Joi.string()
      .trim()
      .max(100)
      .default('')
      .custom(sanitize)
      .messages({
        'string.max': 'Title must be less than 100 characters',
      }),
    description: Joi.string()
      .trim()
      .max(500)
      .default('')
      .custom(sanitize)
      .messages({
        'string.max': 'Description must be less than 500 characters',
      }),
    showDescription: Joi.boolean().default(false),
    message: Joi.string()
      .trim()
      .max(200)
      .default('Hurry! Sale ends in')
      .custom(sanitize)
      .messages({
        'string.max': 'Message must be less than 200 characters',
      }),
    showUrgency: Joi.boolean().default(true),
    urgencyThreshold: Joi.number().integer().min(0).default(3600),
    urgencyNotification: Joi.string()
      .valid('color-pulse', 'text-blink', 'none')
      .default('color-pulse'),
  }).default({}),
};

// Fixed timer schema
export const fixedTimerSchema = Joi.object({
  ...baseTimerSchema,
  type: Joi.string().valid('fixed').required(),
  startDate: Joi.date().iso().required().messages({
    'date.base': 'Start date must be a valid ISO 8601 date',
    'any.required': 'Start date is required for fixed timers',
  }),
  endDate: Joi.date()
    .iso()
    .required()
    .greater(Joi.ref('startDate'))
    .messages({
      'date.base': 'End date must be a valid ISO 8601 date',
      'any.required': 'End date is required for fixed timers',
      'date.greater': 'End date must be after start date',
    }),
  duration: Joi.forbidden(),
});

// Evergreen timer schema
export const evergreenTimerSchema = Joi.object({
  ...baseTimerSchema,
  type: Joi.string().valid('evergreen').required(),
  duration: Joi.number()
    .integer()
    .min(60)
    .max(86400)
    .required()
    .messages({
      'number.base': 'Duration must be a number',
      'number.min': 'Duration must be at least 60 seconds',
      'number.max': 'Duration must be at most 86400 seconds (24 hours)',
      'any.required': 'Duration is required for evergreen timers',
    }),
  startDate: Joi.forbidden(),
  endDate: Joi.forbidden(),
});

// Combined timer schema (validates based on type)
export const timerSchema = Joi.object({
  ...baseTimerSchema,
  type: Joi.string().valid('fixed', 'evergreen').required(),
  startDate: Joi.when('type', {
    is: 'fixed',
    then: Joi.date().iso().required().messages({
      'date.base': 'Start date must be a valid ISO 8601 date',
      'any.required': 'Start date is required for fixed timers',
    }),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'Start date is not allowed for evergreen timers',
    }),
  }),
  endDate: Joi.when('type', {
    is: 'fixed',
    then: Joi.date()
      .iso()
      .required()
      .greater(Joi.ref('startDate'))
      .messages({
        'date.base': 'End date must be a valid ISO 8601 date',
        'any.required': 'End date is required for fixed timers',
        'date.greater': 'End date must be after start date',
      }),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'End date is not allowed for evergreen timers',
    }),
  }),
  duration: Joi.when('type', {
    is: 'evergreen',
    then: Joi.number()
      .integer()
      .min(60)
      .max(86400)
      .required()
      .messages({
        'number.base': 'Duration must be a number',
        'number.min': 'Duration must be at least 60 seconds',
        'number.max': 'Duration must be at most 86400 seconds (24 hours)',
        'any.required': 'Duration is required for evergreen timers',
      }),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'Duration is not allowed for fixed timers',
    }),
  }),
});

// Update schema - allows partial updates (all fields optional except validation rules)
export const timerUpdateSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .custom(sanitize)
    .optional(),
  type: Joi.string()
    .valid('fixed', 'evergreen')
    .optional(),
  targetType: Joi.string()
    .valid('all', 'products', 'collections')
    .optional(),
  targetIds: Joi.array()
    .items(Joi.string())
    .optional(),
  priority: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .optional(),
  status: Joi.string()
    .valid('active', 'scheduled', 'expired', 'draft')
    .optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  duration: Joi.number()
    .integer()
    .min(60)
    .max(86400)
    .optional(),
  customization: Joi.object({
    backgroundColor: hexColor.optional(),
    textColor: hexColor.optional(),
    position: Joi.string()
      .valid('top', 'bottom', 'custom')
      .optional(),
    timerSize: Joi.string()
      .valid('small', 'medium', 'large')
      .optional(),
    title: Joi.string()
      .trim()
      .max(100)
      .custom(sanitize)
      .optional(),
    description: Joi.string()
      .trim()
      .max(500)
      .custom(sanitize)
      .optional(),
    showDescription: Joi.boolean().optional(),
    message: Joi.string()
      .trim()
      .max(200)
      .custom(sanitize)
      .optional(),
    showUrgency: Joi.boolean().optional(),
    urgencyThreshold: Joi.number().integer().min(0).optional(),
    urgencyNotification: Joi.string()
      .valid('color-pulse', 'text-blink', 'none')
      .optional(),
  }).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation error',
        details: errors,
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

// Query parameter validation
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation error',
        details: errors,
      });
    }

    req.query = value;
    next();
  };
};

