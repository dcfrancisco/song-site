class ContentConflictError extends Error { constructor(message, currentVersion) { super(message); this.name = 'ContentConflictError'; this.currentVersion = currentVersion; } }
class ContentValidationError extends Error { constructor(errors) { super('Content validation failed'); this.name = 'ContentValidationError'; this.errors = errors; } }
module.exports = { ContentConflictError, ContentValidationError };
