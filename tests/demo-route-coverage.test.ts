import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { demoNav, demoProductHubs, demoTourSteps } from "@/lib/demo-data";

function demoPagePathForHref(href: string) {
  if (href === "/demo") {
    return join(process.cwd(), "app", "demo", "page.tsx");
  }

  const demoSegment = href.replace(/^\/demo\/?/, "");
  return join(process.cwd(), "app", "demo", demoSegment, "page.tsx");
}

describe("demo route coverage", () => {
  it("keeps every sidebar demo link backed by a public demo page", () => {
    const missingPages = demoNav
      .map((item) => ({ href: item.href, path: demoPagePathForHref(item.href) }))
      .filter((item) => !existsSync(item.path));

    expect(missingPages).toEqual([]);
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

  it("includes collaboration and report-builder surfaces in the no-login demo", () => {
    const hrefs = new Set(demoNav.map((item) => item.href));

    expect(hrefs.has("/demo/care-notes")).toBe(true);
    expect(hrefs.has("/demo/report-builder")).toBe(true);
  });
});
