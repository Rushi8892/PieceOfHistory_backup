import assert from "node:assert/strict";
import { test } from "node:test";
import { parseArchiveDate } from "../src/routes/archive.ts";

test("normalizes a valid archive path to an ISO calendar date", () => {
  assert.equal(parseArchiveDate("2026-09-18"), "2026-09-18");
  assert.equal(parseArchiveDate(["2026-09-18"]), "2026-09-18");
});

test("does not treat serialized timestamps as archive dates", () => {
  assert.equal(parseArchiveDate("2026-09-18T00:00:00.000Z"), null);
  assert.equal(parseArchiveDate(["2026-09-18T00:00:00.000Z"]), null);
  assert.equal(parseArchiveDate("2026-02-30"), null);
});