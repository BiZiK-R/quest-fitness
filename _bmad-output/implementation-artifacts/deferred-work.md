# Deferred work

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-platform-scaffold.md`
  summary: Health не проверяет доступность Postgres
  evidence: AC 1.1 требует smoke health; DB-probe отложен до зрелого ops/health в следующих story.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-platform-scaffold.md`
  summary: Валидация SESSION_SECRET / GYM_TIMEZONE при старте Nest
  evidence: Переменные задокументированы для 1.1, чтение/валидация относится к Story 1.2 (сессии) и AD-17.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-platform-scaffold.md`
  summary: CI-проверка дрейфа openapi.yaml vs Nest export
  evidence: Канон коммитится; авто-`git diff --exit-code` после export — часть полного CI (Deferred spine).

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-platform-scaffold.md`
  summary: Docker healthcheck на backend/frontend сервисах
  evidence: Compose smoke через curl достаточен для 1.1; service_healthy на app-контейнерах не в AC.
