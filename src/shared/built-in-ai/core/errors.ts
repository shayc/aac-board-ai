import type { AvailabilityState } from "./types";

export class BuiltInAIUnavailableError extends Error {
  readonly availability: AvailabilityState;

  constructor(availability: AvailabilityState) {
    super(`Built-in AI model is ${availability}`);
    this.name = "BuiltInAIUnavailableError";
    this.availability = availability;
  }
}
