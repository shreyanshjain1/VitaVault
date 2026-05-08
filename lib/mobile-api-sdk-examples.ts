export type MobileApiSdkExample = { title: string; file: string; language: string; purpose: string; covers: string[] };

export const MOBILE_API_SDK_EXAMPLES: MobileApiSdkExample[] = [
  {
    title: "Framework-neutral TypeScript client",
    file: "examples/mobile-api/vitavault-mobile-client.ts",
    language: "TypeScript",
    purpose: "Reusable fetch-based client for web, Node test harnesses, or mobile wrappers.",
    covers: ["login", "session", "logout", "connections", "device reading sync", "rate-limit errors"],
  },
  {
    title: "React Native sync service",
    file: "examples/mobile-api/react-native-sync.ts",
    language: "TypeScript",
    purpose: "Mobile integration example for secure token storage and queued health reading sync.",
    covers: ["secure token storage", "reading mapping", "queued sync", "401 token clearing"],
  },
  {
    title: "cURL QA scripts",
    file: "examples/mobile-api/curl-examples.md",
    language: "Shell",
    purpose: "Terminal-ready request examples for manual QA and endpoint smoke testing.",
    covers: ["login", "me", "connections", "sync", "logout"],
  },
];

export function getMobileApiSdkExampleCount() {
  return MOBILE_API_SDK_EXAMPLES.length;
}

export function getMobileApiSdkCoveredCapabilities() {
  return Array.from(new Set(MOBILE_API_SDK_EXAMPLES.flatMap((example) => example.covers))).sort((left, right) => left.localeCompare(right));
}
