const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.status === 413 || err.statusCode === 413 || err.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Uploaded data is too large. Please use a smaller image.',
    });
  }
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
};

module.exports = errorMiddleware;
