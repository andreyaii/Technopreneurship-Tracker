import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { QueryClient } from "@tanstack/react-query";
import {
  getUserQueryScope,
  queryKeys,
  TECHNOPRENEURSHIP_SUBJECT,
} from "../src/queries/queryKeys.js";
import { queryClient } from "../src/queryClient.js";
import {
  QUERY_STALE_TIME,
  QUERY_GC_TIME,
} from "../src/services/projectService.js";

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

  it("configures queryClient with staleTime: 5 mins and gcTime: 10 mins", () => {
    const defaults = queryClient.getDefaultOptions().queries;
    assert.equal(defaults.staleTime, 1000 * 60 * 5);
    assert.equal(defaults.gcTime, 1000 * 60 * 10);
    assert.equal(QUERY_STALE_TIME, 1000 * 60 * 5);
    assert.equal(QUERY_GC_TIME, 1000 * 60 * 10);
  });

  it("ensures navigating between pages (Dashboard -> Projects -> Dashboard) reads from cache without network requests", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
          gcTime: 1000 * 60 * 10,
        },
      },
    });

    let dashboardFetchCount = 0;
    let projectsFetchCount = 0;

    const student = {
      role: "student",
      studentNo: "22-1234-567",
      groupCode: "CSIT-301",
    };

    const dashboardKey = queryKeys.dashboard(student.groupCode, student.studentNo);
    const projectsKey = queryKeys.projects.list(getUserQueryScope(student));

    const fetchDashboard = async () => {
      dashboardFetchCount += 1;
      return { project: { groupCode: "CSIT-301" }, overallProgress: 75 };
    };

    const fetchProjects = async () => {
      projectsFetchCount += 1;
      return [{ groupCode: "CSIT-301" }, { groupCode: "CSIT-302" }];
    };

    try {
      // Step 1: User visits Dashboard
      const dash1 = await client.fetchQuery({
        queryKey: dashboardKey,
        queryFn: fetchDashboard,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
      });
      assert.equal(dashboardFetchCount, 1);
      assert.equal(dash1.overallProgress, 75);

      // Step 2: User navigates to Projects
      const proj1 = await client.fetchQuery({
        queryKey: projectsKey,
        queryFn: fetchProjects,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
      });
      assert.equal(projectsFetchCount, 1);
      assert.equal(proj1.length, 2);

      // Step 3: User navigates BACK to Dashboard
      // Must read directly from cache instantly without triggering fetchDashboard
      const dash2 = await client.fetchQuery({
        queryKey: dashboardKey,
        queryFn: fetchDashboard,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
      });
      assert.equal(dashboardFetchCount, 1, "Dashboard should be read from cache without network fetch");
      assert.deepEqual(dash2, dash1);

      // Step 4: User navigates BACK to Projects
      // Must read directly from cache instantly without triggering fetchProjects
      const proj2 = await client.fetchQuery({
        queryKey: projectsKey,
        queryFn: fetchProjects,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
      });
      assert.equal(projectsFetchCount, 1, "Projects should be read from cache without network fetch");
      assert.deepEqual(proj2, proj1);
    } finally {
      client.clear();
    }
  });

  it("verifies raw data fetching functions do not wrap queryClient.fetchQuery", async () => {
    const {
      getGroupDeliverables,
      getGroupMembers,
      fetchDashboardData,
      getDashboardData,
      getProjectOverallProgress,
      getRatings,
    } = await import("../src/services/projectService.js");

    let fetchQueryCalled = false;
    const originalFetchQuery = queryClient.fetchQuery.bind(queryClient);
    queryClient.fetchQuery = () => {
      fetchQueryCalled = true;
      throw new Error("queryClient.fetchQuery should not be called by raw functions");
    };

    try {
      // Empty/null inputs should return direct responses without touching queryClient
      assert.deepEqual(await getGroupDeliverables(""), []);
      assert.deepEqual(await getGroupMembers(""), []);
      assert.equal(await getProjectOverallProgress(""), 0);
      assert.deepEqual(await getRatings(""), { groupRating: null, individualRating: null });
      assert.equal(await fetchDashboardData(null), null);
      assert.equal(await getDashboardData(null), null);
      assert.equal(fetchQueryCalled, false, "queryClient.fetchQuery was unexpectedly invoked");
    } finally {
      queryClient.fetchQuery = originalFetchQuery;
    }
  });
});
