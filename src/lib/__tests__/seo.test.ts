import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import robots from "../../app/robots.ts";
import sitemap from "../../app/sitemap.ts";

describe("SEO and Generative Search Engine Configuration", () => {
  describe("Robots configuration", () => {
    it("declares crawler rules and protects admin and portal private routes", () => {
      const robotsConfig = robots();
      assert.ok(Array.isArray(robotsConfig.rules));
      assert.ok(typeof robotsConfig.sitemap === "string");
      assert.match(robotsConfig.sitemap, /sitemap\.xml$/);

      const defaultRule = (robotsConfig.rules as Array<{ userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] }>).find(
        (r) => r.userAgent === "*"
      );
      assert.ok(defaultRule, "Default '*' crawler rule should be present");
      assert.equal(defaultRule.allow, "/");

      const disallowed = Array.isArray(defaultRule.disallow) ? defaultRule.disallow : [defaultRule.disallow];
      assert.ok(disallowed.some((d) => d === "/admin" || d === "/admin/"));
      assert.ok(disallowed.some((d) => d === "/portal" || d === "/portal/"));
    });

    it("explicitly permits major AI search bots (OAI-SearchBot, PerplexityBot, ClaudeBot)", () => {
      const robotsConfig = robots();
      const rules = robotsConfig.rules as Array<{ userAgent?: string | string[]; allow?: string | string[] }>;
      const agentNames = rules.map((r) => r.userAgent);

      assert.ok(agentNames.includes("OAI-SearchBot"));
      assert.ok(agentNames.includes("PerplexityBot"));
      assert.ok(agentNames.includes("ClaudeBot"));
    });

    it("handles trailing slash in NEXT_PUBLIC_SITE_URL without double slashes in sitemap URL", () => {
      const original = process.env.NEXT_PUBLIC_SITE_URL;
      try {
        process.env.NEXT_PUBLIC_SITE_URL = "https://custom-domain.com/";
        const robotsConfig = robots();
        assert.equal(robotsConfig.sitemap, "https://custom-domain.com/sitemap.xml");
      } finally {
        if (original === undefined) {
          delete process.env.NEXT_PUBLIC_SITE_URL;
        } else {
          process.env.NEXT_PUBLIC_SITE_URL = original;
        }
      }
    });
  });

  describe("Sitemap configuration", () => {
    it("includes canonical base path and public pages with valid priorities", () => {
      const sitemapEntries = sitemap();
      assert.ok(Array.isArray(sitemapEntries));
      assert.ok(sitemapEntries.length >= 2);

      const home = sitemapEntries.find((entry) => entry.url.endsWith("/"));
      assert.ok(home, "Home page entry must be present");
      assert.equal(home.priority, 1.0);
      assert.equal(home.changeFrequency, "weekly");

      const login = sitemapEntries.find((entry) => entry.url.endsWith("/ingresar"));
      assert.ok(login, "Ingresar page entry must be present");
      assert.equal(login.priority, 0.3);
    });

    it("sanitizes trailing slashes in NEXT_PUBLIC_SITE_URL avoiding duplicate slashes", () => {
      const original = process.env.NEXT_PUBLIC_SITE_URL;
      try {
        process.env.NEXT_PUBLIC_SITE_URL = "https://custom-domain.com/";
        const sitemapEntries = sitemap();
        const urls = sitemapEntries.map((e) => e.url);

        assert.ok(urls.includes("https://custom-domain.com/"));
        assert.ok(urls.includes("https://custom-domain.com/ingresar"));
        assert.ok(!urls.some((u) => u.includes("custom-domain.com//")));
      } finally {
        if (original === undefined) {
          delete process.env.NEXT_PUBLIC_SITE_URL;
        } else {
          process.env.NEXT_PUBLIC_SITE_URL = original;
        }
      }
    });
  });

  describe("LLMS text assets compliance", () => {
    it("ensures public/llms.txt adheres strictly to the llmstxt.org specification", () => {
      const llmsPath = path.resolve(process.cwd(), "public/llms.txt");
      assert.ok(fs.existsSync(llmsPath), "public/llms.txt should exist");

      const content = fs.readFileSync(llmsPath, "utf-8");
      const lines = content.split("\n");

      // Single H1 at top
      const h1s = lines.filter((l) => /^#\s+[^#]/.test(l.trim()));
      assert.equal(h1s.length, 1, "Exactly one H1 title should exist in llms.txt");
      assert.equal(h1s[0].trim(), "# Plaza Aragón");

      // Blockquote summary
      const blockquote = lines.find((l) => /^>\s+/.test(l.trim()));
      assert.ok(blockquote, "Blockquote summary must follow H1");

      // Categorized H2 sections
      const h2s = lines.filter((l) => /^##\s+[^#]/.test(l.trim()));
      assert.ok(h2s.length >= 2, "Must contain organized H2 sections");

      // Annotated links
      const linkRegex = /-\s+\[([^\]]+)\]\(([^)]+)\):\s*(.+)/;
      const bulletedLinks = lines.filter((l) => linkRegex.test(l.trim()));
      assert.ok(bulletedLinks.length >= 3, "Curated resource links with annotations must be present");
    });

    it("ensures public/llms-full.txt provides deep context for single-pass ingestion", () => {
      const fullPath = path.resolve(process.cwd(), "public/llms-full.txt");
      assert.ok(fs.existsSync(fullPath), "public/llms-full.txt should exist");

      const content = fs.readFileSync(fullPath, "utf-8");
      assert.ok(content.includes("Olanchito, Yoro"));
      assert.ok(content.includes("HNL"));
      assert.ok(content.includes("FAQ") || content.includes("Preguntas"));
    });
  });
});
