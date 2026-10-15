# Gates: TanStack Start migration

OWNS: app/**, tests/**, scripts/**, tools/dbInit.ts, tools/ugoira.ts, package.json, bun.lock, vite.config.ts, server.ts, playwright.config.ts, tsconfig.json, biome.json, Dockerfile, .dockerignore, .gitignore, .github/workflows/pr.yml, README.md, GATES.md

Scope: migrate the alpha framework to the latest stable Start release while preserving bookmark search, URL state, image delivery, Bun runtime, and SQLite compatibility.

- [x] G1: dependency installation reproduces the pinned stack
  CHECK: bun install --frozen-lockfile
  EXPECT: bun install
  EVIDENCE: automatic-evidence=v1; definition-sha256=2a6c8063a9d8086b63b375ef13dbf37c15efe6f4b4b619378f3a39aa9550e482; exit=0; EXPECT=matched; output-sha256=53177e64263fe43de9f2be027b11c4737630c792fe1e9c5dc52e8a50333368d2; output-bytes=113; shell=/bin/sh; cwd=/Users/rayriffy/Git/pixiv-bookmarks-visualizer; path=c18e19d97130/4 entries

- [x] G2: maintained source passes formatting and lint
  CHECK: bun run lint
  EXPECT: Checked
  EVIDENCE: automatic-evidence=v1; definition-sha256=ec0a1ecacb21877dfed880e051b77227e788389e1caf0f3892a654d9b72e6fae; exit=0; EXPECT=matched; output-sha256=21d29dddbb2b379e62c6458dba29aa7eb1b3da838e641a638c27638fe2f979c8; output-bytes=60; shell=/bin/sh; cwd=/Users/rayriffy/Git/pixiv-bookmarks-visualizer; path=c18e19d97130/4 entries

- [x] G3: application, tooling, and acceptance tests typecheck
  CHECK: bun run type-check
  EXPECT: Types verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=5c43ac7dffbb616b8a200134766e9ae6a9e972b2882e009563aa3562c99e0595; exit=0; EXPECT=matched; output-sha256=af21f39f3e40bebdd917ff9ccc529eac8e2c185d13abd1dece810226312f9167; output-bytes=61; shell=/bin/sh; cwd=/Users/rayriffy/Git/pixiv-bookmarks-visualizer; path=c18e19d97130/4 entries

- [x] G4: production client and server bundles compile
  CHECK: bun run build
  EXPECT: built in
  EVIDENCE: automatic-evidence=v1; definition-sha256=3a57051b8efcdfb1a56413bdc169d4046ad3585e620e8372816707771d22f1b7; exit=0; EXPECT=matched; output-sha256=84ce271745964cab9947cf3197270f7c694392b419221afff9a0e827c345a3b4; output-bytes=1112; shell=/bin/sh; cwd=/Users/rayriffy/Git/pixiv-bookmarks-visualizer; path=c18e19d97130/4 entries

- [x] G5: API failure handling and legacy URL formats retain their contracts
  CHECK: bun run test:unit
  EXPECT: pass
  EVIDENCE: automatic-evidence=v1; definition-sha256=169db1a574088925fc43556d34c1ec3612e4deb3cf30d081d6e95333992e84f3; exit=0; EXPECT=matched; output-sha256=cf57f89ce8d43ac883a6f76a39c7001894d58da1b33db56f40ad7a3155df4432; output-bytes=899; shell=/bin/sh; cwd=/Users/rayriffy/Git/pixiv-bookmarks-visualizer; path=c18e19d97130/4 entries

- [x] G6: production SSR, filters, tags, pagination, URL restoration, images, animation, and responsive rendering pass acceptance tests
  CHECK: bun run test:e2e
  EXPECT: passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=fe745ab08485fa12b18ec2938ea4fd7baeea367c376494db2739c60432a252e2; exit=0; EXPECT=matched; output-sha256=ab089767824ad190f6cd61e5a54e750584a5b9f82bb68b3ee158f88daac59b01; output-bytes=13655; shell=/bin/sh; cwd=/Users/rayriffy/Git/pixiv-bookmarks-visualizer; path=c18e19d97130/4 entries

- [x] G7: development server passes the same acceptance contract
  CHECK: bun run test:e2e:dev
  EXPECT: passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=517edc927b8cc73a15aaccb98dad79899c36271f0d529e8eb84b257b4c7fa624; exit=0; EXPECT=matched; output-sha256=7bbbc8a60ce9dac9a0b4acd0e8363b2ca59c8a2fb9fd3a16555dee5afc963094; output-bytes=12787; shell=/bin/sh; cwd=/Users/rayriffy/Git/pixiv-bookmarks-visualizer; path=c18e19d97130/4 entries

- [x] G8: runtime, Docker configuration, CI, and testing instructions match the migrated stack
  EVIDENCE: Reviewed Vite/default Start entries, Bun fetch/static adapter, preserved SQLite migration, pinned Bun Docker stages, frozen-install CI with both browser suites, and README commands. CI YAML parsed. Docker image execution remains unverified because the local daemon is offline; no remote CI run requested.

- [x] G9: existing user data and tools/ugoira.ts changes are preserved
  EVIDENCE: Original .data/pixiv.db SHA-256 verified unchanged after acceptance runs. Babel AST comparison against the original dirty tools/ugoira.ts confirms identical implementation after formatting. SQLite schema and migration files unchanged; synthetic databases/caches live outside the checkout.

Discovery: indexed query `@tanstack/react-start|vinxi|defineConfig` found the old Vinxi configuration and all five API routes; exact working-tree reads verified stale manifest entries. No existing acceptance tests found.
