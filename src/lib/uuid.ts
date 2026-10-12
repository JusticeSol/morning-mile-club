const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Route ids go straight into queries; a malformed one would be a Postgres
// error rather than a clean 404.
export function isUuid(value: string) {
  return UUID.test(value);
}
