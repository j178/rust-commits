CREATE TABLE `github_commit_pages` (
	`ref` text PRIMARY KEY NOT NULL,
	`commit_shas_json` text NOT NULL,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `github_commits` (
	`sha` text PRIMARY KEY NOT NULL,
	`html_url` text NOT NULL,
	`message` text NOT NULL,
	`author_name` text NOT NULL,
	`authored_at` text NOT NULL,
	`parents_json` text NOT NULL,
	`cached_at` integer NOT NULL
);
