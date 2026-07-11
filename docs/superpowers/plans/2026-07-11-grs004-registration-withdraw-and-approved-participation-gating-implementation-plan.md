# GRS004 / Registration Withdraw And Approved Participation Gating Implementation Plan

## 实施步骤

- [ ] 补设计文档
- [ ] 更新 `src/lib/services/registrations.ts`
- [ ] 更新 `src/app/actions.ts`
- [ ] 更新 Public / Rider / Organizer registration UI
- [ ] 更新 `src/lib/services/ca-connections.ts`
- [ ] 扩展 registration / ui / ca-connection tests
- [ ] 跑聚焦验证
- [ ] 跑 `npm run build`
- [ ] 更新 `docs/superpowers/status.md`

## 验证命令

```bash
node --import tsx --test src/app/actions.registration-review-system-scope.test.ts src/app/_components/public/race-register-page.test.tsx src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx
node --test-concurrency=1 --import tsx --test src/lib/services/registration-review-flow.test.ts src/lib/services/ca-connection-audit.test.ts src/lib/services/ca-rotation-disable.test.ts
npm run build
```
