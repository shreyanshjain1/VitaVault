# Repository Cleanup Checklist

Run this before pushing or deploying:

1. Delete any temporary patch folders such as `phase03_patch/`
2. Delete leftover temp files such as `*.tmp`, `*.orig`, and `*.rej`
3. Run `npm run repo:check`
4. Run `npm run typecheck`
5. Run `npm run build`

## Recommended cleanup commands

### Windows PowerShell
```powershell
if (Test-Path phase03_patch) { Remove-Item phase03_patch -Recurse -Force }
Get-ChildItem -Recurse -Include *.tmp,*.orig,*.rej | Remove-Item -Force
```

### Bash
```bash
rm -rf phase03_patch
find . -type f \( -name "*.tmp" -o -name "*.orig" -o -name "*.rej" \) -delete
```
