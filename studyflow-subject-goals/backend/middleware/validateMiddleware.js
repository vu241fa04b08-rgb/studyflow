const { errorResponse } = require('../utils/apiResponse');

const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = await schema.parseAsync(dataToValidate);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return errorResponse(res, 400, 'Validation failed', formattedErrors);
      }
      return errorResponse(res, 400, 'Invalid request data');
    }
  };
};

module.exports = {
  validate,
};
