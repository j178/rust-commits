CREATE TABLE `github_pull_requests` (
	`number` integer PRIMARY KEY NOT NULL,
	`html_url` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`author_login` text NOT NULL,
	`cached_at` integer NOT NULL
);
