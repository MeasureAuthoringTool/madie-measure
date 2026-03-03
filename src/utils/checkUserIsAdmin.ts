/**
 * TODO: Replace this mock with actual implementation from @madie/madie-util
 * when PR for user role detection is merged.
 *
 * Expected implementation will check if current user has MADiE-Admin role
 * by examining the user object's roles collection.
 */

/**
 * Temporary mock function to check if current user is an admin
 * @returns true if user has MADiE-Admin role, false otherwise
 */
export const checkUserIsAdmin = (): boolean => {
  // Mock implementation - returns false by default
  // For local testing, you can temporarily hardcode return true

  // TODO: Replace with:
  // const user = getUserFromContext(); // or similar
  // return user?.roles?.some(role => role === "MADiE-Admin") || false;

  return false;
};

export default checkUserIsAdmin;
