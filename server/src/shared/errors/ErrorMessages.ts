export const ErrorMessages: Record<string, string> = {
    VALIDATION_ERROR: 'Validation failed for request inputs.',
    BAD_REQUEST: 'Bad request. Please verify your inputs.',
    UNAUTHORIZED: 'Authentication required to access this resource.',
    FORBIDDEN: 'Access denied. You do not have sufficient permissions.',
    NOT_FOUND: 'The requested resource was not found.',
    CONFLICT: 'A conflict occurred with the current state of the resource.',
    UNPROCESSABLE_ENTITY: 'Unable to process the request payload.',
    INTERNAL_SERVER_ERROR: 'An unexpected internal server error occurred. Please try again later.',
    ROUTE_NOT_FOUND: 'The requested route does not exist on this server.',
    DUPLICATE_KEY_ERROR: 'A record with this unique identifier already exists.',
    INVALID_ID: 'Invalid record ID format provided.'
};
