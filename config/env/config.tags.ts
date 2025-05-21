import { ITagConfiguration } from "./validators/Tag";
import { env } from "@config/env";

/**
 * Configuration for tag instances
 */
export const tagConfig: ITagConfiguration = {
  labels: [
    {
      pattern: [/@epic:(.*)/],
      name: "epic",
    },
    {
      pattern: [/@severity:(.*)/],
      name: "severity",
    },
    {
      pattern: [/@testrail:(C\d+|\d+)/],
      name: "testId",
    },
    {
      pattern: [/@testsuite:(\d+)/],
      name: "suiteId",
    },
  ],
  links: {
    issue: {
      pattern: [/@issue:(.*)/],
      urlTemplate: "https://issues.example.com/%s",
      nameTemplate: "ISSUE %s",
    },
    tms: {
      pattern: [/@tms:(.*)/],
      urlTemplate: "https://tms.example.com/%s",
    },
    jira: {
      pattern: [/@jira:(.*)/],
      urlTemplate: (v: any) => `https://wiswm.atlassian.net/browse/${v}`,
    },
    testrail: {
      pattern: [/@testrail:(C\d+|\d+)/],
      urlTemplate: (v: any) => {
        // Convert C12345 format to just numeric ID
        const caseId = v.toString().replace(/^C/i, '');
        return `${env.TESTRAIL?.TESTRAIL_HOST}/index.php?/cases/view/${caseId}`;
      },
      nameTemplate: "TestRail Case %s",
    },
    testsuite: {
      pattern: [/@testsuite:(\d+)/],
      urlTemplate: (v: any) => {
        return `${env.TESTRAIL?.TESTRAIL_HOST}/index.php?/suites/view/${v}`;
      },
      nameTemplate: "TestRail Suite %s",
    },
  }
};
