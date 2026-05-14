import { existsSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import {
  demoNav,
  demoNavGroups,
  demoProductHubs,
  demoQaChecklist,
  demoReviewerCtas,
  demoTourSteps,
} from "@/lib/demo-data";

function demoPagePathForHref(href: string) {
  if (href === "/demo") {
    return join(process.cwd(), "app", "demo", "page.tsx");
  }

  const demoSegment = href.replace(/^\/demo\/?/, "");
  return join(process.cwd(), "app", "demo", demoSegment, "page.tsx");
}

function hrefForDemoPagePath(path: string) {
  const demoRoot = join(process.cwd(), "app", "demo");
  const relativePath = relative(demoRoot, path).split(sep).join("/");

  if (relativePath === "page.tsx") {
    return "/demo";
  }

  return `/demo/${relativePath.replace(/\/page\.tsx$/, "")}`;
}

function collectDemoPagePaths(dir = join(process.cwd(), "app", "demo")): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectDemoPagePaths(fullPath);
    }

    return entry.isFile() && entry.name === "page.tsx" ? [fullPath] : [];
  });
}

describe("demo route coverage", () => {
  it("keeps every sidebar demo link backed by a public demo page", () => {
    const missingPages = demoNav
      .map((item) => ({ href: item.href, path: demoPagePathForHref(item.href) }))
      .filter((item) => !existsSync(item.path));

    expect(missingPages).toEqual([]);
  });

  it("keeps every public demo page discoverable in sidebar navigation", () => {
    const navHrefs = new Set(demoNav.map((item) => item.href));
    const unlistedPages = collectDemoPagePaths()
      .map((path) => hrefForDemoPagePath(path))
      .filter((href) => !navHrefs.has(href));

    expect(unlistedPages).toEqual([]);
  });

  it("keeps every product hub card linked to a public demo page", () => {
    const missingHubPages = demoProductHubs
      .map((item) => ({ href: item.href, path: demoPagePathForHref(item.href) }))
      .filter((item) => !existsSync(item.path));

    expect(missingHubPages).toEqual([]);
  });

  it("keeps every guided walkthrough step linked to a public demo page", () => {
    const missingTourPages = demoTourSteps
      .map((item) => ({ href: item.route, path: demoPagePathForHref(item.route) }))
      .filter((item) => !existsSync(item.path));

    expect(missingTourPages).toEqual([]);
  });

  it("keeps demo navigation unique and grouped exactly once", () => {
    const navHrefs = demoNav.map((item) => item.href);
    const navLabels = demoNav.map((item) => item.label);
    const groupedHrefs = demoNavGroups.flatMap((group) => group.items.map((item) => item.href));

    expect(new Set(navHrefs).size).toBe(navHrefs.length);
    expect(new Set(navLabels).size).toBe(navLabels.length);
    expect(new Set(groupedHrefs)).toEqual(new Set(navHrefs));
    expect(groupedHrefs).toHaveLength(navHrefs.length);
  });

  it("keeps reviewer CTAs and QA checklist display-ready", () => {
    expect(demoQaChecklist.length).toBeGreaterThanOrEqual(4);
    expect(demoQaChecklist.every((item) => item.label && item.status && item.detail)).toBe(true);

    const invalidCtas = demoReviewerCtas
      .filter((item) => item.href.startsWith("/demo"))
      .map((item) => ({ href: item.href, path: demoPagePathForHref(item.href) }))
      .filter((item) => !existsSync(item.path));

    expect(invalidCtas).toEqual([]);
  });

  it("includes collaboration and report-builder surfaces in the no-login demo", () => {
    const hrefs = new Set(demoNav.map((item) => item.href));

    expect(hrefs.has("/demo/care-notes")).toBe(true);
    expect(hrefs.has("/demo/report-builder")).toBe(true);
  });
});
