import test from "node:test";
import assert from "node:assert/strict";
import { createNativeClinicalToolEnvelope, getNativeClinicalTool, isNativeClinicalToolEnvelope } from "./native-registry.ts";

test("il registry espone QAB V1 e non rende nativi gli altri strumenti", () => { assert.equal(getNativeClinicalTool("qab-it")?.schemaVersion, 1); assert.equal(getNativeClinicalTool("eat-10-it"), undefined); });
test("la factory crea un QAB non avviato e il dispatch valida envelope e payload", () => { const value = createNativeClinicalToolEnvelope("qab-it"); assert.equal(value.data.status, "not_started"); assert.equal(isNativeClinicalToolEnvelope(value), true); assert.equal(isNativeClinicalToolEnvelope({ ...value, schemaVersion: 2 }), false); assert.equal(isNativeClinicalToolEnvelope({ ...value, data: { ...value.data, results: {} } }), false); });
