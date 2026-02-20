import Joi from 'joi';

// Schema for public timer query
export const timerQuerySchema = Joi.object({
  productId: Joi.string().optional(),
  collectionId: Joi.string().optional(),
}).or('productId', 'collectionId').messages({
  'object.missing': 'Either productId or collectionId is required',
});

// Query parameter validation middleware
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

    // Replace req.query with validated and sanitized values
    req.query = value;
    next();
  };
};

