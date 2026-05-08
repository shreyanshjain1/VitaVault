# VitaVault Mobile API SDK Examples

| File | Purpose |
|---|---|
| `vitavault-mobile-client.ts` | Framework-neutral TypeScript client for login, session checks, logout, connection listing, and device reading sync. |
| `react-native-sync.ts` | React Native-style service helpers for secure token storage and queued reading sync. |
| `curl-examples.md` | Terminal-ready examples for QA and endpoint testing. |

```ts
import { VitaVaultMobileClient, buildAndroidHealthConnectSamplePayload } from "./vitavault-mobile-client";

const client = new VitaVaultMobileClient({ baseUrl: "https://your-vitavault-domain.com" });
await client.login({ email: "patient@example.com", password: "correct-horse-battery-staple", deviceName: "Pixel 8 Pro" });
await client.syncDeviceReadings(buildAndroidHealthConnectSamplePayload());
```
