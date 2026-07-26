"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type {
  DeviceDetails,
  DeviceSummary,
  LocationOption,
} from "@/modules/inventory/application/device-contracts";
import { DEVICE_STATUSES, DEVICE_TYPES } from "@/modules/shared/domain/network";

interface DeviceFormProps {
  readonly locations: readonly LocationOption[];
  readonly mode: "create" | "update";
  readonly parents: readonly DeviceSummary[];
  readonly initial?: DeviceDetails;
}

interface ApiError {
  readonly message: string;
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
  readonly correlationId?: string;
}

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export function DeviceForm({
  locations,
  mode,
  parents,
  initial,
}: DeviceFormProps) {
  const router = useRouter();
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: value(formData, "name"),
      hostname: value(formData, "hostname"),
      ipAddress: value(formData, "ipAddress"),
      macAddress: value(formData, "macAddress") || null,
      type: value(formData, "type"),
      status: value(formData, "status"),
      osName: value(formData, "osName") || null,
      locationId: value(formData, "locationId"),
      parentDeviceId: value(formData, "parentDeviceId") || null,
      importanceWeight: Number(value(formData, "importanceWeight")),
    };

    try {
      const response = await fetch(
        mode === "create"
          ? "/api/v1/devices"
          : `/api/v1/devices/${initial?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = (await response.json()) as {
        data?: DeviceDetails;
        error?: ApiError;
      };

      if (!response.ok || !body.data) {
        setError(body.error ?? { message: "The device could not be saved." });
        return;
      }

      if (mode === "create") {
        router.push(`/devices/${body.data.id}`);
      } else {
        setSuccess("Device changes saved and audited.");
        router.refresh();
      }
    } catch {
      setError({ message: "The device could not be saved. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldError = (name: string) => error?.fieldErrors?.[name]?.[0];

  return (
    <form className="mt-4 space-y-4" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Device name
          <input
            aria-describedby={fieldError("name") ? "name-error" : undefined}
            className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3"
            defaultValue={initial?.name}
            name="name"
            required
          />
          {fieldError("name") ? (
            <span className="text-danger mt-1 block text-xs" id="name-error">
              {fieldError("name")}
            </span>
          ) : null}
        </label>
        <label className="text-sm font-medium">
          Hostname
          <input
            className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3 font-mono"
            defaultValue={initial?.hostname}
            name="hostname"
            required
          />
          {fieldError("hostname") ? (
            <span className="text-danger mt-1 block text-xs">
              {fieldError("hostname")}
            </span>
          ) : null}
        </label>
        <label className="text-sm font-medium">
          IP address
          <input
            className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3 font-mono"
            defaultValue={initial?.ipAddress}
            name="ipAddress"
            required
          />
          {fieldError("ipAddress") ? (
            <span className="text-danger mt-1 block text-xs">
              {fieldError("ipAddress")}
            </span>
          ) : null}
        </label>
        <label className="text-sm font-medium">
          MAC address
          <input
            className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3 font-mono"
            defaultValue={initial?.macAddress ?? ""}
            name="macAddress"
            placeholder="02:00:00:00:00:31"
          />
        </label>
        <label className="text-sm font-medium">
          Type
          <select
            className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3"
            defaultValue={initial?.type ?? "SERVER"}
            name="type"
          >
            {DEVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Status
          <select
            className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3"
            defaultValue={initial?.status ?? "UNKNOWN"}
            name="status"
          >
            {DEVICE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Operating system
          <input
            className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3"
            defaultValue={initial?.osName ?? ""}
            name="osName"
          />
        </label>
        <label className="text-sm font-medium">
          Location
          <select
            className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3"
            defaultValue={initial?.location.id ?? locations[0]?.id}
            name="locationId"
            required
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Parent device
          <select
            className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3"
            defaultValue={initial?.parentDevice?.id ?? ""}
            name="parentDeviceId"
          >
            <option value="">No parent</option>
            {parents
              .filter((parent) => parent.id !== initial?.id)
              .map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name} · {parent.hostname}
                </option>
              ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Importance
          <select
            className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3"
            defaultValue={String(initial?.importanceWeight ?? 1)}
            name="importanceWeight"
          >
            {[1, 2, 3, 4, 5].map((weight) => (
              <option key={weight} value={weight}>
                {weight}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div aria-live="polite" className="min-h-6 text-sm">
        {error ? (
          <p className="text-danger">
            {error.message}
            {error.correlationId ? ` Reference: ${error.correlationId}` : ""}
          </p>
        ) : null}
        {success ? <p className="text-success">{success}</p> : null}
      </div>

      <button
        className="bg-brand inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-950 disabled:opacity-60"
        disabled={submitting}
        type="submit"
      >
        {submitting ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Save aria-hidden="true" className="size-4" />
        )}
        {submitting
          ? "Saving…"
          : mode === "create"
            ? "Add device"
            : "Save changes"}
      </button>
    </form>
  );
}
