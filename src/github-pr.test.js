import { expect, test } from "bun:test";
import { parseGithubPullRequestUrl, parseGithubRepoUrl } from "./github-pr.js";

test("parses GitHub pull request URLs", () => {
  expect(
    parseGithubPullRequestUrl("https://github.com/jpmadrigal07/jeichat/pull/22"),
  ).toEqual({
    owner: "jpmadrigal07",
    repo: "jeichat",
    number: 22,
  });
});

test("parses GitHub repo URLs", () => {
  expect(parseGithubRepoUrl("https://github.com/jpmadrigal07/jeichat")).toEqual({
    owner: "jpmadrigal07",
    repo: "jeichat",
  });
});
