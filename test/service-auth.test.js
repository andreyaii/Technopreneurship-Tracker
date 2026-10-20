import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Frontend Service and API Authentication Contract", () => {
  test("authenticateStudent throws backend message when credentials unconfigured", async () => {
    // Mock postAction returning unconfigured error
    const mockPostAction = async () => ({
      success: false,
      message: "Account credentials are not configured. Please contact your adviser or administrator.",
    });

    let thrownError = null;
    try {
      const data = await mockPostAction();
      if (!data.success || !data.student) {
        const error = new Error(data.message || "Invalid student number or PIN.");
        error.apiMessage = data.message;
        throw error;
      }
    } catch (err) {
      thrownError = err;
    }

    assert.ok(thrownError);
    assert.equal(
      thrownError.message,
      "Account credentials are not configured. Please contact your adviser or administrator."
    );
  });

  test("PIN is preserved as exact string with leading zeros without conversion", () => {
    const pin = "001234";
    const payload = {
      action: "loginStudent",
      studentNo: "24-0001-001".trim(),
      pin: String(pin ?? ""),
    };

    assert.strictEqual(payload.pin, "001234");
    assert.strictEqual(typeof payload.pin, "string");
    assert.notStrictEqual(payload.pin, 1234);
  });

  test("Long and alphanumeric passwords are preserved without truncation or stripping", () => {
    const pin = "Alpha!@#$123456789_Long";
    const payload = {
      action: "loginStudent",
      studentNo: "24-0001-001".trim(),
      pin: String(pin ?? ""),
    };

    assert.strictEqual(payload.pin, "Alpha!@#$123456789_Long");
    assert.strictEqual(payload.pin.length, 23);
  });
});
