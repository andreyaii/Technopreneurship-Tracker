import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { QueryClient } from "@tanstack/react-query";
import {
  getUserQueryScope,
  queryKeys,
  TECHNOPRENEURSHIP_SUBJECT,
} from "../src/queries/queryKeys.js";

describe("Project query cache isolation", () => {
  it("scopes project keys by role, principal, and subject", () => {
    const studentScope = getUserQueryScope({
      role: "student",
      studentNo: "22-1234-567",
    });
    const adviserScope = getUserQueryScope({
      role: "adviser",
      adviserNo: "ADV-1",
    });
    const capstoneScope = getUserQueryScope(
      { role: "student", studentNo: "22-1234-567" },
      "capstone"
    );

    assert.deepEqual(studentScope, {
      role: "student",
      principalId: "22-1234-567",
      subject: TECHNOPRENEURSHIP_SUBJECT,
    });
    assert.notDeepEqual(
      queryKeys.projects.list(studentScope),
      queryKeys.projects.list(adviserScope)
    );
    assert.notDeepEqual(
      queryKeys.projects.list(studentScope),
      queryKeys.projects.list(capstoneScope)
    );
    assert.equal(getUserQueryScope(null), null);
  });

  it("deduplicates concurrent project requests and clears cached results", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity } },
    });
    const queryKey = queryKeys.projects.list(
      getUserQueryScope({ role: "student", studentNo: "22-1234-567" })
    );
    let requestCount = 0;
    const queryFn = async () => {
      requestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return [{ groupCode: "G-1" }];
    };
    const options = { queryKey, queryFn, staleTime: 120_000 };

    try {
      const [first, second] = await Promise.all([
        client.fetchQuery(options),
        client.fetchQuery(options),
      ]);

      assert.deepEqual(first, [{ groupCode: "G-1" }]);
      assert.deepEqual(second, first);
      assert.equal(requestCount, 1);

      await client.fetchQuery(options);
      assert.equal(requestCount, 1);

      client.clear();
      await client.fetchQuery(options);
      assert.equal(requestCount, 2);
    } finally {
      client.clear();
    }
  });
});
