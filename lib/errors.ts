// Thrown for expected, user-facing failures (validation, conflicts).
// Routes map these to a 4xx with the message; anything else is a 500.
export class ServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
  }
}
