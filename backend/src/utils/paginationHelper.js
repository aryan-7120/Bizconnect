/**
 * Utility: Pagination Helper
 * Centralizes the skip/limit/totalPages calculation used across all list endpoints.
 */

/**
 * Build pagination options from query params
 * @param {Object} query - req.query
 * @param {number} defaultLimit - Default items per page
 * @param {number} maxLimit - Maximum allowed items per page
 * @returns {{ page, limit, skip }}
 */
const getPaginationOptions = (query, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(maxLimit, parseInt(query.limit) || defaultLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build pagination metadata to attach to response
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total document count
 * @returns {{ page, limit, total, pages }}
 */
const buildPaginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
});

module.exports = { getPaginationOptions, buildPaginationMeta };
