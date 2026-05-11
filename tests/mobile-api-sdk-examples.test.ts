import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { MOBILE_API_SDK_EXAMPLES, getMobileApiSdkCoveredCapabilities, getMobileApiSdkExampleCount } from "@/lib/mobile-api-sdk-examples";
import { VITAVAULT_DEVICE_PLATFORMS, buildAndroidHealthConnectSamplePayload } from "@/examples/mobile-api/vitavault-mobile-client";
import { buildReactNativeSyncPayload, mapDraftToVitaVaultReading } from "@/examples/mobile-api/react-native-sync";

describe("mobile API SDK examples", () => {
  it("tracks all published SDK example files", () => {
    expect(getMobileApiSdkExampleCount()).toBe(3);
    for (const example of MOBILE_API_SDK_EXAMPLES) {
      expect(existsSync(join(process.cwd(), example.file))).toBe(true);
      expect(example.purpose.length).toBeGreaterThan(20);
      expect(example.covers.length).toBeGreaterThan(0);
    }
  });

  it("documents expected client capabilities", () => {
    expect(getMobileApiSdkCoveredCapabilities()).toEqual(expect.arrayContaining(["login", "session", "logout", "connections", "device reading sync"]));
  });

  it("keeps SDK device platforms aligned to the Prisma-backed mobile API contract", () => {
    expect(VITAVAULT_DEVICE_PLATFORMS).toEqual(["ANDROID", "IOS", "WEB", "OTHER"]);
    expect(VITAVAULT_DEVICE_PLATFORMS).not.toContain("WEARABLE");
    expect(VITAVAULT_DEVICE_PLATFORMS).not.toContain("BLUETOOTH");
  });

  it("builds a schema-backed Android Health Connect sample payload", () => {
    const payload = buildAndroidHealthConnectSamplePayload(new Date("2026-04-29T08:35:00.000Z"));
    expect(payload.source).toBe("ANDROID_HEALTH_CONNECT");
    expect(payload.platform).toBe("ANDROID");
    expect(payload.readings.map((reading) => reading.readingType)).toEqual(["HEART_RATE", "BLOOD_PRESSURE", "WEIGHT"]);
  });

  it("maps React Native reading drafts to VitaVault reading inputs", () => {
    const reading = mapDraftToVitaVaultReading({ id: "rn-hr-1", kind: "heart-rate", capturedAt: new Date("2026-04-29T08:35:00.000Z"), value: 77 });
    expect(reading).toEqual(expect.objectContaining({ readingType: "HEART_RATE", valueInt: 77, unit: "bpm" }));
  });

  it("builds a React Native sync payload with queued reading metadata", () => {
    const payload = buildReactNativeSyncPayload(
      {
        baseUrl: "https://demo.vitavault.test",
        tokenStore: { getToken: async () => "token", setToken: async () => undefined, clearToken: async () => undefined },
        clientDeviceId: "android-pixel-8-pro",
        deviceLabel: "Pixel 8 Pro",
        appVersion: "1.0.0",
      },
      [{ id: "rn-steps-1", kind: "steps", capturedAt: new Date("2026-04-29T08:35:00.000Z"), value: 4321 }]
    );
    expect(payload.syncMetadata).toEqual(expect.objectContaining({ client: "react-native-example", queuedReadingCount: 1 }));
    expect(payload.readings[0]?.readingType).toBe("STEPS");
  });
});
