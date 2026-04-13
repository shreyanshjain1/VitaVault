This hotfix aligns the Operations page with the actual Prisma schema and relation includes.

Changes:
- Replaces string enum filters with Prisma enum constants.
- Includes related user/connection data in recent failed run, sync failure, and open alert queries.
- Uses a strongly typed OpsTone for StatusPill compatibility.
- Keeps the Ops page read-only and Prisma-only.
