import { collectReportedErrors } from "@shared/testing/collect-reported-errors";
import { expect, test } from "vitest";
import { reportErrorsTogether } from "./report-errors-together";

test("reports several errors as one that names the first cause", () => {
  const reportedErrors = collectReportedErrors();
  const firstError = new TypeError("disk unreadable");
  const secondError = new Error("also failed");

  reportErrorsTogether([firstError, secondError], "Failed to read assets");

  expect(reportedErrors).toMatchObject([
    {
      message: "Failed to read assets: TypeError: disk unreadable",
      cause: firstError,
      errors: [firstError, secondError],
    },
  ]);
});

test("reports nothing when there are no errors", () => {
  const reportedErrors = collectReportedErrors();

  reportErrorsTogether([], "Failed to read assets");

  expect(reportedErrors).toEqual([]);
});
