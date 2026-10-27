import assert from "node:assert/strict";
import test from "node:test";
import { lineMoney, quoteTotal } from "../src/lib/money.js";
import { extractRequirements } from "../src/lib/requirements.js";
import { deliveryScore, releaseBlockers } from "../src/lib/score.js";
import { findInProject } from "../src/lib/search.js";
import { sampleProject } from "../src/lib/sample.js";

test("empty desk scores zero", () => {
  const score = deliveryScore({ requirements: [], chapters: [], approved: false });
  assert.equal(score.started, false);
  assert.equal(score.score, 0);
  assert.equal(score.grade, "—");
});

test("sample bridge project has a partial score and formal-release blockers", () => {
  const project = sampleProject();
  const score = deliveryScore(project);
  assert.equal(score.parts.response, 33);
  assert.equal(score.parts.evidence, 67);
  assert.equal(score.parts.chapters, 67);
  assert.equal(score.score, 47);
  assert.equal(score.grade, "D");
  assert.deepEqual(releaseBlockers(project).map((item) => item.id), ["core", "evidence", "chapters", "review"]);
});

test("quote keeps tax out of the net amount", () => {
  assert.deepEqual(lineMoney({ quantity: 2, unitPrice: 1000, taxRate: 6 }), { net: 2000, tax: 120, gross: 2120 });
  const total = quoteTotal([{ quantity: 1, unitPrice: 10.005, taxRate: 0 }, { quantity: 3, unitPrice: 20, taxRate: 13 }]);
  assert.equal(total.net, 70.01);
  assert.equal(total.tax, 7.8);
  assert.equal(total.gross, 77.81);
});

test("requirement lines are picked out of plain text", () => {
  const items = extractRequirements([{ name: "招标.txt", text: "今天适合散步。\n投标人必须提供三年质保服务。\n系统应支持离线缓存。" }]);
  assert.deepEqual(items.map((item) => item.level), ["核心", "一般"]);
  assert.equal(items[0].id, "R-01");
});

test("search hits requirements and chapter titles", () => {
  const hits = findInProject(sampleProject(), "桥梁");
  assert.ok(hits.some((hit) => hit.kind === "requirement"));
  assert.equal(findInProject(sampleProject(), "   ").length, 0);
});
