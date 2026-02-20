export const errorHandler = (err, req, res, next) => {
  // Log full error details
  console.error('═══════════════════════════════════════');
  console.error('Error Details:');
  console.error('URL:', req.method, req.originalUrl);
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  console.error('Full Error:', err);
  console.error('═══════════════════════════════════════');

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  // Mongoose connection error
  if (err.name === 'MongoServerError' || err.name === 'MongooseError') {
    return res.status(500).json({
      error: 'Database error',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { details: err.toString() }),
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      name: err.name,
      details: err.toString()
    }),
  });
};


