# VitaVault Mobile API cURL Examples

```bash
export VITAVAULT_BASE_URL="https://your-vitavault-domain.com"
export VITAVAULT_EMAIL="patient@example.com"
export VITAVAULT_PASSWORD="correct-horse-battery-staple"
```

## Login

```bash
curl -sS -X POST "$VITAVAULT_BASE_URL/api/mobile/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"$VITAVAULT_EMAIL"'","password":"'"$VITAVAULT_PASSWORD"'","deviceName":"QA Android Device"}'
```

```bash
export VITAVAULT_MOBILE_TOKEN="vvm_replace_with_returned_token"
```

## Current user

```bash
curl -sS "$VITAVAULT_BASE_URL/api/mobile/auth/me" \
  -H "Authorization: Bearer $VITAVAULT_MOBILE_TOKEN"
```

## Connections

```bash
curl -sS "$VITAVAULT_BASE_URL/api/mobile/connections" \
  -H "Authorization: Bearer $VITAVAULT_MOBILE_TOKEN"
```

## Sync readings

```bash
curl -sS -X POST "$VITAVAULT_BASE_URL/api/mobile/device-readings" \
  -H "Authorization: Bearer $VITAVAULT_MOBILE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source":"ANDROID_HEALTH_CONNECT",
    "platform":"ANDROID",
    "clientDeviceId":"android-pixel-8-pro",
    "deviceLabel":"Pixel 8 Pro",
    "appVersion":"1.0.0",
    "scopes":["vitals:write","device:sync"],
    "syncMetadata":{"network":"wifi","example":"curl"},
    "readings":[
      {"readingType":"HEART_RATE","capturedAt":"2026-04-29T08:35:00.000Z","clientReadingId":"curl-hr-001","unit":"bpm","valueInt":78},
      {"readingType":"BLOOD_PRESSURE","capturedAt":"2026-04-29T08:36:00.000Z","clientReadingId":"curl-bp-001","unit":"mmHg","systolic":118,"diastolic":76}
    ]
  }'
```

## Logout

```bash
curl -sS -X POST "$VITAVAULT_BASE_URL/api/mobile/auth/logout" \
  -H "Authorization: Bearer $VITAVAULT_MOBILE_TOKEN"
```
