import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const githubCommits = sqliteTable("github_commits", {
  sha: text("sha").primaryKey(),
  htmlUrl: text("html_url").notNull(),
  message: text("message").notNull(),
  authorName: text("author_name").notNull(),
  authoredAt: text("authored_at").notNull(),
  parentsJson: text("parents_json").notNull(),
  cachedAt: integer("cached_at").notNull(),
});

export const githubCommitPages = sqliteTable("github_commit_pages", {
  ref: text("ref").primaryKey(),
  commitShasJson: text("commit_shas_json").notNull(),
  fetchedAt: integer("fetched_at").notNull(),
});

export const githubPullRequests = sqliteTable("github_pull_requests", {
  number: integer("number").primaryKey(),
  htmlUrl: text("html_url").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorLogin: text("author_login").notNull(),
  cachedAt: integer("cached_at").notNull(),
});
