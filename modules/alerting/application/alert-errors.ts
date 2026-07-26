export class AlertNotFoundError extends Error {
  readonly code = "ALERT_NOT_FOUND";

  constructor() {
    super("The requested Alert was not found.");
    this.name = "AlertNotFoundError";
  }
}

export class AlertActiveConflictError extends Error {
  readonly code = "ALERT_ACTIVE_CONFLICT";

  constructor() {
    super("An active Alert already exists for this device and rule.");
    this.name = "AlertActiveConflictError";
  }
}
