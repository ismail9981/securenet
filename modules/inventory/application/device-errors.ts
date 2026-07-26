export class DeviceNotFoundError extends Error {
  readonly code = "DEVICE_NOT_FOUND";

  constructor() {
    super("The requested device was not found.");
    this.name = "DeviceNotFoundError";
  }
}

export class DeviceConflictError extends Error {
  constructor(
    readonly code:
      | "DEVICE_HOSTNAME_CONFLICT"
      | "DEVICE_IP_CONFLICT"
      | "DEVICE_PARENT_CONFLICT",
    message: string,
    readonly field: string,
  ) {
    super(message);
    this.name = "DeviceConflictError";
  }
}

export class DeviceReferenceError extends Error {
  readonly code = "DEVICE_REFERENCE_INVALID";

  constructor(
    message: string,
    readonly field: "locationId" | "parentDeviceId",
  ) {
    super(message);
    this.name = "DeviceReferenceError";
  }
}
