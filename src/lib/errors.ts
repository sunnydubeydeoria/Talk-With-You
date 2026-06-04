/**
 * Maps backend/database errors to safe, user-facing messages.
 * Detailed errors stay in console for debugging; users never see
 * raw database/RLS/constraint details.
 */
export function getSafeErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return fallback;

  if (err.code === "23505") return "That value is already taken.";
  if (err.code === "23503") return "Referenced item could not be found.";
  if (err.code === "23502") return "A required field is missing.";

  const msg = (err.message || "").toLowerCase();
  if (msg.includes("row-level security") || msg.includes("permission")) {
    return "You don't have permission to perform this action.";
  }
  if (msg.includes("failed to fetch") || msg.includes("network")) {
    return "Network error. Please check your connection and try again.";
  }

  return fallback;
}
