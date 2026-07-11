- 2026-07-11 已完成 `GRS004 / Core flow friendly error surface extension` 的设计、实现与验证：已新增 `docs/superpowers/specs/2026-07-11-grs004-core-flow-friendly-error-surface-extension-design.md` 与 `docs/superpowers/plans/2026-07-11-grs004-core-flow-friendly-error-surface-extension-implementation-plan.md`；`src/lib/action-feedback.ts` 现已扩展到 `organizer_registration / organizer_works / public_register / rider_registration / rider_ca_setup / rider_submission` 六类 scope，并补齐高频业务错误到统一中文提示的映射；`src/app/races/[raceSlug]/register/page.tsx`、`src/app/console/races/[raceSlug]/rider/[section]/page.tsx`、`src/app/console/races/[raceSlug]/organizer/[section]/page.tsx` 已接入 `feedbackScope / feedbackMessage` 查询参数并通过 `ErrorNotice` 渲染页内错误卡片；`RaceRegisterPageView`、`RiderConsolePageView`、`OrganizerConsolePageView` 已补 `returnTo / feedbackReturnTo` 隐藏字段，保证 public 报名、rider 报名/CA setup/submission、organizer 报名审核/作品控制失败后回到原页面而不是暴露原始异常；`approveRegistrationAction`、`rejectRegistrationAction`、`publishWorkAction`、`hideWorkAction`、`lockWorkAction` 现已与 rider 侧 action 一样改为 `try/catch + buildActionFeedbackHref(...) + redirect(returnTo)`；已新增 `src/app/console/races/[raceSlug]/organizer/[section]/page.test.ts` 并更新 `src/app/actions.return-to.test.ts`；聚焦验证 `node --import tsx --test "src/lib/action-feedback.test.ts" "src/app/actions.return-to.test.ts" "src/app/races/[raceSlug]/register/page.test.ts" "src/app/console/races/[raceSlug]/rider/[section]/page.test.ts" "src/app/console/races/[raceSlug]/organizer/[section]/page.test.ts" "src/app/_components/public/race-register-page.test.tsx" "src/app/_components/console/rider-console-page.test.tsx" "src/app/_components/console/organizer-console-page.test.tsx"` 与 `npm run build` 已通过。
# ARY 鐘舵€?

鏈枃璁板綍褰撳墠宸ヤ綔鍖哄凡缁忓畬鎴愮殑 `grs003` 瀵归綈杩涘睍銆侀獙璇佽瘉鎹紝浠ュ強灏氭湭鏀跺彛鐨勬柟鍚戙€傛湰鏂囨。缁熶竴浣跨敤 UTF-8 缂栫爜鍜屼腑鏂囩淮鎶ゃ€?

## 褰撳墠鐘舵€?
- 2026-07-11 已完成 `GRS004 / Judge and screen friendly error surface extension` 的设计、实现与验证：已新增 `docs/superpowers/specs/2026-07-11-grs004-judge-screen-friendly-error-surface-extension-design.md` 与 `docs/superpowers/plans/2026-07-11-grs004-judge-screen-friendly-error-surface-extension-implementation-plan.md`；`src/lib/action-feedback.ts` 已继续扩展 `judge_review / organizer_judges / screen_console` 三类 scope，并补齐评审提交、评委分配、大屏设置相关错误到统一中文提示的映射；`src/app/console/races/[raceSlug]/judge/[section]/page.tsx` 与 `src/app/console/screen/[raceSlug]/[mode]/page.tsx` 已接入 `feedbackScope / feedbackMessage` 查询参数；`JudgeConsolePageView`、`ScreenConsolePageView` 与 organizer judges 表单已补 `ErrorNotice`、`returnTo` 和必要的隐藏回跳字段；`submitJudgingRecordAction`、`assignJudgeToWorkAction`、`removeJudgeAssignmentAction`、`updateScreenDisplayModeAction`、`updateScreenDisplayThemeAction`、`saveRaceTrackCalibrationAction`、`fallbackScreenDisplayToStableAction`、`fallbackScreenDisplayToStaticAction` 现已统一改为 `try/catch + buildActionFeedbackHref(...) + redirect(returnTo)`；聚焦验证 `node --import tsx --test "src/lib/action-feedback.test.ts" "src/app/actions.return-to.test.ts" "src/app/console/races/[raceSlug]/judge/[section]/page.test.ts" "src/app/console/screen/[raceSlug]/[mode]/page.test.ts" "src/app/console/races/[raceSlug]/organizer/[section]/page.test.ts" "src/app/_components/console/judge-console-page.test.tsx" "src/app/_components/console/screen-console-controls.test.tsx" "src/app/_components/console/organizer-console-page.test.tsx"` 与 `npm run build` 已通过。- 2026-07-11 宸插畬鎴?`GRS004 / Entry friendly error surface` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-entry-friendly-error-surface-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-entry-friendly-error-surface-implementation-plan.md`锛沗src/lib/entry-feedback.ts` 鐜板凡鎻愪緵缁熶竴閿欒鐮併€佸弸濂芥彁绀哄拰璺宠浆 helper锛宍src/lib/services/users.ts` 鐨勬湰鍦扮櫥褰?/ 娉ㄥ唽閿欒宸叉敼涓虹粨鏋勫寲 `EntryFeedbackError`锛宍registerAction`銆乣loginAction`銆乣completeProfileAction` 鐜板凡鍦ㄥけ璐ユ椂鍥炲埌 `/login` 鎴?`/profile` 骞跺睍绀哄弸濂介敊璇彁绀猴紱`src/app/_components/ary-shared.tsx` 宸叉柊澧炲叡浜?`ErrorNotice`锛宍src/app/login/page.tsx` 涓?`src/app/profile/page.tsx` 宸叉帴鍏ョ粺涓€閿欒灞曠ず锛涘悓鏃跺凡鏂板 `src/app/error.tsx` 涓?`src/app/global-error.tsx` 浣滀负鏈帴浣忓紓甯哥殑缁熶竴鍏滃簳鐣岄潰锛涘凡鏂板 `src/lib/entry-feedback.test.ts` 涓?`src/app/error-boundary.test.tsx`锛屽苟鏇存柊 `src/app/_components/public/public-auth-entry-regression.test.tsx`銆乣src/app/_components/public/public-copy-cleanup.test.tsx`銆乣src/app/profile/page.test.tsx`銆乣src/app/actions.return-to.test.ts`锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/entry-feedback.test.ts src/app/_components/public/public-auth-entry-regression.test.tsx src/app/_components/public/public-copy-cleanup.test.tsx src/app/profile/page.test.tsx src/app/actions.return-to.test.ts src/app/error-boundary.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Works display copy localization` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-works-display-copy-localization-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-works-display-copy-localization-implementation-plan.md`锛沗src/app/_components/public/works-display.tsx` 鐜板凡鎶?`Works / Showcase`銆乣Featured Work` 鍜?`Works filter and sort` 绛変綔鍝佸睍绀哄ぇ灞忔畫鐣欒嫳鏂囨爣绛炬敹鍙ｄ负 `浣滃搧灞曠ず`銆乣绮鹃€変綔鍝乣 鍜?`浣滃搧绛涢€変笌鎺掑簭`锛涘凡鏇存柊 `src/app/_components/public/works-display.test.tsx`锛屽苟鍥炲綊 `src/app/_components/public/public-phase-label-regression.test.tsx`锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/_components/public/works-display.test.tsx src/app/_components/public/public-phase-label-regression.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Rider CA setup copy localization` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-rider-ca-setup-copy-localization-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-rider-ca-setup-copy-localization-implementation-plan.md`锛沗src/app/_components/console/rider-console-page.tsx` 鐜板凡鎶?`Rider View`銆乣Connector ID`銆乣Secret Version`銆乣Handshake State`銆乣Rotate Connector Secret`銆乣CA Session ID` 绛?Rider 瑙嗗浘涓?`ca-setup` 鍖鸿嫳鏂囨爣绛炬敹鍙ｄ负姝ｅ紡涓枃琛ㄨ揪锛屽苟鍚屾鎶?`APPROVED / SUBMITTED / REJECTED / WITHDRAWN`銆乣ACTIVE / CONNECTED / FAILED / NOT_CONFIGURED`銆乣completed / needs re-handshake`銆乣yes / no / active / not yet` 绛夊父瑙佺姸鎬佸€兼槧灏勪负涓枃鏄剧ず锛涘悓鏃惰繛鎺ュ櫒鎻愮ず璇存槑鍜岃疆鎹㈠悗閲嶆柊鎻℃墜鎻愮ず涔熷凡涓枃鍖栵紱宸叉洿鏂?`src/app/_components/console/rider-console-page.test.tsx`锛屽苟鍥炲綊 `src/app/_components/console/review-readiness-card.test.tsx`锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/review-readiness-card.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Organizer CA status copy localization` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-organizer-ca-status-copy-localization-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-organizer-ca-status-copy-localization-implementation-plan.md`锛沗src/app/_components/console/organizer-console-page.tsx` 鐨?`ca-status` 鍖虹幇宸叉妸 `Trust / Risk Summary`銆乣Connector Security Controls`銆乣Connector Audit Overview`銆乣Secret Version`銆乣Disable Connector` 绛夎嫳鏂囨爣绛炬敹鍙ｄ负姝ｅ紡涓枃琛ㄨ揪锛屽苟鍚屾鎶?`failed / review_needed / trusted`銆乣ACTIVE / CONNECTED / FAILED / NOT_CONFIGURED`銆乣none / low / medium / high`銆乣accepted / rejected / review_needed / integrity_gap` 绛夊父瑙佺姸鎬佸€兼槧灏勪负涓枃鏄剧ず锛涘悓鏃?`registration.status`銆佹彙鎵嬬姸鎬併€佺鐢ㄧ姸鎬佸拰绋冲畾鍗犱綅鏂囨涔熷凡缁熶竴涓枃鍖栵紱宸叉洿鏂?`src/app/_components/console/organizer-console-page.test.tsx`锛屽苟鍥炲綊 `src/app/_components/console/judge-console-page.test.tsx` 涓?`src/app/_components/console/review-readiness-card.test.tsx`锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/judge-console-page.test.tsx src/app/_components/console/review-readiness-card.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Review readiness card localization` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-review-readiness-card-localization-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-review-readiness-card-localization-implementation-plan.md`锛沗src/app/_components/console/review-readiness-card.tsx` 鐜板凡鎶?`Status Badge / CA Ingestion / Internal Evidence / Review Reason / Review Flag` 绛夎嫳鏂囨爣绛炬敹鍙ｄ负涓枃琛ㄨ揪锛屽苟鍚屾鎶?`review_needed / ready`銆乣FAILED / ACTIVE / CONNECTED / NOT_CONFIGURED`銆乣high / medium` 鏄犲皠鎴愭寮忎腑鏂囨樉绀猴紱宸叉柊澧?`src/app/_components/console/review-readiness-card.test.tsx`锛屽苟鏇存柊 `src/app/_components/console/judge-console-page.test.tsx` 涓?`organizer-console-page.test.tsx`锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/_components/console/review-readiness-card.test.tsx src/app/_components/console/judge-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/rider-console-page.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Console phase label normalization` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-console-phase-label-normalization-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-console-phase-label-normalization-implementation-plan.md`锛沗src/app/_components/console/organizer-console-page.tsx`銆乣rider-console-page.tsx`銆乣screen-console-page.tsx` 鐜板凡缁熶竴閫氳繃 `getRacePhaseLabel()` 杈撳嚭闃舵鏂囨锛屼笉鍐嶇洿鎺ユ妸 `active / running / judging / archived` 绛?raw phase key 鏆撮湶缁?organizer / rider / screen 宸ヤ綔鍙扮敤鎴凤紱鍚屾椂 Rider `submission` 鍖轰笌 Screen Console 宸查€夎禌浜嬪ご閮ㄩ兘宸茶ˉ `褰撳墠闃舵` 鏂囨锛涘凡鏇存柊 `src/app/_components/console/organizer-console-page.test.tsx`銆乣rider-console-page.test.tsx`銆乣screen-console-controls.test.tsx`锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/screen-console-controls.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Public phase label normalization` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-public-phase-label-normalization-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-public-phase-label-normalization-implementation-plan.md`锛沗src/lib/race-phase.ts` 鐨?`getRacePhaseLabel()` 鐜板凡鍙洿鎺ユ秷璐硅繍琛屾椂 `string`锛沗src/app/_components/public/public-home-hero.tsx`銆乣home-gallery.tsx`銆乣races-index-page.tsx`銆乣race-page.tsx`銆乣race-register-page.tsx`銆乣live-hall.tsx`銆乣live-display.tsx`銆乣billboard-display.tsx`銆乣leaderboard-display.tsx`銆乣announcement-display.tsx` 鐜板凡缁熶竴閫氳繃 helper 杈撳嚭姝ｅ紡涓枃闃舵鏍囩锛屼笉鍐嶆妸 `running / judging / archived` 绛夊師濮?phase key 鐩存帴鏆撮湶缁欑敤鎴凤紱鍚屾椂 `Race Page` 宸茶ˉ鍥炴洿娓呮櫚鐨?`鍏紑鍏ュ彛 / 涓嬩竴姝ュ叆鍙 缁撴瀯涓庢姤鍚嶆湡鎻愮ず鏂囨锛涘凡鏂板 `src/app/_components/public/public-phase-label-regression.test.tsx`锛屽苟鏇存柊 `src/app/_components/public/billboard-display.test.tsx`锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/_components/public/public-phase-cta-regression.test.tsx src/app/_components/public/public-phase-label-regression.test.tsx src/app/_components/public/billboard-display.test.tsx src/app/_components/public/race-page.test.tsx src/lib/public-site.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Public site 8-phase CTA alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-public-site-8-phase-cta-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-public-site-8-phase-cta-alignment-implementation-plan.md`锛沗src/lib/public-site.ts` 鐜板凡鎶婂叕寮€绔?phase 璇箟浠庢棫鐨?`active / frozen / finished / preparation` 鎵╁睍鍒板綋鍓?8 鐘舵€佹ā鍨嬶紝鍏朵腑 `liveRaces` 鐜板湪璇嗗埆 `running + legacy active/frozen`锛宍getRacePrimaryCta()` 宸茶鐩?`running -> /live`銆乣submitting / judging -> /works`銆乣completed / archived -> /results`锛宍groupPublicRacesByPhase()` 涔熷凡鎶?`submitting / judging` 鏀惰繘 ongoing bucket锛沗src/app/_components/public/home-gallery.tsx` 涓?`src/app/_components/public/races-index-page.tsx` 鐜板凡缁熶竴澶嶇敤杩欏 CTA helper锛屼笉鍐嶆墜鍐欐棫 phase 鍒ゆ柇锛涘悓鏃跺凡鏇存柊 `src/lib/public-site.test.ts` 骞舵柊澧?`src/app/_components/public/public-phase-cta-regression.test.tsx`锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/public-site.test.ts src/app/_components/public/public-phase-cta-regression.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Live Hall 3s refresh baseline` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-live-hall-3s-refresh-baseline-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-live-hall-3s-refresh-baseline-implementation-plan.md`锛沗src/app/_components/public/live-auto-refresh.tsx` 宸叉柊澧炴渶灏?`LiveAutoRefresh` client 缁勪欢锛屽苟鐢?`shouldEnableLiveAutoRefresh()` 鎶?3 绉掕嚜鍔ㄥ埛鏂伴檺瀹氬湪 `registration / running / submitting / judging / active / frozen` 绛夊疄鏃堕樁娈碉紱`src/app/races/[raceSlug]/live/page.tsx` 涓?`src/app/screen/[raceSlug]/live/page.tsx` 鐜板凡鎺ュ叆璇ュ埛鏂版満鍒讹紝浣垮叕寮€ `Live Hall` 涓?`Screen Live Display` 鍦ㄨ繘琛屼腑闃舵鑳芥寔缁?`router.refresh()`锛涘悓鏃跺凡鏂板 `src/app/_components/public/live-auto-refresh.test.ts`锛屽苟鍥炲綊 `src/app/_components/public/live-hall.test.tsx` 涓?`src/app/_components/public/live-display.test.tsx`锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/_components/public/live-auto-refresh.test.ts src/app/_components/public/live-hall.test.tsx src/app/_components/public/live-display.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Remove session single role residue` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-remove-session-single-role-residue-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-remove-session-single-role-residue-implementation-plan.md`锛沗src/lib/auth.ts` 宸茬Щ闄?`SessionUser` / `DatabaseSessionUser` 涓殑鍗曞€?`role` 瀛楁锛宍getSessionUser()` 涓?`loadDatabaseUser()` 鐜板湪閮藉彧杩斿洖 `roles` 闆嗗悎锛沗src/lib/services/users.ts` 涓?`src/lib/github-oauth.ts` 鐨?session 鍒涘缓璺緞涔熷凡涓嶅啀鏋勯€?`role: getDefaultActiveRole(roles)`锛涘悓鏃跺凡鏂板 `src/lib/auth-session-roles-only.test.ts` 浣滀负鏈€灏忓畧鎶ゆ祴璇曪紝骞舵洿鏂?`src/app/_components/public/race-register-page.test.tsx` 鍘绘帀鏃х殑鍗曡鑹插す鍏凤紱鑱氱劍楠岃瘉 `node --import tsx --test src/lib/auth-session-roles-only.test.ts src/app/_components/public/race-register-page.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Remove dead team registration entry` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-remove-dead-team-registration-entry-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-remove-dead-team-registration-entry-implementation-plan.md`锛涘凡浠庝唬鐮佷腑鍒犻櫎涓嶅啀琚换浣曢〉闈娇鐢ㄧ殑 `registerTeamAction()`銆乣registerTeam()` 涓?`registerTeamSchema`锛屼娇鐢ㄦ埛渚ф寮忔姤鍚嶅叆鍙ｅ彧鍓?Registration-first 璺緞锛涘悓鏃跺凡鏇存柊 `src/app/actions.registration-review-system-scope.test.ts` 涓?`src/app/actions.race-archive-system-scope.test.ts` 閲屽鏃?action 鍒嗛殧绗︾殑渚濊禆锛屽苟鍥炲綊 `src/app/_components/console/rider-console-page.test.tsx`銆乣src/lib/services/submissions-work-materialization.test.ts` 浠ョ‘璁?Rider 鎻愪氦閾捐矾鏈璇激锛涜仛鐒﹂獙璇?`node --test-concurrency=1 --import tsx --test src/app/actions.registration-review-system-scope.test.ts src/app/actions.race-archive-system-scope.test.ts src/app/_components/console/rider-console-page.test.tsx src/lib/services/submissions-work-materialization.test.ts` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Rider submission legacy team gate removal` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-rider-submission-legacy-team-gate-removal-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-rider-submission-legacy-team-gate-removal-implementation-plan.md`锛沗src/lib/services/registrations.ts` 宸叉柊澧?`ensureCompatibilityContainerForApprovedRegistration()`锛屾妸鏃?Team 鍏煎瀹瑰櫒鐨勮ˉ寤烘敹鍙ｄ负 `approved registration` 涓嬬殑鍐呴儴鑷剤锛沗src/lib/services/submissions.ts` 涓?`src/lib/services/works.ts` 鐜板湪閮戒細鍦ㄦ寮忔彁浜ゆ垨淇濆瓨鑽夌鍓嶅厛璋冪敤璇?helper锛屼笉鍐嶅洜涓虹己澶辨棫 Team 瀹瑰櫒鐩存帴鎶ラ敊锛沗src/app/_components/console/rider-console-page.tsx` 鐨?`submission` section 涔熷凡绉婚櫎 `!riderTeam` 鐨勯樆鏂?gate锛屾渶杩戞彁浜ゅ垪琛ㄦ敼涓轰紭鍏堟寜 `registrationId` 杩囨护锛屼笉鍐嶅己渚濊禆 team锛涘凡鎵╁睍 `src/lib/services/submissions-work-materialization.test.ts` 瑕嗙洊缂哄け compatibility container 鏃剁殑鑷姩琛ュ缓涓庢垚鍔熸彁浜わ紝骞舵墿灞?`src/app/_components/console/rider-console-page.test.tsx` 瑕嗙洊 approved registration + `riderTeam=null` 浠嶅彲缁х画鎻愪氦锛涜仛鐒﹂獙璇?`node --test-concurrency=1 --import tsx --test src/app/_components/console/rider-console-page.test.tsx src/lib/services/submissions-work-materialization.test.ts src/lib/services/submissions.test.ts` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / P0 one-click regression runner` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-p0-one-click-regression-runner-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-p0-one-click-regression-runner-implementation-plan.md`锛涗粨搴撳凡鏂板 `scripts/grs004-p0-regression.mjs`锛屽苟鍦?`package.json` 涓毚闇?`test:p0 / qa:p0` 姝ｅ紡鍏ュ彛锛涜鑴氭湰浼氭寜 `Auth/Profile/Role Governance -> Console Access/System Scope -> Race Lifecycle -> Registration/CA Participation -> CA Ingestion/Projection/Live/Screen -> Work Submission/Visibility/Public Routes -> Judging/Awards/Reports/Public Results -> Production Build` 鍒嗙粍椤哄簭鎵ц鐜版湁閫氳繃鐨勮仛鐒︽祴璇曪紝骞跺湪鏁版嵁搴撶浉鍏冲垎缁勫墠鑷姩 `db:seed`锛涘悓鏃跺凡鏂板 `src/app/actions.user-roles-admin-scope.test.ts` 瑕嗙洊 `updateUserRolesAction` 鐨?admin-only wiring锛屽苟淇 `src/lib/services/race-archive-scope.test.ts` 鐨勬椂闂寸獥鍙ｆ紓绉婚棶棰橈紱鏈€缁堥獙璇?`npm run qa:p0` 宸插畬鏁撮€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Admin race console system-scope access` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-admin-race-console-system-scope-access-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-admin-race-console-system-scope-access-implementation-plan.md`锛沗src/lib/viewer-access.ts` 鐜板湪浼氭妸 `ADMIN` 绾冲叆 `races` section锛屽苟鍏佽 Admin 閫氳繃 `organizer` 瑙嗗浘杩涘叆 race workspace锛沗src/lib/services/console-routes.ts` 鐜板湪浼氫负 `ADMIN` 杩斿洖鍏ㄩ儴 races 鐨?organizer-route entries锛屼娇 Admin 鑳芥寜 system scope 杩涘叆 `/console/races/{raceSlug}/organizer/*`锛沗src/app/_components/console/console-races-page.tsx` 鐨勭┖鐘舵€佹枃妗堜篃宸插幓鎺夊彧鍋忓悜 organizer/rider/judge 鐨勬棫鎻忚堪锛涘凡鎵╁睍 `src/lib/viewer-access.test.ts` 涓?`src/lib/services/console-routes.test.ts`锛屽苟鍥炲綊 `src/app/console/page.test.tsx`銆乣src/app/console/races/page.test.tsx`锛岃鐩?Admin 鐨?races section銆乺ace root access銆乤dmin organizer view access 浠ュ強 system-scope race list/detail lookup锛涜仛鐒﹂獙璇?`node --test-concurrency=1 --import tsx --test src/app/console/page.test.tsx src/app/console/races/page.test.tsx src/lib/viewer-access.test.ts src/lib/services/console-routes.test.ts` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Rider work submission readiness prompts` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-rider-work-submission-readiness-prompts-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-rider-work-submission-readiness-prompts-implementation-plan.md`锛沗src/app/_components/console/rider-console-page.tsx` 鐨?`submission` section 鐜板湪浼氬熀浜庣幇鏈?`buildReviewReadinessSummary()` 鍜?`ReviewReadinessCard` 鏄剧ず `鎻愪氦鍓嶆彁绀篳锛屾妸 `aggregateIngestionStatus`銆佸唴閮ㄨ瘉鎹己鍙ｅ拰绌轰綔鍝侀闄╃洿鎺ュ睍绀虹粰 Rider锛涜鎻愮ず鍙礋璐ｈ〃杈?`FAILED / NOT_CONFIGURED / no_internal_evidence / empty_work / missing_work` 绛夐闄╋紝涓嶄細闃绘柇 `淇濆瓨浣滃搧鑽夌 / 鎻愪氦浠ｇ爜 / 鎻愪氦璧涘悗浠ｇ爜涓?Riding Record`锛涘凡鎵╁睍 `src/app/_components/console/rider-console-page.test.tsx` 瑕嗙洊 `CA 鎺ュ叆澶辫触 + 缂哄皯鍐呴儴璇佹嵁` 鏃?Rider 浠嶅彲鎻愪氦锛屽苟澶嶇敤 `src/lib/review-readiness-helpers.test.ts` 浣滀负 helper 璇箟鍥炲綊锛涜仛鐒﹂獙璇?`node --test-concurrency=1 --import tsx --test src/app/_components/console/rider-console-page.test.tsx src/lib/review-readiness-helpers.test.ts` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Work create submit materialization` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-work-create-submit-materialization-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-work-create-submit-materialization-implementation-plan.md`锛沗src/lib/validation.ts` 宸叉柊澧?`saveWorkDraftSchema`锛屽苟鎶?`createSubmissionSchema / createFinalSubmissionSchema` 鎵╁睍涓哄悓鏃舵敹闆?`workTitle / workSummary / demoUrl / repoUrl / videoUrl / techNotes`锛沗src/lib/services/works.ts` 宸叉柊澧?`saveWorkDraftForRider()` 涓?`upsertSubmittedWorkForRegistration()`锛屽叾涓?Rider 淇濆瓨鑽夌浼氭妸 `Work` 钀芥垚 `DRAFT + PRIVATE`锛屾寮忔彁浜や細钀芥垚 `SUBMITTED + PRIVATE`锛屼笖 `LOCKED` work 浼氭嫆缁濆悗缁?rider draft / submit 瑕嗙洊锛沗src/lib/services/submissions.ts` 鐜板湪浼氬湪鍒涘缓 `Submission / SubmissionArtifact` 鍓嶅悓姝ョ墿鍖栨垨鏇存柊姝ｅ紡 `Work` 璧勪骇锛沗src/app/actions.ts` 宸叉柊澧?`saveWorkDraftAction()`锛屽苟鎶?rider submit actions 琛ュ埌 race/public/organizer/rider 鐩稿叧 revalidate锛沗src/app/_components/submission-form-client.tsx` 涓?`src/app/_components/final-submission-form-client.tsx` 鐜板湪浼氬悓鏃舵敹闆嗘渶灏忎綔鍝佸瓧娈靛苟鎻愪緵 `淇濆瓨浣滃搧鑽夌`锛沗src/app/_components/console/rider-console-page.tsx` 鐨?`submission` section 鐜板湪浼氭樉绀?`褰撳墠浣滃搧璧勪骇`锛屽苟鍦?draft 鐘舵€佷笅鎻愪緵 `闅愯棌褰撳墠鑽夌`锛涙柊澧?`src/lib/services/submissions-work-materialization.test.ts` 涓?`src/app/actions.work-create-submit-scope.test.ts`锛屽苟鎵╁睍 `src/app/_components/submission-form-client.test.tsx`銆乣src/app/_components/final-submission-form-client.test.tsx`銆乣src/app/_components/console/rider-console-page.test.tsx`銆乣src/lib/services/submissions.test.ts`銆乣src/lib/services/material-integrity-submissions.test.ts` 瑕嗙洊 Rider draft銆丼ubmission -> Work 鐗╁寲銆乫inal submission 鐗╁寲銆乴ocked work reject銆乺ider draft action wiring 涓?Rider submission UI锛涜仛鐒﹂獙璇?`node --test-concurrency=1 --import tsx --test src/lib/services/submissions-work-materialization.test.ts src/app/actions.work-create-submit-scope.test.ts src/app/_components/submission-form-client.test.tsx src/app/_components/final-submission-form-client.test.tsx src/app/_components/console/rider-console-page.test.tsx src/lib/services/submissions.test.ts src/lib/services/material-integrity-submissions.test.ts`銆乣node --test-concurrency=1 --import tsx --test src/lib/services/submissions-work-materialization.test.ts src/app/actions.work-create-submit-scope.test.ts src/app/_components/submission-form-client.test.tsx src/app/_components/final-submission-form-client.test.tsx src/app/_components/console/rider-console-page.test.tsx src/lib/services/submissions.test.ts src/lib/services/material-integrity-submissions.test.ts src/app/actions.work-visibility-lifecycle-scope.test.ts src/lib/services/work-visibility-lifecycle-scope.test.ts src/lib/services/public-routes.test.ts src/app/_components/console/organizer-console-page.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Work visibility lifecycle baseline` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-work-visibility-lifecycle-baseline-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-work-visibility-lifecycle-baseline-implementation-plan.md`锛沗src/lib/services/works.ts` 宸叉柊澧?`isWorkPublic()`銆乣sanitizePublicWork()`銆乣publishWorkForRace()`銆乣hideWorkForRace()`銆乣lockWorkForRace()`锛屽叾涓叕寮€璇婚摼璺幇鍦ㄨ姹?`visibility === PUBLIC` 涓?`status !== DRAFT / HIDDEN`锛沗src/app/actions.ts` 宸叉柊澧?`publishWorkAction()`銆乣hideWorkAction()`銆乣lockWorkAction()`锛沗src/lib/services/public-routes.ts` 宸叉敼涓哄湪 race / work / rider 涓夋潯鍏紑璇婚摼璺笂缁熶竴杩囨护鏈叕寮€浣滃搧锛沗src/app/_components/console/organizer-console-page.tsx` 鐨?`works` section 鐜板湪浼氭樉绀?`鍙鎬锛屽苟鎻愪緵 `闅愯棌浣滃搧 / 鍏紑浣滃搧 / 閿佸畾浣滃搧` 鏈€灏忔帶鍒讹紱鏂板 `src/app/actions.work-visibility-lifecycle-scope.test.ts` 涓?`src/lib/services/work-visibility-lifecycle-scope.test.ts`锛屽苟鎵╁睍 `src/lib/services/public-routes.test.ts`銆乣src/app/_components/console/organizer-console-page.test.tsx` 瑕嗙洊 managed-race/system scope銆乺ider own draft hide銆佸叕寮€璺敱鎺掗櫎 hidden/private/draft work锛屼互鍙?Organizer works UI 鐢熷懡鍛ㄦ湡鎸夐挳锛涜仛鐒﹂獙璇?`node --test-concurrency=1 --import tsx --test src/app/actions.work-visibility-lifecycle-scope.test.ts src/lib/services/work-visibility-lifecycle-scope.test.ts src/lib/services/public-routes.test.ts src/app/_components/console/organizer-console-page.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / JudgeAssignment remove baseline` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-judge-assignment-remove-baseline-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-judge-assignment-remove-baseline-implementation-plan.md`锛沗src/lib/services/judging.ts` 宸叉柊澧?`removeJudgeAssignment()`锛屽苟娌跨敤鐜版湁 `assignJudgeToWork()` 鐨?`managed race | system` 鍒ゅ畾閫昏緫锛沗src/app/actions.ts` 宸叉柊澧?`removeJudgeAssignmentAction()`锛沗src/app/_components/console/organizer-console-page.tsx` 鐨?`judges` section 鐜板湪浼氬湪宸叉湁 assignment 鏃舵樉绀?`绉婚櫎鍒嗛厤` 鍏ュ彛锛涙柊澧?`src/app/actions.judge-assignment-remove-scope.test.ts`锛屽苟鎵╁睍 `src/lib/services/judging-assignment-scope.test.ts` 涓?`src/app/_components/console/organizer-console-page.test.tsx`锛岃鐩?remove action wiring銆乫oreign organizer 鎷掔粷銆乤dmin/system 鎴愬姛鍜?Organizer judges UI 涓殑 remove 鎸夐挳锛涜仛鐒﹂獙璇?`node --test-concurrency=1 --import tsx --test src/app/actions.judge-assignment-remove-scope.test.ts src/lib/services/judging-assignment-scope.test.ts src/app/_components/console/organizer-console-page.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Registration withdraw and approved participation gating` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-registration-withdraw-and-approved-participation-gating-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-registration-withdraw-and-approved-participation-gating-implementation-plan.md`锛沗src/lib/services/registrations.ts` 宸叉柊澧?`withdrawRegistrationForRace()`锛屽叾涓?Rider own 璺緞鎸夊綋鍓嶉」鐩殑鏈€灏忚惤鍦版妸 `own before locked` 鏄犲皠涓?`Race.phase === "registration"` 鎵嶈兘鑷鎾ゅ洖锛孫rganizer/Admin 鍒欏彲鎸?exception 鎵ц鎾ゅ洖锛沗src/app/actions.ts` 宸叉柊澧?`withdrawRegistrationAction()`锛沗src/app/_components/public/race-register-page.tsx`銆乣src/app/_components/console/rider-console-page.tsx`銆乣src/app/_components/console/organizer-console-page.tsx` 宸插悓姝ヨˉ涓?`鎾ゅ洖鎶ュ悕 / 鏍囪閫€璧沗 鍏ュ彛鍜?`WITHDRAWN` 鐘舵€佸睍绀猴紱鍚屾椂 `src/lib/services/ca-connections.ts` 宸叉妸 `createCAConnectionForRaceProject()` 涓?`rotateCAConnectionSecretForRider()` 鏀跺彛涓哄繀椤?`registration.status === "APPROVED"`锛屼笌涓婁竴杞凡琛ョ殑 submission / snapshot fetch approved gating 淇濇寔涓€鑷达紱骞跺凡鎵╁睍 `src/lib/services/registration-review-flow.test.ts`銆乣src/app/actions.registration-review-system-scope.test.ts`銆乣src/app/_components/public/race-register-page.test.tsx`銆乣src/app/_components/console/rider-console-page.test.tsx`銆乣src/app/_components/console/organizer-console-page.test.tsx`銆乣src/lib/services/ca-connection-audit.test.ts`銆乣src/lib/services/ca-rotation-disable.test.ts` 瑕嗙洊 rider own withdraw銆乷rganizer exception withdraw銆乴ocked self-withdraw reject銆亀ithdraw UI 鍜?non-approved CA self-service reject锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/actions.registration-review-system-scope.test.ts src/app/_components/public/race-register-page.test.tsx src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx`銆乣node --test-concurrency=1 --import tsx --test src/lib/services/registration-review-flow.test.ts src/lib/services/ca-connection-audit.test.ts src/lib/services/ca-rotation-disable.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Rider snapshot fetch own-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-rider-snapshot-fetch-own-scope-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-rider-snapshot-fetch-own-scope-implementation-plan.md`锛沗src/app/actions.ts` 涓?`fetchCASnapshotAction()` 宸蹭笉鍐嶅彧鍋?`RIDER` 瑙掕壊闂ㄦ锛岃€屾槸浼氭妸 `user.id` 鏄惧紡浼犲叆 `fetchCASessionSnapshotForConnection()`锛沗src/lib/services/ca-fetch.ts` 宸蹭负 rider 瑙﹀彂鐨?snapshot fetch 琛ヤ笂 own-scope 鏍￠獙锛氬綋浼犲叆 `userId` 鏃讹紝蹇呴』鍛戒腑褰撳墠 `CAConnection -> RaceProject -> Registration` 鐨?owner锛屼笖璇?`Registration` 蹇呴』宸茬粡 `APPROVED`锛屽惁鍒欎細鍦ㄧ湡姝ｅ彂璧?fetch 鍓嶇洿鎺ユ嫆缁濓紱鏂板 `src/app/actions.rider-snapshot-own-scope.test.ts` 涓?`src/lib/services/ca-fetch-rider-scope.test.ts` 瑕嗙洊 action wiring銆乫oreign rider 鎷掔粷鍜?non-approved registration 鎷掔粷锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/actions.rider-snapshot-own-scope.test.ts src/lib/services/ca-fetch-rider-scope.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Registration review lifecycle baseline` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-registration-review-lifecycle-baseline-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-registration-review-lifecycle-baseline-implementation-plan.md`锛沗src/lib/registration-helpers.ts` 涓柊鎶ュ悕榛樿鐘舵€佸凡浠庣洿鎺?`APPROVED` 鏀跺彛涓?`SUBMITTED`锛屽彧鏈?`APPROVED` 鎵嶄細瑙﹀彂 `ensureRaceProject / ensureCompatibilityTeam`锛沗src/lib/services/registrations.ts` 宸叉柊澧?`approveRegistrationForRace()` 涓?`rejectRegistrationForRace()`锛屽苟鎸?`managed race | system` 鍋氱湡瀹?organizer/admin 杈圭晫鏍￠獙锛沗src/app/actions.ts` 宸叉柊澧?`approveRegistrationAction()` 涓?`rejectRegistrationAction()`锛沗src/app/_components/console/organizer-console-page.tsx` 鐨勬姤鍚嶅垪琛ㄧ幇鍦ㄤ細涓?`SUBMITTED` 鎶ュ悕鏄剧ず `鎵瑰噯鎶ュ悕 / 鎷掔粷鎶ュ悕`锛沗src/app/_components/public/race-register-page.tsx` 涓?`src/app/_components/console/rider-console-page.tsx` 宸叉敼涓烘寜 `APPROVED / SUBMITTED / REJECTED` 灞曠ず鎶ュ悕鐘舵€侊紝涓斿彧鏈?`APPROVED` 鎵嶈В閿?`RaceProject / CA setup / submission` 鍙傝禌涓婁笅鏂囷紱`src/lib/services/submissions.ts` 涔熷凡鏄庣‘瑕佹眰 `registration.status === "APPROVED"` 鎵嶅厑璁告彁浜わ紱鏂板 `src/lib/services/registration-review-flow.test.ts` 涓?`src/app/actions.registration-review-system-scope.test.ts`锛屽苟鎵╁睍 `src/lib/registration-helpers.test.ts`銆乣src/app/_components/public/race-register-page.test.tsx`銆乣src/app/_components/console/rider-console-page.test.tsx`銆乣src/app/_components/console/organizer-console-page.test.tsx` 瑕嗙洊 submitted 鍩虹嚎銆乤pprove/reject scope銆丷ider 寰呭鏍哥姸鎬佸拰 Organizer 瀹℃牳鎸夐挳锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/registration-helpers.test.ts src/lib/services/registration-review-flow.test.ts src/app/actions.registration-review-system-scope.test.ts src/app/_components/public/race-register-page.test.tsx src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Award Report Announcement system-scope service hardening` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-award-report-announcement-system-scope-service-hardening-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-award-report-announcement-system-scope-service-hardening-implementation-plan.md`锛涘鏌ュ彂鐜?`src/lib/services/awards.ts`銆乣src/lib/services/reports.ts`銆乣src/lib/services/announcements.ts` 铏界劧涓婁竴杞凡缁忔湁 `allowSystem?: boolean` 绛惧悕鍜?action 灞?`ADMIN | ORGANIZER` 鍙屽叆鍙ｏ紝浣?managed helper 浠嶅湪淇′换瑁?`allowSystem`锛涙湰杞凡琛ラ綈鐪熷疄 Admin role 鏍￠獙锛屽洜姝?`generateAwardDraftsForRace() / updateAwardDraftForRace() / publishAwardsForRace() / withdrawPublishedAwardsForRace()`銆乣generateReportsForRace() / updateReportDraftForRace() / markReportReviewedForRace() / publishReportForRace()`銆乣createAnnouncementDraftForRace() / updateAnnouncementDraftForRace() / publishAnnouncementForRace() / hideAnnouncementForRace()` 鐜板湪閮藉彧鍏佽褰撳墠璧涗簨 organizer 鎴栫湡瀹?`ADMIN` 浣跨敤 system scope锛涘苟宸叉墿灞?`src/lib/services/awards-draft-withdraw.test.ts`銆乣src/lib/services/reports-generation.test.ts`銆乣src/lib/services/announcements.test.ts`锛岃鐩?foreign organizer + `allowSystem` 鎷掔粷銆乤dmin/system 鎴愬姛璺緞锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/actions.managed-race-system-access.test.ts src/lib/services/awards-draft-withdraw.test.ts src/lib/services/reports-generation.test.ts src/lib/services/announcements.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / ScreenDisplay system-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-screen-display-system-scope-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-screen-display-system-scope-alignment-implementation-plan.md`锛沗src/lib/services/screen-display.ts` 涓?`getRaceForManagedScreenDisplayAction()` 宸蹭笉鍐嶆妸瑁?`allowSystem` 鐩存帴瑙嗕綔 system exception锛岃€屾槸鏀逛负鍚屾椂璇诲彇褰撳墠鐢ㄦ埛 `rolesJson`锛屽彧鏈夌湡瀹?`ADMIN` 鎵嶈兘鍦ㄩ潪鑷繁缁勭粐璧涗簨涓婁娇鐢?`allowSystem: true` 绠＄悊 ScreenDisplay锛涘洜姝?`updateScreenDisplayModeForRace()`銆乣updateScreenDisplayThemeForRace()`銆乣fallbackScreenDisplayToStableProjection()`銆乣fallbackScreenDisplayToStaticNotice()` 杩?4 涓唴閮ㄧ淮鎶ゅ姩浣滅幇鍦ㄩ兘宸插榻?`docs/grs004/ary-permission-matrix.md` 涓?`ScreenDisplay.configure / switch_mode / fallback_*` 鐨?`managed race | system` 杈圭晫锛涙柊澧?`src/app/actions.screen-display-system-scope.test.ts` 閿佸畾 4 涓?screen display action 浠嶄负 `ADMIN | ORGANIZER` 鍙屽叆鍙ｏ紝骞舵墿灞?`src/lib/services/screen-display.test.ts` 瑕嗙洊 foreign organizer + `allowSystem` 鎷掔粷銆乤dmin/system 璺ㄨ禌浜嬫垚鍔燂紱鑱氱劍楠岃瘉 `node --import tsx --test src/app/actions.screen-display-system-scope.test.ts src/lib/services/screen-display.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Legacy TeamComment FeedbackReply system-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-legacy-team-comment-feedback-system-scope-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-legacy-team-comment-feedback-system-scope-alignment-implementation-plan.md`锛沗src/app/actions.ts` 涓?`updateTeamCommentAction()` 涓?`replyFeedbackAction()` 宸蹭粠绾?`requireRole("ORGANIZER")` 鏀跺彛涓?`ADMIN | ORGANIZER` 鍙屽叆鍙ｏ紝骞剁粺涓€琛ヤ笂璧勬枡瀹屾暣鎬ч棬妲涘拰 `allowSystem: hasRole(user.roles, "ADMIN")` 浼犻€掞紱`src/lib/services/teams.ts` 涓?`updateTeamComment()` 鐜板凡澶嶇敤 `assertManagedRaceActionAccess()`锛屼笉鍐嶅厑璁?foreign organizer 闈?team 缁村害璺ㄨ禌浜嬪啓娉ㄩ噴锛沗src/lib/services/feedback.ts` 涓?`replyFeedback()` 鐜板凡鍏堥€氳繃 thread 鍙嶆煡鎵€灞?`raceId` 鍐嶆牎楠?`managed race | system` 杈圭晫锛岀‘淇?legacy compatibility path 閲岀殑 `FeedbackReply` 涔熺湡姝ｅ榻愭潈闄愮煩闃碉紱鏂板 `src/app/actions.legacy-compatibility-system-scope.test.ts` 涓?`src/lib/services/legacy-compatibility-scope.test.ts` 瑕嗙洊 action wiring銆乫oreign organizer 鎷掔粷鍜?admin/system 鎴愬姛璺緞锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/actions.legacy-compatibility-system-scope.test.ts src/lib/services/legacy-compatibility-scope.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Compatibility runner eval system-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-compatibility-runner-eval-system-scope-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-compatibility-runner-eval-system-scope-alignment-implementation-plan.md`锛沗src/app/actions.ts` 涓?`runCompatibilityProgressEvalAction()` 涓?`runCompatibilityHarnessEvalAction()` 宸蹭粠绾?`requireRole("ORGANIZER")` 鏀跺彛涓?`ADMIN | ORGANIZER` 鍙屽叆鍙ｏ紝骞跺湪鐪熸鎵ц `enqueueProgressEvalTasks(raceId)` / `enqueueHarnessEvalTasks(raceId)` 鍓嶅厛璋冪敤 `assertManagedRaceActionAccess()` 鏍￠獙褰撳墠鐢ㄦ埛鏄惁鎷ユ湁璇ヨ禌浜嬬殑 `managed race | system` 鑼冨洿锛涙柊澧?`src/app/actions.compatibility-runner-system-scope.test.ts` 瑕嗙洊涓ゆ潯 compatibility runner eval action 鐨?action wiring锛屼笉鍐嶅厑璁?Organizer-only 涓斿繀椤诲厛璧?managed-race helper锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/actions.compatibility-runner-system-scope.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Race snapshot system-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-race-snapshot-system-scope-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-race-snapshot-system-scope-alignment-implementation-plan.md`锛沗src/app/actions.ts` 涓?`generateRaceSnapshotAction()` 宸蹭粠绾?`requireRole("ORGANIZER")` 鏀跺彛涓?`ADMIN | ORGANIZER` 鍙屽叆鍙ｏ紝骞跺湪鐪熸鎵ц `generateRaceSnapshot(raceId)` 鍓嶅厛璋冪敤 `assertManagedRaceActionAccess()` 鏍￠獙褰撳墠鐢ㄦ埛鏄惁鎷ユ湁璇ヨ禌浜嬬殑 `managed race | system` 鑼冨洿锛涙柊澧?`src/app/actions.race-snapshot-system-scope.test.ts` 瑕嗙洊 action wiring锛屼笉鍐嶅厑璁?Organizer-only 涓斿繀椤诲厛璧?managed-race helper锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/actions.race-snapshot-system-scope.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Race publish system-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-race-publish-system-scope-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-race-publish-system-scope-alignment-implementation-plan.md`锛沗src/lib/services/races.ts` 涓?`createRace()` 鐜板凡榛樿鍒涘缓 `status="draft"` 鐨勮禌浜嬶紝骞舵柊澧?`publishRace()` 鎶?`draft` 璧涗簨鎸?`managed race | system` 杈圭晫鎺ㄨ繘鍒?`published`锛沗src/lib/race-phase.ts` 鐜板凡鎶?`draft / archived / submitting / judging / completed` 瑙嗕綔鏄惧紡鐘舵€侊紝鍚屾椂璁?`published / registration / running / null` 缁х画鎸夋椂闂磋嚜鍔ㄦ帹杩涳紝浠庤€屽舰鎴?`draft -> published -> registration -> running -> completed` 鐨勬渶灏忛棴鐜紱`src/lib/services/public-routes.ts` 宸插紑濮嬭繃婊?`draft` 璧涗簨锛屼繚璇佹湭鍙戝竷璧涗簨涓嶈繘鍏ュ叕寮€绔紱`src/lib/public-site.ts` 涓?`src/app/_components/public/race-page.tsx` 宸插悓姝ヨˉ榻?`published` 鐨勫叕寮€璇箟涓?CTA锛沗src/app/actions.ts` 涓凡鏂板 `publishRaceAction()`锛宍src/app/_components/console/organizer-console-page.tsx` 鐨勮缃〉涔熷凡鏂板鏈€灏忊€滆禌浜嬪彂甯冣€濋潰鏉垮拰鈥滃彂甯冭禌浜嬧€濇寜閽紱鏂板 `src/app/actions.race-publish-system-scope.test.ts`銆乣src/lib/services/race-publish-scope.test.ts`锛屽苟鎵╁睍 `src/lib/services/public-routes.test.ts`銆乣src/lib/public-site.test.ts`銆乣src/app/_components/console/organizer-console-page.test.tsx`锛岃鐩?create 榛樿 draft銆乨raft 涓嶈繘鍏ュ叕寮€绔€乸ublish 鐨?`managed race | system` 杈圭晫銆乸ublished CTA 涓庤缃〉鍙戝竷鍏ュ彛锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/actions.race-publish-system-scope.test.ts src/lib/services/race-publish-scope.test.ts src/lib/services/public-routes.test.ts src/lib/public-site.test.ts src/app/_components/console/organizer-console-page.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Race archive system-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-race-archive-system-scope-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-race-archive-system-scope-alignment-implementation-plan.md`锛沗src/app/actions.ts` 涓凡鏂板 `archiveRaceAction()` 骞舵浛鎹㈡帀褰撳墠瀵瑰鏆撮湶鐨勬竻绌哄叆鍙ｏ紝鐜版寜 `ADMIN | ORGANIZER` 鍙屽叆鍙ｆ墽琛?`archiveRace()` 鑰屼笉鍐嶈皟鐢?delete-like 鐨?`clearRace()`锛沗src/lib/services/races.ts` 涓凡鏂板 `archiveRace()`锛屽厛澶嶇敤 `assertManagedRaceActionAccess()` 鍋?`managed race | system` 杈圭晫鏍￠獙锛屽啀瑕佹眰 phase 宸叉槸 `completed / finished / archived`锛屾渶鍚庢妸 `Race.status` 鍐欎负 `archived`锛屼笉鍐嶅垹闄よ禌浜嬩簨瀹烇紱`src/app/_components/console/organizer-console-page.tsx` 鐨勭淮鎶ら潰鏉挎寜閽凡浠庘€滄竻绌鸿禌浜嬧€濇敼涓衡€滃綊妗ｈ禌浜嬧€濓紝骞惰ˉ鍏呰鏄庘€滀繚鐣欒禌鏋溿€佷綔鍝佷笌澶嶇洏璧勪骇鈥濓紱`src/lib/public-site.ts` 涓?`src/app/_components/public/home-gallery.tsx` 宸插悓姝ユ妸 `archived` 瑙嗕綔璧涘悗璧涗簨锛屼娇鍏剁户缁繘鍏?`latestResults / pastRaces / featuredWorks / 鏌ョ湅璧涙灉 CTA` 绛夊叕寮€鍏ュ彛锛涙柊澧?`src/app/actions.race-archive-system-scope.test.ts`銆乣src/lib/services/race-archive-scope.test.ts` 骞舵墿灞?`src/lib/public-site.test.ts` 瑕嗙洊 action wiring銆乫oreign organizer 鎷掔粷銆乤dmin/system 鎴愬姛銆侀潪璧涘悗闃舵鎷掔粷浠ュ強 archived 璧涘悗鍙鎬э紱鑱氱劍楠岃瘉 `node --import tsx --test src/app/actions.race-archive-system-scope.test.ts src/lib/services/race-archive-scope.test.ts src/lib/public-site.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Race create system-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-race-create-system-scope-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-race-create-system-scope-alignment-implementation-plan.md`锛沗src/lib/viewer-access.ts` 涓?`getCreateRacePageAccess()` 宸蹭粠 Organizer-only 鏀惧鍒?`ADMIN | ORGANIZER`锛宍src/app/console/races/new/page.tsx` 鐜颁細鍦?Admin 杩涘叆鍒涘缓椤垫椂鍔犺浇 organizer 鍒楄〃骞朵紶缁欏垱寤鸿〃鍗曪紝`src/app/_components/create-race-form-client.tsx` 涔熷凡鏂板鏈€灏?`organizerId` 閫夋嫨瀛楁锛沗src/app/actions.ts` 涓?`createRaceAction()` 宸蹭粠绾?`requireRole("ORGANIZER")` 鏀跺彛涓?`ADMIN | ORGANIZER` 鍙屽叆鍙ｏ紝骞跺湪 Admin system create 璺緞涓嬫樉寮忚鍙?`formData.organizerId`锛沗src/lib/services/races.ts` 涓?`createRace()` 宸叉敼涓哄尯鍒?`actorUserId` 涓庣洰鏍?`organizerId`锛岀‘淇?organizer 鍙兘涓鸿嚜宸卞垱寤猴紝鑰?Admin 鍙兘浠ｈ〃鐪熷疄鎷ユ湁 `ORGANIZER` role 鐨勮处鍙峰垱寤猴紝涓嶈兘鎶婅禌浜嬫寕鍒伴潪 organizer 璐﹀彿涓嬶紱鏂板 `src/app/actions.race-create-system-scope.test.ts` 涓?`src/lib/services/race-create-scope.test.ts`锛屽苟鏇存柊 `src/lib/viewer-access.test.ts` 瑕嗙洊 Admin 鍒涘缓椤靛噯鍏ャ€丄dmin 浠?Organizer 鍒涘缓鎴愬姛銆乫oreign organizer + `allowSystem` 鎷掔粷銆侀潪 organizer 鐩爣鎷掔粷锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/viewer-access.test.ts src/app/actions.race-create-system-scope.test.ts src/lib/services/race-create-scope.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Race edit system-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-race-edit-system-scope-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-race-edit-system-scope-alignment-implementation-plan.md`锛沗src/app/actions.ts` 涓?`updateRaceAction()`銆乣updateOrganizerCommentAction()`銆乣updateDisplayOptionsAction()` 宸蹭粠绾?`requireRole("ORGANIZER")` 鏀跺彛涓?`ADMIN | ORGANIZER` 鍙屽叆鍙ｏ紝骞剁粺涓€鍚?`updateRaceContent()`銆乣updateOrganizerComment()`銆乣updateRaceDisplayOptions()` 浼犲叆 `allowSystem: hasRole(user.roles, "ADMIN")`锛沗src/lib/services/races.ts` 涓繖 3 涓?service 鐜板凡澶嶇敤 `assertManagedRaceActionAccess()`锛屾妸 `Race.edit` 鐨勭湡瀹炲啓杈圭晫鏀跺彛涓衡€滃綋鍓嶈禌浜?organizer 鎴栫湡瀹?Admin system鈥濓紝鍚屾椂淇濈暀 `finished race` 涓嶈兘缁х画淇敼棰樼洰涓庤缁冩暟鎹殑鐜版湁涓氬姟瑙勫垯锛涙柊澧為暱搴﹁緝灏忕殑 action wiring 娴嬭瘯 `src/app/actions.race-edit-system-scope.test.ts` 涓?service scope 娴嬭瘯 `src/lib/services/race-edit-scope.test.ts`锛岃鐩?foreign organizer + `allowSystem` 鎷掔粷銆乤dmin/system 鎴愬姛淇敼 race content / organizer comment / display options锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/actions.race-edit-system-scope.test.ts src/lib/services/race-edit-scope.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / CA connection management system-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-ca-connection-management-system-scope-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-ca-connection-management-system-scope-alignment-implementation-plan.md`锛沗src/app/actions.ts` 涓?`disableCAConnectionAction()` / `enableCAConnectionAction()` 宸蹭粠绾?`requireRole("ORGANIZER")` 鏀跺彛涓?`ADMIN | ORGANIZER` 鍙屽叆鍙ｏ紝骞剁粺涓€鍚?`disableCAConnectionForOrganizer()` / `enableCAConnectionForOrganizer()` 浼犲叆 `allowSystem: hasRole(user.roles, "ADMIN")`锛沗src/lib/services/ca-connections.ts` 宸叉柊澧?`getManagedCAConnectionForAction()`锛屾妸 disable / enable 鐨勭湡瀹炲啓杈圭晫鏀跺彛涓衡€滃綋鍓嶈禌浜?organizer 鎴栫湡瀹?Admin system exception鈥濓紝foreign organizer 鍗充娇浼?`allowSystem: true` 涔熶笉鑳借秺鏉冿紱鏂板闀垮害杈冨皬鐨?action wiring 娴嬭瘯 `src/app/actions.ca-connection-system-scope.test.ts`锛屽苟鎵╁睍 `src/lib/services/ca-rotation-disable.test.ts` 瑕嗙洊 organizer 鎴愬姛銆乫oreign organizer + `allowSystem` 鎷掔粷銆乤dmin/system 鎴愬姛锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/actions.ca-connection-system-scope.test.ts src/lib/services/ca-rotation-disable.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Projection rebuild system-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-projection-rebuild-system-scope-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-projection-rebuild-system-scope-alignment-implementation-plan.md`锛沗src/app/actions.ts` 涓?`rebuildProcessModelsAction()` 宸蹭粠绾?`requireRole("ORGANIZER")` 鏀跺彛涓?`ADMIN | ORGANIZER` 鍙屽叆鍙ｏ紝骞跺湪鐪熸鎵ц `rebuildSessionSummaryEvidenceForRace()` / `rebuildRaceProcessProjections()` 鍓嶅厛璋冪敤 `assertManagedRaceActionAccess()` 鏍￠獙褰撳墠鐢ㄦ埛鏄惁鎷ユ湁璇ヨ禌浜嬬殑 `managed race | system` 鑼冨洿锛沗src/lib/services/races.ts` 宸叉柊澧炲彲澶嶇敤鐨?`assertManagedRaceActionAccess()`锛屽悓鏃舵妸 `updateRaceTrackCalibration()` 浠庘€滆８ `allowSystem` 鍗冲彲瓒婃潈鈥濇敹鍙ｄ负鈥滃彧鏈夌湡瀹?Admin 鎵嶈兘鍊?`allowSystem` 璧?system scope鈥濓紱鏂板闀垮害杈冨皬鐨?action wiring 娴嬭瘯 `src/app/actions.projection-rebuild-scope.test.ts`锛屽苟鎵╁睍 `src/lib/services/race-track-calibration.test.ts` 瑕嗙洊 foreign organizer 鍗充娇浼?`allowSystem: true` 涔熶細琚嫆缁濄€乤dmin/system 鍙法璧涗簨淇濆瓨鏍″噯锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/actions.projection-rebuild-scope.test.ts src/lib/services/race-track-calibration.test.ts` 涓?`npm run build` 宸查€氳繃銆?
- 2026-07-11 宸插畬鎴?`GRS004 / Judge Assignment system-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-judge-assignment-system-scope-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-judge-assignment-system-scope-alignment-implementation-plan.md`锛沗src/app/actions.ts` 涓?`assignJudgeToWorkAction()` 宸蹭粠绾?`requireRole("ORGANIZER")` 鏀跺彛涓?`ADMIN | ORGANIZER` 鍙屽叆鍙ｏ紝骞剁粺涓€鍚?`assignJudgeToWork()` 浼犲叆 `allowSystem: hasRole(user.roles, "ADMIN")`锛沗src/lib/services/judging.ts` 涓?`assignJudgeToWork()` 宸叉柊澧?actor 瑙掕壊鏍￠獙涓?`managed race | system` scope 鏍￠獙锛岀‘淇?`assignedByUserId` 蹇呴』鎷ユ湁 organizer/admin 瑙掕壊锛宖oreign organizer 鍗充娇鐭ラ亾 `workId` 涔熶笉鑳藉啀璺ㄨ禌浜嬪垎閰?Judge锛岃€?Admin 浠嶅彲鎸?system scope 鎵ц鍚屼竴鍔ㄤ綔锛涙柊澧?`src/app/actions.judge-assignment-scope.test.ts` 涓?`src/lib/services/judging-assignment-scope.test.ts` 瑕嗙洊 action wiring銆乺ace organizer 鎴愬姛銆乫oreign organizer 鎷掔粷銆乺ider 鎷掔粷銆乤dmin system 鎴愬姛鍙?upsert update 鍚?`assignedByUserId` 浠嶈褰曠湡瀹炴搷浣滆€咃紱鑱氱劍楠岃瘉 `node --import tsx --test src/app/actions.judge-assignment-scope.test.ts src/lib/services/judging-assignment-scope.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴?`GRS004 / Award Report Announcement system-scope alignment` 鐨勮璁°€佸疄鐜颁笌楠岃瘉锛氬凡鏂板 `docs/superpowers/specs/2026-07-11-grs004-award-report-announcement-system-scope-alignment-design.md` 涓?`docs/superpowers/plans/2026-07-11-grs004-award-report-announcement-system-scope-alignment-implementation-plan.md`锛沗src/app/actions.ts` 涓?`publishLeaderboard / generateAwardDrafts / withdrawPublishedAwards / updateAwardDraft / generateReports / publishReport / updateReportDraft / markReportReviewed / createAnnouncementDraft / updateAnnouncementDraft / publishAnnouncement / hideAnnouncement` 杩?12 涓?action 宸蹭粠绾?`requireRole("ORGANIZER")` 鏀跺彛涓?`ADMIN | ORGANIZER` 鍙屽叆鍙ｏ紝骞剁粺涓€鍚?service 浼犲叆 `allowSystem: hasRole(user.roles, "ADMIN")`锛沗src/lib/services/awards.ts`銆乣reports.ts`銆乣announcements.ts` 鐨?managed-race helper 涓庡搴斿姩浣滅幇鍦ㄩ兘宸叉敮鎸?`allowSystem?: boolean`锛岀‘淇?`Award / Report / Announcement` 涓夌粍鍐呴儴缁存姢鍔ㄤ綔鐪熸瀵归綈 `docs/grs004/ary-permission-matrix.md` 涓殑 `managed race | system`锛涙柊澧?`src/app/actions.managed-race-system-access.test.ts`锛屽苟鎵╁睍 `src/lib/services/awards-draft-withdraw.test.ts`銆乣reports-generation.test.ts`銆乣announcements.test.ts` 瑕嗙洊 Admin/system 瀵归潪鑷繁缁勭粐璧涗簨鐨勬垚鍔熻矾寰勶紱鑱氱劍楠岃瘉 `node --import tsx --test src/app/actions.managed-race-system-access.test.ts src/lib/services/awards-draft-withdraw.test.ts src/lib/services/reports-generation.test.ts src/lib/services/announcements.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-09 宸叉柊澧?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`锛屾妸 GRS003 鏃у畨鍏ㄨ鍒掓寜褰撳墠瀹炵幇閲嶅啓涓?GRS004 鐗堟湰锛氬畨鍏ㄤ腑蹇冧粠鏃?Runner / 鑷姩 DQ / 鍥哄畾瀹㈡埛绔〃杩帮紝杞悜 `Registration 鈫?RaceProject 鈫?CAConnection 鈫?Session 鈫?Evidence 鈫?Projection 鈫?Organizer/Judge review` 涓婚摼璺紝骞跺垪鏄庢秷鎭骇绛惧悕銆侀槻閲嶆斁澧炲己銆佹潗鏂?hash銆丒vidence 鍙俊搴﹀瓧娈靛拰缁熶竴瀹¤妯″瀷绛夊悗缁己鍙ｃ€?- 2026-07-10 宸插畬鎴?`GRS004 / DEV-5 / P0 鍙俊閾剧己鍙 绗竴杞惤鍦帮細`CAIngestionEvent` 宸茶ˉ `payloadDigest / sequence / receivedAt / integrityStatus`锛宻ignal 閲嶅 `idempotencyKey` 涓?payload 涓嶄竴鑷存椂浼氬舰鎴?`integrity_gap` 椋庨櫓璁板綍锛宍SESSION_SUMMARY` Evidence 宸茶ˉ `integrityStatus / confidenceLevel / sourceDigest / generatedFromEventIdsJson / reviewFlagJson`锛屼笖椋庨櫓榛樿杩涘叆 review 璇箟銆佷笉鑷姩 DQ銆?- 2026-07-10 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P0-B sequence 闃查噸鏀炬牎楠宍 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-10-grs004-p0b-sequence-replay-guard-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 CA signal ingestion 鐨勬渶灏?replay guard锛氬彧鍦ㄥ悓涓€ `caConnectionId + caSessionId` 涓嬫牎楠?`sequence` 鍗曡皟鎬т笌鍐茬獊锛屼笉鎵?snapshot 璇箟銆佷笉寮曞叆 nonce銆?- 2026-07-10 宸插畬鎴?`GRS004 / P0-B sequence 闃查噸鏀炬牎楠宍 鐨勫疄鐜颁笌楠岃瘉锛歚prisma/schema.prisma` 宸蹭负 `CAIngestionEvent` 琛?`caSessionId` 涓?`[caConnectionId, caSessionId, sequence]` 鍞竴杈圭晫锛沗src/lib/services/ca-ingestion.ts` 鐜板湪浼氬 replay / out-of-order sequence 鍐?`integrity_gap` 瀹¤骞堕樆鏂?`Session / RaceProject / Projection` 鎺ㄨ繘锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/ca-integrity-helpers.test.ts src/lib/services/ca-ingestion-integrity.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / DEV-5 CA signal contract alignment` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-10-grs004-dev5-signal-contract-alignment-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 CA push 濂戠害鏀舵暃锛氭墿 `signal.type` 鏀寔闈紝淇濈暀 `signal.noteReason / technicalActions`锛屽苟灏?`race.taskId` 璋冩暣涓哄繀濉紝涓嶆墿澶?Projection 璇箟銆?- 2026-07-10 宸插畬鎴?`GRS004 / DEV-5 CA signal contract alignment` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/services/ca-ingestion.ts` 鐜板凡鏀寔 spec 涓垪鍑虹殑 `signal.type` 鍊欓€夐泦鍚堬紝骞朵繚鐣?`signal.noteReason / technicalActions`锛沗race.taskId` 鐜板凡鎴愪负 push schema 蹇呭～瀛楁锛沗src/lib/ca-runtime-helpers.ts` 宸插悓姝ユ妸鏂?signal.type 瑙嗕负鏈夋晥娲诲姩淇″彿锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-signature-verification.test.ts src/lib/services/ca-ingestion-integrity.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / DEV-5 CA snapshot contract alignment` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-10-grs004-dev5-snapshot-contract-alignment-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 snapshot fetch 濂戠害鏀舵暃锛氳ˉ `ca.caType / task.taskId / session.tokens`锛屽閮ㄥ瓧娈佃创榻?spec锛屽唴閮ㄤ粛鏄犲皠鍒扮幇鏈?`Session.tokenCost`銆?- 2026-07-10 宸插畬鎴?`GRS004 / DEV-5 CA snapshot contract alignment` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/services/ca-fetch.ts` 鐜板湪浼氭寜 spec 鏍￠獙 `ca.caType / task.taskId / session.tokens`锛沗src/lib/ca-runtime-helpers.ts` 宸叉妸 `session.tokens` 鏄犲皠鍥炲唴閮?`tokenCost`锛涜仛鐒﹂獙璇?`node --test-concurrency=1 --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-fetch-integrity.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴愪笅涓€瀛愰」鐩?`P1-A 鏉愭枡寮曠敤涓?hash 鍩虹灞俙 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`銆傚綋鍓嶈璁℃槑纭彧瑕嗙洊浼佷笟棰樼洰鏉愭枡銆乄ork 璧勪骇銆侀€夋墜浠ｇ爜鏉愭枡鐨?`sourceRef + hash + 鏈€灏忚韩浠界粦瀹歚锛屼笉鎶?`Award / Report / JudgingRecord` 鐨勭増鏈喕缁撴贩鍏ユ湰杞€?- 2026-07-10 宸插畬鎴?`GRS004 / P1-A 鏉愭枡寮曠敤涓?hash 鍩虹灞俙 鐨勫疄鐜颁笌楠岃瘉锛歚CooperationRequest / Race / Work / Submission / SubmissionArtifact / TeamArchive` 宸茶ˉ榻愭湰杞鍒掑唴鐨?`sourceRef / hash / submitter binding` 鍩虹瀛楁锛沗runner` 鐨勫綊妗ｉ摼璺凡鍚屾涓夐」瀹屾暣鎬у瓧娈靛苟鍏煎鏃?`teamId` 鍨嬭褰曪紱P1-A 鑱氱劍娴嬭瘯銆乣npm run db:generate`銆乣npm run db:seed` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴?`GRS004 / P1-B 缁撴灉寮曠敤鍐荤粨灞俙 鐨勫疄鐜颁笌楠岃瘉锛歚JudgingRecord / Award / Report` 宸茶ˉ榻?`sourceRefJson / sourceDigest`锛沗upsertJudgingRecord()` 浼氬喕缁撳綋鍓?`Work + Registration Evidence` 寮曠敤锛宍prisma/seed.ts` 浼氬湪 `race_finished` 鐨?seed 鍚庡鐞嗛樁娈靛洖鍐?`JudgingRecord / Award / Report` 鐨勫喕缁撳紩鐢紱P1-B 鑱氱劍娴嬭瘯銆乣npm run db:generate`銆乣npm run db:seed` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴?`GRS004 / P1-C 缁熶竴 SecurityAudit 灞俙 鐨勫疄鐜颁笌楠岃瘉锛歅risma 宸叉柊澧炲崟琛?`SecurityAudit`锛沗createCAConnectionForRaceProject()`銆乣completeCAConnectionHandshake()`銆乣ingestRidingSignalMessage()`銆乣fetchCASessionSnapshotForConnection()` 鐜板湪閮戒細鎶?`CA registration / handshake / signal / snapshot` 鍥涚被鐪熷疄杈圭晫鍔ㄤ綔鍐欏叆缁熶竴瀹¤浜嬪疄锛汸1-C 鑱氱劍娴嬭瘯銆乣npm run db:generate`銆乣npm run db:seed` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴?`GRS004 / P2-A Connector Credential Fingerprint 涓庢秷鎭鍚峘 鐨勫疄鐜颁笌楠岃瘉锛歚CAConnection` 宸茶ˉ `credentialFingerprint / publicKeyPem / signatureVersion`锛沨andshake 鐜板湪鍙櫥璁?credential 涓斾細鏍￠獙 fingerprint锛涘凡鐧昏 credential 鐨?connection 鐜板湪浼氬己鍒舵牎楠?`signal / snapshot` 鐨?`signature + signedAt + signatureVersion`锛汸2-A 鑱氱劍娴嬭瘯銆乣npm run db:generate`銆乣npm run db:seed` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴?`GRS004 / P2-B connector secret rotation + disabled/revoked connector 鍙鍖朻 鐨勫疄鐜颁笌楠岃瘉锛歚CAConnection` 宸茶ˉ `secretVersion / secretRotatedAt / disabledReason`锛況ider 鐜板湪鍙互杞崲褰撳墠 connector secret锛宱rganizer 鐜板湪鍙互绂佺敤/鎭㈠褰撳墠 connector锛沗Rider Console / ca-setup` 涓?`Organizer Console / ca-status` 宸茶兘鏄剧ず secret 鐗堟湰銆佽疆鎹㈡椂闂淬€乨isabled 鍘熷洜涓庘€滈渶閲嶆柊 handshake鈥濈姸鎬侊紱`SecurityAudit` 宸叉柊澧?`ca_connection.secret_rotated / disabled / enabled` 涓夌被浜嬪疄锛汸2-B 鑱氱劍娴嬭瘯銆乣npm run db:generate`銆乣npm run db:seed` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P2-C Organizer Console trust / risk 灞曠ず` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-10-grs004-p2c-organizer-trust-risk-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 Organizer `ca-status` 鐨勬渶灏忓彧璇绘憳瑕佸眰锛氬彧鑱氬悎鐜版湁 `aggregateIngestionStatus + Evidence integrity + Session risk + connector readiness`锛屼笉鎵?`RISK` projection payload锛屼笉鏂板璁よ瘉绛栫暐鎴栧璁℃€昏椤点€?- 2026-07-10 宸插畬鎴?`GRS004 / P2-C Organizer Console trust / risk 灞曠ず` 鐨勫疄鐜颁笌楠岃瘉锛歚Organizer Console / ca-status` 鐜板湪浼氫负姣忎釜 registration 娓叉煋 `Trust / Risk Summary`锛屽苟鍩轰簬鐜版湁 `aggregateIngestionStatus + Evidence integrity + Session risk + connector readiness` 鐢熸垚 `failed / review_needed / trusted` 涓夌鐘舵€侊紱鏈疆娌℃湁鎵?`RISK` projection payload锛屼篃娌℃湁鏂板鏂扮殑璁よ瘉绛栫暐鎴栧璁℃€昏椤碉紱`node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P2-D connector 瀹¤鎬昏鍙鍖朻 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-10-grs004-p2d-connector-audit-overview-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 Organizer `ca-status` 鐨勬渶灏忓彧璇诲璁″眰锛氬彧娑堣垂鐜版湁 `SecurityAudit`锛屼笉鏂板紑椤甸潰銆佷笉鎵?projection銆佷笉鏂板璁よ瘉绛栫暐銆?- 2026-07-10 宸插畬鎴?`GRS004 / P2-D connector 瀹¤鎬昏鍙鍖朻 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/services/races.ts` 鐜板湪浼氭妸 race 鐩稿叧 `SecurityAudit` 鎸傚洖 read model锛宍Organizer Console / ca-status` 鐜板湪浼氫负姣忎釜 registration 娓叉煋 `Connector Audit Overview`锛屾樉绀?recent audit counts 涓庢渶杩戝畨鍏ㄤ簨浠讹紝涓斾笉浼氭硠婕忔棤鍏?registration 瀹¤锛沗node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P2-E 鐢熶骇 connector 寮哄埗绛惧悕绛栫暐` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-10-grs004-p2e-production-signature-enforcement-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负杩愯鏃剁瓥鐣ュ己鍖栵細杩滅▼ / 闈炴湰鍦?connector 榛樿蹇呴』鐧昏 credential 骞惰蛋绛惧悕閾捐矾锛宭ocalhost demo 淇濇寔 bearer-only 鍏煎锛屼笉鏂板 schema 鎴栨柊绛惧悕绠楁硶銆?- 2026-07-10 宸插畬鎴?`GRS004 / P2-E 鐢熶骇 connector 寮哄埗绛惧悕绛栫暐` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/ca-signature-helpers.ts` 宸叉柊澧?`requiresProductionConnectorSignature()`锛沗completeCAConnectionHandshake()`銆乣ingestRidingSignalMessage()`銆乣fetchCASessionSnapshotForConnection()` 鐜板湪閮戒細瀵?production connector 寮哄埗瑕佹眰宸茬櫥璁?credential锛屽惁鍒欎互 `credential_required` 鎷掔粷锛涘悓鏃?localhost / 127.0.0.1 demo connector 缁х画鍏煎 bearer-only锛涜仛鐒﹂獙璇?`node --test-concurrency=1 --import tsx --test src/lib/ca-signature-helpers.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts src/lib/services/ca-ingestion-integrity.test.ts src/lib/services/ca-fetch-integrity.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P1-D 鍚堜綔鍔炶禌鏉愭枡璇诲彇鏍￠獙 + 瀹¤` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-10-grs004-p1d-cooperation-material-read-verification-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负鍚堜綔鍔炶禌涓婚摼璺細鍙湪 `approveCooperationRequest()` 鍓嶉噸璇诲苟鏍￠獙宸蹭笂浼犵殑 `task package / proposal` 鏂囦欢锛屼笉鏂板 schema銆佷笉鎵╁睍鍒伴€夋墜浠ｇ爜璺緞銆?- 2026-07-10 宸插畬鎴?`GRS004 / P1-D 鍚堜綔鍔炶禌鏉愭枡璇诲彇鏍￠獙 + 瀹¤` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/material-integrity-helpers.ts` 宸叉柊澧?upload path 瑙ｆ瀽涓?hash 閲嶇畻 helper锛宍approveCooperationRequest()` 鐜板湪浼氬湪瀹℃壒鍓嶉噸鏂版牎楠屽凡涓婁紶鏉愭枡锛涙枃浠剁己澶便€佽矾寰勯潪娉曟垨 hash 涓嶅尮閰嶆椂浼氭嫆缁濆垱寤?Race锛屽苟鍐欏叆 `SecurityAudit(action=cooperation_request.materials_verify)`锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P1-E 鎻愪氦浠ｇ爜鏉愭枡璇诲彇鏍￠獙 + 瀹¤` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-10-grs004-p1e-submission-artifact-read-verification-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 Runner 璇诲彇鍏ュ彛锛氬彧鍦?`pullRunnerTask()` 鍓嶆牎楠?`SubmissionArtifact` 鐨?hash 涓?submitter binding锛屼笉鏂板 schema銆佷笉鎵?judge/public 椤甸潰銆?- 2026-07-10 宸插畬鎴?`GRS004 / P1-E 鎻愪氦浠ｇ爜鏉愭枡璇诲彇鏍￠獙 + 瀹¤` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/material-integrity-helpers.ts` 宸叉柊澧?submitter binding 瑙ｆ瀽涓?artifact 瀹屾暣鎬?helper锛宍pullRunnerTask()` 鐜板湪浼氬湪 Runner 鐪熸鎷垮埌浠诲姟鍓嶆牎楠?`codeContentHash / ridingRecordHash / submitterBindingJson`锛涙牎楠屽け璐ユ椂浼氶樆鏂换鍔＄户缁氦浠樸€佹爣璁?`RunnerTask` 澶辫触锛屽苟鍐欏叆 `SecurityAudit(action=submission_artifact.verify)`锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/services/material-integrity-submissions.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P1-F 鎻愪氦浠ｇ爜鏉愭枡鍐欏叆瀹¤` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-10-grs004-p1f-submission-artifact-write-audit-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 sanctioned 鍐欒矾寰勶細鍙湪 `createSubmission()` / `createFinalSubmission()` 鎴愬姛鍒涘缓 `SubmissionArtifact` 鍚庡啓缁熶竴瀹¤锛屼笉鏂板 schema銆佷笉鎵╁睍缂栬緫鍘嗗彶椤甸潰銆?- 2026-07-10 宸插畬鎴?`GRS004 / P1-F 鎻愪氦浠ｇ爜鏉愭枡鍐欏叆瀹¤` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/services/submissions.ts` 鐜板湪浼氬湪 active / final submission 鐨?`SubmissionArtifact` create 鎴愬姛鍚庡啓鍏?`SecurityAudit(action=submission_artifact.create)`锛宒etails 浼氬甫鍑?`submissionPhase / codeContentHash / ridingRecordHash / submitterBindingJson`锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/services/material-integrity-submissions.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P1-G 鎻愪氦浠ｇ爜鏉愭枡灞曠ず/鎶曞奖璇诲彇鏍￠獙 + 瀹¤` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-10-grs004-p1g-submission-artifact-showcase-verification-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 Runner complete 鎴愬姛鎶曞奖鍓嶇殑鏈€灏忎簩娆℃牎楠岋細鍙嫤鎴?`TeamArchive / RidingHighlight` 缁х画娑堣垂琚鏀?artifact锛屼笉鏂板 schema銆佷笉鎵?judge/public 椤甸潰銆?- 2026-07-10 宸插畬鎴?`GRS004 / P1-G 鎻愪氦浠ｇ爜鏉愭枡灞曠ず/鎶曞奖璇诲彇鏍￠獙 + 瀹¤` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/services/runner.ts` 鐜板湪浼氬湪 `completeRunnerTask()` 鐨勬垚鍔熸姇褰卞墠閲嶆柊鏍￠獙 `codeContentHash / ridingRecordHash / submitterBindingJson`锛涙牎楠屽け璐ユ椂浼氶樆鏂?`Submission / TeamArchive / Leaderboard / HarnessEntry / RidingHighlight` 缁х画鍐欏叆锛屽苟鍐欏叆 `SecurityAudit(action=submission_artifact.verify, details.verificationStage=runner_complete)`锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/services/material-integrity-submissions.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P1-H 鍚堜綔鍔炶禌鏉愭枡鍐欏叆瀹¤` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-10-grs004-p1h-cooperation-material-write-audit-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负鍚堜綔鍔炶禌涓婁紶鐨?sanctioned 鏂囦欢鍐欒矾寰勶細鍙湪 `submitCooperationRequest()` 鎴愬姛鍒涘缓 `CooperationRequest` 鍚庡啓缁熶竴瀹¤锛屼笉鏂板 schema銆佷笉寮曞叆鏂囦欢绯荤粺 watcher銆?- 2026-07-10 宸插畬鎴?`GRS004 / P1-H 鍚堜綔鍔炶禌鏉愭枡鍐欏叆瀹¤` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/services/cooperation.ts` 鐜板湪浼氬湪 `submitCooperationRequest()` 鎴愬姛鍚庡啓鍏?`SecurityAudit(action=cooperation_request.materials_create)`锛宒etails 浼氬甫鍑?`taskPackage / proposal` 鐨?hash銆乸ath銆乶ame锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P1-I Work 鍏紑璇诲彇鏍￠獙` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-p1i-work-public-read-verification-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负鍏紑璇诲彇鏈嶅姟灞傦細鍙湪鍏紑璇︽儏銆佸叕寮€鍒楄〃銆侀獞鎵嬪叕寮€浣滃搧閾炬帴鍜岃禌鏋?work 閾捐矾涓婃牎楠?`Work.contentHash / sourceRefJson`锛屼笉鏂板 schema銆佷笉鎵?judge/private 璇诲彇銆?- 2026-07-11 宸插畬鎴?`GRS004 / P1-I Work 鍏紑璇诲彇鏍￠獙` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/material-integrity-helpers.ts` 宸叉柊澧?`verifyWorkIntegrity()`锛沗src/lib/services/races.ts`銆乣works.ts`銆乣awards.ts`銆乣public-routes.ts` 鐜板湪閮戒細鍦ㄥ叕寮€閾捐矾鏆撮湶 Work 鍓嶆牎楠?`contentHash / sourceRefJson`锛岀鏀瑰悗鐨?Work 涓嶅啀杩涘叆鍏紑璇︽儏銆佸叕寮€浣滃搧鍒楄〃鍜屽叕寮€璧涙灉 work link锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P1-J Race 棰樼洰鏉愭枡璇诲彇鏍￠獙` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-p1j-race-challenge-read-verification-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 runner 鐪熷疄璇诲彇鍏ュ彛锛氬彧鍦?`pullRunnerTask()` 杩斿洖浠诲姟鍓嶆牎楠?`Race.challengeSourceRefJson / challengeContentHash` 浠ュ強 `taskPackage/proposal` 鏂囦欢 hash锛屼笉鏂板 schema銆佷笉鎵?public/console 椤甸潰缁熶竴璇诲彇鏍￠獙銆?- 2026-07-11 宸插畬鎴?`GRS004 / P1-J Race 棰樼洰鏉愭枡璇诲彇鏍￠獙` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/material-integrity-helpers.ts` 宸叉柊澧?`verifyRaceChallengeIntegrity()`锛沗src/lib/services/runner.ts` 鐜板湪浼氬湪 `pullRunnerTask()` 杩斿洖 runner payload 鍓嶆牎楠?`Race` challenge material锛岄鐩潗鏂欒绡℃敼鏃朵細闃绘柇浠诲姟缁х画娲惧彂銆佸啓鍏?`SecurityAudit(action=race.challenge_verify)`锛屼笖涓嶄細鑷姩鎶?`Submission` 鍒や负澶辫触锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/material-integrity-submissions.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P1-K Work GitHub 寮曠敤蹇収鏍￠獙` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-p1k-work-github-reference-verification-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 `Work.repoUrl` 鐨?GitHub commit/tag/release 寮曠敤锛氬彧鍦ㄧ幇鏈?`sourceRefJson` 涓檮甯﹀彲閫?`githubRef` 蹇収锛屽苟鍦ㄥ叕寮€璇诲彇鏈嶅姟灞傛牎楠岃繖浠藉揩鐓э紝涓嶆柊澧?schema銆佷笉鎵?demo/video 杩滅鎶撳彇銆?- 2026-07-11 宸插畬鎴?`GRS004 / P1-K Work GitHub 寮曠敤蹇収鏍￠獙` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/material-integrity-helpers.ts` 宸叉柊澧?GitHub URL 瑙ｆ瀽銆乨igest銆乻napshot capture/verify helper 涓?`verifyWorkReadIntegrity()`锛沗src/lib/services/works.ts`銆乣awards.ts`銆乣races.ts`銆乣public-routes.ts` 鐜板湪閮戒細鍦ㄥ叕寮€璇诲彇鍓嶅甯?`githubRef` 鐨?Work 杩藉姞 GitHub commit/tag/release 蹇収鏍￠獙锛宻tale GitHub 寮曠敤涓嶅啀杩涘叆鍏紑 Work 閾捐矾锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P1-L Work Demo/瑙嗛杩滅鍐呭鎶撳彇鏍￠獙` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-p1l-work-remote-asset-verification-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 `Work.demoUrl / videoUrl`锛氬彧鍦ㄧ幇鏈?`sourceRefJson` 涓檮甯﹀彲閫?`demoRef / videoRef` 蹇収锛屽苟鍦ㄥ叕寮€璇诲彇鏈嶅姟灞傛牎楠岃繖浠借繙绔唴瀹瑰揩鐓э紝涓嶆柊澧?schema銆佷笉鎵?judge/private 璇诲彇銆?- 2026-07-11 宸插畬鎴?`GRS004 / P1-L Work Demo/瑙嗛杩滅鍐呭鎶撳彇鏍￠獙` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/material-integrity-helpers.ts` 宸叉柊澧炶繙绔祫婧?digest銆乻napshot capture/verify helper锛屽苟鎶?`verifyWorkReadIntegrity()` 鎵╁睍鍒?`demoRef/videoRef`锛沗src/lib/services/works.ts`銆乣awards.ts`銆乣races.ts`銆乣public-routes.ts` 鐜板湪閮戒細鍦ㄥ叕寮€璇诲彇鍓嶅甯?`demoRef/videoRef` 鐨?Work 杩藉姞杩滅鍐呭蹇収鏍￠獙锛宻tale demo/video 寮曠敤涓嶅啀杩涘叆鍏紑 Work 閾捐矾锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / P1-M Race 璇勬祴閰嶇疆 version/hash 璇诲彇鏍￠獙` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-p1m-race-evaluation-config-verification-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 runner 瀹為檯娑堣垂鐨?Race 璇勬祴閰嶇疆锛氬彧鍦?`Race` 涓婃柊澧?`evaluationConfigVersion / evaluationConfigHash`锛屽苟鍦?`pullRunnerTask()` 杩斿洖浠诲姟鍓嶆牎楠岋紝涓嶆墿 public/console 椤电粺涓€璇诲彇鏍￠獙銆?- 2026-07-11 宸插畬鎴?`GRS004 / P1-M Race 璇勬祴閰嶇疆 version/hash 璇诲彇鏍￠獙` 鐨勫疄鐜颁笌楠岃瘉锛歚prisma/schema.prisma` 宸蹭负 `Race` 鏂板 `evaluationConfigVersion / evaluationConfigHash`锛宍src/lib/material-integrity-helpers.ts` 宸叉柊澧?`buildRaceEvaluationConfigDigest()` 涓?`verifyRaceEvaluationConfigIntegrity()`锛沗createRace()`銆乣approveCooperationRequest()`銆乣updateRaceContent()` 鐜板湪閮戒細缁存姢璇勬祴閰嶇疆 version/hash锛宍pullRunnerTask()` 鐜板湪浼氭柊澧?`SecurityAudit(action=race.evaluation_config_verify)` 鏍￠獙锛岄厤缃鏀规椂浼氶樆鏂换鍔＄户缁淳鍙戜笖涓嶄細鑷姩鎶?submission 鍒ゅけ璐ワ紱鑱氱劍楠岃瘉 `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/material-integrity-cooperation.test.ts src/lib/services/material-integrity-submissions.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / DEV-6 澶у睆 fallback 鏈哄埗` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-dev6-screen-fallback-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负璇诲彇璺緞 fallback锛氫紭鍏堝疄鏃?snapshot锛屽け璐ュ悗閫€鍒版渶杩戜竴娆＄ǔ瀹?snapshot锛屽啀澶辫触閫€鍒伴潤鎬佸叕鍛?/ 姒滃崟 / 鍏紑浣滃搧鍏ュ彛锛屼笉鏂板 schema銆佷笉閲嶅仛澶у睆鏋舵瀯銆?- 2026-07-11 宸插畬鎴?`GRS004 / DEV-6 澶у睆 fallback 鏈哄埗` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/services/race-snapshot.ts` 宸叉柊澧?`resolveRaceSnapshotForDisplay()`锛屽疄鏃?snapshot 鎴愬姛鏃朵細鍒锋柊 `public/assets/snapshots/{raceId}.json`锛沗src/app/races/[raceSlug]/live/page.tsx`銆乣src/app/console/screen/[raceSlug]/[mode]/page.tsx`銆乣src/app/jumbotron/[raceId]/page.tsx` 鐜板湪閮藉凡鎺ュ叆缁熶竴 fallback 璇诲彇锛沗Live Hall` 涓?`Screen Console` 棰勮浼氭樉绀虹ǔ瀹氬揩鐓?/ 闈欐€?fallback 鎻愮ず锛宍/jumbotron/[raceId]` 鍦ㄧ洰鏍囪禌浜?snapshot 鎴栬禌閬撹祫婧愪笉鍙敤鏃朵細鏀规樉绀哄叏灞忛潤鎬佸叕鍛?/ 姒滃崟锛岃€屼笉鏄洿鎺ュけ璐ワ紱鑱氱劍楠岃瘉 `node --import tsx --test src/lib/services/race-snapshot.test.ts src/app/_components/public/live-hall.test.tsx src/app/_components/console/console-copy.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / DEV-5 Review Readiness 椋庨櫓鎻愮ず` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-dev5-review-readiness-risk-prompts-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负鏈€灏忚瘎瀹″墠椋庨櫓鎻愮ず锛氬彧澶嶇敤鐜版湁 `RaceProject.aggregateIngestionStatus`銆乣Evidence.reviewFlagJson / integrityStatus / confidenceLevel` 鍜?`Work.title / summary`锛屼笉鏂板 schema銆佷笉鍋氳嚜鍔ㄥ缃氥€?- 2026-07-11 宸插畬鎴?`GRS004 / DEV-5 Review Readiness 椋庨櫓鎻愮ず` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/review-readiness-helpers.ts` 宸叉柊澧?`buildReviewReadinessSummary()`锛宍src/app/_components/console/review-readiness-card.tsx` 宸叉柊澧炵粺涓€ `璇勫鍓嶉闄╂彁绀篳 鍗＄墖锛沗Organizer Console -> registrations` 涓?`Judge Console` assignment 鍗＄墖鐜板湪閮戒細鏄剧ず `鏈帴鍏?CA / CA 鎺ュ叆澶辫触 / 缂哄皯鍐呴儴璇佹嵁 / 瀛樺湪璇佹嵁澶嶆牳鏍囪 / 瀛樺湪涓彲淇″害璇佹嵁 / 缂哄皯浣滃搧 / 浣滃搧鍐呭涓虹┖` 绛夐闄╂彁绀猴紝涓斾笉鏆撮湶鍘熷 CA Session銆佷笉闃绘柇浜哄伐璇勫垎锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/review-readiness-helpers.test.ts src/app/_components/console/judge-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/console-copy.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / Public CA Session 闅旂鏀跺彛` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-public-session-isolation-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负鍏紑璇︽儏椤佃竟鐣岋細鍙厛鏀剁揣 `public rider profile` 鍜?`public work` 涓ゆ潯璇诲彇閾撅紝涓嶆妸鏈疆澶稿ぇ鎴愬叏绔?public read model 鍏ㄩ噸鏋勩€?- 2026-07-11 宸插畬鎴?`GRS004 / Public CA Session 闅旂鏀跺彛` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/services/public-routes.ts` 宸叉柊澧?`listPublicRaces()`锛岄椤点€乣/races`銆乣/riders`銆乣/works` 鍜?`getRaceBySlug()` 鐜板湪閮藉彲璧?`public-safe` race read model锛沗getRiderBySlug()` 宸叉敼涓轰笉鍐嶇洿鎺ヨ鍙?raw Session锛宍performanceSummary` 鐜板湪鏀硅 `CURRENT_LEADERBOARD / COST / RISK` projection锛沗getWorkBySlug()` 涓?`getRiderBySlug()` 鐜板湪閮藉彧鏆撮湶 `PUBLIC` evidence锛沗src/app/_components/public/live-hall.tsx` 鐨?fallback 缁熻涔熷凡鍘绘帀瀵?raw `sessions` 鐨勭洿鎺ヨ鍙栵紱鏂板娴嬭瘯璇佹槑鈥滃彧鏀?raw Session銆佷絾涓嶉噸寤?Projection 鏃讹紝public rider summary 涓嶄細鍙樺寲鈥濓紝骞堕獙璇?`INTERNAL` evidence 涓嶅啀杩涘叆鍏紑 Work / Rider 椤甸潰銆乣getRaceBySlug()` 涓嶅啀杩斿洖 raw `sessions`锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/services/public-routes.test.ts src/lib/public-site.test.ts src/app/_components/public/live-hall.test.tsx src/app/_components/public/rider-profile-page.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / DEV-3 GitHub OAuth 鐧诲綍妯″瀷鏀跺彛` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-dev3-github-oauth-login-model-closure-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负鐧诲綍妯″瀷鏀跺彛锛氬厛鎶娾€滄湰鍦拌处鍙烽粯璁ゅ紑鏀锯€濇敼鎴愨€淕itHub 姝ｅ紡鍏ュ彛 + 寮€鍙?fallback鈥濓紝涓嶆妸鏈疆澶稿ぇ鎴愮湡瀹?GitHub 鎺堟潈娴忚鍣ㄨ仈璋冨凡缁忓叏閮ㄩ獙鏀躲€?- 2026-07-11 宸插畬鎴?`GRS004 / DEV-3 GitHub OAuth 鐧诲綍妯″瀷鏀跺彛` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/auth-entry.ts` 宸叉柊澧?`isGitHubOAuthConfigured()` 涓?`isLocalAuthFallbackEnabled()`锛沗/login` 鐜板湪浼氭寜 fallback 寮€鍏冲喅瀹氭槸鍚︽樉绀烘湰鍦拌处鍙疯〃鍗曞拰 `SeedAccountsPanel`锛沗src/lib/services/users.ts` 鐜板湪浼氬湪 fallback 鍏抽棴鏃舵嫆缁濇湰鍦版敞鍐?/ 鐧诲綍锛涙柊澧炴祴璇曡鐩?helper銆乻hared auth panel 鍜屾湇鍔＄ gating source锛岃仛鐒﹂獙璇?`node --import tsx --test src/lib/auth-entry.test.ts src/app/_components/public/public-copy-cleanup.test.tsx src/app/actions.return-to.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / DEV-3 韬唤鍏ュ彛閾捐矾鍥炲綊瑕嗙洊` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-dev3-auth-entry-regression-coverage-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负鈥滈椤?-> /login -> GitHub/fallback鈥?鐨勬渶灏忓洖褰掕鐩栵細琛?`PublicHeader` 涓?`/login` wiring 鐨勬簮鐮?娓叉煋鍥炲綊鍜屾渶灏?HTTP 楠岃瘉锛屼笉鎶婃湰杞じ澶ф垚鐪熷疄 GitHub 娴忚鍣ㄦ巿鏉冨叏楠屾敹銆?- 2026-07-11 宸插畬鎴?`GRS004 / DEV-3 韬唤鍏ュ彛閾捐矾鍥炲綊瑕嗙洊` 鐨勫疄鐜颁笌楠岃瘉锛氬凡鏂板 `src/app/_components/public/public-auth-entry-regression.test.tsx`锛岃鐩栧尶鍚嶅ご閮?`/login` 鍏ュ彛銆佸凡鐧诲綍澶撮儴鎺у埗鍙板叆鍙ｏ紝浠ュ強 `/login` 鐨?GitHub action wiring / callback error / fallback gating锛沗src/lib/auth-entry.test.ts` 宸茶ˉ `ARY_ENABLE_LOCAL_AUTH_FALLBACK=false` 鐨勬樉寮忓叧闂洖褰掞紱鏈湴寮€鍙戞湇鍔″櫒涓?`GET /` 涓?`GET /login?returnTo=%2Fraces` 宸查獙璇佽繑鍥?`200`锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/_components/public/public-auth-entry-regression.test.tsx src/lib/auth-entry.test.ts src/app/_components/public/public-copy-cleanup.test.tsx src/app/_components/public/public-header.test.tsx src/app/actions.return-to.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / DEV-3 璧勬枡琛ュ叏姝ｅ紡宸ヤ綔娴乣 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-dev3-profile-completion-formal-flow-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负鏈€灏忔寮忛棴鐜細鍙敤鐜版湁 `profileName / profileOrgLabel / profileCompleted` 瀛楁鏂板 `/profile`銆佽璇佸悗璺宠浆鍜屽叧閿叆鍙ｆ嫤鎴紝涓嶆妸鏈疆澶稿ぇ鎴愬畬鏁磋处鍙蜂腑蹇冦€?- 2026-07-11 宸插畬鎴?`GRS004 / DEV-3 璧勬枡琛ュ叏姝ｅ紡宸ヤ綔娴乣 鐨勫疄鐜颁笌楠岃瘉锛氬凡鏂板 `src/lib/profile-completion.ts`銆乣src/app/profile/page.tsx` 涓?`completeProfileAction`锛沗registerAction`銆乣loginAction` 鍜?GitHub callback 鐜板湪閮戒細鎶婃湭琛ュ叏璐﹀彿鍏堝鍒?`/profile`锛沗src/lib/services/users.ts` 宸叉柊澧?`completeUserProfile()`锛沗/console` 鍏ュ彛鍜屽叕寮€鎶ュ悕椤电幇鍦ㄩ兘浼氬湪鏈ˉ鍏ㄦ椂鍏堟彁绀鸿祫鏂欒ˉ鍏紱鑱氱劍楠岃瘉 `node --import tsx --test src/lib/profile-completion.test.ts src/lib/services/users-profile-completion.test.ts src/app/profile/page.test.tsx src/app/console/page.test.tsx src/app/actions.return-to.test.ts src/app/_components/public/race-register-page.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / DEV-3 GitHub placeholder config gating` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-dev3-github-placeholder-config-gating-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负閰嶇疆鍒ゅ畾鏀跺彛锛氬彧鎶?`replace-with-*` 杩欑被鍗犱綅鍊间粠鈥滃凡閰嶇疆鈥濇敼鎴愨€滄湭閰嶇疆鈥濓紝骞剁粺涓€ `/login` 涓?`startGitHubOAuth()` 鐨勫垽鏂紝涓嶆妸鏈疆澶稿ぇ鎴愮湡瀹?GitHub OAuth 鑱旇皟瀹屾垚銆?- 2026-07-11 宸插畬鎴?`GRS004 / DEV-3 GitHub placeholder config gating` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/auth-entry.ts` 宸叉柊澧?`getGitHubOAuthCredentials()` 骞舵妸 `isGitHubOAuthConfigured()` 鏀逛负鍗犱綅鍊兼晱鎰燂紱`src/lib/github-oauth.ts` 鐨?`startGitHubOAuth()` 涓?`exchangeCodeForAccessToken()` 鐜板湪閮戒細澶嶇敤鍚屼竴濂?helper锛涘綋鍓嶉粯璁?`.env` 浠嶆槸鍗犱綅鍊兼椂锛屾湰鍦拌繍琛屾椂 `GET /login?returnTo=%2Fraces` 杩斿洖 `200`锛屼笖椤甸潰 HTML 涓凡涓嶅啀鍑虹幇 `auth-oauth-form` 鎴栧彲瑙佺殑 `浣跨敤 GitHub 鐧诲綍` 鎸夐挳锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/auth-entry.test.ts src/app/_components/public/public-auth-entry-regression.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / Runner 鑷姩鍏ラ槦闄嶇骇瀵归綈` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-runner-autoqueue-demotion-alignment-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 Rider 鎻愪氦娴佺▼鏀跺彛锛氬彧鍒犻櫎姣旇禌涓彁浜ょ殑鑷姩 Runner 鍏ラ槦鍜岃瀵兼€р€滆禌涓唬鐮佹祴璇曗€濇枃妗堬紝涓嶆妸鏈疆澶稿ぇ鎴?Runner API 宸插叏闈㈠簾闄ゃ€?- 2026-07-11 宸插畬鎴?`GRS004 / Runner 鑷姩鍏ラ槦闄嶇骇瀵归綈` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/services/submissions.ts` 鐨?`createSubmission()` 宸蹭笉鍐嶆敮鎸?`enqueueSubmissionTest`锛沗src/app/actions.ts` 宸插垹闄?`submitEntryForTestAction`锛沗src/app/_components/console/rider-console-page.tsx` 姣旇禌涓叆鍙ｇ幇宸叉敼鍥?`浣滃搧鎻愪氦 / 鎻愪氦浠ｇ爜`锛沗src/lib/services/material-integrity-submissions.test.ts` 鐜板凡鐢ㄦ樉寮?`RunnerTask` fixture 缁х画瑕嗙洊 `pullRunnerTask()` 鐨勫畬鏁存€ф牎楠岃竟鐣岋紱鑱氱劍楠岃瘉 `node --import tsx --test src/app/_components/console/rider-console-page.test.tsx src/app/actions.return-to.test.ts src/lib/services/material-integrity-submissions.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / Organizer Runner compatibility copy demotion` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-organizer-runner-compatibility-copy-demotion-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负椤甸潰瀹氫綅闄嶇骇锛氬彧鎶?Organizer 渚?Runner 闈㈡澘鏀规垚鍏煎閾捐矾琛ㄨ堪锛屼笉鍦ㄦ湰杞墿澶у埌姝ｅ紡 Award 鍙戝竷鏈嶅姟閲嶆瀯銆?- 2026-07-11 宸插畬鎴?`GRS004 / Organizer Runner compatibility copy demotion` 鐨勫疄鐜颁笌楠岃瘉锛歚src/app/_components/console/organizer-console-page.tsx` 鐨?`Process Evaluation` 宸叉敼鎴?`鍏煎 Runner 宸ュ叿`锛宍Published Skill Signals` 宸叉敼鎴?`鍏煎 Skill Signals`锛屽苟鏂板璇存槑鈥滄寮忔鍗曞彂甯冨簲鍩轰簬 Award / Leaderboard鈥濓紱绌虹姸鎬佹枃妗堜篃宸蹭腑鏂囧寲锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / DEV-6 Screen Console Preview + Fullscreen Output` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-dev6-screen-console-preview-fullscreen-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负鎺у埗闈㈣ˉ榻愶細鎶婃枃妗ｉ噷宸插啓鏄庣殑 `棰勮 + Fullscreen Output` 鐪熸鎺ュ埌 `Screen Console`锛屼笉閲嶅啓鍚勬ā寮?display 椤甸潰锛屼篃涓嶅紩鍏ユ祻瑙堝櫒 fullscreen API銆?- 2026-07-11 宸插畬鎴?`GRS004 / DEV-6 Screen Console Preview + Fullscreen Output` 鐨勫疄鐜颁笌楠岃瘉锛歚src/app/_components/console/screen-console-page.tsx` 褰撳墠鐘舵€佸崱宸叉妸涓诲姩浣滄槑纭敹鍙ｄ负 `鍏ㄥ睆灞曠ず褰撳墠杈撳嚭`锛沗billboard / live / leaderboard / works / announcement` 绛夐潪 `jumbotron` 妯″紡鐜板湪浼氬湪鎺у埗鍙板唴鐩存帴鏄剧ず `<iframe>` 褰㈠紡鐨?`褰撳墠杈撳嚭棰勮`锛屼笉鍐嶅彧鍓╄烦杞摼鎺ワ紱瀵瑰簲涓枃 copy 涓庤涓哄洖褰掑凡琛ュ埌 `src/app/_components/console/screen-console-controls.test.tsx` 鍜?`src/app/_components/console/console-copy.test.tsx`锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/_components/console/console-copy.test.tsx src/app/_components/console/screen-console-controls.test.tsx` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / Console 鏉冮檺鐭╅樀鍑嗗叆楠岃瘉` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-permission-matrix-console-access-verification-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负 console 鍏ュ彛灞傞獙璇侊細鍙妸 `viewer-access` 娴嬭瘯鏀跺彛鍒?`docs/grs004/ary-permission-matrix.md` 褰撳墠鍙ｅ緞锛屼笉鎵?`managed race` 鏌ヨ灞傦紝涔熶笉鎶婃湰杞墿澶ф垚瀹屾暣璧勬簮鍔ㄤ綔 13脳6 鑷姩鍖栫煩闃点€?- 2026-07-11 宸插畬鎴?`GRS004 / Console 鏉冮檺鐭╅樀鍑嗗叆楠岃瘉` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/viewer-access.test.ts` 鐜板凡鏀规寜鏉冮檺鐭╅樀鏂█ Organizer 鍙娇鐢?`Screen Console`銆丱rganizer console home 鍖呭惈 `screen` section銆丷ider/Judge 涓嶅彲杩涘叆 `Screen Console`锛涘綋鍓嶈繍琛屾椂 helper 鏃犻渶鏀瑰姩锛岄棶棰樹粎鍦ㄦ棫娴嬭瘯鍙ｅ緞钀藉悗浜庢枃妗ｏ紱鑱氱劍楠岃瘉 `node --import tsx --test src/lib/viewer-access.test.ts src/lib/services/judge-scope-convergence.test.ts` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / Screen Console managed race scope` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-screen-console-managed-race-scope-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负澶у睆鎺у埗璇︽儏椤垫潈闄愪慨琛ワ細鍙ˉ `Screen Console` 鍒楄〃椤靛拰璇︽儏椤佃寖鍥翠笉涓€鑷寸殑瓒婃潈鍙ｅ瓙锛屼笉鎶婃湰杞墿澶ф垚鍏ㄩ儴 console 鏌ヨ灞傞噸鏋勩€?- 2026-07-11 宸插畬鎴?`GRS004 / Screen Console managed race scope` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/services/console-routes.ts` 宸叉柊澧?`getScreenConsoleRaceBySlugForUser()`锛宍src/app/console/screen/[raceSlug]/[mode]/page.tsx` 宸叉敼涓哄鐢ㄨ scoped helper锛岀‘淇?Organizer 鍙兘鎵撳紑鑷繁璐熻矗璧涗簨鐨?screen detail锛沗src/lib/services/console-routes.test.ts` 鐜板凡瑕嗙洊 Organizer screen list 浠呰繑鍥炶嚜宸辫禌浜嬨€侀潪鑷繁璧涗簨 slug 瀵?Organizer 杩斿洖 `null`銆丄dmin 浠嶅彲璇诲彇鍏ㄩ儴 screen race锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/viewer-access.test.ts src/lib/services/judge-scope-convergence.test.ts src/lib/services/console-routes.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / Race Console scope alignment` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-race-console-scope-alignment-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负璧涗簨鎺у埗鍙拌鎯呰鍙栨敹鍙ｏ細鍙妸 `entry / organizer / rider / judge` 璇︽儏椤佃鍙栦笌 `listConsoleRacesForUser()` 鐨?`own / assigned / managed race` 瑙勫垯瀵归綈锛屼笉鎵╁ぇ鍒板叏閮ㄦ煡璇㈠眰閲嶆瀯銆?- 2026-07-11 宸插畬鎴?`GRS004 / Race Console scope alignment` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/services/console-routes.ts` 宸叉柊澧?`getConsoleRaceEntriesBySlugForUser()` 涓?`getConsoleRaceBySlugForAccess()`锛沗src/app/console/races/[raceSlug]/page.tsx` 宸叉敼涓烘寜褰撳墠鐢ㄦ埛鍙 access 鐩存帴鍒嗗彂鍒板搴旈粯璁ら〉锛宍organizer / rider / judge` 涓変釜 section route 涔熷凡鏀逛负鍏堣蛋 scoped helper 鍐嶈鍙?race context锛沗src/lib/services/console-routes.test.ts` 鐜板凡瑕嗙洊 Organizer / Rider / Judge 鐨?detail scope 鍜?entry helper 浠呰繑鍥炲綋鍓嶇敤鎴风湡瀹炲彲瑙?access锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/services/console-routes.test.ts src/lib/viewer-access.test.ts src/lib/services/judge-scope-convergence.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / Console route profile completion gate` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-console-route-profile-completion-gate-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负椤甸潰绾ц祫鏂欒ˉ鍏ㄥ墠缃棬锛氬彧鎶?`console/*` 璺敱缁熶竴鏀跺彛鍒板叡浜?helper锛屼笉鎵╁ぇ鎴愬叏灞€ middleware锛屼篃涓嶆敼璧勬枡妯″瀷銆?- 2026-07-11 宸插畬鎴?`GRS004 / Console route profile completion gate` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/auth.ts` 宸叉柊澧?`requireConsoleUser(returnTo)`锛屼細鍦ㄦ湭鐧诲綍鏃惰烦 `/login`銆佸湪 `profileCompleted=false` 鏃惰烦 `buildProfileCompletionHref(returnTo)`锛沗src/app/console/admin/[section]/page.tsx`銆乣races/page.tsx`銆乣races/new/page.tsx`銆乣races/[raceSlug]/page.tsx`銆乣organizer / rider / judge` section route銆乣screen/page.tsx` 鍜?`screen/[raceSlug]/[mode]/page.tsx` 鐜板凡缁熶竴澶嶇敤璇?helper锛屼笉鍐嶇洿鎺ヨ８璋?`loadDatabaseUser()`锛涙柊澧?`src/app/console/console-route-profile-gating.test.ts` 瑕嗙洊杩欎簺 route 鐨勫叡浜?gate wiring锛屼笖宸查『鎵嬪垹闄や笉鍐嶄娇鐢ㄧ殑鏈?scoped helper `getConsoleRaceBySlug()`锛涜仛鐒﹂獙璇?`node --import tsx --test src/app/console/page.test.tsx src/app/console/console-route-profile-gating.test.ts src/lib/services/console-routes.test.ts src/lib/viewer-access.test.ts src/lib/services/judge-scope-convergence.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-11 宸插畬鎴愪笅涓€鍒囩墖 `GRS004 / Race Console root access boundary` 鐨勮璁℃敹鏁涳紝spec 宸插啓鍒?`docs/superpowers/specs/2026-07-11-grs004-race-console-root-access-boundary-design.md`銆傚綋鍓嶈璁℃槑纭檺瀹氫负鏍归〉杈圭晫淇ˉ锛氬彧澶勭悊 `/console/races` 瀵规棤 `races` section 瑙掕壊灞曠ず绌哄３椤甸潰鐨勯棶棰橈紝涓嶆墿澶у埌鏂扮殑鏉冮檺妯″瀷鎴?detail scope 閲嶆瀯銆?- 2026-07-11 宸插畬鎴?`GRS004 / Race Console root access boundary` 鐨勫疄鐜颁笌楠岃瘉锛歚src/lib/viewer-access.ts` 宸叉柊澧?`getConsoleRacesRootAccess()`锛宍src/app/console/races/page.tsx` 鐜板凡鍦?`requireConsoleUser("/console/races")` 涔嬪悗澶嶇敤璇?helper锛涘綋鍓?`ORGANIZER / RIDER / JUDGE` 浠嶅彲杩涘叆 `璧涗簨鎺у埗鍙癭锛岃€?`ADMIN` 杩欑被娌℃湁 `races` section 鐨勮处鍙蜂細鐩存帴鍥炲埌鑷繁鐨勬帶鍒跺彴榛樿钀界偣锛屼笉鍐嶇湅鍒扮┖澹?`璧涗簨鎺у埗鍙癭锛涙柊澧?`src/app/console/races/page.test.tsx` 瑕嗙洊 route wiring锛宍src/lib/viewer-access.test.ts` 宸茶ˉ root access helper 鏂█锛涜仛鐒﹂獙璇?`node --import tsx --test src/lib/viewer-access.test.ts src/app/console/races/page.test.tsx src/app/console/page.test.tsx src/app/console/console-route-profile-gating.test.ts src/lib/services/console-routes.test.ts src/lib/services/judge-scope-convergence.test.ts` 涓?`npm run build` 宸查€氳繃銆?- 2026-07-10 宸叉柊澧?`grs004readme.md`锛岀敤浜庢眹鎬诲綋鍓?`GRS004` 宸茶惤鍦板姛鑳姐€佺敤鎴峰彲瑙佸彉鍖栥€佹湰鍦伴儴缃叉柟寮忎笌楠岃瘉鍛戒护锛屾柟渚夸粠浠撳簱鏍圭洰褰曞揩閫熶簡瑙ｂ€滅幇鍦ㄥ姞浜嗕粈涔堛€佹€庝箞璺戙€佹€庝箞娴嬧€濄€?- 涓烘仮澶嶆湰杞畬鏁撮獙璇侊紝宸查『鎵嬩慨澶嶄竴缁勭幇鏈?Console 绫诲瀷鏀跺彛闂锛歚race-requests-page.tsx` 鐨?`Panel` 璋冪敤缂哄弬銆乣Panel` 缁勪欢缂哄皯鍙€?`style`銆佷互鍙婅嫢骞?console page 涓?`sessionUser` 鏈樉寮忔敹绐勫鑷寸殑 TypeScript build blocker銆傚綋鍓?`npm run build` 宸叉仮澶嶉€氳繃銆?- 褰撳墠浠ｇ爜搴撳凡缁忎粠鍗曢〉娣峰悎妯″紡鎺ㄨ繘鍒板垎灞傜粨鏋勶紝鏍稿績鍒嗗尯鍖呮嫭鍏紑绔欍€佽禌浜嬫帶鍒跺彴銆佺鐞嗘帶鍒跺彴銆佸ぇ灞忔帶鍒跺彴鍜屽ぇ灞忓睍绀哄眰銆?- 鍏紑椤甸潰涓昏矾绾垮凡缁忚惤鍒?`/races`銆乣/works`銆乣/riders`銆乣/cooperation`銆乣/console/*` 杩欎竴缁?`grs003` 鎺ㄨ崘璺緞涓娿€?- 鎺у埗鍙板叆鍙ｃ€佽瘎濮旇鍥俱€侀獞鎵嬭鍥俱€佷富鍔炴柟瑙嗗浘锛屼互鍙婂叕寮€椤典腑鐨勫ぇ閮ㄥ垎鐢ㄦ埛鍙鏂囨锛屽凡缁忔敹鍙ｅ埌涓枃銆?- 澶у睆鎺у埗鍙颁笌璧涗簨鎺у埗鍙板凡缁忔寜鑳藉姏杈圭晫鎷嗗紑锛涘綋鍓嶅凡閲嶆柊鍚?`Organizer` 寮€鏀惧ぇ灞忔帶鍒跺彴鍏ュ彛锛屼絾 Organizer 鍙兘鐪嬪埌鑷繁涓诲姙鐨勮禌浜嬶紝`Admin` 浠嶅彲鏌ョ湅鍏ㄩ儴璧涗簨銆?
- GitHub OAuth 涓婚摼璺唬鐮佷笌 CA handshake / signal / snapshot fetch 杩愯鏃舵ˉ宸茬粡鍏峰锛屼笖浠撳簱鍐呮柊澧炰簡鍙繍琛岀殑鏈湴 connector demo銆?
- Jumbotron 涓庡ぇ灞忚禌閬撴覆鏌撴牱寮忎粛浠モ€滃敖閲忎繚鐣欐渶鏃╂牱寮忊€濅负鍘熷垯锛岃繖鍑犺疆涓枃鍖栨敹鍙ｆ病鏈夋敼鍔ㄨ禌閬撹瑙夌粨鏋勩€?- 椤圭洰宸插畬鎴?`grs003` 鏍稿績瑕佹眰锛氬叕寮€绔?鎺у埗鍙?澶у睆椤甸潰灏变綅銆? 瑙掕壊浣撶郴銆侀鍩熸ā鍨嬭惤鍦般€丷ace 8 鐘舵€佹満銆丆A 鏈€灏忛棴鐜€丷unner 闄嶇骇銆傚墿浣?UI 瑙嗚鍗囩骇鍜?Team鈫扲egistration 娣卞眰杩佺Щ鍦ㄥ悗缁凯浠ｃ€?- 浼佷笟鍔炶禌鍚堜綔閾惧凡闂幆锛氬叕寮€鍚堜綔椤垫彁浜?鈫?CooperationRequest(PENDING) 鈫?Admin 鎺у埗鍙板鎵癸紙鎵瑰噯鑷姩鍒涘缓 Race / 鎷掔粷鏍囪 REJECTED锛夈€侫dmin 鎺у埗鍙扮敱 3 涓?section 鎵╁睍涓?4 涓€?
## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-6 澶у睆 fallback 鏈哄埗

> 鏈妭鐢ㄤ簬 `DEV-6` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傚綋鍓嶅璇濆凡杩滆秴 500k token锛涘悗缁嫢缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary.plan.md`
  - `DEV-6 Screen Console / 澶у睆鑱旇皟`
  - 楠屾敹锛氬急缃戞垨 Projection 寮傚父鏃跺彲 fallback 鍒扮ǔ瀹?Projection 鎴栭潤鎬佸叕鍛?/ 姒滃崟
- `docs/grs004/ary-qa-plan.md`
  - `搂2.5 Projection 娴嬭瘯`
  - `搂2.7 澶у睆娴嬭瘯`
- `docs/grs004/ary-release-ops-plan.md`
  - `搂8.1 Live Hall 涓嶇ǔ瀹歚
  - `搂8.2 澶у睆涓嶇ǔ瀹歚
- `docs/grs004/grs003-gap-analysis.md`
  - `fallback 鏈哄埗 | 鉂?鏈В鍐砢

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/race-snapshot.ts`
  - 宸蹭繚鐣欙細
    - `buildRaceSnapshot()`
    - `generateRaceSnapshot()`
    - `loadRaceSnapshot()`
  - 鏈疆鏂板锛?    - `resolveRaceSnapshotForDisplay()`
  - 瑙勫垯锛?    - 鍏堝皾璇?live snapshot
    - 鎴愬姛鍒欏埛鏂?`public/assets/snapshots/{raceId}.json`
    - 澶辫触鍒欏洖閫€鍒板凡鏈夌ǔ瀹?snapshot
    - 绋冲畾 snapshot 涔熶笉鍙敤鏃惰繑鍥?`static`
- `src/app/races/[raceSlug]/live/page.tsx`
  - 宸蹭笉鍐嶇洿鎺ヨ皟鐢?`buildRaceSnapshot()`
  - 鐜板凡璇诲彇缁熶竴 fallback 缁撴灉骞舵妸鐘舵€侀€忎紶缁?`LiveHallView`
- `src/app/_components/public/live-hall.tsx`
  - 宸叉柊澧烇細
    - `绋冲畾蹇収 fallback` 鎻愮ず
    - `StaticDisplayFallback`
- `src/app/console/screen/[raceSlug]/[mode]/page.tsx`
  - Jumbotron 棰勮宸插垏鍒扮粺涓€ fallback 璇诲彇
- `src/app/_components/console/screen-console-page.tsx`
  - 宸叉柊澧為潤鎬?fallback 璇存槑鍜?`announcement / leaderboard` 蹇嵎鍒囨崲鍏ュ彛
- `src/app/jumbotron/[raceId]/page.tsx`
  - 鐩爣璧涗簨 snapshot 鎴栬禌閬撹祫婧愪笉鍙敤鏃讹紝鐜板凡鐩存帴鏄剧ず鍏ㄥ睆闈欐€?fallback
- `src/app/JumbotronBanner.tsx`
  - 绋冲畾 snapshot 鏉＄洰浼氭樉绀?`绋冲畾蹇収 fallback`

### 鏈疆宸插畬鎴愮殑鐐?
- `Live Hall`銆乣Screen Console` 棰勮銆乣/jumbotron/[raceId]` 涓夋潯璇诲彇璺緞宸茬粺涓€璧?fallback helper
- 瀹炴椂 snapshot 鎴愬姛鏃朵細鑷姩鍒锋柊鏈湴绋冲畾 snapshot 鏂囦欢
- snapshot 鏋勫缓澶辫触鏃讹紝浼樺厛閫€鍒版渶杩戜竴娆＄ǔ瀹?snapshot
- 鏃犵ǔ瀹?snapshot 鏃讹紝涓嶅啀鍙姤閿欙紝鑰屾槸缁х画灞曠ず闈欐€佸叕鍛?/ 姒滃崟 / 鍏紑浣滃搧鍏ュ彛
- fallback 浠嶇劧涓嶈鍙栧師濮?CA Session锛屼篃涓嶄慨鏀规牳蹇冧簨瀹炴暟鎹?
### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈夌嫭绔嬬殑鈥滆皝瑙﹀彂浜?fallback / 浣曟椂鍒囨崲鈥濈殑鎸佷箙鍖栨搷浣滄棩蹇?- `announcement / leaderboard / works` 浠嶆湭閲嶆瀯鎴愮湡姝ｇ嫭绔嬬殑澶у睆鎾斁椤?- 杩樻病鏈夋妸 fallback 鐘舵€佽繘涓€姝ョ撼鍏?Organizer 渚у€煎畧 / 瀹¤闈㈡澘

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 鑻ョ户缁部 `docs/grs004/grs003-gap-analysis.md` 鏀跺彛锛屼笅涓€姝ュ簲閲嶆柊鏍稿鍓╀綑鏈В鍐抽」閲屽摢涓€涓粛鏄洿楂樹紭鍏堢骇鏄惧紡缂哄彛銆?2. 鑻ョ户缁部 `DEV-6` 娣辨寲锛屽彲璇勪及鏄惁闇€瑕佹妸 fallback 瑙﹀彂璁板綍鎺ュ叆缁熶竴瀹¤锛岃€屼笉鏄彧鍋氬睍绀哄厹搴曘€?3. 鏃犺杩涘叆鍝釜涓嬩竴鍒囩墖锛岄兘缁х画鍚屾 `docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃缁х画鑶ㄨ儉鏃朵紭鍏堝啓鏂扮殑鎭㈠蹇収銆?
## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-5 Review Readiness 椋庨櫓鎻愮ず

> 鏈妭鐢ㄤ簬 `DEV-5 Review Readiness` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傚綋鍓嶅璇濆凡杩滆秴 500k token锛涘悗缁嫢缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary.plan.md`
  - `DEV-5 CA 鎺ュ叆 / Projection / Live Hall`
  - 楠屾敹锛歚failed / not_configured` 涓嶉樆鏂彁浜ゅ拰璇勫锛屼絾蹇呴』鐢熸垚璇勫鍓嶉闄╂彁绀?- `docs/grs004/ary-qa-plan.md`
  - `搂2.4 CA 鎺ュ叆娴嬭瘯`
  - `搂2.2 瑙掕壊璺緞娴嬭瘯`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Review Flag / Review Readiness`
  - `Organizer View 鍜?Judge View 搴斿睍绀鸿瘎瀹″墠椋庨櫓鎻愮ず`
- `docs/grs004/grs003-gap-analysis.md`
  - `璇勫鍓嶉闄╂彁绀?| 鉂?鏈В鍐砢

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/review-readiness-helpers.ts`
  - 宸叉柊澧?`buildReviewReadinessSummary()`
  - 褰撳墠瑙勫垯鍙鐢ㄧ幇鏈夊瓧娈碉細
    - `RaceProject.aggregateIngestionStatus`
    - `Evidence.reviewFlagJson`
    - `Evidence.integrityStatus`
    - `Evidence.confidenceLevel`
    - `Work.title / Work.summary`
- `src/app/_components/console/review-readiness-card.tsx`
  - 宸叉柊澧炵粺涓€ `璇勫鍓嶉闄╂彁绀篳 娓叉煋鍗＄墖
- `src/app/_components/console/organizer-console-page.tsx`
  - `registrations` section 宸叉帴鍏?Review Readiness
- `src/app/_components/console/judge-console-page.tsx`
  - assignment 鍗＄墖宸叉帴鍏?Review Readiness
- `src/lib/services/judging.ts`
  - Judge assignment 鏌ヨ宸茶ˉ `registration.raceProject`

### 鏈疆宸插畬鎴愮殑鐐?
- Organizer 鍜?Judge 鐜板湪閮借兘鍦ㄧ湡瀹炶瘎瀹′笂涓嬫枃涓湅鍒伴闄╂彁绀?- 椋庨櫓鎻愮ず浣跨敤鐜版湁鎽樿瀛楁锛屼笉鏆撮湶鍘熷 CA Session
- `failed / not_configured` 浠嶄笉鑷姩閫€璧涳紝鍙繘鍏ラ闄╂彁绀?- 椋庨櫓鎻愮ず涓嶄細闃绘柇 Judge 琛ㄥ崟锛屼篃涓嶄細鏇夸唬浜哄伐璇勫垎
- 绗竴杞鐩栫殑椋庨櫓鍖呮嫭锛?  - 鏈帴鍏?CA
  - CA 鎺ュ叆澶辫触
  - 缂哄皯鍐呴儴璇佹嵁
  - 瀛樺湪璇佹嵁澶嶆牳鏍囪
  - 瀛樺湪涓彲淇″害璇佹嵁
  - 缂哄皯浣滃搧
  - 浣滃搧鍐呭涓虹┖

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈夌嫭绔嬫寔涔呭寲 `ReviewFlag` / `ReviewReadinessCheck` 瀹炰綋
- 杩樻病鏈夆€滈闄╂彁绀哄凡纭 / 宸插叧闂€濈殑宸ヤ綔娴?- 杩樻病鏈夋妸鍙枒杩濊銆佺己灏戝閮ㄦ潗鏂欑瓑鏇存繁灞傝鍒欑粺涓€绾冲叆鍚屼竴 helper

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 鑻ョ户缁部 `grs003-gap-analysis.md` 鏀跺彛锛屽彲閲嶆柊鏍稿鍓╀綑 `鉂?馃敹` 椤归噷鍝釜浠嶆槸鏈€楂樹紭鍏堢骇鏄惧紡缂哄彛銆?2. 鑻ョ户缁部 `Review Readiness` 娣辨寲锛屽彲璇勪及鏄惁闇€瑕佹妸椋庨櫓鎻愮ず浠庣幇绠?helper 鍗囩骇涓烘寔涔呭寲瀹¤ / 宸ヤ綔娴佸璞°€?3. 鏃犺杩涘叆鍝釜涓嬩竴鍒囩墖锛岄兘缁х画鍚屾 `docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃缁х画鑶ㄨ儉鏃朵紭鍏堝啓鏂扮殑鎭㈠蹇収銆?
## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / Public CA Session 闅旂鏀跺彛

> 鏈妭鐢ㄤ簬 `Public CA Session 闅旂鏀跺彛` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傚綋鍓嶅璇濆凡杩滆秴 500k token锛涘悗缁嫢缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-mvp.prd.md`
  - `鍘熷 CA Session 榛樿涓嶅叕寮€`
  - `鍏紑绔彧璇诲彇 Projection銆丒vidence 鎽樿銆佸凡鍏紑 Work銆佸凡鍙戝竷 Award銆佸凡鍙戝竷涓斿叕寮€鍙鐨?Report 鎴栧叕寮€ Rider Profile`
- `docs/grs004/ary-permission-matrix.md`
  - `鍏紑绔案涓嶈鍙栧師濮?CA Session`
- `docs/grs004/ary-qa-plan.md`
  - `Public 涓嶈兘璁块棶鍚庡彴銆佸師濮?CA Session`
- `docs/grs004/grs003-gap-analysis.md`
  - `CA Session 涓嶅叕寮€ | 馃敹`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/public-routes.ts`
  - `listPublicRaces()`
    - 褰撳墠宸蹭綔涓?public-safe race read model 鍏ュ彛
    - 棣栭〉銆乣/races`銆乣/riders`銆乣/works` 鍜?`getRaceBySlug()` 宸插垏杩囧幓
  - `getRiderBySlug()`
    - 宸蹭笉鍐嶇洿鎺ヨ鍙?`raceProject.caConnections.sessions`
    - `performanceSummary` 褰撳墠鏀逛负璇诲彇锛?      - `CURRENT_LEADERBOARD`
      - `COST`
      - `RISK`
  - `getWorkBySlug()`
    - `evidenceSummaries` 褰撳墠鍙繑鍥?`visibility = PUBLIC`
  - `getRiderBySlug()`
    - `raceRecords[].evidenceCount` 褰撳墠鍙粺璁?`PUBLIC` evidence
- `src/app/_components/public/live-hall.tsx`
  - public fallback 缁熻宸插幓鎺夊 raw `sessions` 鐨勭洿鎺ヨ鍙?  - 褰撳墠鍙洖閫€鍒?`registrationStatus / aggregateIngestionStatus / caConnectionCount`
- `src/lib/services/public-routes.test.ts`
  - 宸叉柊澧烇細
    - raw Session 鍙樺寲浣?Projection 涓嶉噸寤烘椂锛宲ublic rider summary 涓嶅彉
    - `INTERNAL` evidence 涓嶅啀杩涘叆鍏紑 Work / Rider 椤甸潰
    - `getRaceBySlug()` 杩斿洖鐨?public race 涓嶅啀甯?`sessions`

### 鏈疆宸插畬鎴愮殑鐐?
- `public rider profile` 鏈€鐩存帴鐨?raw Session 璇诲彇宸叉敹鎺?- `public work` 璇︽儏椤典笉鍐嶆贩鍏?`INTERNAL` evidence
- `public rider profile` 鐨勮瘉鎹暟鐜板湪鍙粺璁?`PUBLIC` evidence
- 宸叉湁娴嬭瘯鑳借瘉鏄庘€滃叕寮€琛ㄧ幇鎽樿涓嶅啀鐩存帴缁?raw Session鈥?
### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 鍏紑鍏ュ彛宸茬粡寮€濮嬭劚绂?`listRaces()`锛屼絾 `console-safe` / `public-safe` 涓ゅ read model 浠嶆湭瀹屽叏褰诲簳鎷嗗垎
- `Live Hall / Jumbotron` 鐨勫唴閮?snapshot 鐢熸垚浠嶆湁鍚庣画绌洪棿
- 杩欒疆娌℃湁瑕嗙洊 Judge / Organizer 鍐呴儴 Session 璇诲彇杈圭晫

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 鑻ョ户缁部鍏紑鏉冮檺杈圭晫鏀跺彛锛屽彲璇勪及鏄惁瑕佹妸 `listRaces()` 鎷嗘垚 public-safe / console-safe 涓ゅ read model銆?2. 鑻ョ户缁部 `grs003-gap-analysis.md` 鏀跺彛锛屼篃鍙洖鍒板墿浣?`GitHub OAuth`銆乣Runner API` 鎴栨洿瀹屾暣鐨?`CA Session 涓嶅叕寮€` 杈圭晫椤广€?3. 鏃犺杩涘叆鍝釜涓嬩竴鍒囩墖锛岄兘缁х画鍚屾 `docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃缁х画鑶ㄨ儉鏃朵紭鍏堝啓鏂扮殑鎭㈠蹇収銆?
## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-3 GitHub OAuth 鐧诲綍妯″瀷鏀跺彛

> 鏈妭鐢ㄤ簬 `DEV-3 GitHub OAuth 鐧诲綍妯″瀷鏀跺彛` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傚綋鍓嶅璇濆凡杩滆秴 500k token锛涘悗缁嫢缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary.plan.md`
  - `DEV-3 鐧诲綍 / 瑙掕壊 / Race Console`
  - 浜や粯鑼冨洿锛歚GitHub 鐧诲綍`銆乣璧勬枡琛ュ叏`
- `docs/grs004/ary-mvp.prd.md`
  - `MVP 浣跨敤 GitHub 鐧诲綍浣滀负璐﹀彿鍏ュ彛`
- `docs/grs004/grs003-gap-analysis.md`
  - `GitHub 鐧诲綍 | 馃敹`
  - `鐧诲綍妯″瀷浠嶅亸鍚?浠讳綍浜洪兘鍙洿鎺ユ敞鍐?鐧诲綍鏈湴璐﹀彿"`
- `docs/grs004/github-oauth-ca-demo.md`
  - `GitHub OAuth as the formal login entry`
  - `local username/password forms as a development fallback`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/github-oauth.ts`
  - OAuth state cookie / token exchange / GitHub profile fetch / local session 鍒涘缓閮藉凡鍏峰
- `src/lib/auth-entry.ts`
  - 宸叉柊澧烇細
    - `isGitHubOAuthConfigured()`
    - `isLocalAuthFallbackEnabled()`
- `src/app/_components/public/public-auth-entry-regression.test.tsx`
  - 宸叉柊澧烇細
    - 鍖垮悕 `PublicHeader` 浠嶆寚鍚?`/login`
    - 宸茬櫥褰?`PublicHeader` 涓嶅啀鏄剧ず鐧诲綍 CTA锛岃€屾槸鏄剧ず `杩涘叆鎺у埗鍙癭
    - `/login` 浠嶄繚鐣?GitHub action wiring銆乧allback error 鍜?fallback gating
- `src/app/login/page.tsx`
  - 宸叉敼涓猴細
    - GitHub 淇濈暀涓烘寮忓叆鍙?    - local fallback 鍏抽棴鏃朵笉鍐嶆樉绀烘湰鍦拌处鍙疯〃鍗?    - local fallback 鍏抽棴鏃朵笉鍐嶆樉绀?`SeedAccountsPanel`
- `src/lib/profile-completion.ts`
  - 宸叉柊澧烇細
    - `buildProfileCompletionHref()`
    - `resolveProfileCompletionReturnTo()`
    - `getPostAuthRedirectTarget()`
- `src/lib/auth-entry.ts`
  - 宸叉柊澧烇細
    - `getGitHubOAuthCredentials()`
  - `isGitHubOAuthConfigured()`
    - 鐜板湪浼氭妸 `replace-with-*` 鍗犱綅鍊艰涓烘湭閰嶇疆
- `src/app/profile/page.tsx`
  - 宸叉柊澧烇細
    - 鐢ㄦ埛渚ф渶灏忚祫鏂欒ˉ鍏ㄩ〉
- `src/lib/services/users.ts`
  - 宸叉柊澧烇細
    - `completeUserProfile()`
- `src/lib/services/users.ts`
  - 宸叉敼涓猴細
    - local fallback 鍏抽棴鏃舵嫆缁濇湰鍦版敞鍐?    - local fallback 鍏抽棴鏃舵嫆缁濇湰鍦扮櫥褰?- `src/lib/services/submissions.ts`
  - 姣旇禌涓彁浜ょ幇鍦ㄥ彧鍐?`Submission / SubmissionArtifact / SecurityAudit`
  - 涓嶅啀鑷姩鍒涘缓 `RunnerTask`
- `src/app/_components/console/rider-console-page.tsx`
  - 姣旇禌涓叆鍙ｇ幇鍦ㄦ敼鍥?`浣滃搧鎻愪氦 / 鎻愪氦浠ｇ爜`
- `src/app/_components/console/organizer-console-page.tsx`
  - Runner 闈㈡澘鐜板湪鏄庣‘鏍囨垚 `鍏煎 Runner 宸ュ叿`
  - `Skill Signals` 涔熸槑纭爣鎴愬吋瀹逛骇鐗?
### 鏈疆宸插畬鎴愮殑鐐?
- GitHub 浠嶇劧鏄寮忚处鍙峰叆鍙?- 鏈湴璐﹀彿涓嶅啀瀵规墍鏈夌幆澧冮粯璁ゅ紑鏀?- local auth 鍏抽棴鏃讹紝UI 鍜屾湇鍔＄閮戒細鍚屾椂鏀跺彛
- 寮€鍙?/ 婕旂ず fallback 浠嶇劧淇濈暀
- 鍖垮悕棣栭〉鍏ュ彛涓?`/login` 鐨勬渶灏忛摼璺幇鍦ㄥ凡鏈変笓闂ㄥ洖褰掓祴璇?- 鏈湴杩愯鏃跺凡纭 `/` 涓?`/login?returnTo=%2Fraces` 鑳芥甯歌繑鍥?`200`
- 鐧诲綍鎴愬姛鍚庣殑鏈ˉ鍏ㄧ敤鎴风幇鍦ㄤ細鍏堣繘鍏?`/profile`
- 鍏紑鎶ュ悕椤典腑锛屾湭琛ュ叏璧勬枡鐨?Rider 鐜板湪浼氬厛鐪嬪埌鈥滃幓琛ュ叏璧勬枡鈥?- `/console` 鍏ュ彛鐜板湪涓嶄細鐩存帴鏀捐鏈ˉ鍏ㄨ处鍙?- 褰撳墠榛樿 `.env` 浠嶆槸鍗犱綅鍊兼椂锛宍/login` 涓嶄細鍐嶈鏄剧ず GitHub 姝ｅ紡鍏ュ彛

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈夊仛鐪熷疄 GitHub 鎺堟潈娴忚鍣ㄧ偣鍑?/ callback / session 鑱旇皟楠屾敹
- 璧勬枡琛ュ叏鐩墠杩樻槸鏈€灏忚〃鍗曪紝涓嶆槸瀹屾暣璐﹀彿涓績
- 杩樻病鏈夊仛 profile completion 鐨勪簩娆＄紪杈戙€佸鏍告垨鏇翠赴瀵屽瓧娈?- 棣栭〉鈥滆韩浠藉叆鍙ｉ摼璺柇鐐光€濊櫧鐒跺凡鏈夋簮鐮?娓叉煋鍥炲綊鍜?HTTP 璇佹嵁锛屼絾浠嶆湭鍋氭祻瑙堝櫒绾у洖褰?- 鐪熷疄 GitHub client id / secret 閰嶅ソ涔嬪墠锛屾祻瑙堝櫒閲屼粛鏃犳硶楠岃瘉瀹屾暣 OAuth 鎴愬姛閾捐矾
- `/api/runner/tasks/pull` 涓?`/api/runner/tasks/result` 鍏煎 route 浠嶇劧瀛樺湪
- Organizer 渚х殑鍏煎 Runner 瑙﹀彂鍏ュ彛浠嶇劧瀛樺湪锛孯unner 杩樻病鏈夎褰诲簳鍒犲嚭绯荤粺
- Organizer 椤甸潰铏界劧宸茬粡琛ヤ笂姝ｅ紡 Award 鍙戝竷鍏ュ彛锛屼絾 Award draft 缂栬緫 / withdraw 宸ヤ綔娴佷粛鏈柊澧?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 鑻ョ户缁部 `GitHub OAuth` 杩欐潯绾挎帹杩涳紝涓嬩竴姝ュ簲杩涘叆鐪熷疄娴忚鍣ㄦ巿鏉?/ callback / session 楠屾敹锛岃€屼笉鍙槸妯″瀷鏀跺彛銆佽祫鏂欒ˉ鍏ㄥ拰婧愮爜/HTTP 鍥炲綊銆?2. 鑻ュ垏鍥?`grs003-gap-analysis.md` 鐨勫墿浣欐樉寮忕己鍙ｏ紝涔熷彲浠ョ户缁敹鍙?`Runner API` 鎴栨洿瀹屾暣鐨?`CA Push+Fetch` 涓昏矾寰勫垏鎹€?3. 鏃犺杩涘叆鍝釜涓嬩竴鍒囩墖锛岄兘缁х画鍚屾 `docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃缁х画鑶ㄨ儉鏃朵紭鍏堝啓鏂扮殑鎭㈠蹇収銆?
## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-3 璧勬枡琛ュ叏姝ｅ紡宸ヤ綔娴?
> 鏈妭鐢ㄤ簬 `DEV-3 璧勬枡琛ュ叏姝ｅ紡宸ヤ綔娴乣 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傚綋鍓嶅璇濆凡杩滆秴 500k token锛涘悗缁嫢缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary.plan.md`
  - `DEV-3 鐧诲綍 / 瑙掕壊 / Race Console`
  - 浜や粯鑼冨洿锛歚GitHub 鐧诲綍`銆乣璧勬枡琛ュ叏`
- `docs/grs004/ary-mvp.prd.md`
  - `鐢ㄦ埛鍙互閫氳繃 GitHub 鐧诲綍骞惰ˉ鍏ㄤ釜浜鸿祫鏂檂
- `docs/grs004/ary-qa-plan.md`
  - P0 鍥炲綊锛歚GitHub 鐧诲綍 -> 璧勬枡琛ュ叏 -> Admin 鍒嗛厤 roles -> ...`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/profile-completion.ts`
  - 宸叉柊澧烇細
    - `buildProfileCompletionHref()`
    - `resolveProfileCompletionReturnTo()`
    - `getPostAuthRedirectTarget()`
- `src/app/profile/page.tsx`
  - 宸叉柊澧烇細
    - 鐢ㄦ埛渚ф渶灏忚祫鏂欒ˉ鍏ㄩ〉
- `src/app/actions.ts`
  - 宸叉柊澧烇細
    - `completeProfileAction`
  - `registerAction / loginAction`
    - 鐜板湪浼氭寜 `profileCompleted` 鍐冲畾鏄厛鍥炲師璺繕鏄厛鍘?`/profile`
- `src/lib/github-oauth.ts`
  - GitHub callback 鎴愬姛鍚庣幇鍦ㄤ篃浼氳蛋鍚屼竴濂?post-auth redirect helper
- `src/lib/services/users.ts`
  - 宸叉柊澧烇細
    - `completeUserProfile()`
- `src/app/console/page.tsx`
  - 鏈ˉ鍏ㄨ处鍙疯繘鍏?`/console` 鏃讹紝浼氬厛琚鍚?`/profile?returnTo=%2Fconsole`
- `src/app/_components/public/race-register-page.tsx`
  - 宸茬櫥褰曚絾鏈ˉ鍏ㄧ殑 Rider 鐜板湪鍏堢湅鍒扳€滃幓琛ュ叏璧勬枡鈥?
### 鏈疆宸插畬鎴愮殑鐐?
- 鐧诲綍鎴愬姛鍚庣殑鏈ˉ鍏ㄧ敤鎴风幇鍦ㄦ湁姝ｅ紡璧勬枡琛ュ叏椤?- 璧勬枡淇濆瓨鍚庝細鍥炲埌鍘?`returnTo`
- `/console` 鍏ュ彛鐜板湪浼氭嫤鏈ˉ鍏ㄨ处鍙?- 鍏紑鎶ュ悕椤典笉鍐嶈鏈ˉ鍏?Rider 鐩存帴鐐光€滄姤鍚嶅弬璧涒€?
### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈夌湡瀹?GitHub 娴忚鍣ㄦ巿鏉冭仈璋?- 璧勬枡琛ュ叏杩樻槸鏈€灏忚〃鍗曪紝涓嶆槸瀹屾暣璐﹀彿涓績
- 杩樻病鏈?profile completion 鐨勪簩娆＄紪杈?/ 瀹℃牳 / 鏇翠赴瀵屽瓧娈?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 鑻ョ户缁部 `DEV-3` 鎺ㄨ繘锛屼笅涓€姝ュ簲鍋氱湡瀹?GitHub 娴忚鍣ㄦ巿鏉?+ callback + session 楠屾敹銆?2. 鑻ュ垏鍥炲叏灞€鍓╀綑鏄惧紡缂哄彛锛屼篃鍙互缁х画鏀跺彛 `Runner API` 鎴栨洿瀹屾暣鐨?`CA Push+Fetch` 涓昏矾寰勫垏鎹€?3. 鏃犺杩涘叆鍝釜涓嬩竴鍒囩墖锛岄兘缁х画鍚屾 `docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃缁х画鑶ㄨ儉鏃朵紭鍏堝啓鏂扮殑鎭㈠蹇収銆?
## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / Runner 鑷姩鍏ラ槦闄嶇骇瀵归綈

> 鏈妭鐢ㄤ簬 `Runner 鑷姩鍏ラ槦闄嶇骇瀵归綈` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傚綋鍓嶅璇濆凡杩滆秴 500k token锛涘悗缁嫢缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/grs003-gap-analysis.md`
  - `CA Push+Fetch 妯″紡 | 馃敹`
  - `Runner API 搴熼櫎 | 馃敹`
  - `璇勫垎妯″紡杩佺Щ | 馃敹`
- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - Runner 宸查檷绾т负鍏煎閾捐矾鎴栬緟鍔╁鐞嗙粍浠?
### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/submissions.ts`
  - `createSubmission()`
    - 鐜板湪鍙啓 `Submission / SubmissionArtifact / SecurityAudit`
    - 涓嶅啀鏀寔 Rider 鎻愪氦鏃惰嚜鍔ㄥ垱寤?`RunnerTask`
- `src/app/actions.ts`
  - 宸插垹闄わ細
    - `submitEntryForTestAction`
- `src/app/_components/console/rider-console-page.tsx`
  - 姣旇禌涓叆鍙ｇ幇宸叉敼鍥烇細
    - `浣滃搧鎻愪氦`
    - `鎻愪氦浠ｇ爜`
- `src/lib/services/material-integrity-submissions.test.ts`
  - 鐜板凡鐢ㄦ樉寮?`RunnerTask` fixture 瑕嗙洊 `pullRunnerTask()` 鐨勫畬鏁存€ц竟鐣?
### 鏈疆宸插畬鎴愮殑鐐?
- Rider 姣旇禌涓彁浜や笉鍐嶈嚜鍔ㄨЕ鍙?Runner
- 姣旇禌涓彁浜ゆ祦绋嬬殑鏂囨涓嶅啀鍐欐垚鈥滆禌涓唬鐮佹祴璇曗€?- 鍏煎 Runner 鐨勫畬鏁存€ф祴璇曠户缁瓨鍦紝浣嗕笉鍐嶄緷璧?Rider 鑷姩鍏ラ槦
- Organizer 椤甸潰涓殑 Runner 闈㈡澘鐜板湪鏄庣‘鏍囨垚鍏煎宸ュ叿

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `/api/runner/tasks/pull` 涓?`/api/runner/tasks/result` 鍏煎 route 浠嶅湪
- Organizer 鎵嬪姩鍏煎 Runner 瑙﹀彂鍏ュ彛浠嶅湪
- Runner 浠嶆湭琚交搴曞垹鍑虹郴缁?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 鑻ョ户缁部 Runner 杩欐潯绾挎帹杩涳紝涓嬩竴姝ュ簲璇勪及 Organizer 渚у吋瀹?Runner 瑙﹀彂鍏ュ彛鏄惁涔熻缁х画闄嶇骇銆?2. 鑻ュ垏鍥炲叏灞€鍓╀綑鏄惧紡缂哄彛锛屼篃鍙互缁х画鍋氱湡瀹?GitHub OAuth 娴忚鍣ㄨ仈璋冦€?3. 鏃犺杩涘叆鍝釜涓嬩竴鍒囩墖锛岄兘缁х画鍚屾 `docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃缁х画鑶ㄨ儉鏃朵紭鍏堝啓鏂扮殑鎭㈠蹇収銆?
## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-5 / P0 鍙俊閾剧己鍙?
> 鏈妭鐢ㄤ簬浼氳瘽涓婁笅鏂囧帇缂╁悗鐨勬仮澶嶅叆鍙ｃ€傚綋鍓嶅璇濆凡瓒呰繃 500k token锛屽悗缁嫢缁х画鎺ㄨ繘 `grs004`锛屽簲鍏堣鏈妭锛屽啀鍥炲埌瀵瑰簲婧愭枃妗ｄ笌浠ｇ爜鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary.plan.md`
  - 褰撳墠棣栧厛鏀舵暃鍒?`DEV-5 CA 鎺ュ叆 / Projection / Live Hall`銆?- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰 `搂5 褰撳墠涓昏缂哄彛`銆乣搂6 GRS004 鎺ㄨ崘瀹炵幇璺嚎`銆乣搂8 楠屾敹鏍囧噯`銆?  - 褰撳墠浼樺厛绾ф槸 `P0锛氬厛琛ュ彲淇￠摼缂哄彛`锛屼笉鏄?`P1 鏉愭枡瀹屾暣鎬 鎴?`P2 connector 璁よ瘉澧炲己`銆?
### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `prisma/schema.prisma`
  - `CAIngestionEvent` 宸茶ˉ `payloadDigest / sequence / receivedAt / integrityStatus`銆?  - `Evidence` 宸茶ˉ `integrityStatus / confidenceLevel / sourceDigest / generatedFromEventIdsJson / reviewFlagJson`銆?- `src/lib/services/ca-ingestion.ts`
  - 缁х画淇濈暀 `connectorSecret` 鏍￠獙銆乣disabled/handshake` 鏍￠獙銆乻cope 鏍￠獙銆乣Session` upsert銆乣CAConnection`/`RaceProject` 鐘舵€佹洿鏂帮紝浠ュ強 signal 鍚庤Е鍙?`Evidence` / `Projection` 閲嶅缓銆?  - 宸茶ˉ `schemaVersion / sequence` 瑙ｆ瀽銆乣payloadDigest` 璁＄畻銆佹椂闂寸獥 `review_needed` 鏍囪锛屼互鍙婇噸澶?`idempotencyKey` 涓?payload 涓嶄竴鑷存椂鐨?`integrity_gap` 椋庨櫓璁板綍銆?- `src/lib/services/ca-fetch.ts`
  - 缁х画淇濈暀 handshake銆乻napshot fetch銆乸ayload scope 鏍￠獙銆乣snapshotFetchedAt` stale 鍒ゆ柇锛屼互鍙?fetch 鍚庤Е鍙?`Evidence` / `Projection` 閲嶅缓銆?  - snapshot fetch 浜嬩欢宸茶ˉ `payloadDigest / receivedAt / integrityStatus`銆?- `src/lib/services/evidence.ts`
  - 浠嶇敱 `Session` 閲嶅缓 `SESSION_SUMMARY` Evidence銆?  - 鐜板凡鍚屾椂璇诲彇鍏宠仈 ingestion events锛岀敓鎴?`confidenceLevel / integrityStatus / sourceDigest / generatedFromEventIdsJson / reviewFlagJson`銆?- `src/lib/services/projections.ts`
  - 褰撳墠浠嶆槸 race 绾у叏閲?rebuild銆?  - 杩欎笌 `grs004` 鏂囨。鎻忚堪涓€鑷达細鐜伴樁娈靛厑璁镐繚鐣欏叏閲?rebuild 浣滀负 fallback锛屽悗缁啀缁嗗寲灞€閮ㄦ洿鏂般€?
### 鏈疆宸插畬鎴愮殑鐐?
- 鏈疆鎸?`涓ユ牸 P0` 鎵ц锛屾病鏈夋妸 `P1` 鎴?`P2` 娣疯繘鏉ャ€?- 鏈疆宸茶鐩栵細
  - `CAIngestionEvent` 鐨?`payloadDigest / sequence / receivedAt / integrityStatus`
  - `Evidence` 鐨勫畬鏁存€?/ 鍙俊搴﹀瓧娈?  - 閲嶅 `idempotencyKey` 涓?digest 涓嶄竴鑷存椂褰㈡垚 integrity risk
  - signal 鏃堕棿绐楁鏌ワ紝浣嗗彧褰㈡垚椋庨櫓锛屼笉鑷姩 DQ
- 鏈疆涓嶅仛锛?  - `Work / 棰樼洰 / 浠ｇ爜` hash
  - 娑堟伅绾х鍚?  - 鐙珛 `SecurityAudit / IntegrityEvent`
  - 鑷姩澶勭綒銆佽嚜鍔?DQ

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `docs/superpowers/specs/2026-07-10-grs004-dev5-p0-trusted-ingestion-design.md` 涓?`docs/superpowers/plans/2026-07-10-grs004-dev5-p0-trusted-ingestion-implementation-plan.md` 宸插啓鍑猴紝涓旀湰杞疄鐜颁笌楠岃瘉宸叉寜鍏朵富绾垮畬鎴愮涓€杞惤鍦般€?- `P1 鏉愭枡瀹屾暣鎬銆乣P2 connector 璁よ瘉澧炲己`銆佺嫭绔?`SecurityAudit / IntegrityEvent`銆佹秷鎭骇绛惧悕銆乣Work / 棰樼洰 / 浠ｇ爜` hash 浠嶆湭寮€濮嬨€?- Projection 浠嶄繚鎸?race 绾у叏閲?rebuild锛屽皻鏈繘鍏?`sourceVersion / inputDigest / 灞€閮ㄩ噸寤篳 闃舵銆?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 鑻ョ户缁部 `闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屼笅涓€瀛愰」鐩簲杩涘叆 `P1 鏉愭枡瀹屾暣鎬銆?2. 鑻ュ垏鍥?`ary.plan.md` 鐨勫叏灞€绐楀彛锛屽簲閲嶆柊鏍稿褰撳墠鍝釜 `DEV-* / UX-* / REL-*` 鏄洿楂樹紭鍏堢骇鍏ュ彛銆?3. 鏃犺杩涘叆鍝釜涓嬩竴瀛愰」鐩紝閮藉簲缁х画鍦?`docs/superpowers` 涓淮鎶?spec / plan / status锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?
## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-A 鏉愭枡寮曠敤涓?hash 鍩虹灞?
> 鏈妭鐢ㄤ簬 `P1-A` 宸插疄鏂藉垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画浼氳瘽浠?`P1-A` 缁х画锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`銆乣prisma/schema.prisma` 鍜岀浉鍏?services銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂5.3 Work / 棰樼洰 / 澶栭儴鏉愭枡缂哄皯 hash 鍏冩暟鎹甡
    - `搂6 P1锛氳ˉ鏉愭枡瀹屾暣鎬
    - `搂10 浼佷笟棰樼洰闃茬鏀筦
    - `搂11 閫夋墜浠ｇ爜闃茬鏀筦
- `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`
  - 褰撳墠宸插啓鍑虹殑 `P1-A` 璁捐鏂囨。銆?
### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `CooperationRequest`
  - 宸蹭繚瀛?`taskPackageFileHash / proposalFileHash`
- `Race`
  - `approveCooperationRequest()` 鍒涘缓璧涗簨鏃朵細鍐欏叆 `challengeSourceRefJson / challengeContentHash`
- `Work`
  - `buildWorkSeedRecord()` 璺緞宸茶ˉ榻?`sourceRefJson / contentHash`
- `Submission / SubmissionArtifact`
  - `createSubmission()` / `createFinalSubmission()` 宸插啓鍏?`codeContentHash / ridingRecordHash / submitterBindingJson`
- `TeamArchive`
  - `projectProgressEvalSuccess()` 宸叉妸 artifact 涓婄殑涓夐」瀹屾暣鎬у瓧娈靛悓姝ュ埌褰掓。
  - 褰掓。/姒滃崟/杩涘害浠诲姟鐨勫鍣ㄥ尮閰嶅凡鍏煎鏃х殑 `teamId` 璁板綍涓庢柊鐨?`registrationId` 璁板綍
- `Award / JudgingRecord / Report`
  - 浠嶆湭琛モ€滃紩鐢ㄥ綋鏃舵潗鏂欑増鏈€濈殑鍐荤粨瀛楁锛岀户缁暀缁?`P1-B`

### 鏈疆宸叉敹鏁涚殑璁捐缁撹

- `P1` 涓嶄竴娆″仛瀹岋紝鍏堟媶鎴?`P1-A 鏉愭枡寮曠敤涓?hash 鍩虹灞俙
- `P1-A` 鍙鐩栵細
  - 浼佷笟棰樼洰鏉愭枡
  - Work 璧勪骇寮曠敤
  - 閫夋墜浠ｇ爜鏉愭枡
- `P1-A` 涓嶈鐩栵細
  - `Award / Report / JudgingRecord` 鐗堟湰鍐荤粨
  - 缁熶竴 `SecurityAudit / IntegrityEvent`
  - GitHub commit / tag / release 澶栭儴鎶撳彇
  - Demo / 瑙嗛杩滅鍐呭鎶撳彇鏍￠獙
- 鎺ㄨ崘鏂规鏄細**鍦ㄧ幇鏈夋ā鍨嬩笂鐩存帴琛?`sourceRef + hash` 瀛楁**锛屼笉鏂板缓鐙珛 `MaterialIntegrityRecord`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `P1-A` 鏈韩鐨勪唬鐮佸垏鐗囧凡瀹屾垚锛屽綋鍓嶆病鏈夋柊鐨勫凡鐭ュ疄鐜扮己鍙ｇ暀鍦ㄦ湰杞寖鍥村唴銆?- 浠嶆湭杩涘叆鐨勫悗缁寖鍥村寘鎷細
  - `P1-B` 鐨?`Award / JudgingRecord / Report` 缁撴灉寮曠敤鍐荤粨
  - 缁熶竴 `SecurityAudit / IntegrityEvent`
  - GitHub commit / tag / release 鎷夊彇
  - Demo / 瑙嗛杩滅鍐呭鎶撳彇鏍￠獙

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屼笅涓€瀛愰」鐩簲杩涘叆 `P1-B 缁撴灉寮曠敤鍐荤粨灞俙銆?2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛屼繚鎸?`docs/superpowers/spec / plan / status` 鍚屾鏇存柊锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛琛ユ仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/material-integrity-cooperation.test.ts src/lib/services/material-integrity-submissions.test.ts src/lib/services/material-integrity-work.test.ts`
   - `npm run db:generate`
   - `npm run db:seed`
   - `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-7 Report 鑽夌缂栬緫涓?reviewed 鍙戝竷闂ㄧ

> 鏈妭鐢ㄤ簬 `DEV-7` 杩欐 鈥淩eport edit + reviewed gate鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-permission-matrix.md`銆乣docs/grs004/ary-domain-analysis.v0.3.md`銆乣docs/superpowers/specs/2026-07-11-grs004-dev7-report-edit-review-gate-design.md` 涓庣浉鍏冲疄鐜版枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-permission-matrix.md`
  - `3.10 Report`
    - `generate`
    - `edit`
    - `publish`
    - `regenerate`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Report Status`
    - `draft`
    - `generated`
    - `reviewed`
    - `published`
- `docs/superpowers/specs/2026-07-11-grs004-dev7-report-edit-review-gate-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev7-report-edit-review-gate-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/reports.ts`
  - 鏂板锛?    - `updateReportDraftForRace()`
    - `markReportReviewedForRace()`
  - `publishReportForRace()` 鐜板湪浼氭嫆缁濇湭 reviewed 鐨勫叕寮€鎶ュ憡
  - `generateReportsForRace()` 缁х画鎵挎媴 regenerate锛屼粛浼氳鐩栨湭鍙戝竷鎶ュ憡骞舵妸鐘舵€侀噸缃垚 `GENERATED`
- `src/app/actions.ts`
  - 鏂板锛?    - `updateReportDraftAction()`
    - `markReportReviewedAction()`
- `src/app/_components/console/organizer-console-page.tsx`
  - `reports` 鍖哄煙鐜板湪宸叉湁锛?    - 閲嶆柊鐢熸垚鎻愮ず
    - 鎶ュ憡鑽夌缂栬緫琛ㄥ崟
    - `淇濆瓨鎶ュ憡鑽夌`
    - `鏍囪涓?reviewed`
    - 鍙戝竷鎸夐挳鍦ㄦ湭 reviewed 鏃朵繚鎸佸彲瑙佷絾绂佺敤
- `src/lib/services/reports-generation.test.ts`
  - 宸茶鐩栵細
    - edit -> `DRAFT`
    - regenerate -> `GENERATED`
    - publish before reviewed 琚嫆缁?    - reviewed 鍚?publish 鎴愬姛
- `src/app/_components/console/organizer-report-controls.test.tsx`
  - 宸茶鐩栵細
    - draft edit controls
    - reviewed affordance
    - regenerate warning copy

### 鏈疆宸插畬鎴愮殑鐐?
- Organizer 鐜板湪鍙互缂栬緫鏈彂甯冩姤鍛?- 缂栬緫鍚庢姤鍛婁細杩涘叆 `DRAFT`
- Organizer 鐜板湪鍙互鎶婃湭鍙戝竷鎶ュ憡鏍囪涓?`REVIEWED`
- `race_report / review_summary` 鏈?reviewed 鏃朵笉鑳藉彂甯?- `generateReportsForRace()` 浠嶇劧鏄?regenerate 鍏ュ彛锛屽苟涓斾細瑕嗙洊鏈彂甯冭崏绋?- Rider 绉佹湁 `rider_report` 涓?Public 鎶ュ憡鍙鎬ц竟鐣屾湭琚洖閫€

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈?report withdraw
- 杩樻病鏈?report version history / diff
- 杩樻病鏈夊浜哄鏍告垨 reviewer comments
- `Award draft / withdraw` 浠嶇劧娌¤ˉ榻?
### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/lib/services/reports-generation.test.ts src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/organizer-report-controls.test.tsx`
- `node --import tsx --test src/lib/services/rider-console.test.ts src/lib/services/public-routes.test.ts src/app/_components/public/rider-profile-page.test.tsx src/app/_components/console/organizer-report-controls.test.tsx`
- `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-7 Report Visibility and Publication Baseline

> 鏈妭鐢ㄤ簬 `DEV-7 Report Visibility and Publication Baseline` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傚綋鍓嶅璇濆凡杩滆秴 500k token锛涘悗缁嫢缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary.plan.md`
  - `DEV-7 Report / Review / Results`
  - `rider_report銆乺ace_report銆乺eview_summary`
- `docs/grs004/ary-qa-plan.md`
  - `rider_report 鐢熸垚銆佹煡鐪媊
  - `race_report 鐢熸垚銆佺紪杈慲
  - `review_summary 鐢熸垚銆佺紪杈戙€佸彂甯僠
  - `鏈彂甯?Report 涓嶅嚭鐜板湪 Public Site`
- `docs/grs004/ary-permission-matrix.md`
  - `rider_report` 榛樿鍙厑璁稿搴?Rider銆乵anaged race Organizer 鍜?Admin
  - Public 鍙兘鏌ョ湅宸插彂甯?`race_report / review_summary`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/reports.ts`
  - 宸叉柊澧烇細
    - `listPrivateRiderReportsForUserInRace()`
    - `generateReportsForRace()`
    - `publishReportForRace()`
  - 鐢熸垚閫昏緫鐜板凡瑕嗙洊锛?    - `RIDER_REPORT`
    - `RACE_REPORT`
    - `REVIEW_SUMMARY`
  - 缁х画澶嶇敤锛?    - `Report.status`
    - `publishedAt`
    - `sourceRefJson / sourceDigest`
- `src/lib/services/rider-console.ts`
  - Rider Console 鐜板凡鏀硅鈥滃綋鍓?race 涓嬭嚜宸辩殑绉佹湁 rider_report鈥?- `src/lib/services/public-routes.ts`
  - Public Rider Profile 鐜板凡涓嶅啀璇诲彇 `rider_report`
  - `reportSummaries` 鐜板凡娓呯┖锛屼笉鍐嶅叕寮€楠戞墜绉佹湁鎶ュ憡鎽樿
- `src/app/_components/public/rider-profile-page.tsx`
  - 鍏紑 Rider Profile 鐜板凡鍙睍绀哄凡鍙戝竷璇勫鎽樿锛屼笉鍐嶅睍绀?`rider_report`
- `src/app/actions.ts`
  - 宸叉柊澧烇細
    - `generateReportsAction()`
    - `publishReportAction()`
- `src/app/_components/console/organizer-console-page.tsx`
  - `reports` section 鐜板凡鏂板锛?    - `鐢熸垚鎶ュ憡鑽夌`
    - `鍙戝竷 race_report`
    - `鍙戝竷 review_summary`

### 鏈疆宸插畬鎴愮殑鐐?
- Organizer 鐜板湪鍙互涓哄綋鍓?race 鐢熸垚涓夌被鎶ュ憡鑽夌
- Organizer 鐜板湪鍙互鍙戝竷 `race_report / review_summary`
- Rider 鐜板湪鍙互鍦?Rider Console 閲岀湅鍒拌嚜宸卞綋鍓?race 涓嬬殑绉佹湁 `rider_report`
- Public Rider Profile 涓嶅啀鏆撮湶 `rider_report`
- Public Review / Results 缁х画鍙宸插彂甯冩姤鍛?
### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈夊畬鏁存姤鍛婄紪杈戝櫒
- `rider_report` 浠嶉粯璁や繚鎸佺鏈夛紝娌℃湁鍗曠嫭鐨勫叕寮€鍙戝竷瑙勫垯
- 杩樻病鏈夊畬鏁?`Report generator / publish` 宸ヤ綔娴佺殑澶嶆牳/鎾ゅ洖闃舵
- 鍏煎 Runner route 鍜屽吋瀹?Runner 瑙﹀彂鍏ュ彛浠嶇劧瀛樺湪

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 鑻ョ户缁部 `DEV-7` 娣辨寲锛屼笅涓€姝ュ簲琛?`race_report / review_summary` 缂栬緫涓庡鏍稿彂甯冩祦绋嬨€?2. 鑻ュ垏鍥炲叏灞€鍓╀綑鏄惧紡缂哄彛锛屼篃鍙互缁х画鍋氱湡瀹?GitHub OAuth 娴忚鍣ㄨ仈璋冩垨鍏煎 Runner API 杩涗竴姝ラ€€鍦恒€?3. 鏃犺杩涘叆鍝釜涓嬩竴鍒囩墖锛岄兘缁х画鍚屾 `docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃缁х画鑶ㄨ儉鏃朵紭鍏堝啓鏂扮殑鎭㈠蹇収銆?
## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-7 姝ｅ紡 Award 鍙戝竷涓庡叕寮€缁撴灉闂ㄧ鏀跺彛

> 鏈妭鐢ㄤ簬 `DEV-7 姝ｅ紡 Award 鍙戝竷涓庡叕寮€缁撴灉闂ㄧ鏀跺彛` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傚綋鍓嶅璇濆凡杩滆秴 500k token锛涘悗缁嫢缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary.plan.md`
  - `DEV-7 Report / Review / Results`
  - 楠屾敹锛歚Organizer 鍙互鍙戝竷姒滃崟`
- `docs/grs004/ary-qa-plan.md`
  - `Organizer锛氬垱寤鸿禌浜嬨€佺鐞嗘姤鍚嶃€佸垎閰嶈瘎濮斻€佸彂甯冩鍗昤
  - `Public 涓嶈兘璁块棶鏈彂甯?Award / Leaderboard draft`
- `docs/grs004/ary-permission-matrix.md`
  - `3.7 JudgingRecord`
  - `3.8 Award / Leaderboard`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/awards.ts`
  - 宸叉柊澧烇細
    - `listPublishedAwardsForRace()`
    - `publishAwardsForRace()`
  - 姝ｅ紡鍙戝竷瑙勫垯锛?    - `Best Overall`锛歚scoreResult + scoreRiding`
    - `Best Work`锛歚scoreResult`
    - `Best Agent Rider`锛歚scoreRiding`
  - 鍙秷璐?`submittedAt != null` 鐨?`JudgingRecord`
  - 缁х画澶嶇敤 `Award.sourceRefJson / sourceDigest / publishedAt`
- `src/lib/services/judging.ts`
  - `listJudgingRecordsForRace()` 鐜板凡鏀寔 `submittedOnly`
- `src/lib/services/results.ts`
  - Public Results 鐜板凡鍙锛?    - 宸插彂甯?Award
    - 宸叉彁浜?JudgingRecord 鎽樿
- `src/lib/services/review.ts`
  - Public Review 鐜板凡鍙锛?    - 宸插彂甯?Award
    - 宸叉彁浜?JudgingRecord 鎽樿
- `src/lib/services/public-routes.ts`
  - Public `race / rider` read model 鐜板凡缁熶竴杩囨护鏈彂甯?Award
  - Public rider judge comments 鐜板凡鍙潵鑷凡鎻愪氦 JudgingRecord
- `src/lib/services/works.ts`
  - Public work 璺敱鐜板凡杩囨护锛?    - `publishedAt = null` 鐨?Award
    - `submittedAt = null` 鐨?JudgingRecord 鑽夌璇勮
- `src/app/actions.ts`
  - `publishLeaderboardAction()` 鐜板凡鏀瑰洖姝ｅ紡 Award 鍙戝竷璇箟
  - 鍏煎 Runner 璇勪及宸叉媶鍒帮細
    - `runCompatibilityProgressEvalAction()`
    - `runCompatibilityHarnessEvalAction()`
- `src/app/_components/console/organizer-console-page.tsx`
  - `awards` section 鐜板凡鏂板锛?    - `姝ｅ紡姒滃崟鍙戝竷`
    - `鎸?JudgingRecord 鍙戝竷姝ｅ紡姒滃崟`
  - `judging` section 鐨?Runner 鎸夐挳缁х画淇濈暀涓哄吋瀹归摼璺?
### 鏈疆宸插畬鎴愮殑鐐?
- Organizer 鐜板湪鍙互鎸夎瘎濮斿凡鎻愪氦鐨?`JudgingRecord` 姝ｅ紡鍙戝竷 Award
- Public `results / review / work / rider / race` 缁撴灉閾捐矾鐜板湪涓嶄細鎻愬墠娉勯湶鏈彂甯?Award
- Public `review / work / rider` 缁撴灉鎽樿鐜板湪涓嶄細鎻愬墠娉勯湶鏈彁浜?`JudgingRecord` 鑽夌
- 姝ｅ紡缁撴灉鍔ㄤ綔涓庡吋瀹?Runner 鍔ㄤ綔鐜板湪宸茬粡鍦?action 鍛藉悕鍜岄〉闈㈠叆鍙ｄ笂鍒嗗紑

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈?Award draft 缂栬緫/鎾ゅ洖宸ヤ綔娴?- 杩樻病鏈夋寮?`Report generator / publish` 鍏ㄩ摼璺敹鍙?- 鍏煎 Runner route 鍜屽吋瀹?Runner 瑙﹀彂鍏ュ彛浠嶇劧瀛樺湪
- 鐪熷疄 GitHub OAuth 娴忚鍣ㄨ仈璋冧粛鏈畬鎴?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 鑻ョ户缁部 `DEV-7` 娣辨寲锛屼笅涓€姝ュ簲璇勪及鏄惁琛?Award draft / withdraw 涓?Report publish 涓婚摼璺€?2. 鑻ュ垏鍥炲叏灞€鍓╀綑鏄惧紡缂哄彛锛屼篃鍙互缁х画鍋氱湡瀹?GitHub OAuth 娴忚鍣ㄨ仈璋冩垨鍏煎 Runner API 杩涗竴姝ラ€€鍦恒€?3. 鏃犺杩涘叆鍝釜涓嬩竴鍒囩墖锛岄兘缁х画鍚屾 `docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃缁х画鑶ㄨ儉鏃朵紭鍏堝啓鏂扮殑鎭㈠蹇収銆?
## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P2-D connector 瀹¤鎬昏鍙鍖?> 鏈妭鐢ㄤ簬 `P2-D` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂6 P2锛氬寮?connector 璁よ瘉`
      - `4. 鏀寔 disabled / revoked connector 鐨勫璁′笌鍙鍖朻
- `docs/superpowers/specs/2026-07-10-grs004-p2d-connector-audit-overview-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p2d-connector-audit-overview-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `prisma/schema.prisma`
  - `SecurityAudit` 浠嶄负鍗曡〃妯″瀷锛屽瓧娈靛寘鎷細
    - `raceId / raceProjectId / registrationId / userId / caConnectionId`
    - `action / result / reason / detailsJson / createdAt`
- `src/lib/services/races.ts`
  - `listRaces()` 鐜板湪浼氶澶栬鍙?race 鐩稿叧 `SecurityAudit`
  - 宸叉寜 `raceId` 鍒嗙粍骞舵寕鍥?race read model 鐨?`securityAudits`
- `src/app/_components/console/organizer-console-page.tsx`
  - `ca-status` 鐜板湪闄や簡 `Trust / Risk Summary` 澶栵紝杩樹細涓烘瘡涓?registration 娓叉煋 `Connector Audit Overview`
  - overview 浼氭樉绀猴細
    - `Recent Audit Events`
    - `Rejected Events`
    - `Review Events`
    - recent audit event rows
    - `Audit Reason`
    - `Audit Connector`
- `src/app/_components/console/organizer-console-page.test.tsx`
  - 宸茶鐩栧綋鍓?registration 瀹¤鎽樿銆佺┖鐘舵€併€佹棤鍏?registration 瀹¤闅旂锛屼互鍙?`action / result / reason / connectorId`

### 鏈疆宸插畬鎴愮殑鐐?
- organizer 鐜板湪鍙互鍦?`ca-status` 涓洿鎺ョ湅鍒版瘡涓?registration 鐨?connector 瀹¤鎬昏
- 灞曠ず鐩存帴娑堣垂鐜版湁 `SecurityAudit`
- 鏃犲叧 registration 鐨勫璁′簨浠朵笉浼氭硠婕忓埌褰撳墠 registration 鍗＄墖
- 鏈疆娌℃湁鏂板鏂扮殑璁よ瘉绛栫暐锛屼篃娌℃湁鏂板紑瀹¤椤甸潰
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鏂板鐙珛 organizer 瀹¤椤甸潰
- 浠嶆湭鏂板瀹¤绛涢€夈€佹悳绱㈡垨鍒嗛〉
- 浠嶆湭寮曞叆鏇村己鐨勨€滄墍鏈夌敓浜?connector 蹇呴』绛惧悕鈥濈瓥鐣?- `P2` 鏇村ぇ鐨?connector 璁よ瘉澧炲己鑼冨洿杩樻病鏈夊叏閮ㄧ粨鏉?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿 `P2` 鍓╀綑椤规槸鍚﹁繘鍏ワ細
   - 鏇村己鐨勭敓浜?connector 绛惧悕绛栫暐
   - 鏄惁闇€瑕佺嫭绔?organizer 瀹¤椤佃€屼笉鏄户缁爢鍙犲湪 `ca-status`
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P2-E 鐢熶骇 connector 寮哄埗绛惧悕绛栫暐
> 鏈妭鐢ㄤ簬 `P2-E` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂5.1 缂哄皯娑堟伅绾х鍚峘
    - `搂6 P2锛氬寮?connector 璁よ瘉`
- `docs/grs004/ary-ca-integration-spec.md`
- `docs/superpowers/specs/2026-07-10-grs004-p2e-production-signature-enforcement-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p2e-production-signature-enforcement-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/ca-signature-helpers.ts`
  - 宸叉柊澧?`requiresProductionConnectorSignature()`
  - 褰撳墠 production 鍒ゆ柇瑙勫垯锛?    - `ingestionSource === CONNECTOR`
    - 鎴?`connectorBaseUrl` 涓洪潪 localhost / 127.0.0.1 / ::1
- `src/lib/services/ca-fetch.ts`
  - handshake 鍦?production connector 涓旀棤 credential 鏃朵細鎷掔粷锛?    - `credential_required`
  - snapshot fetch 鍦?production connector 涓旀棤 credential 鏃朵細鎷掔粷锛?    - `credential_required`
- `src/lib/services/ca-ingestion.ts`
  - signal ingest 鍦?production connector 涓旀棤 credential 鏃朵細鎷掔粷锛?    - `credential_required`
- `src/lib/services/ca-fetch-audit.test.ts`
  - 宸茶鐩?remote production / localhost demo 杈圭晫
- `src/lib/services/ca-signature-verification.test.ts`
  - 宸茶鐩?production signal 琚嫆缁濅笌 localhost demo 淇濇寔鍏煎
- `src/lib/services/ca-ingestion-integrity.test.ts`
  - 宸茶縼绉诲埌 localhost/manual connection
- `src/lib/services/ca-fetch-integrity.test.ts`
  - 宸茶縼绉诲埌 localhost/manual connection

### 鏈疆宸插畬鎴愮殑鐐?
- 杩滅▼ / 闈炴湰鍦?connector 鐜板湪榛樿蹇呴』鍏堢櫥璁?credential锛屼笉鑳藉啀闀挎湡璧?bearer-only
- localhost demo connector 缁х画鍏煎褰撳墠鏈湴婕旂ず闂幆
- 娌℃湁鏂板 schema 瀛楁锛屼篃娌℃湁鏂板鏂扮殑绛惧悕绠楁硶
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --test-concurrency=1 --import tsx --test src/lib/ca-signature-helpers.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts src/lib/services/ca-ingestion-integrity.test.ts src/lib/services/ca-fetch-integrity.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鏂板鐙珛鐨?credential 鐢熷懡鍛ㄦ湡鎴栫鍚嶇瓥鐣ョ鐞嗛〉闈?- 浠嶆湭寮曞叆澶氱畻娉曠鍚嶆敮鎸?- 浠嶆湭鎶婄缃戝湴鍧€銆佸唴缃戝煙鍚嶇瓑鏇村鏉傜幆澧冨尯鍒嗙撼鍏ョ瓥鐣?- `GRS004` 鏇村ぇ鑼冨洿浠嶆湭鍏ㄩ儴缁撴潫

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿涓嬩竴寮犲墿浣欏垏鐗囨槸鍚﹁繘鍏ワ細
   - 鏂囦欢绯荤粺棰樼洰鍖?/ 璁粌鏁版嵁瀹屾暣鎬т笌瀹¤
   - 浠ｇ爜淇敼瀹¤鎴栨洿娣辩殑鏉愭枡瀹屾暣鎬ф敹鍙?2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --test-concurrency=1 --import tsx --test src/lib/ca-signature-helpers.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts src/lib/services/ca-ingestion-integrity.test.ts src/lib/services/ca-fetch-integrity.test.ts`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-D 鍚堜綔鍔炶禌鏉愭枡璇诲彇鏍￠獙 + 瀹¤
> 鏈妭鐢ㄤ簬 `P1-D` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂10 浼佷笟棰樼洰闃茬鏀筦
- `docs/superpowers/specs/2026-07-10-grs004-p1d-cooperation-material-read-verification-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p1d-cooperation-material-read-verification-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/material-integrity-helpers.ts`
  - 宸叉柊澧烇細
    - `resolvePublicUploadAbsolutePath()`
    - `verifyStoredUploadHash()`
  - 褰撳墠鍙厑璁歌В鏋?`/uploads/...` public path
- `src/lib/services/cooperation.ts`
  - `submitCooperationRequest()` 浠嶈礋璐ｄ笂浼犳椂鍐欏叆锛?    - `taskPackageFileHash`
    - `proposalFileHash`
  - `approveCooperationRequest()` 鐜板湪浼氬湪瀹℃壒鍒涘缓 Race 鍓嶉噸鏂版牎楠岋細
    - `taskPackageFilePath + taskPackageFileHash`
    - `proposalFilePath + proposalFileHash`
  - 褰撳墠鎷掔粷鍘熷洜鍖呮嫭锛?    - `task_package_missing`
    - `proposal_missing`
    - `task_package_hash_mismatch`
    - `proposal_hash_mismatch`
    - `invalid_upload_path`
  - 鏍￠獙缁撴灉宸插啓鍏ワ細
    - `SecurityAudit(action=cooperation_request.materials_verify)`
- `src/lib/services/material-integrity-cooperation.test.ts`
  - 宸茶鐩栵細
    - hash 瀛樺偍
    - challenge sourceRef / digest 鐢熸垚
    - 鏂囦欢琚鏀规椂鎷掔粷
    - 鏂囦欢缂哄け鏃舵嫆缁?    - 澶辫触璺緞鍐欏璁?
### 鏈疆宸插畬鎴愮殑鐐?
- 鍚堜綔鍔炶禌鏉愭枡鍦ㄥ鎵硅鍙栧墠浼氶噸鏂版牎楠?hash
- 鏂囦欢琚浛鎹㈡垨鍒犻櫎鏃讹紝`approveCooperationRequest()` 涓嶅啀缁х画鍒涘缓 Race
- 鏍￠獙缁撴灉杩涘叆缁熶竴 `SecurityAudit`
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鎵╁睍鍒伴€夋墜浠ｇ爜璇诲彇鏍￠獙
- 浠嶆湭鏂板鏂囦欢涓嬭浇 / 棰勮椤典笂鐨勫畬鏁存€ф牎楠?- 浠嶆湭寮曞叆鏁板瓧绛惧悕鎴栨洿寮烘枃浠跺瓨鍌ㄩ槻绡℃敼鏈哄埗
- 绗?11 鑺傗€滈€夋墜浠ｇ爜闃茬鏀光€濅富閾捐矾杩樻病寮€濮嬭鍙栨牎楠屼笌瀹¤鏀跺彛

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲浼樺厛鏍稿绗?11 鑺傗€滈€夋墜浠ｇ爜闃茬鏀光€濈殑涓嬩竴寮犲垏鐗囷細
   - 浠ｇ爜璇诲彇鏍￠獙
   - 浠ｇ爜淇敼瀹¤
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-E 鎻愪氦浠ｇ爜鏉愭枡璇诲彇鏍￠獙 + 瀹¤
> 鏈妭鐢ㄤ簬 `P1-E` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂11 閫夋墜浠ｇ爜闃茬鏀筦
- `docs/superpowers/specs/2026-07-10-grs004-p1e-submission-artifact-read-verification-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p1e-submission-artifact-read-verification-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/material-integrity-helpers.ts`
  - 宸叉柊澧烇細
    - `parseSubmissionBindingJson()`
    - `verifySubmissionArtifactIntegrity()`
- `src/lib/services/runner.ts`
  - `pullRunnerTask()` 鐜板湪浼氬湪 Runner 鎷垮埌 payload 鍓嶆牎楠岋細
    - `codeContentHash`
    - `ridingRecordHash`
    - `submitterBindingJson`
  - 鑻ユ牎楠屽け璐ワ細
    - 褰撳墠 `RunnerTask` 鏍囪涓?`FAILED`
    - `SUBMISSION_TEST` 瀵瑰簲 `Submission` 鍚屾鏍囪涓?`FAILED`
    - 涓嶅啀鎶婁换鍔?payload 浜ょ粰 Runner
    - 鍐欏叆 `SecurityAudit(action=submission_artifact.verify, result=rejected)`
  - 鑻ユ牎楠岄€氳繃锛?    - 鍐欏叆 `SecurityAudit(action=submission_artifact.verify, result=accepted)`
- `src/lib/services/material-integrity-submissions.test.ts`
  - 宸茶鐩?tampered code content銆乼ampered submitter binding 鍜屾甯镐紶鎾矾寰?
### 鏈疆宸插畬鎴愮殑鐐?
- Runner 鍦ㄦ秷璐?`SubmissionArtifact` 鍓嶄細閲嶆柊鏍￠獙浠ｇ爜鏉愭枡瀹屾暣鎬?- hash 鎴?binding 琚鏀规椂锛屼换鍔′笉浼氱户缁氦缁?Runner
- 鏍￠獙缁撴灉杩涘叆缁熶竴 `SecurityAudit`
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鎵╁睍鍒?judge/public 灞曠ず灞備簩娆℃牎楠?- 浠嶆湭鏂板浠ｇ爜淇敼鍘嗗彶 UI
- 浠嶆湭寮曞叆鏁板瓧绛惧悕
- 绗?11 鑺傗€滀唬鐮佷慨鏀瑰璁℃棩蹇椻€濅粛鍙ˉ鍒颁簡 Runner 璇绘牎楠屽璁★紝涓嶆槸鍏ㄩ噺淇敼鍘嗗彶

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿绗?11 鑺傚墿浣欓」鏄惁杩涘叆锛?   - judge/public 璇诲彇灞備簩娆℃牎楠?   - 鏇村畬鏁寸殑浠ｇ爜淇敼瀹¤
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-G 鎻愪氦浠ｇ爜鏉愭枡灞曠ず/鎶曞奖璇诲彇鏍￠獙 + 瀹¤

> 鏈妭鐢ㄤ簬 `P1-G` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂11 閫夋墜浠ｇ爜闃茬鏀筦
      - 璇勫鎴栧睍绀烘椂鏈牎楠屼唬鐮佸畬鏁存€?      - 缂哄皯浠ｇ爜淇敼鐨勫璁℃棩蹇?- `docs/superpowers/specs/2026-07-10-grs004-p1g-submission-artifact-showcase-verification-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p1g-submission-artifact-showcase-verification-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/runner.ts`
  - `pullRunnerTask()` 涓?`completeRunnerTask()` 鐜板湪鍏辩敤 artifact 瀹屾暣鎬ф牎楠岄€昏緫
  - `completeRunnerTask()` 鍦?`status = succeeded` 鏃讹紝浼氬厛鏍￠獙锛?    - `codeContentHash`
    - `ridingRecordHash`
    - `submitterBindingJson`
  - 鏍￠獙澶辫触鏃讹細
    - 褰撳墠 `RunnerTask` 鏍囪涓?`FAILED`
    - 鑻ヤ负 `SUBMISSION_TEST`锛屽搴?`Submission` 涔熸爣璁颁负 `FAILED`
    - 涓嶅啀缁х画鍐欏叆锛?      - `Submission`
      - `TeamArchive`
      - `LeaderboardEntry`
      - `HarnessEntry`
      - `RidingHighlight`
  - 鏍￠獙閫氳繃 / 鎷掔粷閮戒細鍐欙細
    - `SecurityAudit(action=submission_artifact.verify)`
    - `details.verificationStage` 鐜板凡鍖哄垎锛?      - `runner_pull`
      - `runner_complete`
- `src/lib/services/material-integrity-submissions.test.ts`
  - 宸叉柊澧烇細
    - progress eval 鍦烘櫙涓嬶紝pull 鍚庣鏀?artifact 鏃朵笉浼氱户缁啓鍏?`TeamArchive`
    - harness eval 鍦烘櫙涓嬶紝pull 鍚庣鏀?artifact 鏃朵笉浼氱户缁敓鎴?`RidingHighlight`

### 鏈疆宸插畬鎴愮殑鐐?
- Runner complete 鎴愬姛鎶曞奖鍓嶅凡琛ョ浜岄亾 artifact 瀹屾暣鎬ф牎楠?- 琚鏀圭殑 artifact 涓嶄細鍐嶇户缁祦鍏?`TeamArchive / RidingHighlight`
- 瀹屾暣鎬ф牎楠屽璁＄幇鍦ㄥ凡鍙尯鍒?`runner_pull` 涓?`runner_complete`
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鏂板 judge/public 椤甸潰涓婄殑鐙珛浠ｇ爜璇诲彇浜屾鏍￠獙
- 浠嶆湭鏂板鏇村畬鏁寸殑浠ｇ爜淇敼鍘嗗彶 / 缂栬緫瀹¤瑙嗗浘
- 浠嶆湭寮曞叆鏁板瓧绛惧悕
- `GRS004` 绗?11 鑺傛洿澶ц寖鍥翠粛鏈叏閮ㄧ粨鏉?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿绗?11 鑺傚墿浣欓」鏄惁杩涘叆锛?   - judge/public 璇诲彇灞備簩娆℃牎楠?   - 鏇村畬鏁寸殑浠ｇ爜淇敼瀹¤
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P0-B sequence 闃查噸鏀炬牎楠?
> 鏈妭鐢ㄤ簬 `P0-B` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂5.2 骞傜瓑閿凡鏈夛紝浣嗛槻閲嶆斁浠嶄笉瀹屾暣`
- `docs/superpowers/specs/2026-07-10-grs004-p0b-sequence-replay-guard-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p0b-sequence-replay-guard-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `prisma/schema.prisma`
  - `CAIngestionEvent` 鐜板凡鏂板锛?    - `caSessionId`
  - 骞跺凡鏂板鍞竴杈圭晫锛?    - `[caConnectionId, caSessionId, sequence]`
- `prisma/migrations/20260710105437_grs004_p0b_sequence_replay_guard/`
  - 宸茶惤鍦版湰杞?migration
  - migration 浼氫负鏃ф暟鎹洖濉?`caSessionId`
  - 鍘嗗彶 `INTEGRITY_GAP` 鍙栬瘉浜嬩欢鍦ㄨ縼绉绘椂浼氭竻绌?`sequence`锛岄伩鍏嶅敮涓€绾︽潫鍐茬獊
- `src/lib/ca-integrity-helpers.ts`
  - 宸叉柊澧烇細
    - `evaluateSequenceProgression()`
- `src/lib/services/ca-ingestion.ts`
  - `ingestRidingSignalMessage()` 鐜板湪浼氬湪姝ｅ父涓氬姟鍐欏叆鍓嶆鏌ュ悓涓€ `caConnectionId + caSessionId` 涓嬬殑鏈€澶у凡鎺ユ敹 sequence
  - 鑻?incoming sequence锛?    - 绛変簬鏈€澶у€硷細璁颁负 `sequence_replayed`
    - 灏忎簬鏈€澶у€硷細璁颁负 `sequence_out_of_order`
  - 涓婅堪涓ょ被鎯呭喌褰撳墠閮戒細锛?    - 鍐?`CAIngestionEvent(INTEGRITY_GAP)`
    - 鍐?`SecurityAudit(action=ca_signal.ingest, result=integrity_gap)`
    - 闃绘柇 `Session / CAConnection / RaceProject / Projection` 鎺ㄨ繘
- `src/lib/services/ca-fetch.ts`
  - snapshot ingestion event 鐜板湪涔熶細鍐欏叆 `caSessionId`

### 鏈疆宸插畬鎴愮殑鐐?
- `sequence` 宸蹭粠琚姩璁板綍瀛楁鍗囩骇涓哄悓 connection+session 涓嬬殑鐪熷疄 replay guard
- replay / out-of-order 涓嶄細鍐嶆帹杩?`Session / Projection`
- 瀹¤ reason 宸茶兘鍖哄垎锛?  - `sequence_replayed`
  - `sequence_out_of_order`
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/ca-integrity-helpers.test.ts src/lib/services/ca-ingestion-integrity.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭寮曞叆 nonce
- 浠嶆湭鎵╁埌 snapshot fetch 鐨?sequence 璇箟
- 浠嶆湭寮曞叆鏇村鏉傜殑 signedAt + sequence 鑱斿悎绛栫暐
- `GRS004` 绗?5.2 鑺傛洿澶ц寖鍥翠粛鏈叏閮ㄧ粨鏉?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿 `搂5.2` 鍓╀綑椤规槸鍚﹁繘鍏ワ細
   - nonce / 鏇村己 replay window
   - 鏇寸粏鐨?signedAt + sequence 鑱斿姩绛栫暐
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/ca-integrity-helpers.test.ts src/lib/services/ca-ingestion-integrity.test.ts`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-5 CA signal contract alignment

> 鏈妭鐢ㄤ簬 `DEV-5 signal contract alignment` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-ca-integration-spec.md`
  - 閲嶇偣闃呰锛?    - `搂5.2 鍩虹瀛楁`
    - `搂5.3 signal.type 鍊欓€夊€糮
- `docs/superpowers/specs/2026-07-10-grs004-dev5-signal-contract-alignment-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-dev5-signal-contract-alignment-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/ca-ingestion.ts`
  - push schema 鐜板湪宸叉敮鎸?spec 鍒楀嚭鐨?`signal.type` 鍊欓€夐泦鍚堬細
    - `riding_started`
    - `riding_paused`
    - `riding_resumed`
    - `riding_finished`
    - `task_started`
    - `task_progress`
    - `task_completed`
    - `task_blocked`
    - `session_started`
    - `session_completed`
    - `cost_updated`
    - `risk_detected`
    - `milestone_reached`
    - `validation_run`
    - `artifact_linked`
  - `race.taskId` 鐜板湪宸叉槸蹇呭～
  - `signal.noteReason` 鐜板湪浼氳淇濈暀
  - 椤跺眰 `technicalActions[]` 鐜板湪浼氳淇濈暀骞惰繘鍏?`payloadJson / payloadDigest`
- `src/lib/ca-runtime-helpers.ts`
  - `RidingSignalInput.type` 宸叉墿瀹瑰埌涓婅堪鍊欓€夐泦鍚?  - `getNextConnectionStatusFromSignal()` 鐜板湪浼氭妸杩欎簺鏈夋晥 push signal 缁熶竴瑙嗕负鍙繘鍏?/ 淇濇寔 `ACTIVE`
- `src/lib/services/ca-signature-verification.test.ts`
  - 宸茶鐩栧甫 `noteReason / technicalActions` 鐨?signed `milestone_reached` signal
- `src/lib/services/ca-ingestion-integrity.test.ts`
  - 宸茶鐩?`race.taskId` 缂哄け鏃?schema 鎷掔粷

### 鏈疆宸插畬鎴愮殑鐐?
- CA push 濂戠害宸插悜 `ary-ca-integration-spec.md` 鏀舵暃涓€灞?- 鏂?signal.type 涓嶅啀琚?schema 鎷掔粷
- `race.taskId` 涓嶄細鍐嶈闈欓粯缂哄け
- `noteReason / technicalActions` 涓嶅啀琚?zod 榛樿涓㈠純
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-signature-verification.test.ts src/lib/services/ca-ingestion-integrity.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鎶?`taskId` 鎺ュ叆 Race 妯″瀷
- 浠嶆湭鎵╁睍 `technicalActions` 鐨勪笅娓告姇褰辨秷璐?- 浠嶆湭鎵╁ぇ snapshot fetch 鐨勪笟鍔¤涔?- `DEV-5` 鏇村ぇ鑼冨洿浠嶆湭鍏ㄩ儴缁撴潫

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/ary-ca-integration-spec.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿鍓╀綑濂戠害椤规槸鍚﹁繘鍏ワ細
   - snapshot contract 瀛楁缁х画瀵归綈
   - `technicalActions` 鐨勪笅娓告秷璐硅竟鐣?2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-signature-verification.test.ts src/lib/services/ca-ingestion-integrity.test.ts`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-5 CA snapshot contract alignment

> 鏈妭鐢ㄤ簬 `DEV-5 snapshot contract alignment` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-ca-integration-spec.md`
  - 閲嶇偣闃呰锛?    - `搂6 Session 蹇収 fetch`
- `docs/superpowers/specs/2026-07-10-grs004-dev5-snapshot-contract-alignment-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-dev5-snapshot-contract-alignment-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/ca-fetch.ts`
  - snapshot schema 鐜板湪宸茶姹傦細
    - `ca.caType`
    - `task.taskId`
    - `session.tokens`
  - `task.taskId` 缂哄け鏃朵細鐩存帴琚?schema 鎷掔粷
- `src/lib/ca-runtime-helpers.ts`
  - `buildSessionPatchFromSnapshot()` 鐜板湪浼氭妸锛?    - `session.tokens`
    鏄犲皠鍥炲唴閮細
    - `tokenCost`
- `src/lib/services/ca-fetch-integrity.test.ts`
  - 宸茶鐩?spec 瀵归綈鍚庣殑 snapshot payload
  - 宸茶鐩?`task.taskId` 缂哄け鎷掔粷
- `src/lib/services/ca-signature-verification.test.ts`
  - signed snapshot 鐜板凡鎸夛細
    - `ca.caType`
    - `task.taskId`
    - `session.tokens`
    鍙ｅ緞閫氳繃绛惧悕鏍￠獙

### 鏈疆宸插畬鎴愮殑鐐?
- snapshot fetch 澶栭儴濂戠害宸插悜 spec 褰撳墠瀛楁鍙ｅ緞鏀舵暃
- `tokens` 涓嶅啀浣跨敤鏃?`tokenCost` 澶栭儴瀛楁
- `task.taskId / ca.caType` 涓嶅啀琚潤榛樼己澶?- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --test-concurrency=1 --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-fetch-integrity.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鎶?`taskId` 鎺ュ埌 Race 妯″瀷
- 浠嶆湭鎵╁ぇ snapshot 鍒版柊鐨勬姇褰辨秷璐硅涔?- 浠嶆湭寮曞叆 snapshot 鐗堟湰鍘嗗彶琛?- `DEV-5` 鏇村ぇ鑼冨洿浠嶆湭鍏ㄩ儴缁撴潫

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/ary-ca-integration-spec.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿鍓╀綑濂戠害椤规槸鍚﹁繘鍏ワ細
   - `technicalActions` 鐨勪笅娓告秷璐硅竟鐣?   - snapshot 杈撳嚭瀵规洿澶氶〉闈?璇佹嵁鐨勬秷璐?2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --test-concurrency=1 --import tsx --test src/lib/ca-runtime-helpers.test.ts src/lib/services/ca-fetch-integrity.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-H 鍚堜綔鍔炶禌鏉愭枡鍐欏叆瀹¤

> 鏈妭鐢ㄤ簬 `P1-H` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂10 浼佷笟棰樼洰闃茬鏀筦
      - 缂哄皯鏂囦欢淇敼鐨勫璁℃棩蹇?- `docs/superpowers/specs/2026-07-10-grs004-p1h-cooperation-material-write-audit-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p1h-cooperation-material-write-audit-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/cooperation.ts`
  - `submitCooperationRequest()` 鍦ㄤ繚瀛?`task package / proposal` 鍒?`public/uploads/cooperation/...` 骞舵垚鍔熷垱寤?`CooperationRequest` 鍚庯紝鐜板凡鍐欏叆锛?    - `SecurityAudit(action=cooperation_request.materials_create, result=accepted)`
  - `detailsJson` 褰撳墠宸插寘鍚細
    - `companyName`
    - `raceTitle`
    - `taskPackageFileHash / taskPackageFilePath / taskPackageFileName`
    - `proposalFileHash / proposalFilePath / proposalFileName`
- `src/lib/services/material-integrity-cooperation.test.ts`
  - 宸茶鐩栵細
    - create 璺緞鍐欏璁?    - approve 鍓嶈鏍￠獙 accepted / rejected 鏃ц鐩栦粛淇濈暀

### 鏈疆宸插畬鎴愮殑鐐?
- 鍚堜綔鍔炶禌鏉愭枡涓婁紶鐨?sanctioned 鍐欒矾寰勫凡鎺ュ叆缁熶竴瀹¤
- 瀹¤涓?`CooperationRequest` 涓€涓€瀵瑰簲
- 瀹¤ details 宸插甫鍑哄綋鍓嶄笂浼犳潗鏂?hash/path/name
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭寮曞叆 OS 绾ф枃浠朵慨鏀瑰巻鍙叉垨 watcher
- 浠嶆湭鏂板鏂囦欢涓嬭浇 / 棰勮椤甸潰涓婄殑浜屾鏍￠獙
- 浠嶆湭寮曞叆鏁板瓧绛惧悕鎴栨洿寮洪槻绡℃敼瀛樺偍鏈哄埗
- `GRS004` 绗?10 鑺傛洿澶ц寖鍥翠粛鏈叏閮ㄧ粨鏉?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿绗?10 鑺傚墿浣欓」鏄惁杩涘叆锛?   - 鏂囦欢涓嬭浇 / 棰勮椤佃鍙栨牎楠岋紙鍓嶆彁鏄厛纭鐪熷疄椤甸潰鍏ュ彛锛?   - 鏇村己鐨勫瓨鍌ㄩ槻绡℃敼鏈哄埗
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts`
   - `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-I Work 鍏紑璇诲彇鏍￠獙

> 鏈妭鐢ㄤ簬 `P1-I` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂5.3 Work / 棰樼洰 / 澶栭儴鏉愭枡缂哄皯 hash 鍏冩暟鎹甡
    - `搂8 楠屾敹鏍囧噯`
      - `Work / 棰樼洰鏉愭枡 hash 鑳借褰曞苟鍦ㄨ鍙栨椂鏍￠獙锛堝緟瀹炵幇锛塦
- `docs/superpowers/specs/2026-07-11-grs004-p1i-work-public-read-verification-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-p1i-work-public-read-verification-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/material-integrity-helpers.ts`
  - 宸叉柊澧烇細
    - `verifyWorkIntegrity()`
  - 褰撳墠浼氬悓鏃舵牎楠岋細
    - `contentHash`
    - `sourceRefJson`
- `src/lib/services/works.ts`
  - `getWorkForPublicSlug()` / `getWorkForLegacyTeamSlug()` 鐜板湪浼氬湪鍏紑 work 璇︽儏杩斿洖鍓嶆牎楠?integrity
  - 绡℃敼鍚庣殑 work 鐜板湪鐩存帴杩斿洖 `null`
- `src/lib/services/races.ts`
  - `listRaces()` 鐜板湪浼氬湪 read model 涓妸鏃犳晥锛?    - `registration.work`
    - `awards[].work`
    缃负 `null`
- `src/lib/services/awards.ts`
  - `listAwardsForRace()` 鐜板湪浼氳繃婊ゆ棤鏁?`award.work`
- `src/lib/services/public-routes.ts`
  - `getRiderBySlug()` 閲岀殑 `registration.work / works` 鐩存煡缁撴灉鐜板湪涔熶細杩囨护鏃犳晥 work

### 鏈疆宸插畬鎴愮殑鐐?
- `Work.contentHash / sourceRefJson` 宸茬湡姝ｇ敤浜庡叕寮€璇诲彇鏍￠獙
- 绡℃敼鍚庣殑 Work 涓嶄細鍐嶇户缁繘鍏ワ細
  - 鍏紑浣滃搧璇︽儏
  - 璧涗簨浣滃搧鍒楄〃
  - 棣栭〉绮鹃€変綔鍝侀摼璺?  - 楠戞墜鍏紑浣滃搧閾炬帴
  - 鍏紑璧涙灉 work link
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鏂板 judge/private 璇诲彇鏍￠獙
- 浠嶆湭鏂板 Work 璇诲彇鎷掔粷鐨勭粺涓€瀹¤
- 浠嶆湭鎵╁睍鍒?GitHub repo 杩滅瀹為檯鎶撳彇鏍￠獙
- `GRS004` 绗?5.3 鑺傛洿澶ц寖鍥翠粛鏈叏閮ㄧ粨鏉?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿 `搂5.3` 鍓╀綑椤规槸鍚﹁繘鍏ワ細
   - GitHub commit / tag / release digest
   - Demo / 瑙嗛杩滅鍐呭鎶撳彇鏍￠獙
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts`
   - `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-J Race 棰樼洰鏉愭枡璇诲彇鏍￠獙

> 鏈妭鐢ㄤ簬 `P1-J` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂5.3 Work / 棰樼洰 / 澶栭儴鏉愭枡缂哄皯 hash 鍏冩暟鎹甡
    - `搂10 浼佷笟棰樼洰闃茬鏀筦
    - `搂8 楠屾敹鏍囧噯`
      - `Work / 棰樼洰鏉愭枡 hash 鑳借褰曞苟鍦ㄨ鍙栨椂鏍￠獙锛堝緟瀹炵幇锛塦
- `docs/superpowers/specs/2026-07-11-grs004-p1j-race-challenge-read-verification-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-p1j-race-challenge-read-verification-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/material-integrity-helpers.ts`
  - 宸叉柊澧烇細
    - `verifyRaceChallengeIntegrity()`
  - 褰撳墠浼氭牎楠岋細
    - `challengeSourceRefJson`
    - `challengeContentHash`
    - `taskPackage/proposal` 鐨勪笂浼犺矾寰勪笌鏂囦欢 hash
- `src/lib/services/runner.ts`
  - `pullRunnerTask()` 鐜板湪浼氬湪杩斿洖 runner payload 鍓嶅厛鏍￠獙褰撳墠 `Race` challenge material
  - 鏍￠獙澶辫触鏃讹細
    - 褰撳墠 `RunnerTask` 鏍囪涓?`FAILED`
    - 鍐欏叆 `SecurityAudit(action=race.challenge_verify, result=rejected)`
    - 涓嶈嚜鍔ㄦ妸 `Submission` 鏍囪涓?`FAILED`
  - 鏍￠獙鎴愬姛鏃讹細
    - 鍐欏叆 `SecurityAudit(action=race.challenge_verify, result=accepted)`

### 鏈疆宸插畬鎴愮殑鐐?
- `Race.challengeSourceRefJson / challengeContentHash` 宸茬湡姝ｇ敤浜?runner 璇诲彇鍓嶆牎楠?- 棰樼洰鏉愭枡鍦ㄥ缓璧涘悗琚鏀规椂锛宺unner 浠诲姟涓嶄細缁х画娑堣垂
- 澶辫触璺緞浼氳繘鍏ョ粺涓€ `SecurityAudit`
- 鏈疆鏄庣‘淇濈暀鈥滈闄╂彁绀轰紭鍏堚€濊竟鐣岋細
  - challenge material 寮傚父涓嶄細鑷姩鎶?submission 鍒ゅけ璐?- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/material-integrity-submissions.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鎵╁睍鍒?public race page / organizer page 鐨勭粺涓€璇诲彇鏍￠獙
- 浠嶆湭鎵╁睍鍒拌繙绔?GitHub repo / demo / video 鎶撳彇鏍￠獙
- `GRS004` 绗?5.3 鑺傛洿澶ц寖鍥翠粛鏈叏閮ㄧ粨鏉?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿 `搂5.3` 鍓╀綑椤规槸鍚﹁繘鍏ワ細
   - GitHub commit / tag / release digest
   - Demo / 瑙嗛杩滅鍐呭鎶撳彇鏍￠獙
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/material-integrity-submissions.test.ts`
   - `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-K Work GitHub 寮曠敤蹇収鏍￠獙

> 鏈妭鐢ㄤ簬 `P1-K` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂5.3 Work / 棰樼洰 / 澶栭儴鏉愭枡缂哄皯 hash 鍏冩暟鎹甡
      - `GitHub commit SHA / tag / release digest`
    - `搂8 楠屾敹鏍囧噯`
      - `Work / 棰樼洰鏉愭枡 hash 鑳借褰曞苟鍦ㄨ鍙栨椂鏍￠獙锛堝緟瀹炵幇锛塦
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `GitHub Repo / Commit / PR / Source Ref` 鐩稿叧瀹氫箟
- `docs/superpowers/specs/2026-07-11-grs004-p1k-work-github-reference-verification-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-p1k-work-github-reference-verification-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/material-integrity-helpers.ts`
  - 宸叉柊澧烇細
    - `parseGitHubReferenceUrl()`
    - `buildGitHubReferenceDigest()`
    - `captureGitHubReferenceSnapshot()`
    - `verifyGitHubReferenceSnapshot()`
    - `verifyWorkReadIntegrity()`
  - `buildWorkSourceRef()` 鐜板湪鍏佽闄勫甫鍙€夛細
    - `githubRef`
- `src/lib/services/works.ts`
  - `listWorksForRace()`銆乣getWorkForPublicSlug()`銆乣getWorkForLegacyTeamSlug()` 鐜板湪閮戒細鍦ㄥ叕寮€璇诲彇鍓嶆墽琛屽紓姝?`Work` 璇诲彇瀹屾暣鎬ф牎楠?- `src/lib/services/awards.ts`
  - `listAwardsForRace()` 鐜板湪浼氬甯?`githubRef` 鐨?Work 杩藉姞 GitHub 蹇収鏍￠獙
- `src/lib/services/races.ts`
  - `listRaces()` 鐜板湪浼氬湪 `registration.work` 涓?`awards[].work` 涓婃墽琛屽紓姝?GitHub 蹇収鏍￠獙
- `src/lib/services/public-routes.ts`
  - `getRiderBySlug()` 閲岀殑鍏紑 work 閾捐矾鐜板湪涔熶細澶嶇敤寮傛 GitHub 蹇収鏍￠獙

### 鏈疆宸插畬鎴愮殑鐐?
- `Work.repoUrl` 鐜板湪鍙€夊甫 GitHub `commit/tag/release` 蹇収
- 鍏紑璇诲彇鏃朵細鏍￠獙宸蹭繚瀛樼殑 `githubRef`
- stale GitHub 寮曠敤涓嶄細缁х画杩涘叆鍏紑 `Work` 閾捐矾
- 鐜版湁鏃?`githubRef` 鐨勬棫鏁版嵁淇濇寔鍏煎
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鎵╁睍鍒?plain repo root / branch URL 鐨勭湡瀹炴€ф牎楠?- 浠嶆湭鎵╁睍鍒?demo/video 杩滅鍐呭鎶撳彇鏍￠獙
- `GRS004` 绗?5.3 鑺傛洿澶ц寖鍥翠粛鏈叏閮ㄧ粨鏉?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿 `搂5.3` 鍓╀綑椤规槸鍚﹁繘鍏ワ細
   - Demo / 瑙嗛杩滅鍐呭鎶撳彇鏍￠獙
   - 鏇村鐨?GitHub root repo / branch / PR 寮曠敤鏀跺彛
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts`
   - `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-L Work Demo/瑙嗛杩滅鍐呭鎶撳彇鏍￠獙

> 鏈妭鐢ㄤ簬 `P1-L` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂5.3 Work / 棰樼洰 / 澶栭儴鏉愭枡缂哄皯 hash 鍏冩暟鎹甡
      - `Demo 闄勪欢 hash`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Demo URL`
  - `Video URL`
- `docs/superpowers/specs/2026-07-11-grs004-p1l-work-remote-asset-verification-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-p1l-work-remote-asset-verification-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/material-integrity-helpers.ts`
  - 宸叉柊澧烇細
    - `buildRemoteAssetReferenceDigest()`
    - `captureRemoteAssetSnapshot()`
    - `verifyRemoteAssetSnapshot()`
  - `buildWorkSourceRef()` 鐜板湪鍏佽闄勫甫鍙€夛細
    - `demoRef`
    - `videoRef`
  - `verifyWorkReadIntegrity()` 鐜板湪浼氬湪 `demoRef/videoRef` 瀛樺湪鏃剁户缁牎楠岃繙绔唴瀹瑰揩鐓?- `src/lib/services/works.ts`
  - `listWorksForRace()`銆乣getWorkForPublicSlug()`銆乣getWorkForLegacyTeamSlug()` 鐜板湪閮戒細鍦ㄥ叕寮€璇诲彇鍓嶅鐢ㄨ繙绔唴瀹瑰揩鐓ф牎楠?- `src/lib/services/awards.ts`
  - `listAwardsForRace()` 鐜板湪浼氬甯?`demoRef/videoRef` 鐨?Work 杩藉姞杩滅鍐呭蹇収鏍￠獙
- `src/lib/services/races.ts`
  - `listRaces()` 鐜板湪浼氬湪 `registration.work` 涓?`awards[].work` 涓婃墽琛屽紓姝ヨ繙绔唴瀹瑰揩鐓ф牎楠?- `src/lib/services/public-routes.ts`
  - `getRiderBySlug()` 閲岀殑鍏紑 work 閾捐矾鐜板湪涔熶細澶嶇敤杩滅鍐呭蹇収鏍￠獙

### 鏈疆宸插畬鎴愮殑鐐?
- `Work.demoUrl / videoUrl` 鐜板湪鍙€夊甫杩滅鍐呭蹇収
- 鍏紑璇诲彇鏃朵細鏍￠獙宸蹭繚瀛樼殑 `demoRef / videoRef`
- stale demo/video 寮曠敤涓嶄細缁х画杩涘叆鍏紑 `Work` 閾捐矾
- 鐜版湁鏃?`demoRef/videoRef` 鐨勬棫鏁版嵁淇濇寔鍏煎
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `GRS004` 绗?5.3 鑺傞噷鏈€鏄庣‘鐨勫墿浣欐樉寮忛」宸茬粡鍩烘湰鏀跺彛
- 浠嶆湭鎵╁睍鍒?judge/private 璇诲彇
- 浠嶆湭鎶婄幇鏈夋棤蹇収鏃ф暟鎹洖濉负甯?`demoRef/videoRef` 鐨勮褰?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿锛?   - 鏄惁闇€瑕佹妸宸叉湁鏃?Work 鏁版嵁鍥炲～鎴愬甫 `demoRef/videoRef` 鐨勮褰?   - 鏄惁闇€瑕佹妸鍏紑璇诲彇鏍￠獙缁х画鎵╁睍鍒?judge/private 璇诲彇
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/public-routes.test.ts src/lib/services/results.test.ts`
   - `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-M Race 璇勬祴閰嶇疆 version/hash 璇诲彇鏍￠獙

> 鏈妭鐢ㄤ簬 `P1-M` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂5.3 Work / 棰樼洰 / 澶栭儴鏉愭枡缂哄皯 hash 鍏冩暟鎹甡
      - `璇勬祴閰嶇疆鐗堟湰鍙蜂笌 hash`
- `docs/superpowers/specs/2026-07-11-grs004-p1m-race-evaluation-config-verification-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-p1m-race-evaluation-config-verification-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `prisma/schema.prisma`
  - `Race` 宸叉柊澧烇細
    - `evaluationConfigVersion`
    - `evaluationConfigHash`
- `src/lib/material-integrity-helpers.ts`
  - 宸叉柊澧烇細
    - `buildRaceEvaluationConfigDigest()`
    - `verifyRaceEvaluationConfigIntegrity()`
- `src/lib/services/races.ts`
  - `createRace()` 鐜板湪浼氬啓鍏ワ細
    - `evaluationConfigVersion = 1`
    - `evaluationConfigHash`
  - `updateRaceContent()` 鐜板湪浼氾細
    - 閲嶇畻 `evaluationConfigHash`
    - `evaluationConfigVersion + 1`
- `src/lib/services/cooperation.ts`
  - `approveCooperationRequest()` 鍒涘缓 Race 鏃剁幇鍦ㄤ篃浼氬啓鍏ワ細
    - `evaluationConfigVersion = 1`
    - `evaluationConfigHash`
- `src/lib/services/runner.ts`
  - `pullRunnerTask()` 鐜板湪浼氬湪 `race.challenge_verify` 鍚庛€乣submission_artifact.verify` 鍓嶆柊澧烇細
    - `race.evaluation_config_verify`
  - 鏍￠獙澶辫触鏃讹細
    - 褰撳墠 `RunnerTask` 鏍囪涓?`FAILED`
    - 鍐欏叆 `SecurityAudit(action=race.evaluation_config_verify, result=rejected)`
    - 涓嶈嚜鍔ㄦ妸 `Submission` 鏍囪涓?`FAILED`
  - 杩斿洖缁?runner 鐨?payload 鐜板湪浼氬甫锛?    - `evaluationConfigVersion`
    - `evaluationConfigHash`

### 鏈疆宸插畬鎴愮殑鐐?
- `Race` 宸蹭繚瀛?runner 瀹為檯娑堣垂璇勬祴閰嶇疆鐨?`version/hash`
- sanctioned 鍐欒矾寰勪細缁存姢杩欑粍鍏冩暟鎹?- `pullRunnerTask()` 浼氬湪璇诲彇鍓嶆牎楠?- 閰嶇疆绡℃敼浼氶樆鏂?runner task锛屼絾涓嶈嚜鍔ㄦ妸 submission 鍒ゅけ璐?- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/material-integrity-cooperation.test.ts src/lib/services/material-integrity-submissions.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈夋妸鈥滀换鍔℃媺鍙栨椂鐪嬪埌鐨勯厤缃増鏈€濆喕缁撳埌 `RunnerTask`
- 杩樻病鏈夋墿灞曞埌 public race page / organizer page 鐨勭粺涓€璇诲彇鏍￠獙

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿锛?   - 鏄惁闇€瑕佹妸 evaluation config snapshot 鍐荤粨杩?`RunnerTask`
   - 鏄惁闇€瑕佹妸 version/hash 鏍￠獙鎵╁睍鍒版洿澶?Race 璇诲彇鍏ュ彛
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/material-integrity-helpers.test.ts src/lib/services/material-integrity-cooperation.test.ts src/lib/services/material-integrity-submissions.test.ts`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-F 鎻愪氦浠ｇ爜鏉愭枡鍐欏叆瀹¤
> 鏈妭鐢ㄤ簬 `P1-F` 宸插疄鐜板垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画缁х画娌?`docs/grs004` 鎺ㄨ繘锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒板搴?spec銆乸lan 鍜屼唬鐮佹枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂11 閫夋墜浠ｇ爜闃茬鏀筦
- `docs/superpowers/specs/2026-07-10-grs004-p1f-submission-artifact-write-audit-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p1f-submission-artifact-write-audit-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/submissions.ts`
  - `createSubmission()` 鐜板湪浼氬湪 `SubmissionArtifact` create 鎴愬姛鍚庡啓鍏ワ細
    - `SecurityAudit(action=submission_artifact.create, result=accepted)`
    - `submissionPhase = active`
  - `createFinalSubmission()` 鐜板湪浼氬湪 `SubmissionArtifact` create 鎴愬姛鍚庡啓鍏ワ細
    - `SecurityAudit(action=submission_artifact.create, result=accepted)`
    - `submissionPhase = final`
  - `detailsJson` 褰撳墠宸插寘鍚細
    - `submissionId`
    - `submissionPhase`
    - `codeContentHash`
    - `ridingRecordHash`
    - `submitterBindingJson`
- `src/lib/services/material-integrity-submissions.test.ts`
  - 宸茶鐩?active / final 鍐欒矾寰勫璁?  - 鍚屾椂淇濈暀涓婁竴杞?Runner 璇绘牎楠岃鐩?
### 鏈疆宸插畬鎴愮殑鐐?
- sanctioned 浠ｇ爜鏉愭枡鍐欏叆璺緞宸叉帴鍏ョ粺涓€瀹¤
- 瀹¤鍜?`SubmissionArtifact` 涓€涓€瀵瑰簲
- 瀹¤ details 宸插甫鍑哄綋鍓?hash 涓?binding 浜嬪疄
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鏂板 judge/public 椤甸潰涓婄殑浠ｇ爜璇诲彇浜屾鏍￠獙
- 浠嶆湭鏂板鏇村畬鏁寸殑缂栬緫鍘嗗彶瑙嗗浘
- 浠嶆湭寮曞叆鏁板瓧绛惧悕
- 绗?11 鑺傛洿骞夸箟鐨勨€滀唬鐮佷慨鏀瑰璁℃棩蹇椻€濅粛鍙鐩?sanctioned 鍐欒矾寰勶紝涓嶆槸鍏ㄩ噺淇敼鍘嗗彶

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿绗?11 鑺傚墿浣欓」鏄惁杩涘叆锛?   - judge/public 璇诲彇灞備簩娆℃牎楠?   - 鏇村畬鏁寸殑浠ｇ爜淇敼瀹¤
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛岀户缁悓姝ョ淮鎶?`docs/superpowers/spec / plan / status`锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛鍐欐仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/services/material-integrity-submissions.test.ts`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-B 缁撴灉寮曠敤鍐荤粨灞?
> 鏈妭鐢ㄤ簬 `P1-B` 宸插疄鏂藉垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画浼氳瘽浠?`P1-B` 缁х画锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`銆乣prisma/schema.prisma` 鍜岀浉鍏?services銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂6 P1锛氳ˉ鏉愭枡瀹屾暣鎬
      - `2. 涓?Report 鐢熸垚璁板綍杈撳叆 Evidence / Projection / Work 鐨勭増鏈紩鐢╜
      - `3. 涓?Award / JudgingRecord 淇濆瓨鍙傝€?Evidence 鐨勫揩鐓ф垨寮曠敤`
      - `4. 寮曞叆缁熶竴 SecurityAudit / IntegrityEvent`
- `docs/superpowers/specs/2026-07-10-grs004-p1b-result-reference-freeze-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p1b-result-reference-freeze-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `JudgingRecord`
  - 宸叉柊澧?`sourceRefJson / sourceDigest`
  - `src/lib/services/judging.ts` 鐨?`upsertJudgingRecord()` 浼氬喕缁撳綋鍓?`Work + Registration Evidence` 寮曠敤
- `Award`
  - 宸叉柊澧?`sourceRefJson / sourceDigest`
  - 褰撳墠鐪熷疄鍐欏叆浠嶅湪 `result-chain-helpers + prisma/seed.ts`
- `Report`
  - 宸叉柊澧?`sourceRefJson / sourceDigest`
  - 褰撳墠 seed 鍚庡鐞嗕細鍐荤粨 `Work / Evidence / Projection / Award` 涓婁笅鏂囧紩鐢?- `Projection`
  - 浠嶆湭鏂板甯搁┗ digest 瀛楁锛沗P1-B` 鍙湪鍐荤粨褰撲笅鍗虫椂璁＄畻 `payloadDigest`

### 鏈疆宸插畬鎴愮殑鐐?
- `prisma/schema.prisma` 涓?`prisma/migrations/20260710014442_grs004_p1b_result_reference_freeze/` 宸茶ˉ `JudgingRecord / Award / Report` 鐨勫喕缁撳紩鐢ㄥ瓧娈点€?- `src/lib/result-reference-freeze-helpers.ts` 涓庡搴旀祴璇曞凡钀藉湴锛岀粺涓€鏋勫缓 `JudgingRecord / Award / Report` 鐨勫喕缁撳紩鐢ㄧ粨鏋勩€?- `src/lib/services/judging.ts` 鐪熷疄杩愯鏃堕摼璺凡钀藉湴鍐荤粨鍐欏叆銆?- `prisma/seed.ts` 宸插湪 `race_finished` 鐨?seed 鏈熬瀵?`JudgingRecord / Award / Report` 鍋氬喕缁撳紩鐢ㄥ洖鍐欍€?- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/result-reference-freeze-helpers.test.ts src/lib/services/result-reference-freeze-judging.test.ts src/lib/result-chain-helpers.test.ts src/lib/services/result-reference-freeze-seed.test.ts`
  - `npm run db:generate`
  - `npm run db:seed`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 褰撴椂浠嶆湭鏂板姝ｅ紡杩愯鏃?`Award` 鍙戝竷鏈嶅姟鎴?`Report` 鐢熸垚鏈嶅姟锛涜鐘舵€佸凡鍦?2026-07-11 鍚庣画鍒囩墖涓儴鍒嗘敹鍙ｃ€?- `SecurityAudit / IntegrityEvent` 缁熶竴瀹¤灞備粛鏈紑濮嬶紝缁х画鐣欑粰 `P1-C`銆?- `Projection` 妯″瀷鏈韩杩樻病鏈夊父椹?`inputDigest / sourceVersion` 瀛楁銆?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屼笅涓€瀛愰」鐩簲杩涘叆 `P1-C 缁熶竴 SecurityAudit / IntegrityEvent`銆?2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛屼繚鎸?`docs/superpowers/spec / plan / status` 鍚屾鏇存柊锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛琛ユ仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/result-reference-freeze-helpers.test.ts src/lib/services/result-reference-freeze-judging.test.ts src/lib/result-chain-helpers.test.ts src/lib/services/result-reference-freeze-seed.test.ts`
   - `npm run db:generate`
   - `npm run db:seed`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P1-C 缁熶竴 SecurityAudit 灞?
> 鏈妭鐢ㄤ簬 `P1-C` 宸插疄鏂藉垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画浼氳瘽浠?`P1-C` 缁х画锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`銆乣prisma/schema.prisma` 鍜岀浉鍏?services銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂5.6 缂哄皯缁熶竴瀹¤妯″瀷`
    - `搂6 P1锛氳ˉ鏉愭枡瀹屾暣鎬
      - `4. 寮曞叆缁熶竴 SecurityAudit / IntegrityEvent`
    - `搂6 P2锛氬寮?connector 璁よ瘉`
- `docs/superpowers/specs/2026-07-10-grs004-p1c-security-audit-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p1c-security-audit-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `SecurityAudit`
  - Prisma 宸叉柊澧炲崟琛ㄦā鍨?  - 褰撳墠瀛楁瑕嗙洊锛歚actorKind / action / targetType / targetId / result / reason / payloadDigest / detailsJson / raceId / raceProjectId / registrationId / userId / caConnectionId / createdAt`
- `src/lib/services/ca-connections.ts`
  - `createCAConnectionForRaceProject()` 鎴愬姛鍚庝細鍐?`ca_connection.register`
- `src/lib/services/ca-fetch.ts`
  - `completeCAConnectionHandshake()` 浼氬 success / rejected 鍒嗘敮鍐?`ca_connection.handshake`
  - `fetchCASessionSnapshotForConnection()` 浼氬 accepted / stale / rejected 鍒嗘敮鍐?`ca_snapshot.fetch`
- `src/lib/services/ca-ingestion.ts`
  - `ingestRidingSignalMessage()` 浼氬 accepted / review_needed / deduped / integrity_gap / rejected 鍒嗘敮鍐?`ca_signal.ingest`

### 鏈疆宸插畬鎴愮殑鐐?
- `prisma/schema.prisma` 涓?`prisma/migrations/20260710020312_grs004_p1c_security_audit/` 宸茶惤鍦扮粺涓€瀹¤妯″瀷銆?- `src/lib/security-audit-helpers.ts` 涓?`src/lib/services/security-audit.ts` 宸茶惤鍦扮粺涓€鏋勫缓涓庡啓鍏?helper銆?- `CA registration / handshake / signal / snapshot` 鍥涙潯鐪熷疄杈圭晫閾捐矾宸叉帴鍏ョ粺涓€ `SecurityAudit`銆?- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/security-audit-helpers.test.ts src/lib/services/ca-connection-audit.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-ingestion-integrity.test.ts`
  - `npm run db:generate`
  - `npm run db:seed`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `SecurityAudit` 鐩墠鍙鐩?`CA` 涓婚摼璺紝灏氭湭鎵╁睍鍒拌鑹蹭慨鏀广€佸悎浣滃鎵广€佹枃浠舵敼鍔ㄦ垨浣滃搧淇敼瀹¤銆?- `ipAddress / userAgent` 浠嶆湭鐪熷疄閲囬泦锛屽綋鍓嶅瓧娈典繚鐣欎负绌恒€?- 杩樻病鏈?Organizer Console 绾у埆鐨勫璁℃煡璇?/ 鍙鍖栥€?- `disabled / revoked connector` 鐨勫彲瑙嗗寲涓庡嚟璇佽疆鎹粛鐣欏湪 `P2`銆?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屼笅涓€瀛愰」鐩簲杩涘叆 `P2 connector 璁よ瘉澧炲己`銆?2. 浼樺厛椤哄簭鎸夋枃妗ｅ簲鍏堢湅锛?   - connector 绾х鍚?   - credential fingerprint / public key 娉ㄥ唽
   - secret rotation
   - disabled / revoked connector 瀹¤鍙鍖?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/security-audit-helpers.test.ts src/lib/services/ca-connection-audit.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-ingestion-integrity.test.ts`
   - `npm run db:generate`
   - `npm run db:seed`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P2-A Connector Credential Fingerprint 涓庢秷鎭鍚?
> 鏈妭鐢ㄤ簬 `P2-A` 宸插疄鏂藉垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画浼氳瘽浠?`P2-A` 缁х画锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`銆乣docs/grs004/ary-ca-integration-spec.md`銆乣prisma/schema.prisma` 鍜岀浉鍏?services銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰锛?    - `搂5.1 缂哄皯娑堟伅绾х鍚峘
    - `搂6 P2锛氬寮?connector 璁よ瘉`
      - `1. 鍦?connector 灞傚紩鍏ュ叕閽ユ敞鍐屾垨 credential fingerprint`
      - `2. Signal payload 澧炲姞绛惧悕`
      - `3. 鏀寔 connector secret rotation`
      - `4. 鏀寔 disabled / revoked connector 鐨勫璁′笌鍙鍖朻
- `docs/grs004/ary-ca-integration-spec.md`
  - 閲嶇偣闃呰锛?    - `RidingSignalMessage`
    - `Session snapshot fetch`
- `docs/superpowers/specs/2026-07-10-grs004-p2a-connector-signature-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p2a-connector-signature-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `CAConnection`
  - 宸叉柊澧?`credentialFingerprint / publicKeyPem / signatureVersion`
- `completeCAConnectionHandshake()`
  - 鍙互鐧昏 connector credential
  - 浼氭嫆缁濓細
    - `credential_fingerprint_mismatch`
    - `credential_mismatch`
- `ingestRidingSignalMessage()`
  - 瀵瑰凡鐧昏 credential 鐨?connection 寮哄埗瑕佹眰 `signature`
  - 浼氭嫆缁濓細
    - `signature_missing`
    - `signature_version_mismatch`
    - `signature_invalid`
- `fetchCASessionSnapshotForConnection()`
  - 瀵瑰凡鐧昏 credential 鐨?connection 寮哄埗鏍￠獙 snapshot 绛惧悕
  - 鏈櫥璁?credential 鐨勬棫 connection 浠嶅彲璧?bearer-only 鍏煎璺緞

### 鏈疆宸插畬鎴愮殑鐐?
- `prisma/schema.prisma` 涓?`prisma/migrations/20260710023123_grs004_p2a_connector_signature/` 宸蹭负 `CAConnection` 琛?credential 瀛楁銆?- `src/lib/ca-signature-helpers.ts` 涓庡搴旀祴璇曞凡钀藉湴锛屽綋鍓嶅彧鏀寔 `ed25519:v1`銆?- `src/lib/services/ca-fetch.ts` 宸叉敮鎸?handshake 鐧昏 credential锛屼互鍙?snapshot 鍝嶅簲楠岀銆?- `src/lib/services/ca-ingestion.ts` 宸叉敮鎸?signal 娑堟伅楠岀銆?- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/ca-signature-helpers.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts`
  - `npm run db:generate`
  - `npm run db:seed`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `connectorSecret` rotation 杩樻病鏈夊紑濮嬨€?- `disabled / revoked connector` 鐨勫彲瑙嗗寲銆乁I 鏌ヨ鍜岃繍缁存祦杞繕娌℃湁寮€濮嬨€?- 褰撳墠鍙敮鎸?`ed25519:v1`锛岃繕娌℃湁澶氱畻娉曠増鏈鐞嗐€?- 鏃?connection 浠嶅厑璁?bearer-only锛涜繕娌¤繘鍏モ€滄墍鏈夌敓浜?connector 蹇呴』绛惧悕鈥濈殑寮哄埗闃舵銆?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屼笅涓€瀛愰」鐩簲杩涘叆 `P2-B connector secret rotation + disabled/revoked connector 鍙鍖朻銆?2. 涓嬩竴姝ヤ紭鍏堥『搴忔寜鏂囨。搴斿厛鐪嬶細
   - connector secret rotation
   - disabled / revoked connector 瀹¤鍙鍖?   - Organizer Console 涓殑 trust / risk 灞曠ず
3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/ca-signature-helpers.test.ts src/lib/services/ca-fetch-audit.test.ts src/lib/services/ca-signature-verification.test.ts`
   - `npm run db:generate`
   - `npm run db:seed`
   - `npm run build`

## 宸插畬鎴愭敹鍙?- 浼佷笟鍚堜綔鍔炶禌瀹℃壒閾捐矾锛歚submitCooperationRequest` 鈫?`listCooperationRequests` 鈫?`approveCooperationRequest` / `rejectCooperationRequest`锛孉dmin 鍙湪 `/console/admin/race-requests` 鏌ョ湅骞跺鎵?
## 2026-06-20 Organizer 澶у睆鎺у埗鍙板叆鍙ｆ仮澶?

### 姒傝堪

鎸夋渶鏂颁骇鍝佽姹傦紝鎭㈠涓诲姙鏂硅繘鍏ュぇ灞忔帶鍒跺彴鐨勮兘鍔涳細Organizer 鍙粠鑷繁涓诲姙璧涗簨鐨勪富鍔炴柟瑙嗗浘鐩存帴杩涘叆澶у睆鎺у埗鍙帮紝骞跺湪 `/console/screen` 涓彧鐪嬪埌鑷繁涓诲姙鐨勮禌浜嬶紱Admin 浠嶄繚鐣欏叏閮ㄨ禌浜嬬殑澶у睆鎺у埗鍙拌闂寖鍥淬€?

### 淇敼浠ｇ爜娓呭崟

| 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 |
|---|---|---|
| `src/app/_components/console/organizer-console-page.tsx` | 淇敼 | 鍦ㄤ富鍔炴柟銆屼笅涓€姝ュ叆鍙ｃ€嶄腑鏂板銆屽ぇ灞忔帶鍒跺彴銆嶆寜閽紝璺宠浆鍒?`/console/screen/${raceSlug}/jumbotron`锛涜鏄庢枃妗堟敼涓轰富鍔炴柟鍙€夋嫨灞曠ず妯″紡 |
| `src/lib/viewer-access.ts` | 淇敼 | `canUseScreen`銆乣getConsoleHomeSections()` 鍜?`getConsoleScreenAccess()` 閲嶆柊鍏佽 `ORGANIZER` 浣跨敤/鐪嬪埌澶у睆鎺у埗鍙?|
| `src/lib/services/console-routes.ts` | 淇敼 | `listScreenConsoleRacesForUser()` 鏀逛负 `ADMIN` 杩斿洖鍏ㄩ儴璧涗簨銆乣ORGANIZER` 杩斿洖鑷繁涓诲姙鐨勮禌浜嬶紝鍏朵粬瑙掕壊杩斿洖绌哄垪琛?|

### 楠岃瘉

- `npm test -- --runInBand src/app/_components/console/console-copy.test.tsx` 鏈墽琛屾垚鍔燂細椤圭洰褰撳墠娌℃湁 `test` script銆?
- `npm run lint` 宸茶繍琛屼絾澶辫触锛涘け璐ラ」涓轰粨搴撴棦鏈?lint 闂锛岃緭鍑轰腑鏈嚭鐜版湰娆′慨鏀规枃浠剁殑鏂板閿欒銆?

## 2026-06-20 Rider 鎺у埗鍙般€屼綔鍝佹彁浜ゃ€峉ection 鏀跺彛

### 姒傝堪

> 璇ヨ妭璁板綍 2026-06-20 鐨勯樁娈垫€?UI 鏀跺彛銆?026-07-11 宸茬户缁敹鍙ｄ负鈥滄瘮璧涗腑涔熸樉绀轰綔鍝佹彁浜わ紝涓斾笉鍐嶈嚜鍔ㄨЕ鍙?Runner鈥濓紱鏈妭淇濈暀涓哄巻鍙茶儗鏅€?
鏁寸悊楠戞墜鎺у埗鍙?`submission` section 鐨勬彁浜ゅ叆鍙ｏ紝鎸夎禌浜嬮樁娈垫敹鍙ｄ负鍗曚竴鎿嶄綔鍏ュ彛锛?- **姣旇禌涓?*锛坅ctive/frozen/running/submitting锛夛細鍙繚鐣欍€岃禌涓唬鐮佹祴璇曘€嶏紝鍘绘帀鐙珛鐨勩€屾彁浜や綔鍝併€?
- **姣旇禌缁撴潫鍚?*锛坒inished/completed锛夛細缁熶竴涓恒€屼綔鍝佹彁浜ゃ€嶏紝浣跨敤 `FinalSubmissionFormClient`锛堣嚜甯︿唬鐮佹枃浠?+ Riding Record 鍙屽叆鍙ｏ級

### 淇敼鍓?

```
姣旇禌涓?  Panel "鎻愪氦浣滃搧" (submitEntryAction) + Panel "璧涗腑浠ｇ爜娴嬭瘯" (submitEntryForTestAction)
姣旇禌鍚?  Panel "鎻愪氦璧涘悗浠ｇ爜涓庤褰? (FinalSubmissionFormClient)
```

### 淇敼鍚?

```
姣旇禌涓?  Panel "璧涗腑浠ｇ爜娴嬭瘯" (submitEntryForTestAction)   鈫?浠呬竴涓叆鍙?
姣旇禌鍚?  Panel "浣滃搧鎻愪氦" (FinalSubmissionFormClient)     鈫?缁熶竴鍏ュ彛锛屽惈浠ｇ爜+Riding Record
```

### 鍙樻洿鏂囦欢

| 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 |
|---|---|---|
| `src/app/_components/console/rider-console-page.tsx` | 淇敼 | 绉婚櫎 `submitEntryAction` import锛涙瘮璧涗腑鍘绘帀 `Panel "鎻愪氦浣滃搧"`锛屽彧淇濈暀 `Panel "璧涗腑浠ｇ爜娴嬭瘯"`锛涙瘮璧涘悗 `Panel "鎻愪氦璧涘悗浠ｇ爜涓庤褰?` 鏇村悕涓?`Panel "浣滃搧鎻愪氦"`锛涙洿鏂版湭寮€鏀鹃樁娈垫彁绀烘枃妗?|

## 2026-06-20 鐜淇涓庣粨鏋勬敹鍙ｏ紙Hrm-cell锛屾湰鏃ユ柊瀹屾垚锛?

- 鐜淇
  - `prisma db push` 鍚屾鏁版嵁搴撲笌 Schema锛圫chema 宸叉湁鍏ㄩ儴 GRS003 妯″瀷浣?migration 鏈墽琛岋級銆?
  - `prisma generate` 閲嶆柊鐢熸垚 Prisma 瀹㈡埛绔€?
  - 鍒犻櫎鏂鐨?`prisma/backfill-registration-refs.ts`銆?
  - 淇 `admin-console-page.test.tsx` TS 閿欒锛坄as const` 鈫?`as AppRole[]`锛夈€?
- Race 鐘舵€佹満 5鈫?
  - `Race` 妯″瀷鏂板 `status String?` 瀛楁銆?
  - `race-phase.ts` 閲嶅啓锛氫紭鍏堟樉寮?status锛宯ull 鏃?fallback 鏃堕棿鎺ㄥ锛屼繚鐣欐棫 5 鐘舵€佸吋瀹广€?
  - 鏂板 `isValidPhaseTransition()` 鏍￠獙鍚堟硶杩佺Щ銆?
  - 绉嶅瓙鏁版嵁涓夎禌浜嬪悇璁炬樉寮?status銆?
- Runner 璺緞闄嶇骇
  - `submissions.ts` 涓?`enqueueSubmissionTestTask` 鍜?`enqueueHarnessEvalTaskForArtifact` 璋冪敤宸茬Щ闄ゃ€傛彁浜や笉鍐嶈嚜鍔ㄥ叆 Runner 闃熷垪锛孋A Connector鈫扟udgingRecord 鎴愪负涓昏矾寰勩€?
- Console 鏉冮檺楠岃瘉
  - `console-routes.ts` 纭锛歄rganizer 鎸?`organizerId` 杩囨护銆丷ider 鎸?registration銆丣udge 鎸?assignment銆?
- 楠岃瘉
  - `npx tsc --noEmit` 闆堕敊璇€?
  - `npm run build` 閫氳繃銆?
  - `npm run db:seed` 鐢熸垚 3 璧涗簨 + 11 楠戞墜銆?

## 2026-06-20 Admin 鍔炶禌鐢宠瀹℃壒鍔熻兘锛堟湰鏃ユ柊瀹屾垚锛?

### 姒傝堪

琛ュ叏浼佷笟鍚堜綔鍔炶禌閾捐矾鐨勫鎵圭幆鑺傘€傛鍓嶄紒涓氭彁浜ゅ姙璧涚敵璇峰悗浠呭瓨鍏?`CooperationRequest`锛坰tatus=PENDING锛夛紝鏃犱换浣曟煡鐪嬫垨瀹℃壒鑳藉姏銆傛湰鏃ユ柊澧?Admin 鎺у埗鍙板鎵归〉闈笌瀹屾暣瀹℃壒 Service锛屽舰鎴?浼佷笟鎻愪氦 鈫?Admin 瀹℃牳 鈫?鑷姩鍒涘缓璧涗簨"鐨勫畬鏁撮棴鐜€?

### 娴佺▼

```
浼佷笟濉啓鍚堜綔琛ㄥ崟 鈫?cooperationRequestAction 鈫?CooperationRequest (status: PENDING, submitterId=褰撳墠鐢ㄦ埛)
                                                          鈫?
Admin 鐧诲綍 鈫?/console/admin/race-requests 鈫?RaceRequestsPageView
                                                          鈫?
                                            鈹屸攢鈹€ 鎵瑰噯 鈹€鈹€鈫?$transaction:
                                            鈹?            1. Race.create(organizerId=request.submitterId ?? adminUserId)
                                            鈹?            2. CooperationRequest.status 鈫?"APPROVED"
                                            鈹?
                                            鈹斺攢鈹€ 鎷掔粷 鈹€鈹€鈫?CooperationRequest.status 鈫?"REJECTED"
```

### 鏂板 / 淇敼浠ｇ爜娓呭崟

| 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 |
|---|---|---|
| `prisma/schema.prisma` | 淇敼 | `CooperationRequest` 鏂板 `submitterId String?` 瀛楁锛堟彁浜ょ敵璇锋椂璁板綍褰撳墠鐢ㄦ埛 ID锛?|
| `src/lib/services/cooperation.ts` | 淇敼 | 鏂板 import `parseKeywords` / `normalizeWeights`锛沗submitCooperationRequest` 鏂板 `submitterId` 鍙傛暟 |
| `src/lib/services/cooperation.ts` | 鏂板 | `listCooperationRequests(status?: string)` 鈥?鍒楀嚭鎵€鏈夌敵璇凤紝鍙€夋寜 status 杩囨护锛屾寜 `createdAt` 闄嶅簭 |
| `src/lib/services/cooperation.ts` | 鏂板 | `approveCooperationRequest(requestId, adminUserId)` 鈥?鎵瑰噯鐢宠锛宍$transaction` 鍘熷瓙鍒涘缓 Race + 鏇存柊鐘舵€佷负 APPROVED銆俹rganizerId 浼樺厛鍙?`request.submitterId`锛宖allback 鍒?`adminUserId`銆傛牎楠岋細鐢宠涓嶅瓨鍦ㄦ姏閿欍€侀潪 PENDING 鐘舵€佹嫆缁濋噸澶嶅鎵?|
| `src/lib/services/cooperation.ts` | 鏂板 | `rejectCooperationRequest(requestId)` 鈥?鎷掔粷鐢宠锛屾洿鏂扮姸鎬佷负 REJECTED銆傜浉鍚岄槻閲嶉€昏緫 |
| `src/app/actions.ts` | 淇敼 | 鏂板 import `getSessionUser` / `approveCooperationRequest` / `rejectCooperationRequest`锛沗cooperationRequestAction` 璋冪敤 `getSessionUser()` 鑾峰彇褰撳墠鐢ㄦ埛 ID 骞朵紶鍏?`submitterId` |
| `src/app/actions.ts` | 鏂板 | `approveCooperationRequestAction(formData)` 鈥?Server Action锛宍requireRole("ADMIN")` 閴存潈锛岃鍙?`requestId` 璋冪敤 Service锛宍revalidatePath("/console/admin/race-requests")` |
| `src/app/actions.ts` | 鏂板 | `rejectCooperationRequestAction(formData)` 鈥?Server Action锛屽悓涓婇壌鏉?+ revalidate |
| `src/app/_components/console/race-requests-page.tsx` | **鏂板缓** | `RaceRequestsPageView` 缁勪欢锛氬垎"寰呭鏍哥敵璇?鍜?宸插鐞嗙敵璇?涓ょ粍灞曠ず锛屽惈鐢宠璇︽儏鎶樺彔闈㈡澘锛坄<details>`锛変笌鎵瑰噯/鎷掔粷鎸夐挳锛圫erver Action 琛ㄥ崟锛?|
| `src/app/_components/console/console-shell.tsx` | 淇敼 | `adminConsoleSections` 浠?`["users", "profile-completion", "roles"]` 鎵╁睍涓?`["users", "profile-completion", "roles", "race-requests"]` |
| `src/app/console/admin/[section]/page.tsx` | 淇敼 | 鏂板 import `RaceRequestsPageView` / `listCooperationRequests`锛沗adminSectionLabels` 鏂板 `"race-requests": "鍔炶禌鐢宠瀹℃牳"`锛泂ection 涓?`"race-requests"` 鏃舵覆鏌?`RaceRequestsPageView`锛屽叾浠栬蛋鍘熸湁 `AdminConsolePageView` |
| `src/app/_components/console/console-home.tsx` | 淇敼 | admin 鍗＄墖鎻忚堪浠?鐢ㄦ埛鍒楄〃銆佽祫鏂欑姸鎬佷笌瑙掕壊绠＄悊"鏇存柊涓?鐢ㄦ埛鍒楄〃銆佽祫鏂欑姸鎬併€佽鑹茬鐞嗕笌鍔炶禌鐢宠瀹℃牳" |
| `src/app/_components/cooperation-form.tsx` | 淇敼 | 鎻愪氦鎴愬姛鎻愮ず鏂囨鏇存柊涓?浣犵殑鍔炶禌鐢宠宸叉彁浜わ紝灏嗙敱绠＄悊鍛樺鏍搞€傚鏍搁€氳繃鍚庤禌浜嬪皢鑷姩鍒涘缓鈥?锛屾槑纭憡鐭ュ鎵规祦绋?|

### API 鎺ュ彛瀹氫箟

#### `listCooperationRequests(status?: string)`
- **鍙傛暟**锛歚status` 鍙€夛紝鍊间负 `"PENDING"` / `"APPROVED"` / `"REJECTED"`锛屼笉浼犺繑鍥炲叏閮?
- **杩斿洖**锛歚Promise<CooperationRequest[]>`锛屾寜 `createdAt` 闄嶅簭
- **鏉冮檺**锛氭棤鍐呯疆閴存潈锛堢敱璋冪敤鏂?`/console/admin/[section]/page.tsx` 鐨?`getConsoleAdminAccess` 瀹堝崼锛?

#### `approveCooperationRequest(requestId: string, adminUserId: string)`
- **鍙傛暟**锛?
  - `requestId` - 鐢宠璁板綍 ID锛坈uid锛?
  - `adminUserId` - 瀹℃壒绠＄悊鍛樼殑鐢ㄦ埛 ID锛屼綔涓?Race 鐨?`organizerId` 鐨?fallback 鍊?
- **organizerId 纭畾閫昏緫**锛氫紭鍏堜娇鐢ㄧ敵璇疯褰曚腑鐨?`submitterId`锛堟彁浜ょ敵璇锋椂璁板綍鐨勭敤鎴?ID锛夛紝鑻ヤ负绌哄垯 fallback 鍒?`adminUserId`
- **杩斿洖**锛歚Promise<Race>` 鈥?鏂板垱寤虹殑璧涗簨璁板綍
- **閿欒澶勭悊**锛?
  - 鐢宠涓嶅瓨鍦?鈫?`throw new Error("鍔炶禌鐢宠涓嶅瓨鍦?)`
  - 鐢宠鐘舵€侀潪 PENDING 鈫?`throw new Error("璇ョ敵璇峰凡澶勭悊锛屾棤娉曢噸澶嶅鎵?)`
- **Race 榛樿鍊?*锛堢敵璇疯〃涓笉鍖呭惈鐨勫瓧娈碉級锛?
  - `taskPackageLabel` = 鐢宠涓殑 `raceTitle`
  - `cloudStudioUrl` = `""`
  - `trackId` = `"oval-track"`锛堥粯璁ゆき鍦嗚禌閬擄級
  - `trackConfigJson` = `""`锛堢┖璧涢亾閰嶇疆锛?
  - `updateGranularityMinutes` = 30锛圥risma 榛樿鍊硷級
  - `displayHighlightCount` = 3锛圥risma 榛樿鍊硷級
  - `weightTaskPassRate` = 1.0, 鍏朵綑鏉冮噸 = 0.0锛坱ask-only 璇勫垎妯″紡锛?
  - `harnessWeightReasoning` = 0.6, `harnessWeightKeyword` = 0.4锛圥risma 榛樿鍊硷級
  - `organizerComment` = `""`锛圥risma 榛樿鍊硷級
- **鍘熷瓙鎬?*锛氫娇鐢?`prisma.$transaction` 鍚屾椂鍒涘缓 Race + 鏇存柊 CooperationRequest 鐘舵€?

#### `rejectCooperationRequest(requestId: string)`
- **鍙傛暟**锛歚requestId` - 鐢宠璁板綍 ID
- **杩斿洖**锛歚Promise<CooperationRequest>`
- **閿欒澶勭悊**锛氬悓 `approveCooperationRequest`锛岀敵璇蜂笉瀛樺湪鎴栧凡澶勭悊鍧囨姏閿?

### Server Actions

#### `approveCooperationRequestAction(formData: FormData)`
- **閴存潈**锛歚requireRole("ADMIN")` 鈥?浠呯鐞嗗憳鍙皟鐢?
- **鍏ュ弬**锛歚formData.get("requestId")` 鈥?鐢宠 ID
- **鍓綔鐢?*锛氳皟鐢?`approveCooperationRequest` 鍚?`revalidatePath("/console/admin/race-requests")`

#### `rejectCooperationRequestAction(formData: FormData)`
- **閴存潈**锛歚requireRole("ADMIN")` 鈥?浠呯鐞嗗憳鍙皟鐢?
- **鍏ュ弬**锛氬悓 approve锛岃鍙?`requestId`
- **鍓綔鐢?*锛氳皟鐢?`rejectCooperationRequest` 鍚?`revalidatePath("/console/admin/race-requests")`

### 杈圭晫鏉′欢澶勭悊

| 鍦烘櫙 | 澶勭悊鏂瑰紡 |
|---|---|
| 鐢宠涓嶅瓨鍦?| `throw Error("鍔炶禌鐢宠涓嶅瓨鍦?)`锛岄〉闈㈡樉绀洪敊璇?|
| 閲嶅瀹℃壒锛坰tatus 宸查潪 PENDING锛?| `throw Error("璇ョ敵璇峰凡澶勭悊锛屾棤娉曢噸澶嶅鎵?)` |
| 绌虹敵璇峰垪琛?| `RaceRequestsPageView` 鏄剧ず"鏆傛棤鐢宠"绌烘€?|
| 鍏ㄩ儴宸插鐞?| 浠呮樉绀?宸插鐞嗙敵璇?闈㈡澘锛?寰呭鏍?闈㈡澘涓嶆覆鏌?|
| 鍏ㄩ儴寰呭鏍?| 浠呮樉绀?寰呭鏍哥敵璇?闈㈡澘锛?宸插鐞?闈㈡澘涓嶆覆鏌?|
| 闈?ADMIN 鐢ㄦ埛璁块棶 `/console/admin/race-requests` | `getConsoleAdminAccess` 杩斿洖 `allowed: false`锛岄噸瀹氬悜鍒?`/console` |
| 鎻愪氦鐢宠鏃跺凡鐧诲綍锛堟湁 session锛?| `submitterId` 璁板綍褰撳墠鐢ㄦ埛 ID锛屾壒鍑嗗悗 Race 褰掑睘璇ョ敤鎴?|
| 鎻愪氦鐢宠鏃舵湭鐧诲綍锛堝尶鍚嶏級 | `submitterId` 涓?null锛屾壒鍑嗗悗 `organizerId` fallback 鍒板鎵?Admin |
| 鐢宠涓殑鏃ユ湡涓?String 鏍煎紡 | 鎵瑰噯鏃?`new Date(request.signupStart)` 绛夎浆涓?DateTime |
| Schema 鍙樻洿鍚?dev server 缂撳瓨鏃?Client | 闇€ `prisma generate` + 娓呯悊 `.next` 鐩綍鍚庨噸鍚?|

### 楠岃瘉

- TypeScript 缂栬瘧锛氭墍鏈夋柊澧?淇敼鏂囦欢 `read_lints` 闆堕敊璇?
- Prisma 瀹㈡埛绔細`prisma generate` 鍚?`CooperationRequest`锛堝惈 `submitterId` 瀛楁锛夊凡鍑虹幇鍦?`src/generated/prisma/models/` 鍜?`client.ts` 绫诲瀷涓?
- 鏁版嵁搴擄細`prisma db push` 鍚屾 `CooperationRequest` 琛紙鍚?`submitterId` 鍒楋級鍒?`dev.db`
- 鎵嬪姩楠屾敹锛歰rganizer 鐧诲綍鍚庢彁浜ょ敵璇?鈫?Admin 瀹℃壒 鈫?organizer 鎺у埗鍙板彲鐪嬪埌璇ヨ禌浜?

---

## 2026-06-19 GitHub OAuth 涓庣湡瀹?agent 鏈€灏忛棴鐜ˉ榻愶紙杩涜涓級

- GitHub OAuth
  - `src/lib/github-oauth.ts` 宸叉壙鎷?state cookie銆丟itHub code exchange銆佺敤鎴锋煡鎵?鍒涘缓涓?session 鍐欏叆銆?
  - `src/app/api/auth/github/callback/route.ts` 宸叉壙鎺?callback锛屽苟鎶?`github_denied / github_missing_code / github_callback_failed` 鍥炶惤鍒扮櫥褰曢〉銆?
  - `README.md` 涓?`.env.example` 宸茶ˉ榻?`SESSION_SECRET / ARY_BASE_URL / GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET / GITHUB_CALLBACK_URL` 璇存槑銆?
- Real agent demo
  - 鏂板 `organizer_demo/ca_connector_demo/` 鏈€灏忔紨绀哄櫒锛氭湰鍦?snapshot server銆丄RY handshake client銆乻ignal push client銆乣.env.example` 涓?README銆?
  - 璇?demo 榛樿鑷姩鍙戦€?`session_started` 涓?`task_progress`锛屽苟閫氳繃 Rider 鎺у埗鍙版墜鍔ㄨЕ鍙?snapshot fetch銆?
- 褰撳墠杈圭晫
  - 杩欎竴杞互鈥滄渶灏忔紨绀洪棴鐜€濅负鐩爣锛屼笉鎵╁睍鍒扮敓浜х骇 connector SDK銆佽嚜鍔?snapshot 璋冨害銆乻ecret 杞崲鎴栧璁＄紪鎺掋€?
- 楠岃瘉
  - `powershell -Command "$env:DATABASE_URL='file:./dev.db'; npm run db:generate"` 宸查€氳繃锛屽凡鎭㈠ `src/generated/prisma` 鐢熸垚浜х墿銆?
  - `npm --prefix organizer_demo/ca_connector_demo run typecheck` 宸查€氳繃銆?
  - `powershell -Command "$env:DATABASE_URL='file:./dev.db'; npm --prefix organizer_demo/ca_connector_demo run typecheck; npm run build"` 宸查€氳繃銆?

## 2026-06-19 澶у睆鎺у埗鍙版潈闄愯竟鐣屾敹鍙ｏ紙鍘嗗彶璁板綍锛屽凡琚?2026-06-20 Organizer 鍏ュ彛鎭㈠瑕嗙洊锛?

> 娉細鏈妭璁板綍 2026-06-19 鐨勯樁娈垫€у喅绛栵紱2026-06-20 宸叉寜鏈€鏂拌姹傛仮澶?Organizer 澶у睆鎺у埗鍙板叆鍙ｏ紝褰撳墠鐘舵€佷互銆?026-06-20 Organizer 澶у睆鎺у埗鍙板叆鍙ｆ仮澶嶃€嶄负鍑嗐€?

- `src/lib/viewer-access.ts`
  - `canUseScreen`銆乣getConsoleHomeSections()` 鍜?`getConsoleScreenAccess()` 涓嶅啀鎶?Organizer 瑙嗕负澶у睆鎺у埗鍙扮敤鎴枫€?
  - 澧炲姞娉ㄩ噴鏄庣‘锛氫紒涓氳兘鍔涘皻鏈嫭绔嬪缓妯★紝褰撳墠鐢?`Admin` 浠ｇ悊澶у睆鎺у埗鍙版潈闄愩€?
- `src/lib/services/console-routes.ts`
  - `listScreenConsoleRacesForUser()` 鏀逛负浠?`Admin` 杩斿洖璧涗簨鍒楄〃锛屼笉鍐嶇粰 Organizer 杩斿洖澶у睆鍏ュ彛銆?
- `src/app/_components/console/organizer-console-page.tsx`
  - 涓诲姙鏂硅鍥剧Щ闄ょ洿杈惧ぇ灞忔帶鍒跺彴鎸夐挳锛屾敼涓鸿鏄庡綋鍓嶉渶鐢辩鐞嗗憳浠ｇ悊杩涘叆澶у睆鎺у埗鍙拌仈璋冦€?
- 瀵瑰簲娴嬭瘯
  - `src/lib/viewer-access.test.ts`
  - `src/lib/services/console-routes.test.ts`
  - `src/app/_components/console/organizer-console-page.test.tsx`
- 楠岃瘉
  - `node --import tsx --test src/lib/viewer-access.test.ts` 宸查€氳繃銆?
  - `src/lib/services/console-routes.test.ts` 涓?`src/app/_components/console/organizer-console-page.test.tsx` 褰撳墠鍙?`src/lib/prisma.ts` 瀵?`@/generated` 鐨勮繍琛屾椂渚濊禆闃诲锛屽懡浠や細鍦ㄥ姞杞?Prisma 鏃跺け璐ワ紝灏氭湭瀹屾垚鑷姩鍖栭獙鏀躲€?

## 2026-06-19 鍏紑绔笌杩囩▼鎶曞奖鏀跺彛锛堝凡瀹屾垚楠屾敹锛?

- `src/lib/jumbotron/adapter.ts`
  - 鍘绘帀浜嗗湪娌℃湁鐪熷疄鏉ユ簮鏃朵吉閫犵殑楠戣娑堟伅銆?
  - 鍘绘帀浜嗗湪娌℃湁鐪熷疄椋庨櫓鏉ユ簮鏃朵吉閫犵殑浣庨闄╂彁閱掗」銆?
  - 娲昏穬楠戞墜鍜屾帶鍒跺彴 KPI 浼樺厛璇诲彇 `Registration / RaceProject`銆?
- `src/lib/services/projections.ts`
  - 澧炲姞 `EVENT_STREAM_READ_MODEL` 鎶曞奖杈撳嚭銆?
- `src/app/_components/public/live-hall.tsx`
  - 杩囩▼姒滃崟鏀逛负璇诲彇 `CURRENT_LEADERBOARD`銆?
  - 浜嬩欢娴佹敼涓鸿鍙?`EVENT_STREAM_READ_MODEL`銆?
  - 涓嶅啀鍥為€€鍒版棫鐨?`leaderboardEntries`銆?
- 楠岃瘉 鉁?
  - `node --import tsx --test src/lib/jumbotron-adapter.test.ts src/app/_components/public/live-hall.test.tsx src/lib/services/projections-convergence.test.ts`锛?8 椤归€氳繃锛?

## 2026-06-19 鍏紑缁撴灉閾炬敹鍙ｏ紙宸插畬鎴愰獙鏀讹級

- `src/lib/services/results.ts`
  - 澧炲姞 `buildPublicResultsModel()`銆?
  - 缁撴灉椤靛紑濮嬫寜 `Award / Report / Work` 鑱氬悎鍏紑璧涙灉妯″瀷銆?
- `src/lib/services/review.ts`
  - 澧炲姞 `buildPublicReviewModel()`銆?
  - 澶嶇洏椤靛紑濮嬫寜 `review_summary / Award / Evidence` 鑱氬悎銆?
- `src/lib/services/public-routes.ts`
  - 鍏紑浣滃搧椤靛拰楠戞墜椤佃ˉ榻?`techNotes`銆乣judgeComments`銆乣skillTags`銆乣performanceSummary`銆?
- 瀵瑰簲鍏紑缁勪欢
  - `results-page.tsx`
  - `review-page.tsx`
  - `work-page.tsx`
  - `rider-profile-page.tsx`
  - `works-page.tsx`
- 楠岃瘉 鉁?
  - 绾嚱鏁帮細`node --import tsx --test src/lib/services/results-chain-convergence.test.ts`锛? 椤归€氳繃锛?
  - 缁勪欢娓叉煋锛歚node --import tsx --test src/app/_components/public/results-page.test.tsx src/app/_components/public/review-page.test.tsx src/app/_components/public/work-page.test.tsx src/app/_components/public/rider-profile-page.test.tsx src/app/_components/public/works-page.test.tsx`锛?3 椤归€氳繃锛?
  - 鍚堣 22 椤瑰叏閮ㄩ€氳繃

## 2026-06-19 鎺у埗鍙板熀纭€璺嚎鏀跺彛锛堝凡瀹屾垚楠屾敹锛?

- 鏂板鎺у埗鍙拌矾鐢变笌澹冲眰锛?
  - `src/app/console/layout.tsx`
  - `src/app/console/page.tsx`
  - `src/app/console/races/page.tsx`
  - `src/app/console/screen/page.tsx`
  - `src/app/_components/console/console-shell.tsx`
  - `src/app/_components/console/console-home.tsx`
  - `src/app/_components/console/console-races-page.tsx`
- `src/lib/viewer-access.ts`
  - 澧炲姞 `admin / judge / organizer / rider / screen` 鍏ュ彛鎺у埗銆?
- `src/lib/services/console-routes.ts`
  - 澧炲姞璧涗簨鎺у埗鍙板垪琛ㄣ€佸ぇ灞忔帶鍒跺彴鍒楄〃锛屼互鍙婃寜 slug 鍙栬禌浜嬩笂涓嬫枃鐨勯€昏緫銆?
- 楠岃瘉 鉁?
  - 缁熶竴鍛戒护锛歚node --import tsx --test src/lib/services/console-routes-convergence.test.ts src/lib/viewer-access.test.ts src/app/_components/console/console-copy.test.tsx src/lib/services/console-routes.test.ts`锛?9 椤归€氳繃锛?

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 |
  |---|---|---|
  | `src/lib/user-roles.ts` | 鏂板 | `normalizeRoles / parseRolesJson / hasRole / getDefaultActiveRole` 4瑙掕壊浣撶郴 |
  | `src/lib/viewer-access.ts` | 鏂板 | `getConsoleHomeSections / getConsoleDefaultHref / getConsoleRaceViewAccess / getCreateRacePageAccess / getConsoleScreenAccess / getConsoleAdminAccess` 绛?11 涓叆鍙ｆ帶鍒跺嚱鏁?|
  | `src/app/_components/console/console-shell.tsx` | 鏂板 | `ConsoleShell` 甯冨眬 + `organizerConsoleSections / riderConsoleSections / judgeConsoleSections / adminConsoleSections / screenConsoleModes` 鍏?5 濂楀鑸父閲?+ `buildConsoleRootNavItems / buildConsoleSectionNavItems` |
  | `src/app/console/layout.tsx` | 鏂板 | Console 鏍瑰竷灞€ |
  | `src/app/console/page.tsx` | 鏂板 | Console 棣栭〉 |
  | `src/app/console/races/page.tsx` | 鏂板 | 璧涗簨鎺у埗鍙板垪琛?|
  | `src/app/console/screen/page.tsx` | 鏂板 | 澶у睆鎺у埗鍙板垪琛?|

## 2026-06-19 Judge 鑼冨洿鏀跺彛锛堝凡瀹屾垚楠屾敹锛?

- `src/lib/services/console-routes.ts`
  - `judge` 璧涗簨鍒楄〃鏀逛负鍙睍绀哄綋鍓嶈瘎濮旇鍒嗛厤浣滃搧鎵€鍦ㄧ殑璧涗簨銆?
- `src/lib/viewer-access.ts`
  - `judge` 璧涗簨瑙嗗浘鍑嗗叆鏀逛负鏄惧紡渚濊禆 `isRaceJudge`銆?
- `src/app/console/races/[raceSlug]/page.tsx`
  - 杩涘叆璧涗簨宸ヤ綔鍙版椂锛岃瘎濮斿彧浼氬湪鏈?assignment 鐨勮禌浜嬩腑璺宠浆鍒?`judge/assigned`銆?
- `src/app/console/races/[raceSlug]/judge/[section]/page.tsx`
  - 璺敱灞傛樉寮忔寜 assignment 鏁伴噺鎺у埗璇勫鍑嗗叆銆?
- 楠岃瘉 鉁?
  - 缁熶竴鍛戒护锛歚node --import tsx --test src/lib/services/judge-scope-convergence.test.ts src/lib/services/console-routes.test.ts src/lib/viewer-access.test.ts`锛?3+12=25 椤瑰凡閫氳繃锛?

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 |
  |---|---|---|
  | `src/lib/services/console-routes.ts` | 淇敼 | judge 璧涗簨鍒楄〃鏀逛负鍙睍绀烘湁 JudgeAssignment 鐨勮禌浜嬶紙lines 61-94锛?|
  | `src/lib/viewer-access.ts` | 淇敼 | judge 瑙嗗浘鍑嗗叆鏀逛负鏄惧紡渚濊禆 `isRaceJudge` 鍙傛暟锛坙ines 147-152锛?|
  | `src/app/console/races/[raceSlug]/page.tsx` | 鏂板 | 鍏ュ彛椤垫寜 `judgeAssignments.length > 0` 鍐冲畾鏄惁璺宠浆 judge/assigned |
  | `src/app/console/races/[raceSlug]/judge/[section]/page.tsx` | 鏂板 | judge section 椤垫寜 assignment 鏁伴噺浜屾鏍￠獙鍑嗗叆 |
  | `src/lib/services/judge-scope-convergence.test.ts` | 鏂板 | 13 椤归獙鏀舵祴璇曪紙isRaceJudge 鍑嗗叆/瓒婃潈/鏈櫥褰?鍙岃鑹诧級 |

## 2026-06-19 submission 鏈嶅姟 registration-first 鏀跺彛锛堝凡瀹屾垚楠屾敹锛?

- `src/lib/services/submissions.ts`
  - `createSubmission()` 鍜?`createFinalSubmission()` 鍏堟煡 `Registration`锛屽啀鏌ュ吋瀹?`team` 瀹瑰櫒銆?
  - 瀵瑰閿欒璇箟缁熶竴鍥炲埌鈥滀釜浜烘姤鍚?/ 鍙敤鎻愪氦瀹瑰櫒 / 姣旇禌闃舵鈥濄€?
- `src/lib/services/rider-bridge.ts`
  - 鏂板 `getCompatibilityContainerForRegistration()`锛岄泦涓吋瀹瑰眰鏌ヨ銆?
- 楠岃瘉 鉁?
  - 缁熶竴鍛戒护锛歚node --import tsx --test src/lib/services/submission-registration-first.test.ts`锛?8 椤归€氳繃锛?

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 |
  |---|---|---|
  | `src/lib/services/submissions.ts` | 淇敼 | `createSubmission`/`createFinalSubmission` 鍏堟煡 `Registration` 鍐嶆煡鍏煎 `team` 瀹瑰櫒锛涢敊璇秷鎭敼涓?涓汉鎶ュ悕/鍙敤鎻愪氦瀹瑰櫒" |
  | `src/lib/services/rider-bridge.ts` | 鏂板 | `getCompatibilityContainerForRegistration()` 闆嗕腑鍏煎灞傛煡璇?|
  | `src/lib/services/submission-registration-first.test.ts` | 鏂板 | 18 椤归獙鏀舵祴璇曪紙Agent鏍囩7椤?Schema鏍￠獙6椤?閿欒璇箟5椤癸級 |

## 2026-06-19 Rider Console 璇箟鏀跺彛锛堝凡瀹屾垚楠屾敹锛?

- `src/lib/services/rider-console.ts`
  - 澧炲姞 `buildRiderConsoleReportModel()`銆?
- `src/app/_components/console/rider-console-page.tsx`
  - 瑙嗗浘璇箟鏀逛负 `鎶ュ悕 / 浣滃搧鎻愪氦 / 璇勫缁撴灉 / 楠戞墜鎶ュ憡`銆?
  - 涓嶅啀鐩存帴鏆撮湶 compatibility 灞傛蹇点€?
- 楠岃瘉 鉁?
  - 璇箟妫€鏌ワ細`node --import tsx --test src/app/_components/console/rider-console-semantics.test.tsx`锛? 椤归€氳繃锛?

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 |
  |---|---|---|
  | `src/lib/services/rider-console.ts` | 鏂板 | `buildRiderConsoleReportModel()` |
  | `src/app/_components/console/rider-console-page.tsx` | 淇敼 | 瑙嗗浘璇箟鏀逛负鎶ュ悕/浣滃搧鎻愪氦/璇勫缁撴灉/楠戞墜鎶ュ憡锛涗笉鏆撮湶 compatibility 灞?|
  | `src/app/_components/console/rider-console-semantics.test.tsx` | 鏂板 | 3 椤归獙鏀舵祴璇曪紙6 section 涓枃+compatibility 闅旂+report 璇箟锛?|

## 2026-06-19 Admin Console 鏈€灏忚处鍙锋不鐞嗕腑鏂囧寲鏀跺彛锛堝凡瀹屾垚楠屾敹锛?026-06-20 鎵╁睍涓?4 section锛?

- `src/app/_components/console/admin-console-page.tsx`
  - 鏀跺彛涓?`鐢ㄦ埛鍒楄〃 / 璧勬枡琛ュ叏 / 瑙掕壊缁存姢` 涓変釜鏈€灏忚处鍙锋不鐞嗗尯鍧楋紙`鍔炶禌鐢宠瀹℃牳` section 浜?2026-06-20 鏂板锛岀嫭绔嬬粍浠讹級銆?
  - 瑙掕壊鏍囩鏀逛负锛?
  - `绠＄悊鍛榒
  - `璇勫`
  - `涓诲姙鏂筦
  - `楠戞墜`
- `src/app/console/admin/[section]/page.tsx`
  - breadcrumb銆乼itle銆乨escription 鍜?section 鏍囩鏀逛负涓枃銆?
- `src/app/_components/console/admin-console-page.test.tsx`
  - 鏂板 Admin Console 涓枃鍖栨祴璇曘€?
- 楠岃瘉 鉁?
  - 缁熶竴鍛戒护锛歚node --import tsx --test src/app/_components/console/admin-console-chinese.test.tsx`锛? 椤归€氳繃锛?

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 |
  |---|---|---|
  | `src/app/_components/console/admin-console-page.tsx` | 淇敼 | 3 section(鐢ㄦ埛鍒楄〃/璧勬枡琛ュ叏/瑙掕壊缁存姢)+4 瑙掕壊鏍囩(绠＄悊鍛?璇勫/涓诲姙鏂?楠戞墜) |
  | `src/app/console/admin/[section]/page.tsx` | 淇敼 | breadcrumb/title/description 鍏ㄤ腑鏂?|
  | `src/app/_components/console/admin-console-chinese.test.tsx` | 鏂板 | 3 椤归獙鏀舵祴璇曪紙鏍囬+瑙掕壊鏍囩+璧勬枡鐘舵€?娌荤悊璇存槑锛?|

## 2026-06-19 Live Hall 涓?Race Page 鍏紑鍏ュ彛涓枃鍖栨敹鍙ｏ紙宸插畬鎴愰獙鏀讹級

- `src/app/_components/public/live-hall.tsx`
  - 鏀逛负涓枃鍏紑鏍囬銆佸垎鍖烘爣棰樸€佹寜閽拰绌烘€侊細
  - `瀹炲喌澶у巺`
  - `璧涗簨鐘舵€乣
  - `杩囩▼鎬昏`
  - `杩囩▼鎸囨爣`
  - `澶у睆鍏ュ彛`
  - `褰撳墠杈撳嚭`
  - `楠戞墜鍔ㄦ€乣
  - `鎶ュ悕鐘舵€乣
  - `褰撳墠姒滃崟`
  - `杩囩▼姒滃崟`
  - `浜嬩欢娴乣
  - `鏈€杩戜簨浠禶
- `src/app/_components/public/race-page.tsx`
  - 鏀逛负涓枃鍏紑鍏ュ彛鍜屼笅涓€姝ュ叆鍙ｏ細
  - `鍏紑鍏ュ彛`
  - `鏌ョ湅浣滃搧`
  - `鏌ョ湅璧涙灉`
  - `鏌ョ湅澶嶇洏`
  - `鏌ョ湅鍚堜綔`
  - `杩斿洖璧涗簨鍒楄〃`
- 瀵瑰簲娴嬭瘯
  - `src/app/_components/public/live-hall.test.tsx`
  - `src/app/_components/public/race-page.test.tsx`
- 楠岃瘉 鉁?
  - 缁熶竴鍛戒护锛歚node --import tsx --test src/app/_components/public/race-live-chinese.test.tsx`锛? 椤归€氳繃锛?

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 |
  |---|---|---|
  | `src/app/_components/public/live-hall.tsx` | 淇敼 | 12 椤逛腑鏂囨爣棰橈紙瀹炲喌澶у巺/杩囩▼鎬昏/杩囩▼鎸囨爣/澶у睆鍏ュ彛绛夛級 |
  | `src/app/_components/public/race-page.tsx` | 淇敼 | 鍏紑鍏ュ彛+涓嬩竴姝ュ叏涓枃锛堟煡鐪嬩綔鍝?璧涙灉/澶嶇洏/鍚堜綔/杩斿洖璧涗簨鍒楄〃锛?|
  | `src/app/_components/public/race-live-chinese.test.tsx` | 鏂板 | 2 椤归獙鏀舵祴璇曪紙live-hall 12 椤?race-page 10 椤逛腑鏂囷級 |

## 2026-06-19 Organizer Console 涓庡垱寤鸿禌浜嬮〉涓枃鍖栨敹鍙ｏ紙宸插畬鎴愰獙鏀讹級

- `src/app/_components/console/organizer-console-page.tsx`
  - 鏀跺彛 `overview / settings` 鏈€鏄剧溂鐨勮嫳鏂囩晫闈細
  - `涓诲姙鏂硅鍥綻
  - `璧涗簨姒傝`
  - `涓嬩竴姝ュ叆鍙
  - `璧涗簨鍐呭`
  - `鏄剧ず閫夐」`
  - `淇濆瓨璧涗簨鍐呭`
  - `淇濆瓨鏄剧ず閫夐」`
- `src/app/console/races/new/page.tsx`
  - 鍒涘缓璧涗簨椤垫敼涓轰腑鏂囷細
  - `鎺у埗鍙癭
  - `璧涗簨鎺у埗鍙癭
  - `鍒涘缓璧涗簨`
  - `杩斿洖璧涗簨鎺у埗鍙癭
  - `璧涗簨琛ㄥ崟`
- 瀵瑰簲娴嬭瘯
  - `src/app/_components/console/organizer-console-page.test.tsx`
  - `src/app/console/races/new/page.test.tsx`
- 楠岃瘉 鉁?
  - 缁熶竴鍛戒护锛歚node --import tsx --test src/app/_components/console/organizer-chinese.test.tsx`锛? 椤归€氳繃锛?

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 |
  |---|---|---|
  | `src/app/_components/console/organizer-console-page.tsx` | 淇敼 | overview/settings 涓枃鍖栵紙涓诲姙鏂硅鍥?璧涗簨姒傝/璧涗簨鍐呭/鏄剧ず閫夐」/淇濆瓨鎸夐挳锛?|
  | `src/app/console/races/new/page.tsx` | 淇敼 | 鍒涘缓璧涗簨椤典腑鏂囧寲锛堟帶鍒跺彴/璧涗簨鎺у埗鍙?鍒涘缓璧涗簨/杩斿洖璧涗簨鎺у埗鍙?璧涗簨琛ㄥ崟锛?|
  | `src/app/_components/console/organizer-chinese.test.tsx` | 鏂板 | 1 椤归獙鏀舵祴璇曪紙overview+settings 鍏ㄤ腑鏂囨爣棰橈級 |

## 2026-06-19 鍏紑鍏ュ彛 / Live Hall / 澶у睆鍦ㄧ嚎鎬佹敹鍙?

- `src/lib/viewer-access.ts`
  - 棣栭〉椤堕儴鍏紑鍏ュ彛鏀逛负 public-first锛氭湭鐧诲綍鐢ㄦ埛浠嶈蛋 `/login`锛屽凡鐧诲綍鐢ㄦ埛涓嶅啀鎶婁富鍏ュ彛鐩存帴鏇挎崲鎴愭硾鍖栫殑鈥滆繘鍏ユ帶鍒跺彴鈥濄€?
  - `Console` 鍏ュ彛鏀逛负鎸夊疄闄呭彲璁块棶鍒嗗尯鏄剧ず锛屽彧瀵规湁鍙敤 Console section 鐨勭敤鎴蜂繚鐣欐绾у叆鍙ｃ€?
- `src/app/_components/public/public-header.tsx`
  - 鏀规垚鍏紑鍏ュ彛涓?Console 娆＄骇鍏ュ彛骞跺瓨鐨勭粨鏋勩€?
- `src/app/login/page.tsx`
  - 绉婚櫎鐧诲綍椤典腑鐨?seed/demo 璐﹀彿灞曠ず闈㈡澘銆?
- `src/app/_components/public/live-hall.tsx`
  - 澶у睆鏀逛负鐩存帴鍑虹幇鍦?Live Hall 椤堕儴銆?
  - 鍏紑椤典笉鍐嶇洿鎺ユ毚闇测€滄墦寮€澶у睆鎺у埗鍙扳€濋摼鎺ョ粰鏅€氳浼椼€?
- `src/app/JumbotronInline.tsx`
  - 浠庣偣鍑诲睍寮€寮忛瑙堟敼涓虹洿鎺ュ唴宓屽睍绀哄ぇ灞忋€?
- `src/lib/services/race-snapshot.ts`
  - 琛ラ綈 session 鐨?`lastActiveAt` / `updatedAt` 鏁版嵁渚涘ぇ灞?freshness 浣跨敤銆?
- `src/lib/jumbotron/adapter.ts`
  - 澶у睆鍦ㄧ嚎鎬佷笉鍐嶄紭鍏堜緷璧栨棫 leaderboard 鏃堕棿鎴筹紝鑰屾槸浼樺厛璇诲彇鏈€杩?session 娲诲姩鏃堕棿锛岄伩鍏嶉€夋墜鍦ㄧ嚎鏃堕┈鍖瑰垰杩涘満灏辨樉绀?`zzz`銆?
- `src/app/jumbotron/[raceId]/JumbotronClient.tsx`
  - 鍙充笂瑙掑湪绾挎暟鏀逛负鍜岃禌閬撲笂瀹為檯鍙備笌鐘舵€佸垽瀹氫娇鐢ㄥ悓涓€濂?freshness 鍙ｅ緞锛岄伩鍏嶅嚭鐜伴┈鍖规暟鍜?`鍦ㄧ嚎 x/x` 涓嶄竴鑷淬€?
- `src/app/jumbotron/[raceId]/page.tsx`
  - 鍏ㄥ睆澶у睆鎭㈠涓哄彲鍦ㄥ鍦?live race 涔嬮棿婊氬姩鍒囨崲鐨勫叆鍙ｏ紝涓嶅啀鍙浐瀹氬崟鍦烘覆鏌撱€?
- `src/lib/viewer-access.ts`
  - 棣栭〉椤堕儴鐧诲綍涓诲叆鍙ｆ枃妗堟敼鍥炲彲鐞嗚В鐨勭櫥褰曞叆鍙ｏ紝涓嶅啀鏄剧ず璇鎬х殑鈥滆繑鍥炲叕寮€绔欌€濄€?
- 楠岃瘉
  - `node --import tsx --test src/lib/viewer-access.test.ts src/lib/services/adapter-freshness-convergence.test.ts`
  - 浠呭仛闈欐€侀€昏緫楠岃瘉锛屼笉瀵?UI 娓叉煋鍋氳嚜鍔ㄥ寲娴嬭瘯
  - 鑷姩鍖栵細13/13 鍏ㄩ儴閫氳繃锛坴iewer-access 11 椤?+ adapter-freshness 2 椤癸級
  - 鏂板 `src/lib/services/adapter-freshness-convergence.test.ts` 瑕嗙洊 session 鏃堕棿浼樺厛绾э紙`lastActiveAt` > `updatedAt` > `entry.createdAt`锛夊拰 `resolveMotionState` stale 妫€娴?
  - 闇€鎵嬪姩楠屾敹 12 椤癸細鐧诲綍椤?seed/demo 绉婚櫎 (M-1~M-3)銆佸鍦鸿禌浜嬫粴鍔ㄥ垏鎹?(M-4)銆佸洖閫€鍗曞満 (M-5)銆佸湪绾挎暟璧涢亾涓€鑷存€?(M-6)銆乣force-dynamic` 閰嶇疆 (M-7)銆丣umbotronInline 鍐呭祵椤堕儴 (M-8)銆佹棤澶у睆鎺у埗鍙板叆鍙?(M-9)銆乣race-snapshot.ts` 鏃堕棿瀛楁 (M-10~M-11)銆乣STALE_THRESHOLD_MS` 闃堝€?(M-12)

## 2026-06-19 鐧诲綍鍏ュ彛 / 鎶ュ悕鍏ュ彛 / 鎺у埗鍙板叆鍙ｆ敹鍙?

- `src/lib/viewer-access.ts`
  - 鍏紑绔欎富鍏ュ彛鍥炲埌韬唤鍏ュ彛璇箟锛屼笉鍐嶆妸宸茬櫥褰曠敤鎴烽粯璁ゅ鍚?`/console`銆?
  - `Console` 鍏ュ彛缁х画鍙寜鍙闂垎鍖哄崟鐙樉绀恒€?
- `src/app/_components/public/public-header.tsx`
  - 淇濇寔鍏紑鍏ュ彛涓庢帶鍒跺彴鍏ュ彛鍙岃建鏄剧ず锛岄伩鍏嶆妸涓よ€呮贩鎴愬悓涓€涓寜閽€?
- `src/app/login/page.tsx`
  - 鐧诲綍椤垫敼鎴愬叕寮€韬唤鍏ュ彛璇存槑锛屾槑纭尯鍒嗛獞鎵嬫敞鍐屼笌瑙掕壊鎺у埗鍙版潈闄愩€?
- `src/app/_components/ary-shared.tsx`
  - 鐧诲綍 / 娉ㄥ唽 tab 涓?auth hero 鏂囨鏀规垚涓枃骞跺榻?`grs003` 瑙掕壊璇箟銆?
- `src/app/_components/public/home-gallery.tsx`
  - 棣栭〉琛屽姩鍏ュ彛鏀规垚鈥滈獞鎵嬫敞鍐?/ 鐧诲綍鈥濅笌鈥滄煡鐪嬭禌浜嬪苟鎶ュ悕鈥濈殑涓ゆ璺緞銆?
- `src/app/_components/public/race-page.tsx`
  - 鎶ュ悕闃舵 CTA 鏀规垚鐪熷疄鐨勫叕寮€鎶ュ悕椤靛叆鍙ｏ紝涓嶅啀鍙槸鎶婃寜閽枃妗堟敼鎴愨€滅櫥褰曞悗鎶ュ悕鈥濄€?
- `src/app/_components/public/race-register-page.tsx`
  - 鏂板鍏紑鎶ュ悕椤佃鍥撅紝鎸夋湭鐧诲綍 / 闈?Rider / 宸叉姤鍚?/ 鍙洿鎺ユ姤鍚嶅洓绉嶇姸鎬佺粰鍑虹湡瀹炴壙鎺ャ€?
  - 姣旇禌寮€濮嬪悗浼樺厛鏀捐鈥滆禌鍓嶅凡鎶ュ悕鈥濈殑 Rider 缁х画杩涘叆宸ヤ綔鍙帮紝涓嶅啀琚粺涓€鎸℃垚鈥滃綋鍓嶄笉鍙姤鍚嶁€濄€?
- `src/app/races/[raceSlug]/register/page.tsx`
  - 鏂板璧涗簨鍏紑鎶ュ悕璺敱锛岀湡姝ｆ壙鎺ュ叕寮€绔欐姤鍚嶆寜閽€?
- `src/app/actions.ts`
  - 鐧诲綍 / 娉ㄥ唽鍔ㄤ綔鏀寔 `returnTo` 鍥炶烦锛屾湭鐧诲綍鐢ㄦ埛鍙湪韬唤鍏ュ彛瀹屾垚鍚庤繑鍥炲師璧涗簨鎶ュ悕椤电户缁祦绋嬨€?
- `src/app/login/page.tsx`
  - `/login` 鏀寔鎺ユ敹 `returnTo`锛岀敤浜庝粠鍏紑鎶ュ悕椤佃烦杞埌韬唤鍏ュ彛鍚庡啀鍥炲埌鍘熼〉闈㈢户缁祦绋嬨€?
- `src/app/_components/ary-shared.tsx`
  - `AuthTabsPanel` / `AuthForm` 鏀寔閫忎紶 `returnTo`锛岀櫥褰曚笌楠戞墜娉ㄥ唽閮借兘鍥炶烦鍒版潵婧愰〉闈€?
- `src/app/_components/public/home-gallery.tsx`
  - 棣栭〉鍏紑 CTA 浠庢硾鍖栫殑鈥滄煡鐪嬭禌浜嬪苟鎶ュ悕鈥濇敹鍙ｄ负閫氬悜鐪熷疄鎶ュ悕閾捐矾鐨勨€滄煡鐪嬭禌浜嬫姤鍚嶉〉鈥濄€?
- `src/app/_components/public/race-page.tsx`
  - 鎶ュ悕闃舵 CTA 鏀规垚鐪熷疄鐨勫叕寮€鎶ュ悕椤靛叆鍙ｏ紝涓嶅啀鍙槸鎶婃寜閽枃妗堟敼鎴愨€滅櫥褰曞悗鎶ュ悕鈥濄€?
- `src/app/_components/public/race-register-page.tsx`
  - 鏂板鍏紑鎶ュ悕椤佃鍥撅紝鎸夋湭鐧诲綍 / 闈?Rider / 宸叉姤鍚?/ 鍙洿鎺ユ姤鍚嶅洓绉嶇姸鎬佺粰鍑虹湡瀹炴壙鎺ャ€?
  - 姣旇禌寮€濮嬪悗浼樺厛鏀捐鈥滆禌鍓嶅凡鎶ュ悕鈥濈殑 Rider 缁х画杩涘叆宸ヤ綔鍙帮紝涓嶅啀琚粺涓€鎸℃垚鈥滃綋鍓嶄笉鍙姤鍚嶁€濄€?
  - 姣旇禌寮€濮嬪悗鏈姤鍚嶇敤鎴锋槑纭樉绀衡€滄姤鍚嶅凡鎴鈥濓紝鍚屾椂璇存槑璧涘墠宸叉姤鍚嶉獞鎵嬩粛鍙户缁繘鍏ヨ嚜宸辩殑宸ヤ綔鍙般€?
- `src/app/races/[raceSlug]/register/page.tsx`
  - 鏂板璧涗簨鍏紑鎶ュ悕璺敱锛岀湡姝ｆ壙鎺ュ叕寮€绔欐姤鍚嶆寜閽€?
- `src/app/_components/console/rider-console-page.tsx`
  - Rider 鏈姤鍚嶆€佹槑纭负绗簩姝ワ細杩涘叆宸ヤ綔鍙板悗鍐嶅褰撳墠璧涗簨鎻愪氦姝ｅ紡鎶ュ悕銆?
- `src/lib/viewer-access.test.ts`
  - 鏇存柊鍏紑韬唤鍏ュ彛涓庢帶鍒跺彴鍏ュ彛鍒嗙鍚庣殑鏂█銆?
- `src/app/_components/public/race-register-page.test.tsx`
  - 鏂板鍏紑鎶ュ悕椤垫祴璇曪紝瑕嗙洊鍖垮悕鐢ㄦ埛鍥炶烦銆丷ider 鐩存帴鎶ュ悕銆佸凡鎶ュ悕鐢ㄦ埛缁х画杩涘叆宸ヤ綔鍙般€佹瘮璧涗腑闃绘鏂版姤鍚嶇瓑璺緞銆?
- 杩愯鏈熸牳瀵?
  - `GET /login` 杩斿洖 `200 OK`锛屾湇鍔＄宸茶緭鍑哄畬鏁撮〉闈?HTML锛屼笉鏄┖璺敱涔熶笉鏄?404銆?
- 楠岃瘉
  - `node --import tsx --test src/lib/viewer-access.test.ts`
  - `node --import tsx --test src/lib/viewer-access.test.ts src/app/_components/public/race-page.test.tsx src/app/_components/public/home-copy.test.tsx src/app/_components/public/copy-sanity.test.tsx src/app/_components/console/rider-console-page.test.tsx`
  - `node --import tsx --test src/lib/viewer-access.test.ts src/app/_components/public/race-page.test.tsx src/app/_components/public/race-register-page.test.tsx src/app/_components/public/home-copy.test.tsx src/app/_components/public/copy-sanity.test.tsx src/app/_components/console/rider-console-page.test.tsx`
  - `node --import tsx --test src/app/_components/public/race-register-page.test.tsx src/app/_components/public/race-page.test.tsx src/app/_components/console/rider-console-page.test.tsx`

## 褰撳墠楠岃瘉璇佹嵁

### 杩囩▼鎶曞奖鏀跺彛 鈥?缁熶竴楠屾敹锛?8 椤瑰叏閮ㄩ€氳繃锛?

  杩愯鍛戒护锛堜笁濂楁祴璇曚竴骞跺彂璧凤級锛?

  ```bash
  node --import tsx --test \
    src/lib/services/projections-convergence.test.ts \
    src/lib/jumbotron-adapter.test.ts \
    src/app/_components/public/live-hall.test.tsx
  ```

  | 楠屾敹鍔熻兘鐐?| 娴嬭瘯鏍囪瘑 | 楠岃瘉缁撹 |
  |---|---|---|
  | **A. adapter 涓嶅啀浼€犻獞琛屾秷鎭?* | `[A-01]` 鏃犵湡瀹炴秷鎭簮 鈫?绌烘暟缁?| 鉁?闆舵潯浼€犳秷鎭?|
  | | `[A-02]` feedback 鏉ユ簮姝ｇ‘ | 鉁?娑堟伅鍐呭 = 鐪熷疄 feedback |
  | | `[A-03]` SCREEN_FEED projection 浼樺厛 | 鉁?source = projection |
  | | `[A-04]` session latestActivity 鍚庡 | 鉁?鍚庡婧愬彲鐢?|
  | **B. adapter 涓嶅啀浼€犱綆椋庨櫓鎻愰啋** | `[B-01]` 鏃犻闄╂簮 鈫?绌烘暟缁?| 鉁?闆舵潯浼€犻闄╅」 |
  | | `[B-02]` FAILED 鈫?risk item | 鉁?severity=medium |
  | | `[B-03]` antiCheatPenalty 鈫?violation | 鉁?璇卞璇嶆娴嬬敓鏁?|
  | **C. KPI 浼樺厛 Registration** | `[C-01]` onlineRiders/activeRiders 鏉ユ簮 | 鉁?Registration锛岄潪 leaderboard |
  | | `[C-02]` 鏃?Registration 鍥為€€ teams | 鉁?鍏煎鍥為€€璺緞 |
  | | `[C-03]` Session token 浼樺厛 Archive | 鉁?totalTokens=Session 鎬诲拰 |
  | | `[C-04]` roster 鏉ヨ嚜 registration | 鉁?entryId=reg id |
  | | `[C-05]` costTokens 瀛楁鏉ユ簮 | 鉁?Session tokenCost |
  | **D. projections helper** | `[D-01]` EVENT_STREAM 缁撴瀯 | 鉁?items + raceId |
  | | `[D-02]` EVENT_STREAM risk 鏉＄洰 | 鉁?type=risk, severity=warning |
  | | `[D-03]` EVENT_STREAM 鎺掑簭 | 鉁?createdAt 闄嶅簭 |
  | | `[D-04]` LEADERBOARD progress 鎺掑簭 | 鉁?progressPercent 闄嶅簭 |
  | | `[D-05]` LEADERBOARD tokenCost 鎺掑簭 | 鉁?浣?token 鎺掑墠 |
  | | `[D-06]` LEADERBOARD username 鎺掑簭 | 鉁?瀛楁瘝搴?|
  | | `[D-07]` RACE_PROGRESS 缁村害瀹屾暣 | 鉁?5 缁村害榻愬叏 |
  | | `[D-08]` REGISTRATION_STATUS 瀛楁 | 鉁?鎺ュ叆鐘舵€佸瓧娈靛畬鏁?|
  | | `[D-09]` SCREEN_FEED 缁撴瀯 | 鉁?items + raceId |
  | **E. session 杩囩▼鏁版嵁浼樺厛** | session tokenCost 浼樺厛 Archive | 鉁?姝ｇ‘鑱氬悎 |
  | | caProvider 浼樺厛 CAConnection.caType | 鉁?codex/claude 鍖哄垎 |
  | | lastMessage 浼樺厛 session latestActivity | 鉁?鐪熷疄杩囩▼娑堟伅 |
  | | progress 浼樺厛 CURRENT_LEADERBOARD | 鉁?鎶曞奖杩涘害椹卞姩 |
  | | 闆?progress 鍗犱綅涓嶅帇濉屾暣鎵硅禌杞︿綅缃?| 鉁?鍒嗘暟鍒嗗竷椹卞姩 |
  | | registration 瀛樺湪鏃?entryId 鐢?reg id | 鉁?涓嶅洖钀?team id |
  | **F. 鍏紑绔?live-hall 娓叉煋** | `[LH-1]` CURRENT_LEADERBOARD 娓叉煋鎺掑悕涓庤繘搴?| 鉁?DOM 杈撳嚭姝ｇ‘ |
  | | `[LH-2]` 涓嶅洖閫€ legacy leaderboardEntries | 鉁?鏃ф暟鎹笉姹℃煋椤甸潰 |
  | | `[LH-3]` EVENT_STREAM_READ_MODEL 娓叉煋 | 鉁?SCREEN_FEED 涓嶆贩鍏?|
  | | `[LH-4]` 涓枃鏍囬涓庢寜閽敹鍙?| 鉁?鏃犺嫳鏂囨畫鐣?|
  | **杈圭晫寮傚父** | `[Edge-01]` 绌?registrations + 绌?teams | 鉁?杩斿洖绌烘暟缁勪笉宕╂簝 |
  | | `[Edge-02]` projection 澶氫綑瀛楁 | 鉁?涓嶅奖鍝嶈В鏋?|
  | | `[Edge-03]` projection JSON 瑙ｆ瀽澶辫触 | 鉁?鍥為€€涓嶅穿婧?|
  | | `[Edge-04]` 鍏ㄩ儴 projection 缂哄け涓嶅穿婧?| 鉁?绌烘€佹甯?|
  | **缁煎悎楠屾敹** | 鏃犵湡瀹炴潵婧愰浂鏉′吉鏁版嵁 | 鉁?messages=0, items=0 |
  | | Registration 浼樺厛鍚庡閾捐矾 | 鉁?Session token > Archive |
  | | EVENT_STREAM_READ_MODEL 浜у嚭 | 鉁?items > 0 |

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 | 鍏宠仈楠屾敹鐐?|
  |---|---|---|---|
  | `src/lib/jumbotron/adapter.ts` | 淇敼 | `generateMessages()` 浼樺厛璇?SCREEN_FEED projection / session latestActivity / feedback锛屼笉鍐嶇敓鎴?mock 鐭銆?| A |
  | | 淇敼 | `generateAttentionItems()` 妫€鏌?CA ingestion FAILED 鍜?antiCheatPenalty锛屾棤鐪熷疄鏉ユ簮鏃惰繑鍥炵┖鏁扮粍銆?| B |
  | | 淇敼 | `calculateKPIs()` 浼樺厛鎸?`Registration.count 鈫?RaceProject.aggregateIngestionStatus` 缁熻 onlineRiders / activeRiders / cockpits锛汼ession tokenCost 浼樺厛浜?TeamArchive銆?| C |
  | | 淇敼 | `mapToRacingEntries()` roster 浼樺厛鍙栬嚜 Registration锛沜ostTokens / caProvider / lastMessage 浼樺厛鍙栬嚜 CA Session锛涙暣鎵归浂 progress 鍗犱綅涓嶅帇濉岃禌杞︿綅缃€?| C, E |
  | `src/lib/services/projections.ts` | 鏂板 | 鏂板 `rebuildRaceProcessProjections()`锛屼骇鍑?7 绫?Projection锛岄€氳繃 `projection.upsert()` 鍐欏叆鏁版嵁搴撱€?| D |
  | `src/lib/evidence-projection-helpers.ts` | 鏂板 | 鏂板 5 涓姇褰辨暟鎹瀯閫犲嚱鏁帮紝鏀拺 projections.ts 鐨勬暟鎹粍瑁呫€?| D |
  | `src/app/_components/public/live-hall.tsx` | 鏂板 | `LiveHallView` 缁勪欢璇诲彇 6 绫绘姇褰憋紝杩囩▼姒滃崟涓嶅洖钀?leaderboardEntries銆?| F |
  | `src/lib/jumbotron-adapter.test.ts` | 鎵╁睍 | 17 椤瑰洖褰?+ 鏈鏂板娴嬭瘯銆?| A~E |
  | `src/app/_components/public/live-hall.test.tsx` | 鏂板 | 4 椤规覆鏌撴祴璇曪細杩囩▼姒滄覆鏌撱€佷笉鍥為€€鏃ф暟鎹€佷簨浠舵祦娓叉煋銆佷腑鏂囩晫闈€?| F |
  | `src/lib/services/projections-convergence.test.ts` | 鏂板 | 27 椤归獙鏀舵祴璇曪紝瑕嗙洊 A~E 鍏ㄩ儴鍔熻兘鐐瑰強杈圭晫寮傚父銆?| A~Edge |

### 鍏紑缁撴灉閾炬敹鍙?鈥?楠屾敹锛?2 椤瑰叏閮ㄩ€氳繃锛?

  杩愯鍛戒护锛?

  ```bash
  # 绾嚱鏁?
  node --import tsx --test src/lib/services/results-chain-convergence.test.ts
  # 缁勪欢娓叉煋
  node --import tsx --test src/app/_components/public/results-page.test.tsx src/app/_components/public/review-page.test.tsx src/app/_components/public/work-page.test.tsx src/app/_components/public/rider-profile-page.test.tsx src/app/_components/public/works-page.test.tsx
  ```

  | 楠屾敹鍔熻兘鐐?| 娴嬭瘯鏍囪瘑 | 楠岃瘉缁撹 |
  |---|---|---|
  | **A. results 绾嚱鏁?* | `[R-01]~[R-04]` Award 鏍囩鏄犲皠 | 鉁?4 绉嶆槧灏勬纭?|
  | | `[R-05]~[R-07]` 璇勫璇勮 Skill 鎺ㄦ柇 | 鉁?3 绉嶆帹鏂纭?|
  | | `[R-08]~[R-09]` 鍘婚噸閫昏緫 | 鉁?姝ｅ父+绌烘暟缁?|
  | **B. results-page** | 濂栭」姒滃崟+浣滃搧+浜偣+璇勫鍏ュ彛 | 鉁?鍏ㄩ儴鍖哄煙娓叉煋 |
  | | `/works/` 閾炬帴鍛堢幇 | 鉁?鍙叕寮€璺宠浆 |
  | | 鏃犲椤圭┖鎬?| 鉁?涓枃鎻愮ず |
  | **C. review-page** | 璇勫鎬荤粨+璇佹嵁鎽樿+璇勫瑙傜偣 | 鉁?鍏ㄩ儴鍖哄煙娓叉煋 |
  | | 鏃犳暟鎹┖鎬?| 鉁?鑾峰璇存槑绌烘€?|
  | **D. work-page** | 鏍囬+浣滆€?鎶€鏈鏄?璇勫+濂栭」 | 鉁?鍏ㄩ儴鍖哄煙娓叉煋 |
  | **E. rider-profile** | 涓汉淇℃伅+Skill Tag+鎬ц兘鎽樿 | 鉁?鍏ㄩ儴鍖哄煙娓叉煋 |
  | | 鏃犳暟鎹┖鎬?| 鉁?鍙傝禌璁板綍绌烘€?|
  | **F. works-page** | 璧涗簨涓婁笅鏂?浣滃搧鍗＄墖+濂栭」鏍囪瘑 | 鉁?鍏ㄩ儴鍖哄煙娓叉煋 |
  | | 鏃犱綔鍝佺┖鎬?| 鉁?涓枃鎻愮ず |

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 | 鍏宠仈楠屾敹鐐?|
  |---|---|---|---|
  | `src/lib/services/results.ts` | 淇敼 | `mapAwardToSkillLabel()` / `inferSkillLabelFromJudgingComment()` / `dedupeHighlights()` 涓変釜绾嚱鏁版敼涓?export 浠ユ敮鎸佺嫭绔嬫祴璇曘€?| A |
  | | 鏂板 | `buildPublicResultsModel()` 鎸?`Award / Report / Work` 鑱氬悎鍏紑璧涙灉妯″瀷銆?| 缁煎悎 |
  | `src/lib/services/review.ts` | 鏂板 | `buildPublicReviewModel()` 鎸?`review_summary / Award / Evidence` 鑱氬悎澶嶇洏椤垫ā鍨嬨€?| C |
  | `src/lib/services/public-routes.ts` | 鏂板 | `getWorkBySlug()` / `getRiderBySlug()` 琛ラ綈 `techNotes` / `judgeComments` / `skillTags` / `performanceSummary`銆?| D~F |
  | `src/app/_components/public/results-page.tsx` | 鏂板 | `ResultsPageView` 娓叉煋濂栭」姒滃崟銆佽幏濂栦綔鍝併€侀獞琛屼寒鐐广€佽瘎瀹″叆鍙ｃ€?| B |
  | `src/app/_components/public/review-page.tsx` | 鏂板 | `ReviewPageView` 娓叉煋璇勫鎬荤粨銆佽幏濂栬鏄庛€佽瘎濮旇鐐广€佽瘉鎹憳瑕併€?| C |
  | `src/app/_components/public/work-page.tsx` | 鏂板 | `WorkPageView` 娓叉煋浣滃搧璧勪骇銆佹妧鏈鏄庛€佽瘎濮旂偣璇勩€佸椤逛俊鎭€?| D |
  | `src/app/_components/public/rider-profile-page.tsx` | 鏂板 | `RiderProfileView` 娓叉煋涓汉淇℃伅銆丼kill Tag銆佹€ц兘鎽樿銆佸弬璧涜褰曘€?| E |
  | `src/app/_components/public/works-page.tsx` | 鏂板 | `WorksPageView` 娓叉煋璧涗簨涓婁笅鏂?+ 浣滃搧鍗＄墖鍒楄〃銆?| F |
  | `src/lib/services/results-chain-convergence.test.ts` | 鏂板 | 9 椤圭函鍑芥暟楠屾敹娴嬭瘯銆?| A |

### 鎺у埗鍙板熀纭€璺嚎鏀跺彛 鈥?楠屾敹锛?9 椤瑰叏閮ㄩ€氳繃锛?

  杩愯鍛戒护锛?

  ```bash
  node --import tsx --test src/lib/services/console-routes-convergence.test.ts src/lib/viewer-access.test.ts src/app/_components/console/console-copy.test.tsx src/lib/services/console-routes.test.ts
  ```

  | 楠屾敹鍔熻兘鐐?| 娴嬭瘯鏍囪瘑 | 楠岃瘉缁撹 |
  |---|---|---|
  | **A. 4瑙掕壊浣撶郴** | `[CR-01]` normalizeRoles 鍘婚噸鎺掑簭杩囨护 | 鉁?ADMIN鈫扟UDGE鈫扥RGANIZER鈫扲IDER |
  | | `[CR-02]` hasRole 姝ｅ弽鍒ゆ柇 | 鉁?鍚?涓嶅惈姝ｇ‘ |
  | | `[CR-03]` parseRolesJson 鍚堟硶/闈炴硶/寰€杩?| 鉁?JSON瑙ｆ瀽+鍏滃簳 |
  | | `[CR-04]` serializeRoles 搴忓垪鍖?| 鉁?寰€杩斾竴鑷?|
  | **B. 鍏ュ彛鎺у埗** | getRoleCapabilities 5绉嶈鑹?| 鉁?鑳藉姏鏄犲皠姝ｇ‘ |
  | | getConsoleHomeSections | 鉁?鍚勮鑹叉澘鍧楀搴?|
  | | getConsoleDefaultHref | 鉁?榛樿璺敱姝ｇ‘ |
  | | getConsoleEntryTarget | 鉁?宸茬櫥褰?鏈櫥褰?|
  | | getCreateRacePageAccess | 鉁?ORGANIZER鍏佽 |
  | | getConsoleRaceViewAccess | 鉁?鍚玶ace鑼冨洿绾︽潫 |
  | | getConsoleScreenAccess | 鉁?ADMIN/ORGANIZER |
  | **C. 鍒楄〃璺敱** | rider console race list | 鉁?access=rider |
  | | judge console race list | 鉁?access=judge |
  | **D. 涓枃鍖栨覆鏌?* | screen console | 鉁?涓枃鏍囬 |
  | | judge console | 鉁?涓枃鏍囩 |
  | | console home | 鉁?涓枃鏂囨 |

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍏宠仈楠屾敹鐐?|
  |---|---|---|
  | `src/lib/user-roles.ts` | 鏂板 | A |
  | `src/lib/viewer-access.ts` | 鏂板 11 涓叆鍙ｆ帶鍒跺嚱鏁?| B |
  | `src/lib/services/console-routes.ts` | 鏂板璧涗簨/澶у睆鍒楄〃+slug瑙ｆ瀽 | C |
  | `src/app/_components/console/console-shell.tsx` | 鏂板 Shell + 5濂楀鑸父閲?| B |
  | `src/app/console/layout.tsx` | 鏂板鏍瑰竷灞€ | B |
  | `src/app/console/page.tsx` | 鏂板棣栭〉 | B |
  | `src/app/console/races/page.tsx` | 鏂板璧涗簨鎺у埗鍙板垪琛?| C |
  | `src/app/console/screen/page.tsx` | 鏂板澶у睆鎺у埗鍙板垪琛?| C |
  | `src/lib/services/console-routes-convergence.test.ts` | 鏂板 4 椤?| A |
  | `src/lib/services/console-routes.test.ts` | 淇 2 椤癸紙seed瑙ｈ€︼級 | C |

### Judge 鑼冨洿鏀跺彛 鈥?楠屾敹锛?3 椤瑰叏閮ㄩ€氳繃锛?

  杩愯鍛戒护锛?

  ```bash
  node --import tsx --test src/lib/services/judge-scope-convergence.test.ts
  ```

  | 楠屾敹鍔熻兘鐐?| 娴嬭瘯鏍囪瘑 | 楠岃瘉缁撹 |
  |---|---|---|
  | **A. Judge 瑙掕壊鑳藉姏** | `[JS-01]` getRoleCapabilities | 鉁?canJudge=true, 鏃燼dmin/manage |
  | | `[JS-02]` getConsoleHomeSections | 鉁?races 鏉垮潡 |
  | | `[JS-03]` getConsoleDefaultHref | 鉁?/console/races |
  | **B. isRaceJudge 鍑嗗叆** | `[JS-04]` true鈫掑厑璁?| 鉁?allowed=true |
  | | `[JS-05]` false鈫掓嫆缁?| 鉁?redirect=/console/races |
  | | `[JS-06]` undefined鈫掓嫆缁?| 鉁?allowed=false |
  | **C. 瓒婃潈闃叉姢** | `[JS-07]` RIDER鈫掓嫆缁?| 鉁?涓嶅彲瓒婃潈 |
  | | `[JS-08]` ORGANIZER鈫掓嫆缁?| 鉁?涓嶅彲瓒婃潈 |
  | | `[JS-09]` JUDGE+ORGANIZER鈫掑厑璁?| 鉁?鍙岃鑹插彲鍏?|
  | | `[JS-10]` 鏈櫥褰曗啋/login | 鉁?redirect姝ｇ‘ |
  | **D. 缁撴瀯绾﹀畾** | `[JS-11]` judgeConsoleSections | 鉁?3椤?|

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍏宠仈楠屾敹鐐?|
  |---|---|---|
  | `src/lib/services/console-routes.ts` | 淇敼 | 鎸?JudgeAssignment 杩囨护 | A |
  | `src/lib/viewer-access.ts` | 淇敼 | isRaceJudge 鍑嗗叆 | B, C |
  | `src/app/console/races/[raceSlug]/page.tsx` | 鏂板 | 鍏ュ彛椤?judge 璺宠浆 | B |
  | `src/app/console/races/[raceSlug]/judge/[section]/page.tsx` | 鏂板 | section 椤典簩娆℃牎楠?| B |
  | `src/lib/services/judge-scope-convergence.test.ts` | 鏂板 13 椤?| A~D |

### Submission registration-first 鏀跺彛 鈥?楠屾敹锛?8 椤瑰叏閮ㄩ€氳繃锛?

  杩愯鍛戒护锛?

  ```bash
  node --import tsx --test src/lib/services/submission-registration-first.test.ts
  ```

  | 楠屾敹鍔熻兘鐐?| 娴嬭瘯鏍囪瘑 | 楠岃瘉缁撹 |
  |---|---|---|
  | **A. Agent 鏍囩鏄犲皠** | `[SF-01]~[SF-07]` 7 绉嶇被鍨?| 鉁?鍏ㄩ儴姝ｇ‘鍚厹搴?|
  | **B. 姣旇禌涓彁浜?Schema** | `[SF-08]` 姝ｅ父鎺ュ彈 | 鉁?涓嶅惈 Riding Record |
  | | `[SF-09]` 鎷掔粷闈?.ts/.js | 鉁?鍚庣紑鏍￠獙 |
  | | `[SF-10]` 鎷掔粷绌轰唬鐮?| 鉁?鍐呭鏍￠獙 |
  | | `[SF-14]` 涓嶅惈 recordLabel 瀛楁 | 鉁?璧涘悗瀛楁鍓ョ |
  | | `[SF-15]` 鎷掔粷闈炴硶 tokenUsed | 鉁?鏁板瓧鏍￠獙 |
  | **C. 璧涘悗鎻愪氦 Schema** | `[SF-11]` 鎺ュ彈鍚?Riding Record | 鉁?recordLabel+ridingRecord |
  | | `[SF-12]` 鎷掔粷绌?Riding Record | 鉁?蹇呭～鏍￠獙 |
  | **D. 閿欒璇箟** | `[SF-13]` registration-first 鎺緸 | 鉁?涓汉鎶ュ悕/鎻愪氦瀹瑰櫒/姣旇禌闃舵 |

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍏宠仈楠屾敹鐐?|
  |---|---|---|
  | `src/lib/services/submissions.ts` | 淇敼 | 鍏堟煡 Registration 鍐嶆煡鍏煎 team | A~D |
  | `src/lib/services/rider-bridge.ts` | 鏂板 | 鍏煎灞傛煡璇?| B, C |
  | `src/lib/services/submission-registration-first.test.ts` | 鏂板 18 椤?| A~D |

### Rider Console 璇箟鏀跺彛 鈥?楠屾敹锛? 椤瑰叏閮ㄩ€氳繃锛?

  杩愯鍛戒护锛?

  ```bash
  node --import tsx --test src/app/_components/console/rider-console-semantics.test.tsx
  ```

  | 楠屾敹鍔熻兘鐐?| 楠岃瘉缁撹 |
  |---|---|
  | 6 section 鍏ㄤ腑鏂囷細鎶ュ悕/浣滃搧鎻愪氦/璇勫缁撴灉/楠戞墜鎶ュ憡/CA 鎺ュ叆/楠戣鐘舵€?| 鉁?|
  | 涓嶆毚闇?compatibility 灞傛枃妗?| 鉁?|
  | report 鍖哄潡涓嶆毚闇茶繃娓″眰锛圱ransitional/Highlight锛?| 鉁?|
  | 璧涗簨涓婁笅鏂囧缁堜繚鐣欏湪褰撳墠椤甸潰 | 鉁?|

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 |
  |---|---|
  | `src/lib/services/rider-console.ts` | 鏂板 buildRiderConsoleReportModel |
  | `src/app/_components/console/rider-console-page.tsx` | 淇敼 6 section 璇箟 |
  | `src/app/_components/console/rider-console-semantics.test.tsx` | 鏂板 3 椤?|

### Admin Console 涓枃鍖栨敹鍙?鈥?楠屾敹锛? 椤瑰叏閮ㄩ€氳繃锛?026-06-20 鎵╁睍鑷?4 section锛?

  杩愯鍛戒护锛歚node --import tsx --test src/app/_components/console/admin-console-chinese.test.tsx`

  | 楠屾敹鍔熻兘鐐?| 楠岃瘉缁撹 |
  |---|---|
  | 3 section锛氱敤鎴峰垪琛?璧勬枡琛ュ叏/瑙掕壊缁存姢 (+ 2026-06-20 鏂板鍔炶禌鐢宠瀹℃牳) | 鉁?鍏ㄤ腑鏂?|
  | 4 瑙掕壊鏍囩锛氱鐞嗗憳/璇勫/涓诲姙鏂?楠戞墜 | 鉁?鏃犺嫳鏂囨畫鐣?|
  | 璧勬枡鐘舵€侊細宸茶ˉ鍏?寰呰ˉ鍏?| 鉁?鍏ㄤ腑鏂?|
  | 瑙掕壊缁存姢鍚繚瀛樻寜閽?| 鉁?|
  | 鏈€灏忚处鍙锋不鐞嗚鏄?| 鉁?|

  | 鏂囦欢 | 鎿嶄綔 |
  |---|---|
  | `src/app/_components/console/admin-console-page.tsx` | 涓枃鍖?|
  | `src/app/console/admin/[section]/page.tsx` | 涓枃鍖?|
  | `src/app/_components/console/admin-console-chinese.test.tsx` | 鏂板 3 椤?|

### Live Hall & Race Page 涓枃鍖栨敹鍙?鈥?楠屾敹锛? 椤瑰叏閮ㄩ€氳繃锛?

  杩愯鍛戒护锛歚node --import tsx --test src/app/_components/public/race-live-chinese.test.tsx`

  | 楠屾敹鍔熻兘鐐?| 楠岃瘉缁撹 |
  |---|---|
  | live-hall 12 椤逛腑鏂囷細瀹炲喌澶у巺/杩囩▼鎬昏/杩囩▼鎸囨爣/澶у睆鍏ュ彛/楠戞墜鍔ㄦ€?鎶ュ悕鐘舵€?褰撳墠姒滃崟/杩囩▼姒滃崟/浜嬩欢娴?鏈€杩戜簨浠?鎵撳紑澶у睆/鎵撳紑澶у睆鎺у埗鍙?| 鉁?|
  | race-page 10 椤逛腑鏂囷細鍏紑鍏ュ彛/鏌ョ湅浣滃搧/鏌ョ湅璧涙灉/鏌ョ湅澶嶇洏/鏌ョ湅鍚堜綔/杩斿洖璧涗簨鍒楄〃/璧涗簨姒傝/瑙勫垯璇存槑/璧涚▼瀹夋帓/鍙傝禌楠戞墜/涓嬩竴姝ュ叆鍙?鎶ュ悕鏃堕棿/姣旇禌鏃堕棿 | 鉁?|

  | 鏂囦欢 | 鎿嶄綔 |
  |---|---|
  | `src/app/_components/public/live-hall.tsx` | 涓枃鍖?|
  | `src/app/_components/public/race-page.tsx` | 涓枃鍖?|
  | `src/app/_components/public/race-live-chinese.test.tsx` | 鏂板 2 椤?|

### Organizer Console 涓枃鍖栨敹鍙?鈥?楠屾敹锛? 椤归€氳繃锛?

  杩愯鍛戒护锛歚node --import tsx --test src/app/_components/console/organizer-chinese.test.tsx`

  | 楠屾敹鍔熻兘鐐?| 楠岃瘉缁撹 |
  |---|---|
  | overview+settings锛氫富鍔炴柟瑙嗗浘/璧涗簨姒傝/璧涗簨鍐呭/鏄剧ず閫夐」/淇濆瓨鎸夐挳/涓嬩竴姝ュ叆鍙?| 鉁?鍏ㄤ腑鏂囨棤鑻辨枃 |

  | 鏂囦欢 | 鎿嶄綔 |
  |---|---|
  | `src/app/_components/console/organizer-console-page.tsx` | 涓枃鍖?|
  | `src/app/console/races/new/page.tsx` | 涓枃鍖?|
  | `src/app/_components/console/organizer-chinese.test.tsx` | 鏂板 1 椤?|

### 鍏紑鍏ュ彛 / Live Hall / 澶у睆鍦ㄧ嚎鎬佹敹鍙?鈥?楠屾敹锛?3 椤归€氳繃锛?

  浠呭仛闈欐€侀€昏緫楠岃瘉锛屼笉瀵?UI 娓叉煋鍋氳嚜鍔ㄥ寲娴嬭瘯銆?

  杩愯鍛戒护锛歚node --import tsx --test src/lib/viewer-access.test.ts src/lib/services/adapter-freshness-convergence.test.ts`

  | 楠屾敹鍔熻兘鐐?| 楠岃瘉缁撹 |
  |---|---|
  | **宸查獙璇?(鑷姩鍖?13 椤?** | |
  | `getPublicAuthAction` 鍖垮悕/宸茬櫥褰曟枃妗堝尯鍒?| 鉁?null 鈫?"鐧诲綍 / 娉ㄥ唽"锛屾湁瑙掕壊 鈫?"韬唤鍏ュ彛" |
  | 鐧诲綍鍏ュ彛涓嶅惈"杩斿洖鍏紑绔? | 鉁?涓嶅嚭鐜拌瀵兼€ф枃妗?|
  | `getConsoleEntryTarget` 鍒嗗尯鎺у埗 | 鉁?null 鈫?null锛屾湁瑙掕壊 鈫?/console |
  | `getConsoleHomeSections` 鍏ㄨ鑹茶鐩?| 鉁?7 绉嶇粍鍚堬紝鍚?null/绌烘暟缁?|
  | `getLoginRedirectTarget` / `getHomeRedirectTarget` | 鉁?宸茬櫥褰?鈫?/锛岄椤垫案杩滃叕寮€ |
  | `getCreateRacePageAccess` 缁勭粐鑰呴棬鎺?| 鉁?ORGANIZER 鍏佽锛孯IDER 鎷掔粷 |
  | `getConsoleRaceViewAccess` 瑙嗗浘瀹堝崼 | 鉁?organizer/rider/judge + 璧涗簨鑼冨洿 |
  | `getRoleCapabilities` 鑳藉姏鏄犲皠 | 鉁?organizer/rider/null 鑳藉姏鐭╅樀 |
  | `getConsoleAdminAccess` / `getConsoleScreenAccess` | 鉁?ADMIN/ORGANIZER 鎺у埗鍙拌竟鐣?|
  | `getConsoleDefaultHref` 瑙掕壊榛樿璺敱 | 鉁?ADMIN 鈫?users锛孫RGANIZER 鈫?races |
  | `getCreateRaceBackTarget` | 鉁?杩斿洖棣栭〉 / |
  | mapToRacingEntries session 鏃堕棿浼樺厛绾?| 鉁?`lastActiveAt` > `updatedAt` > `entry.createdAt` |
  | resolveMotionState stale 妫€娴?| 鉁?running/sprinting > 5min 鈫?stale |
  | **鏈獙璇?(鎵嬪姩楠屾敹 12 椤?** | |
  | `public-header.tsx` 鍙屽叆鍙ｅ苟瀛?| M-8 娴忚鍣ㄧ‘璁?|
  | `login/page.tsx` 绉婚櫎 seed/demo | M-1~M-3 娴忚鍣ㄧ‘璁?|
  | `live-hall.tsx` 澶у睆椤堕儴 + 闅愯棌鎺у埗鍙板叆鍙?| M-8~M-9 娴忚鍣ㄧ‘璁?|
  | `JumbotronInline.tsx` 鍐呭祵娓叉煋 | M-8 娴忚鍣ㄧ‘璁?|
  | `race-snapshot.ts` session 鏃堕棿瀛楁 | M-10~M-11 浠ｇ爜瀹℃煡 |
  | `JumbotronClient.tsx` 鍦ㄧ嚎鏁板彛寰勪竴鑷?| M-6 娴忚鍣ㄥ姣?|
  | `jumbotron/[raceId]/page.tsx` 澶氬満婊氬姩 | M-4~M-5, M-7 娴忚鍣?+ 浠ｇ爜瀹℃煡 |

  **淇敼浠ｇ爜娓呭崟**

  | 鏂囦欢 | 鎿嶄綔 | 鍙樻洿鎽樿 | 鍏宠仈楠屾敹鐐?|
  |---|---|---|---|
  | `src/lib/viewer-access.ts` | 淇敼 | `getPublicAuthAction()` public-first锛氬尶鍚嶁啋"鐧诲綍 / 娉ㄥ唽"锛屽凡鐧诲綍鈫?韬唤鍏ュ彛"锛屾棤"杩斿洖鍏紑绔? | 宸查獙璇?1-2 |
  | | 淇敼 | `getConsoleEntryTarget()` 浠呭鏈?Console section 鐨勭敤鎴疯繑鍥?/console | 宸查獙璇?3-4 |
  | `src/app/_components/public/public-header.tsx` | 淇敼 | 鍏紑鍏ュ彛涓?Console 娆＄骇鍏ュ彛骞跺瓨娓叉煋 | 鏈獙璇?|
  | `src/app/login/page.tsx` | 淇敼 | 绉婚櫎 seed/demo 棰勭疆璐﹀彿灞曠ず闈㈡澘锛涜繑鍥炴寜閽?杩斿洖鍏紑棣栭〉" | 鏈獙璇?|
  | `src/app/_components/public/live-hall.tsx` | 淇敼 | JumbotronInline 鐩存帴鍐呭祵椤堕儴锛涚Щ闄?鎵撳紑澶у睆鎺у埗鍙?鍏紑鏆撮湶 | 鏈獙璇?|
  | `src/app/JumbotronInline.tsx` | 淇敼 | 浠庣偣鍑诲睍寮€寮忛瑙堟敼涓虹洿鎺ュ唴宓?JumbotronClient | 鏈獙璇?|
  | `src/lib/services/race-snapshot.ts` | 淇敼 | Prisma select 澧炲姞 session.lastActiveAt/updatedAt 瀛楁 | 鏈獙璇?|
  | `src/lib/jumbotron/adapter.ts` | 淇敼 | `mapToRacingEntries()` updatedAt 浼樺厛 latestSession.lastActiveAt | 宸查獙璇?12 |
  | `src/app/jumbotron/[raceId]/JumbotronClient.tsx` | 淇敼 | 鍦ㄧ嚎鏁版敼鐢?resolveMotionState锛屼笌璧涢亾 stale 鍒ゅ畾鍚屼竴鍙ｅ緞 | 鏈獙璇?|
  | `src/app/jumbotron/[raceId]/page.tsx` | 淇敼 | 澶氬満 live race 鍙粴鍔ㄥ垏鎹紱鏃?live race 鍥為€€鍗曞満娓叉煋 | 鏈獙璇?|
  | `src/lib/viewer-access.test.ts` | 宸叉湁 | 瑕嗙洊璁块棶鎺у埗閫昏緫 (11 椤? | 宸查獙璇?1-11 |
  | `src/lib/services/adapter-freshness-convergence.test.ts` | 鏂板 | Session 鏃堕棿浼樺厛绾?+ resolveMotionState stale 妫€娴?(2 椤? | 宸查獙璇?12-13 |

- 鍏紑椤电浉鍏?
  - `node --import tsx --test src/app/_components/public/live-hall.test.tsx src/app/_components/public/race-page.test.tsx src/app/_components/public/results-page.test.tsx src/app/_components/public/review-page.test.tsx src/app/_components/public/work-page.test.tsx src/app/_components/public/rider-profile-page.test.tsx src/app/_components/public/works-page.test.tsx src/app/_components/public/home-copy.test.tsx src/app/_components/public/copy-sanity.test.tsx`
- 鎺у埗鍙扮浉鍏?
  - `node --import tsx --test src/app/_components/console/admin-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/console-copy.test.tsx src/app/console/races/new/page.test.tsx`
- 鏉冮檺涓庢湇鍔＄浉鍏?
  - `node --import tsx --test src/lib/viewer-access.test.ts src/lib/services/console-routes.test.ts src/lib/services/submissions.test.ts src/lib/services/rider-console.test.ts`

## 褰撳墠闃诲 / 鏈畬鎴愰」

- `docs/grs003` 鐨勫叏閮ㄨ姹傚皻鏈畬鍏ㄥ畬鎴愶紝褰撳墠鍙槸鍦ㄦ寔缁帹杩涙敹鍙ｃ€?
- GitHub OAuth 浠嶆湭鎺ュ叆锛屽綋鍓嶄粛鏄湰鍦拌处鍙?/ 瀵嗙爜浼氳瘽銆?
- `Team` 鍏煎灞備粛鐒跺瓨鍦紝娣卞眰 `teamId -> registrationId` 杩佺Щ灏氭湭瀹屾垚銆?
- `runner` 璺緞鍜?`CA Push + Fetch` 鐩爣涔嬮棿浠嶆湁宸窛銆?
- 闄?`status.md` 涔嬪锛屼粨搴撲腑浠嶆湁涓嶅皯鏃ф枃浠舵垨鏃у瓧绗︿覆鍙兘甯︽湁鍘嗗彶缂栫爜闂銆?
- 鏋勫缓闃舵瀛樺湪鐙珛鐜闂锛?
  - `src/lib/prisma.ts` 鍦?`production` 鍒嗘敮閲岀‖缂栫爜鍐欏叆 `/tmp/ary-runtime`銆?
  - 鍦ㄥ綋鍓?Windows 鐜涓嬩細鏄犲皠鍒?`C:\\tmp\\ary-runtime`锛屽鑷?`next build` 鐨勬煇浜涘満鏅嚭鐜?`EPERM: operation not permitted, mkdir 'C:\\tmp\\ary-runtime'`銆?
  - 杩欎笉鏄湰娆?`status.md` 缂栫爜淇寮曞叆鐨勯棶棰橈紝浣嗕細褰卞搷鍚庣画瀹屾暣鏋勫缓楠岃瘉銆?
- 鏈疆鏂板浣嗗皻鏈敹鍙ｇ殑闂锛?
  - `/.claude-login.html` 鍙槸鏈湴鎺掓煡 `/login` 杩斿洖 HTML 鏃剁敓鎴愮殑涓存椂鎶撳彇鏂囦欢锛屼笉鏄寮忎骇鍝侀〉闈紝涔熶笉浠ｈ〃鍏紑韬唤鍏ュ彛閾捐矾宸茬粡鐪熸璺戦€氥€?
  - 棣栭〉鈥滆韩浠藉叆鍙ｂ€濇寜閽綋鍓嶄粛鏈夋棤娉曟甯歌烦杞殑鐢ㄦ埛鍙嶉锛岃鏄庡叕寮€鐧诲綍鍏ュ彛閾捐矾杩樻病鏈夊畬鎴愮湡瀹為獙鏀躲€?
  - 褰撳墠鐧诲綍妯″瀷浠嶇劧鍋忓悜鈥滄墍鏈変汉閮藉彲浠ョ洿鎺ユ敞鍐?/ 鐧诲綍鏈湴璐﹀彿鈥濓紝灏氭湭鏀跺彛鍒?`grs003` 鏈熸湜鐨勬寮忚韩浠戒綋绯讳笌 OAuth 鏂规銆?
  - Console 瀹為檯鍑嗗叆閾捐矾浠嶉渶缁х画鏍稿疄锛涙寜褰撳墠鐢ㄦ埛鍙嶉锛屼粛瀛樺湪鈥滄帶鍒跺彴鍏ュ彛鍩烘湰鐣呴€氭棤闃汇€佽韩浠介獙璇佷笉绗﹀悎棰勬湡鈥濈殑闂锛屾病鏈夎揪鍒板彲楠屾敹鐘舵€併€?
  - 鍙傝禌閫夋墜鎻愪氦閾捐矾浠嶆湭瀹屾暣鎭㈠鍒板彲鐩存帴鎿嶄綔鐨勭姸鎬侊紱鍏紑鎶ュ悕銆丷ider 宸ヤ綔鍙般€佹彁浜ゅ叆鍙ｄ箣闂翠粛鏈夋柇鐐广€?
  - `/login` 铏界劧宸茶兘杩斿洖 `200` 涓庨〉闈?HTML锛屼絾娴忚鍣ㄧ浠嶅嚭鐜扳€滈〉闈㈢湅璧锋潵浠€涔堥兘娌℃湁鈥濈殑鐜拌薄锛岃鏄庡鎴风鏄剧ず / 璧勬簮缂撳瓨 / dev server 鐘舵€佷粛鏈夊緟缁х画鎺掓煡銆?

## 涓嬩竴姝ュ缓璁?

- 鍏堜慨 `src/lib/prisma.ts` 鐨勮繍琛屾椂鐩綍绛栫暐锛屾妸鐢熶骇鎬?SQLite 杩愯鐩綍鏀跺彛鍒板綋鍓嶅钩鍙板彲鍐欎綅缃€?
- 浼樺厛鎶婂叕寮€韬唤鍏ュ彛閾捐矾褰诲簳璺戦€氾細
  - 淇椤碘€滆韩浠藉叆鍙ｂ€濇寜閽烦杞紱
  - 鏍稿疄 `/login` 娴忚鍣ㄧ┖鐧介棶棰橈紱
  - 娓呯悊涓存椂鎺掓煡鏂囦欢濡?`/.claude-login.html`銆?
- 缁х画鏍稿疄骞惰ˉ榻愯鑹蹭笌鏉冮檺閾捐矾锛?
  - 涓嶆槸绠€鍗曗€滀换浣曚汉閮借兘鐧诲綍灏辫兘杩涙墍鏈夊彴鈥濓紱
  - 瑕侀噸鏂版牳瀵瑰叕寮€绔欍€丷ider銆丣udge銆丱rganizer銆丄dmin銆丼creen Console 鐨勭湡瀹炲噯鍏ャ€?
- 缁х画琛ラ綈鍙傝禌閫夋墜鐪熷疄鎿嶄綔閾捐矾锛氭姤鍚嶃€佽繘鍏?Rider 宸ヤ綔鍙般€佹彁浜や綔鍝併€佹煡鐪嬬粨鏋滐紝纭繚涓嶆槸鍙湁鎸夐挳鎴栨枃妗堣€屾槸鑳界湡瀹炴搷浣溿€?
- 缁х画鎵弿鐢ㄦ埛鍙鑻辨枃娈嬬暀锛屼紭鍏堝叕寮€椤靛拰 Organizer Console 鍏朵粬 section銆?
- 缁х画鎺ㄨ繘 `grs003` 娣卞眰璇箟杩佺Щ锛欸itHub OAuth銆丆A 鎺ュ叆閾撅紝浠ュ強鍏煎 `team` 閫€鍦恒€?


## 2026-06-19 鐧诲綍澹冲眰銆丷iders/Works 绱㈠紩椤典笌鍒涘缓璧涗簨琛ㄥ崟鏂囨娓呯悊
- `src/app/_components/ary-shared.tsx`
  - 鐧诲綍 / 娉ㄥ唽鍏ュ彛浠庤嫳鏂囨敼涓轰腑鏂囷細
  - `鐧诲綍`
  - `娉ㄥ唽`
  - `鐢ㄦ埛鍚峘
  - `瀵嗙爜`
  - `婕旂ず璐﹀彿`
  - `褰撳墠閲嶇偣`
  - Hero 涓绘爣棰樻敼涓?`鍏紑璧涘満锛岀鏈夎禌婧愩€俙
  - 鐧诲綍璇存槑鍜屾敞鍐岃鏄庝篃鏀跺彛涓轰腑鏂囷紝涓嶅啀鐩存帴鏆撮湶鑻辨枃鎺у埗鍙拌鏄庛€?
- `src/app/riders/page.tsx`
  - `Riders / Featured Riders` 鏀逛负锛?
  - `楠戞墜`
  - `绮鹃€夐獞鎵媊
- `src/app/works/page.tsx`
  - 鍘熼〉闈㈡贩鏈夎嫳鏂囨爣棰樺拰閿欒缂栫爜涓枃锛屽凡鏁撮〉閲嶅啓涓烘甯镐腑鏂囧叕寮€浣滃搧绱㈠紩锛?
  - `浣滃搧`
  - `鍏紑浣滃搧`
  - `璧涗簨涓婁笅鏂嘸
  - `绛涢€変笌鎺掑簭`
  - `浣滃搧鍗＄墖`
  - `绮鹃€変綔鍝乣
  - `杩斿洖璧涗簨鍒楄〃`
- `src/app/_components/create-race-form-client.tsx`
  - 鍘熻〃鍗曚腑鏈夊ぇ娈甸敊璇紪鐮佷腑鏂囷紝宸插湪淇濇寔瀛楁鍚嶃€佺粨鏋勫拰涓氬姟鍙傛暟涓嶅彉鐨勫墠鎻愪笅閲嶅啓涓哄彲璇讳腑鏂囥€?
  - 鏀跺彛鍚庣殑涓昏鍙鏂囨鍖呮嫭锛?
  - `璧涗簨鍚嶇О`
  - `璧涗簨绠€浠媊
  - `棰樼洰鍖呭悕绉癭
  - `棰樼洰鎻忚堪`
  - `璁粌鏁版嵁璇存槑`
  - `璇勬祴璇存槑`
  - `鍏抽敭璇峘
  - `鎶ュ悕寮€濮?/ 鎶ュ悕缁撴潫 / 姣旇禌寮€濮?/ 姣旇禌缁撴潫`
  - `鍒涘缓璧涗簨`
  - `閫夋嫨鏈湴棰樼洰鍖卄
  - `閫夋嫨鏈湴搴曞浘`
  - `褰撳墠搴曞浘棰勮`
- `src/app/_components/public/public-copy-cleanup.test.tsx`
  - 鏂板瀹氬悜娴嬭瘯锛岄攣瀹氾細
  - 鐧诲綍澹冲眰浣跨敤鍙涓枃
  - Riders / Works 绱㈠紩椤垫爣棰樹娇鐢ㄥ彲璇讳腑鏂?
  - 鍒涘缓璧涗簨琛ㄥ崟婧愮爜涓嶅啀鍖呭惈鍏稿瀷閿欒缂栫爜鏍囪
- 璇存槑
  - 杩欎竴杞粛鐒跺彧鍋氱敤鎴峰彲瑙佸眰鏂囨涓庣紪鐮佹竻鐞嗭紝涓嶆敼甯冨眬锛屼笉鏀瑰ぇ灞忔牱寮忥紝涓嶆敼鍒涘缓璧涗簨琛ㄥ崟瀛楁缁撴瀯鍜屾彁浜ゅ弬鏁般€?
- 楠岃瘉
  - `node --import tsx --test src/app/_components/public/public-copy-cleanup.test.tsx`
  - `cmd /c npm run build`


## 2026-06-19 Prisma 杩愯鏃剁洰褰曡法骞冲彴鏀跺彛
- `src/lib/prisma-runtime-paths.ts`
  - 鏂板璺ㄥ钩鍙拌繍琛屾椂鏁版嵁搴撹矾寰勮В鏋愰€昏緫銆?
  - 浠呭湪 `NODE_ENV=production` 涓?`VERCEL=1` 鏃跺惎鐢?runtime shadow copy銆?
  - Windows 涓嬩娇鐢ㄥ伐浣滃尯鍙啓鐩綍锛歚<cwd>/.tmp/ary-runtime/runtime.db`銆?
  - 闈?Windows 鐨?Vercel 鐢熶骇鐜缁х画浣跨敤 `/tmp/ary-runtime/runtime.db`銆?
- `src/lib/prisma.ts`
  - 涓嶅啀鐩存帴纭紪鐮?`/tmp/ary-runtime`锛屾敼涓鸿皟鐢ㄨ矾寰勮В鏋愬嚱鏁般€?
- `src/lib/prisma-runtime-paths.test.ts`
  - 鏂板 4 缁勫畾鍚戞祴璇曪紝瑕嗙洊 Windows銆侀潪 Windows銆侀潪鐢熶骇鐜鍜屾湰鍦?production build 闈?Vercel 鍦烘櫙銆?
- 楠岃瘉
  - `node --import tsx --test src/lib/prisma-runtime-paths.test.ts`
  - `cmd /c npm run build`

## 2026-06-19 old_version 閫夋墜閾捐矾鎭㈠杩涘睍

- 鍏紑棣栭〉琛屽姩鍏ュ彛宸叉寜褰撳墠鐪熷疄閾捐矾鏀跺彛锛?
  - `楠戞墜娉ㄥ唽 / 鐧诲綍`
  - `鏌ョ湅璧涗簨鎶ュ悕椤礰
  - 鐧诲綍鍚庨澶栨樉绀猴細
  - `缁х画鍙傝禌`
  - `鎻愪氦璧涘悗鏉愭枡`
- 棣栭〉涓?CTA 宸叉寜璧涗簨闃舵鍒囨崲涓虹湡瀹炵洰鏍囷細
  - 鎶ュ悕涓細`绔嬪嵆鎶ュ悕`
  - 鎶ュ悕缁撴潫锛歚鏌ョ湅璧涢`
  - 杩涜涓?/ 灏佹涓細`杩涘叆瀹炲喌澶у巺`
  - 宸茬粨鏉燂細`鏌ョ湅璧涙灉`
- 鍏紑鎶ュ悕椤靛凡鎴愪负姝ｅ紡鍏ュ彛锛?
  - 鏈櫥褰曠敤鎴蜂細璺冲幓 `/login?returnTo=...`
  - Rider 鍙洿鎺ユ姤鍚?
  - 宸叉姤鍚嶇敤鎴峰彲缁х画杩涘叆 Rider 宸ヤ綔鍙?
  - `preparation` 闃舵鏄庣‘涓嶅彲鏂版姤鍚?
- Rider 宸ヤ綔鍙颁腑鐨勪笁鏉℃牳蹇冮摼璺凡鍏ㄩ儴甯﹀洖娴佺洰鏍囷細
  - 姝ｅ紡鎶ュ悕鍚庡洖鍒?`rider/registration`
  - 璧涗腑鎻愪氦鍚庡洖鍒?`rider/submission`
  - 璧涘悗鎻愪氦鍚庡洖鍒?`rider/submission`
- 鐧诲綍椤靛凡鎭㈠婕旂ず璐﹀彿闈㈡澘銆?
- `old_version/` 宸蹭粠褰撳墠鏋勫缓涓帓闄わ紝涓嶅啀骞叉壈 `next build`銆?

### 鐪熷疄楠屾敹璇佹嵁

- 宸茬敤鐪熷疄鏈湴 Chrome 鑷姩鍖栬窇閫氳繃浠ヤ笅閾捐矾锛?
  - 鐧诲綍
  - 鎶ュ悕涓禌浜嬭繘鍏?Rider 宸ヤ綔鍙?
  - 杩涜涓禌浜嬫彁浜?
  - 宸茬粨鏉熻禌浜嬭禌鍚庢彁浜?
- 娴忚鍣ㄩ獙鏀跺悗锛屾暟鎹簱涓凡纭鍐欏叆锛?
  - `race_signup / rider_charlie / APPROVED`
  - `race_active / flow-check.ts / QUEUED`
  - `race_finished / post-race-flow.ts + post-race-record.txt / QUEUED`

### 瀵瑰簲楠岃瘉

- `node --import tsx --test src/app/actions.return-to.test.ts src/app/_components/public/race-register-page.test.tsx src/app/_components/submission-form-client.test.tsx src/app/_components/final-submission-form-client.test.tsx src/app/_components/public/public-copy-cleanup.test.tsx src/lib/public-site.test.ts src/app/_components/public/home-copy.test.tsx src/app/_components/public/copy-sanity.test.tsx src/app/_components/console/rider-console-page.test.tsx`
- `cmd /c npm run build`

## 2026-06-19 鐧诲綍鍚庣粺涓€閫€鍑哄叆鍙ｈ繘灞?

- `src/app/_components/public/public-header.tsx`
  - 宸茬櫥褰曟€佷笉鍐嶆樉绀?`韬唤鍏ュ彛`
  - 鏀逛负缁熶竴鏄剧ず `閫€鍑虹櫥褰昤
  - 浠嶄繚鐣?`杩涘叆鎺у埗鍙癭 鐙珛鍏ュ彛
- `src/app/_components/console/console-shell.tsx`
  - 鎺у埗鍙颁晶鏍忛《閮ㄦ柊澧炵粺涓€ `閫€鍑虹櫥褰昤 鎸夐挳

### 瀵瑰簲楠岃瘉

- `node --import tsx --test src/app/_components/public/public-header.test.tsx src/app/_components/console/console-shell.test.tsx src/app/_components/public/public-copy-cleanup.test.tsx src/app/_components/public/home-copy.test.tsx src/app/_components/public/copy-sanity.test.tsx`
- `cmd /c npm run build`

## 2026-06-19 README 鏁欑▼閲嶅啓杩涘睍

- `README.md` 宸蹭粠鏃х殑 Jumbotron 鍗曟ā鍧楄鏄庨噸鍐欎负褰撳墠椤圭洰绾?README銆?
- 鏂扮粨鏋勫凡鎷嗕负涓や釜鐙珛鏉垮潡锛?
  - `鍒嗚鑹叉暀绋媊
  - `杩愯鏁欑▼`
- 宸茶ˉ鍏咃細
  - 椤圭洰鍏ュ彛
  - 婕旂ず璐﹀彿
  - Rider / Organizer / Judge / Admin 鐨勬渶鐭搷浣滆矾寰?
  - 鍏紑灞曠ず浣撻獙璺緞
  - 鐩稿叧鏂囨。鍏ュ彛

### 瀵瑰簲楠岃瘉

- `cmd /c npm run build`

## 褰撳墠浠嶇己澶?/ 鏈畬鎴?

- GitHub OAuth 浠嶆湭鎺ュ叆锛屽綋鍓嶄粛鏄湰鍦拌处鍙?/ 瀵嗙爜浼氳瘽銆?
- `Team` 鍏煎灞備粛鐒跺瓨鍦紝娣卞眰 `teamId -> registrationId` 杩佺Щ灏氭湭瀹屾垚銆?
- `runner` 璺緞涓?`CA Push + Fetch` 鐩爣涔嬮棿浠嶆湁宸窛銆?
- 杩涜涓禌浜嬬殑鍏紑璧涗簨椤典粛娌℃湁鐩存帴鏆撮湶鏄庢樉鐨?`杩涘叆鎻愪氦` 鎸夐挳銆?
  - 褰撳墠鎻愪氦娴佺▼宸插彲鐢紝浣嗕富瑕佷粛閫氳繃 `/console/races/[raceSlug]/rider/submission` 杩涘叆銆?

## UI 鐩稿叧闂杩涘害

1. 浼佷笟璐﹀彿鐧昏繘鍘讳互鍚庢€庝箞娌℃硶鍒涘缓姣旇禌浜嗭紵鏄剧ず鐨勮繕鏄拰 audience 涓€鏍风殑棣栭〉
2. 瑙備紬鐣岄潰涓嬮潰鐨勫洓涓寜閿笁涓己澶憋紝鐒跺悗閭ｄ釜楠戞墜鐧诲綍/娉ㄥ唽涔熺偣涓嶅紑
3. 鐢ㄤ紒涓氳处鍙风櫥杩涘幓浜嗭紝鍝︼紝閭ｇ湅鏉ュ拰鍓嶉潰閭ｄ釜闂涓€鏍?
4. Jumbotron澶у睆骞曟病寮€濮嬬殑姣旇禌鏄剧ず鍗冲皢寮€濮嬶紝姣旇禌涓殑姣旇禌搴旇瑕佹樉绀篖ive锛屾瘮璧涚粨鏉熺殑搴旇鏄疐inish锛岀幇鍦ㄤ笁绉嶆瘮璧涘叏鏄嵆灏嗗紑濮嬨€傚叾浠栨病鍟ヤ簡
5. 瀹炲喌澶у巺锛屾病鏈夌偣鍑烩€滄墦寮€澶у睆鈥濆墠鏈夌偣閿欎綅
6. 鐢╮ider鐧诲綍鍚庯紝瀵规煇涓禌浜嬬殑鎻愪氦蹇呴』鍘诲埌鎺у埗鍙伴偅閲岋紝鐩存帴杩涘叆璧涗簨涓婚〉娌℃湁鎻愪氦閾炬帴
7. 鍒涘缓姣旇禌椤甸潰锛屾瘮鎴戜滑涔嬪墠鐨勮璁＄己灏戜簡寰堝
8. 涓婚〉闈㈡渶涓嬫柟鎻愮ず鈥滈獞鎵嬫敞鍐?鎶ュ悕/鍔炶禌/鍚堜綔鈥濋偅閲岀殑钃濊壊鎸夐挳鈥滈獞鎵嬫敞鍐?鐧诲綍鈥濇寜浜嗘病鏈夌湡姝ｈ烦鍒扮櫥褰曠晫闈€?
9. 杩涘叆鎺у埗鍙板悗锛屾垜瑙夊緱搴旇灞曠ず鍑烘湰浜鸿处鍙峰悕&韬唤锛屽仛鐫€鍋氱潃鎴戦兘蹇樹簡褰撳墠鐧诲綍鐨勮处鍙锋槸organizer杩樻槸admin杩樻槸浠€涔堢殑

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P2-B connector secret rotation + disabled/revoked connector 鍙鍖?
> 鏈妭鐢ㄤ簬 `P2-B` 宸插疄鏂藉垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画浼氳瘽浠?`P2-B` 缁х画锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`銆乣docs/superpowers/specs/2026-07-10-grs004-p2b-connector-rotation-disable-design.md`銆乣prisma/schema.prisma` 涓庣浉鍏?service / console 鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰 `搂6 P2锛氬寮?connector 璁よ瘉` 涓叧浜?`secret rotation`銆乣disabled / revoked connector` 鍙鍖栥€佷互鍙?Organizer Console trust/risk 灞曠ず鐨勫墿浣欓」銆?- `docs/superpowers/specs/2026-07-10-grs004-p2b-connector-rotation-disable-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p2b-connector-rotation-disable-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `prisma/schema.prisma`
  - `CAConnection` 宸叉柊澧?`secretVersion / secretRotatedAt / disabledReason`
  - 瀵瑰簲 migration 宸茶惤鍦帮細`prisma/migrations/20260710023711_grs004_p2b_connector_rotation_disable/`
- `src/lib/services/ca-connections.ts`
  - 宸叉柊澧烇細
    - `rotateCAConnectionSecretForRider()`
    - `disableCAConnectionForOrganizer()`
    - `enableCAConnectionForOrganizer()`
  - `secret rotation` 鐨勭湡瀹炶涔夋槸锛氭柊 `connectorSecret`銆乣secretVersion + 1`銆乣secretRotatedAt=now`銆佹竻绌?`handshakeCompletedAt`銆乣ingestionStatus=CONNECTED`
  - disable / enable 浼氬垎鍒啓鍏?`ca_connection.disabled / enabled`
- `src/app/actions.ts`
  - 宸叉柊澧烇細
    - `rotateCAConnectionSecretAction`
    - `disableCAConnectionAction`
    - `enableCAConnectionAction`
  - 鍙樻洿鍚庝細 revalidate `/console/races` 涓庡搴?race console 璺緞锛屽苟鍦ㄤ紶鍏?`raceId` 鏃堕噸寤?process projections
- `src/app/_components/console/rider-console-page.tsx`
  - `ca-setup` 宸插睍绀?`secretVersion / secretRotatedAt / disabledAt / disabledReason / Handshake State`
  - 宸叉柊澧?`Rotate Connector Secret` 琛ㄥ崟锛屽苟甯?`raceId + raceSlug + caConnectionId`
- `src/app/_components/console/organizer-console-page.tsx`
  - `ca-status` 宸插湪姣忎釜 connection 涓嬪睍绀?`connectorId / ingestionStatus / secretVersion / secretRotatedAt / disabledAt / disabledReason / handshakeCompletedAt`
  - 宸叉柊澧?`Disable Connector / Enable Connector` 琛ㄥ崟
- `src/lib/services/ca-fetch-audit.test.ts`
  - 宸叉敼涓鸿嚜寤轰复鏃?`CAConnection`锛屼笉鍐嶄笌鍏朵粬娴嬭瘯鏂囦欢鍏变韩 `active_0/1/2` 绉嶅瓙 connector锛岄伩鍏嶅苟鍙戞薄鏌?
### 鏈疆宸插畬鎴愮殑鐐?
- rider 鐜板湪鍙互杞崲鑷繁 `RaceProject` 涓嬬殑 connector secret
- organizer 鐜板湪鍙互绂佺敤/鎭㈠鑷繁璧涗簨涓嬬殑 connector
- 鏃?secret 鍦ㄨ疆鎹㈠悗浼氬け鏁堬紱鏂?secret 闇€瑕侀噸鏂?handshake 鎵嶈兘鎭㈠鍙俊閾?- rider / organizer 鎺у埗鍙板凡鑳界洿鎺ョ湅鍒?secret 鐗堟湰銆佽疆鎹㈡椂闂淬€乨isabled 鍘熷洜涓庘€滈渶閲嶆柊 handshake鈥濈姸鎬?- `SecurityAudit` 宸茶ˉ涓婏細
  - `ca_connection.secret_rotated`
  - `ca_connection.disabled`
  - `ca_connection.enabled`
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/lib/services/ca-rotation-disable.test.ts src/lib/services/ca-fetch-audit.test.ts src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx`
  - `npm run db:generate`
  - `npm run db:seed`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鏂板鐙珛 `revokedAt`
- 浠嶆湭淇濆瓨澶氱増鏈?secret 鍘嗗彶
- 浠嶆湭琛ュ崟鐙殑 connector 瀹¤鎬昏 UI
- `P2-A` 涓€滃凡鐧昏 credential 鐨?connector 寮哄埗绛惧悕鈥濆凡钀藉湴锛屼絾鈥滄墍鏈夌敓浜?connector 涓€寰嬭姹傜鍚嶁€濈殑鏇村己绛栫暐浠嶆湭杩涘叆

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屼笅涓€瀛愰」鐩簲鍥炲埌 `P2 connector 璁よ瘉澧炲己` 鐨勫墿浣欓」锛屼紭鍏堟槸 Organizer Console 涓殑 trust / risk 灞曠ず銆?2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛屼繚鎸?`docs/superpowers/spec / plan / status` 鍚屾鏇存柊锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛琛ユ仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/lib/services/ca-rotation-disable.test.ts src/lib/services/ca-fetch-audit.test.ts src/app/_components/console/rider-console-page.test.tsx src/app/_components/console/organizer-console-page.test.tsx`
   - `npm run db:generate`
   - `npm run db:seed`
   - `npm run build`

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P2-C Organizer Console trust / risk 灞曠ず璁捐

> 鏈妭鐢ㄤ簬 `P2-C` 璁捐鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 涓?`docs/superpowers/specs/2026-07-10-grs004-p2c-organizer-trust-risk-design.md`銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰 `搂6 P2锛氬寮?connector 璁よ瘉`
    - `4. 鏀寔 disabled / revoked connector 鐨勫璁′笌鍙鍖朻
    - `5. 鍦?Organizer Console 涓樉绀烘帴鍏ュ彲淇″害鍜岄闄╂彁绀篳
- `docs/superpowers/specs/2026-07-10-grs004-p2a-connector-signature-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p2b-connector-rotation-disable-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p2c-organizer-trust-risk-design.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/app/_components/console/organizer-console-page.tsx`
  - `ca-status` 宸叉湁 connector 绾у畨鍏ㄧ姸鎬佷笌 disable / enable 鎿嶄綔
  - 浠嶇己 registration 绾?trust / risk 鎽樿
- `src/lib/services/races.ts`
  - organizer 椤甸潰宸茬粡鑳芥嬁鍒帮細
    - `registration.evidences`
    - `registration.raceProject.caConnections.sessions`
    - `race.projections`
- `src/lib/services/projections.ts`
  - 鐜版湁 `ProjectionType.RISK` payload 鍙湁锛?    - `registrationId`
    - `aggregateIngestionStatus`
- `prisma/schema.prisma`
  - `Session` 宸叉湁 `riskLevel / riskReason`
  - `Evidence` 宸叉湁 `integrityStatus / confidenceLevel / reviewFlagJson`

### 鏈疆璁捐宸叉敹鏁涚殑缁撹

- `P2-C` 閲囩敤鏈€灏忓垏鐗囷細
  - 鍙仛 Organizer Console `ca-status` 鐨?trust / risk 灞曠ず
  - 涓嶆墿 `RISK` projection payload
  - 涓嶆柊澧炴柊鐨勮璇佺瓥鐣ユ垨瀹¤鎬昏椤?- trust / risk 椤跺眰鐘舵€佸彧淇濈暀涓夌锛?  - `failed`
  - `review_needed`
  - `trusted`
- 瑙勫垯瀹屽叏渚濊禆鐜版湁瀛楁鑱氬悎锛?  - `aggregateIngestionStatus`
  - `Evidence.integrityStatus / confidenceLevel / reviewFlagJson`
  - `Session.riskLevel / riskReason`
  - `disabledAt / handshakeCompletedAt`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- spec 宸插畬鎴愶紝浣?implementation plan 杩樻病鍐?- 杩樻病鏈夋柊澧?organizer `ca-status` 鐨?trust / risk UI 娴嬭瘯
- 杩樻病鏈夊疄闄呭疄鐜?summary badge銆佸師鍥犲垪琛ㄤ笌 readiness 鎻愮ず

### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 鍏堣鐢ㄦ埛纭 `docs/superpowers/specs/2026-07-10-grs004-p2c-organizer-trust-risk-design.md`
2. 鐢ㄦ埛纭鍚庯紝鍐嶅啓瀵瑰簲 implementation plan锛?   - `docs/superpowers/plans/2026-07-10-grs004-p2c-organizer-trust-risk-implementation-plan.md`
3. 璁″垝鑾峰噯鍚庯紝鍐嶆寜 TDD 杩涘叆瀹炵幇

## 2026-07-10 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / P2-C Organizer Console trust / risk 灞曠ず

> 鏈妭鐢ㄤ簬 `P2-C` 宸插疄鏂藉垏鐗囩殑鎭㈠鍏ュ彛銆傝嫢鍚庣画浼氳瘽浠?`P2-C` 缁х画锛屽厛璇绘湰鑺傦紝鍐嶅洖鍒?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`銆乣docs/superpowers/specs/2026-07-10-grs004-p2c-organizer-trust-risk-design.md`銆乣docs/superpowers/plans/2026-07-10-grs004-p2c-organizer-trust-risk-implementation-plan.md` 涓?`src/app/_components/console/organizer-console-page.tsx`銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md`
  - 閲嶇偣闃呰 `搂6 P2锛氬寮?connector 璁よ瘉`
    - `4. 鏀寔 disabled / revoked connector 鐨勫璁′笌鍙鍖朻
    - `5. 鍦?Organizer Console 涓樉绀烘帴鍏ュ彲淇″害鍜岄闄╂彁绀篳
- `docs/superpowers/specs/2026-07-10-grs004-p2c-organizer-trust-risk-design.md`
- `docs/superpowers/plans/2026-07-10-grs004-p2c-organizer-trust-risk-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/app/_components/console/organizer-console-page.tsx`
  - `ca-status` 鐜板湪闄や簡 connector 绾у畨鍏ㄧ姸鎬佸锛岃繕浼氬姣忎釜 registration 娓叉煋 `Trust / Risk Summary`
  - summary 浣跨敤鐜版湁瀛楁鑱氬悎锛?    - `aggregateIngestionStatus`
    - `Evidence.integrityStatus / confidenceLevel / reviewFlagJson`
    - `Session.riskLevel / riskReason`
    - `disabledAt / handshakeCompletedAt`
- `src/app/_components/console/organizer-console-page.test.tsx`
  - 宸茶鐩栵細
    - `failed`
    - `review_needed`
    - `trusted`
    - evidence review flag 灞曠ず
    - latest session risk 灞曠ず
    - disabled / pending handshake 瀵艰嚧 `review_needed`
- `src/lib/services/projections.ts`
  - `ProjectionType.RISK` payload 浠嶄繚鎸佸師鐘讹紝娌℃湁鍦ㄦ湰杞墿瀹?
### 鏈疆宸插畬鎴愮殑鐐?
- organizer 鐜板湪鍙互鍦?`ca-status` 閲岀洿鎺ョ湅鍒?registration 绾?trust / risk 鎽樿
- 鎽樿椤跺眰鐘舵€佸凡钀藉湴涓猴細
  - `failed`
  - `review_needed`
  - `trusted`
- 鍙缁嗚妭宸茶惤鍦颁负锛?  - `CA Ingestion`
  - `Evidence Integrity`
  - `Latest Session Risk`
  - `Connector Readiness`
- 鍙湪 organizer 瑙嗗浘钀藉湴锛屾病鏈夋妸鍒囩墖鎵╁ぇ鍒?projection schema銆乸ublic site 鎴?jumbotron
- 鏂伴矞楠岃瘉宸查€氳繃锛?  - `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx`
  - `npm run build`

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 浠嶆湭鎵?`ProjectionType.RISK` payload
- 浠嶆湭鏂板 connector 瀹¤鎬昏椤?- 浠嶆湭寮曞叆鏂扮殑璁よ瘉绛栫暐鎴?trust score
- `P2` 閲屾洿澶х殑 connector 璁よ瘉澧炲己鑼冨洿杩樻病鏈夊叏閮ㄧ粨鏉?
### 鎭㈠鎺ㄨ繘鏃剁殑涓嬩竴姝?
1. 濡傛灉缁х画娌?`docs/grs004/闃蹭吉涓庨槻绡℃敼璁″垝.md` 鎺ㄨ繘锛屽簲閲嶆柊鏍稿 `P2` 鍓╀綑椤规槸鍚﹁繘鍏ワ細
   - connector 瀹¤鎬昏鍙鍖?   - 鏇村己鐨勭敓浜?connector 绛惧悕绛栫暐
2. 鑻ュ悗缁繕瑕佺户缁?`grs004`锛屼繚鎸?`docs/superpowers/spec / plan / status` 鍚屾鏇存柊锛屽苟鍦ㄤ笂涓嬫枃瓒呰繃 500k 鏃跺厛琛ユ仮澶嶅揩鐓с€?3. 鑻ラ渶瑕佸鏍告湰杞惤鍦帮紝浼樺厛閲嶈窇锛?   - `node --import tsx --test src/app/_components/console/organizer-console-page.test.tsx`
   - `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-7 Award 鑽夌涓庢挙鍥炲熀绾?
> 鏈妭鐢ㄤ簬 `DEV-7` 杩欐 鈥淎ward draft + withdraw baseline鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-permission-matrix.md`銆乣docs/grs004/ary-domain-analysis.v0.3.md`銆乣docs/superpowers/specs/2026-07-11-grs004-dev7-award-draft-withdraw-baseline-design.md` 涓庣浉鍏冲疄鐜版枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-permission-matrix.md`
  - `3.8 Award / Leaderboard`
    - `view_draft`
    - `create_draft`
    - `publish`
    - `withdraw_publication`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Award / Leaderboard`
  - `Award.rank`
  - published result visibility
- `docs/superpowers/specs/2026-07-11-grs004-dev7-award-draft-withdraw-baseline-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev7-award-draft-withdraw-baseline-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/awards.ts`
  - 鏂板锛?    - `generateAwardDraftsForRace()`
    - `withdrawPublishedAwardsForRace()`
  - `publishAwardsForRace()` 鐜板湪浼氬厛閲嶇畻鏈€鏂拌崏绋匡紝鍐嶈缃?`publishedAt`
- `src/app/actions.ts`
  - 鏂板锛?    - `generateAwardDraftsAction()`
    - `withdrawPublishedAwardsAction()`
- `src/app/_components/console/organizer-console-page.tsx`
  - `awards` 鍖哄煙鐜板湪宸叉湁锛?    - `鐢熸垚 Award 鑽夌`
    - `鎸?JudgingRecord 鍙戝竷姝ｅ紡姒滃崟`
    - `鎾ゅ洖宸插彂甯冩鍗昤
    - `濂栭」鑽夌`
    - `宸插彂甯冨椤筦
- `src/lib/services/awards-draft-withdraw.test.ts`
  - 宸茶鐩栵細
    - draft generation -> unpublished awards
    - publish -> published awards
    - withdraw -> back to draft
- `src/app/_components/console/organizer-award-controls.test.tsx`
  - 宸茶鐩栵細
    - draft control
    - withdraw control
    - separate draft / published panels

### 鏈疆宸插畬鎴愮殑鐐?
- Organizer 鐜板湪鍙互鏄惧紡鐢熸垚 Award 鑽夌
- Award 鑽夌浼氫互 `publishedAt = null` 瀛樺偍
- 姝ｅ紡鍙戝竷浠嶅熀浜庡凡鎻愪氦 `JudgingRecord`
- 宸插彂甯冩鍗曠幇鍦ㄥ彲浠ユ挙鍥炲洖鑽夌鎬?- 鍏紑 `results / review / rider / work / race` 閾捐矾浠嶅彧璇诲彇 `publishedAt != null` 鐨?awards

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈?Award draft 鎵嬪伐缂栬緫
- 杩樻病鏈?per-award withdraw
- 杩樻病鏈?Award version history / diff
- report withdraw / version history / multi-reviewer 浠嶆湭琛ラ綈

### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/lib/services/awards-publication.test.ts src/lib/services/awards-draft-withdraw.test.ts src/app/_components/console/organizer-award-controls.test.tsx`
- `node --import tsx --test src/lib/services/results.test.ts src/lib/services/review.test.ts src/lib/services/public-routes.test.ts`
- `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-6 Works Display 涓撶敤澶у睆杈撳嚭鍩虹嚎

> 鏈妭鐢ㄤ簬 `DEV-6` 杩欐 鈥淲orks Display dedicated output baseline鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-mvp.ia.md`銆乣docs/grs004/ary-domain-analysis.v0.3.md`銆乣docs/grs004/ux-hifi.taskbook.md` 涓庡搴?spec / plan / 浠ｇ爜鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-mvp.ia.md`
  - `Screen Display`
    - `Works Display`
  - `Works`
    - `Race Context`
    - `Filter / Sort`
    - `Work Cards`
    - `Featured Works`
    - `Work Page Entry`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `works_list_read_model`
  - `screen_feed_projection`
    - `Works`
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Display`
    - 鐜板満瑙傜湅浜х墿
    - 涓嶆槸鍚庡彴椤甸潰鏀惧ぇ鐗?    - 杩滆窛绂诲彲璇?    - 寮虹姸鎬?- `docs/grs004/design-prototype/index.html`
  - `Works / Showcase`
  - `浣滃搧澧檂
  - `浣滃搧姗辩獥`
- `docs/superpowers/specs/2026-07-11-grs004-dev6-works-display-dedicated-output-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev6-works-display-dedicated-output-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/app/_components/public/works-display.tsx`
  - 宸叉柊澧炰笓鐢?`WorksDisplayView`
  - 褰撳墠缁撴瀯宸插寘鍚細
    - `Works / Showcase`
    - 璧涗簨浣滃搧澧欐爣棰?    - `鍏ㄩ儴鍏紑浣滃搧 / 绮鹃€?/ 宸茶幏濂?/ 璇勫涓璥
    - 涓€涓?`Featured Work`
    - 浜岀骇浣滃搧鍗＄墖
    - `浣滃搧姗辩獥`
- `src/app/screen/[raceSlug]/works/page.tsx`
  - 宸叉敼涓轰娇鐢?`WorksDisplayView`
  - 涓嶅啀鐩存帴娓叉煋 `WorksPageView`
- `src/lib/services/public-routes.ts`
  - 缁х画鍙彁渚?public-safe 浣滃搧闆嗗悎
  - 鏈叕寮€ work 涓嶄細杩涘叆鏈〉

### 鏈疆宸插畬鎴愮殑鐐?
- `/screen/{raceSlug}/works` 宸蹭笉鍐嶅彧鏄櫘閫?`Works` 椤电殑鍖呭３
- 椤甸潰宸茬粡鏀跺彛鎴愭洿鎺ヨ繎鍘熷瀷鐨?`Works / Showcase`
- 绮鹃€変綔鍝併€佷綔鍝佸崱鐗囧拰浣滃搧姗辩獥閮藉彧娑堣垂鐜版湁鍏紑浣滃搧 / 宸插彂甯?Award 閾捐矾
- 娌℃湁寮曞叆鏂扮殑 `screen_feed_projection` 鎴栨柊鐨勪簨瀹炴ā鍨?
### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `Works Display` 瑙嗚涓婁粛鏄渶灏忓ぇ灞忓熀绾匡紝涓嶆槸鏈€缁堥珮淇濈湡浣滃搧澧?- 杩樻病鏈夋洿澶嶆潅鐨勮疆鎾€佸垎椤垫垨澶氬睆缂栨帓
- 鏇村畬鏁寸殑澶у睆涓婚绯荤粺銆佹牎鍑嗗悎娴併€佺湡瀹?GitHub OAuth 娴忚鍣ㄨ仈璋冦€丷eport withdraw / history / multi-reviewer銆丷unner 褰诲簳閫€鍦轰粛鏈ˉ榻?
### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/app/_components/public/works-display.test.tsx src/lib/services/screen-display.test.ts`
- `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-6 Screen Console Calibration 闆嗘垚鍩虹嚎

> 鏈妭鐢ㄤ簬 `DEV-6` 杩欐 鈥淪creen Console calibration integration鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-mvp.ia.md`銆乣docs/grs004/ux-hifi.taskbook.md` 涓庡搴?spec / plan / 浠ｇ爜鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console`
    - `Theme / Calibration`
    - `Fallback Control`
    - `Fullscreen Output`
  - `鏍稿績浠诲姟`
    - `閰嶇疆澶у睆涓婚`
    - `瀹屾垚鐜板満灞忓箷鏍″噯`
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Console`
    - `Race 閫夋嫨`
    - `Display Mode`
    - `棰勮`
    - `鍏ㄥ睆杈撳嚭`
    - `fallback`
- `docs/superpowers/specs/2026-07-11-grs004-dev6-screen-console-calibration-integration-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev6-screen-console-calibration-integration-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/app/_components/console/screen-console-page.tsx`
  - `mode === "calibration"` 鏃剁幇鍦ㄤ細鐩存帴娓叉煋锛?    - `鏍″噯宸ヤ綔鍖篳
    - 鐜版湁 `CalibratorClient`
  - `calibration` 妯″紡璇存槑宸蹭笉鍐嶆槸鈥滃悗缁啀骞跺叆鈥濈殑鍗犱綅鏂囨
- `src/app/calibrator/CalibratorClient.tsx`
  - 宸叉柊澧?`embedded` 妯″紡
  - 褰撳墠鍦ㄦ帶鍒跺彴鍐呭彲鐩存帴鐪嬪埌锛?    - `瀵煎叆搴曞浘`
    - `瀵煎叆 Profile`
    - `鏍￠獙`
    - `瀵煎嚭褰撳墠 Profile`
- `src/app/calibrator/page.tsx`
  - 鐙珛 `/calibrator` 璺敱浠嶄繚鐣?
### 鏈疆宸插畬鎴愮殑鐐?
- `/console/screen/{raceSlug}/calibration` 宸蹭笉鍐嶅彧鏄崰浣嶈鏄?- 鐜版湁鏍″噯鍣ㄥ凡杩涘叆 Screen Console 宸ヤ綔娴?- 娌℃湁鏂板鏂扮殑鏍″噯鎸佷箙鍖栨ā鍨?- `Theme / Calibration` 鐨勬帶鍒堕潰瑕佹眰鐜板湪宸叉湁鏈€灏忚惤鍦?
### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 鏍″噯缁撴灉杩樻病鏈夊苟鍏?`ScreenDisplay` 鐨勬寔涔呭寲鐘舵€?- 杩樻病鏈夋洿缁嗙殑 per-race 鏍″噯棰勮銆佺増鏈巻鍙叉垨澶氫汉鍗忓悓
- 鏇村畬鏁寸殑澶у睆涓婚绯荤粺銆丣umbotron / Billboard 楂樼骇閰嶇疆銆佺湡瀹?GitHub OAuth 娴忚鍣ㄨ仈璋冦€丷eport withdraw / history / multi-reviewer銆丷unner 褰诲簳閫€鍦轰粛鏈ˉ榻?
### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/app/_components/console/console-copy.test.tsx src/app/_components/console/screen-console-controls.test.tsx`
- `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-6 Screen Console Preview + Fullscreen Output

> 鏈妭鐢ㄤ簬 `DEV-6` 杩欐 鈥淪creen Console preview + fullscreen output鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-mvp.ia.md`銆乣docs/grs004/ux-hifi.taskbook.md` 涓庡搴?spec / plan / 浠ｇ爜鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console`
    - `Display Control`
    - `Fullscreen Output`
  - `Screen Console 蹇呴』娓呮櫚灞曠ず褰撳墠 Race 鍜屽綋鍓?Display Mode`
  - `Screen Console | 褰撳墠 Race銆佸綋鍓?Display Mode | ... | 鍏ㄥ睆灞曠ず / 鍒囨崲妯″紡`
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Console`
    - `Race 閫夋嫨`
    - `Display Mode`
    - `棰勮`
    - `鍏ㄥ睆杈撳嚭`
    - `fallback`
- `docs/superpowers/specs/2026-07-11-grs004-dev6-screen-console-preview-fullscreen-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev6-screen-console-preview-fullscreen-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/app/_components/console/screen-console-page.tsx`
  - 褰撳墠 `ScreenDisplay` 鐘舵€佸崱涓诲姩浣滃凡鏀逛负锛?    - `鍏ㄥ睆灞曠ず褰撳墠杈撳嚭`
  - `杈撳嚭鐩爣` 闈㈡澘褰撳墠宸叉柊澧烇細
    - `褰撳墠杈撳嚭棰勮`
  - `mode !== "jumbotron"` 鏃剁幇鍦ㄤ細鐩存帴娓叉煋锛?    - `<iframe src={currentPublicHref}>`
  - `mode === "jumbotron"` 鏃剁户缁繚鐣欙細
    - `JumbotronInline`
    - `StaticDisplayFallback`
- `src/app/_components/console/screen-console-controls.test.tsx`
  - 宸茶鐩栵細
    - `鍏ㄥ睆灞曠ず褰撳墠杈撳嚭`
    - 闈?`jumbotron` 妯″紡鍑虹幇 iframe 棰勮
- `src/app/_components/console/console-copy.test.tsx`
  - 宸插悓姝ヨ鐩栨柊鐨勪腑鏂?copy

### 鏈疆宸插畬鎴愮殑鐐?
- `Screen Console` 鐜板湪宸叉湁鏄庣‘鐨?`Fullscreen Output` 鎺у埗鍔ㄤ綔
- 闈?`jumbotron` 妯″紡涓嶅啀鍙墿璺宠浆閾炬帴锛岃€屾槸鍙互鍦ㄦ帶鍒跺彴鍐呯洿鎺ラ瑙堝綋鍓嶈緭鍑?- 鎺у埗闈㈠拰灞曠ず闈粛鐒朵繚鎸佸垎绂伙紝娌℃湁鎶婃帶鍒舵寜閽甫杩涜浼楀ぇ灞?
### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈夊紩鍏ユ祻瑙堝櫒 Fullscreen API
- 褰撳墠棰勮灞備粛浠ョ幇鏈夊叕寮€鎾斁椤典负鍑嗭紝涓嶆槸姣忎釜 mode 鐨勫唴鑱?SSR 涓撶敤棰勮缁勪欢
- 鏇村畬鏁寸殑澶у睆涓婚绯荤粺銆佹牎鍑嗗悎娴併€佺湡瀹?GitHub OAuth 娴忚鍣ㄨ仈璋冦€丷eport withdraw / history / multi-reviewer銆丷unner 褰诲簳閫€鍦轰粛鏈ˉ榻?
### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/app/_components/console/console-copy.test.tsx src/app/_components/console/screen-console-controls.test.tsx`
- `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-6 Billboard Screen Feed 闆嗘垚鍩虹嚎

> 鏈妭鐢ㄤ簬 `DEV-6` 杩欐 鈥淏illboard screen feed integration鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-domain-analysis.v0.3.md`銆乣docs/grs004/ary-mvp.ia.md` 涓庡搴?spec / plan / 浠ｇ爜鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Billboard`
    - 淇℃伅鐪嬫澘瑙嗗浘
    - 鍋忔鍗曘€佸叕鍛娿€佺姸鎬佷俊鎭?  - `screen_feed_projection`
    - 澶у睆灞曠ず鏁版嵁鑱氬悎
  - `screen_feed_projection 搴斿尯鍒?feed item 绫诲瀷`
- `docs/grs004/ary-mvp.ia.md`
  - `Screen Display`
    - `Billboard`
  - `杩涜涓姸鎬乣
    - `Jumbotron / Billboard`
    - `閫夋墜杩涘害`
    - `娲昏穬鍔ㄦ€乣
    - `椋庨櫓浜嬩欢`
    - `褰撳墠鎺掕姒渀
    - `闃舵鍏憡`
- `docs/superpowers/specs/2026-07-11-grs004-dev6-billboard-screen-feed-integration-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev6-billboard-screen-feed-integration-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/app/_components/public/billboard-display.tsx`
  - 宸叉柊澧?`screenFeedItems` 杈撳叆
  - 褰撳墠椤甸潰浼氱洿鎺ユ樉绀猴細
    - `Screen Feed`
    - `鍏憡`
    - `杩囩▼姒渀
    - `Session 鎽樿`
- `src/app/screen/[raceSlug]/billboard/page.tsx`
  - 宸插紑濮嬩粠 `Projection.type === "SCREEN_FEED"` 瑙ｆ瀽 feed items
  - 瑙ｆ瀽澶辫触鏃跺洖閫€涓虹┖鏁扮粍锛屼笉宕╂簝
- `src/lib/services/projections.ts`
  - 鐜版湁 `rebuildRaceProcessProjections()` 缁х画璐熻矗浜у嚭 `SCREEN_FEED`

### 鏈疆宸插畬鎴愮殑鐐?
- `Billboard` 宸插紑濮嬬洿鎺ユ秷璐圭幇鏈?`SCREEN_FEED`
- feed item 绫诲瀷鐜板湪鍦ㄩ〉闈笂鍙
- `current_leaderboard_projection` 浠嶇劧鍙綔涓鸿繃绋?feed锛岃€屼笉鏄渶缁堣禌鏋?- 娌℃湁鏂板鏂扮殑 ProjectionType

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `Billboard` 瑙嗚涓婁粛鏄渶灏忎俊鎭湅鏉垮熀绾匡紝涓嶆槸鏈€缁堥珮淇濈湡鐗堟湰
- 杩樻病鏈夋洿澶嶆潅鐨?billboard 鍒嗗尯閰嶇疆鎴栫紪鎺?- 鏇村畬鏁寸殑澶у睆涓婚绯荤粺銆佹牎鍑嗙粨鏋滄寔涔呭寲銆丣umbotron / Billboard 楂樼骇閰嶇疆銆佺湡瀹?GitHub OAuth 娴忚鍣ㄨ仈璋冦€丷eport withdraw / history / multi-reviewer銆丷unner 褰诲簳閫€鍦轰粛鏈ˉ榻?
### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/app/_components/public/billboard-display.test.tsx src/lib/services/projections-convergence.test.ts`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-6 Screen Calibration 鍐欏洖璧涗簨閰嶇疆鍩虹嚎

> 鏈妭鐢ㄤ簬 `DEV-6` 杩欐 鈥渟creen calibration track config persistence鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-mvp.ia.md`銆乣src/lib/jumbotron/track-config.ts`銆乣src/lib/services/race-snapshot.ts` 涓庡搴?spec / plan / 浠ｇ爜鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console`
    - `Theme / Calibration`
  - `鏍稿績浠诲姟`
    - `瀹屾垚鐜板満灞忓箷鏍″噯`
- `src/lib/jumbotron/track-config.ts`
  - `Race.trackConfigJson`
    - 褰撳墠 runtime 姝ｅ紡娑堣垂鍏ュ彛
- `src/lib/services/race-snapshot.ts`
  - snapshot 鏋勫缓浼氳鍙?`trackConfigJson`
- `docs/superpowers/specs/2026-07-11-grs004-dev6-screen-calibration-track-config-persistence-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev6-screen-calibration-track-config-persistence-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/races.ts`
  - 宸叉柊澧烇細
    - `updateRaceTrackCalibration()`
  - 褰撳墠鍙繚瀛橈細
    - `startFinish`
    - `checkpoints`
  - 淇濆瓨鍚庝細娓呴櫎绋冲畾 snapshot
- `src/app/actions.ts`
  - 宸叉柊澧烇細
    - `saveRaceTrackCalibrationAction()`
- `src/app/calibrator/CalibratorClient.tsx`
  - 宓屽叆妯″紡涓嬬幇鍦ㄤ細鏄剧ず锛?    - `淇濆瓨鍒板綋鍓嶈禌浜媊
  - 褰撳墠浼氭彁浜わ細
    - `raceId`
    - `raceSlug`
    - `trackConfigJson`
  - 鍒濆鐘舵€佸凡鏀寔浠庡綋鍓嶈禌浜嬫湁鏁堣禌閬撻厤缃洖濉?- `src/app/_components/console/screen-console-page.tsx`
  - `calibration` 妯″紡鐜板湪浼氭妸褰撳墠璧涗簨鏈夋晥 profile 鍜屼繚瀛?action 浼犵粰宓屽叆鏍″噯鍣?
### 鏈疆宸插畬鎴愮殑鐐?
- 鏍″噯缁撴灉宸茬粡鑳藉啓鍥炲綋鍓嶈禌浜?- 褰撳墠姝ｅ紡鎸佷箙鍖栧叆鍙ｄ粛鐒舵槸 `Race.trackConfigJson`
- 娌℃湁鏂板鏂扮殑 Prisma 妯″瀷
- 鍐嶆杩涘叆鍚屼竴璧涗簨鏍″噯椤垫椂锛屼細鍥炲埌褰撳墠璧涗簨宸茬粡淇濆瓨鐨勮捣缁堢偣 / 妫€鏌ョ偣

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈夋妸瀹屾暣 `TrackProfile` 鎸佷箙鍖栧埌鏁版嵁搴?- 杩樻病鏈夋妸鏍″噯缁撴灉骞跺叆 `ScreenDisplay` 妯″瀷鏈韩
- 杩樻病鏈?per-race 鏍″噯鐗堟湰鍘嗗彶鎴栧浜哄崗鍚?- 鏇村畬鏁寸殑澶у睆涓婚绯荤粺銆丅illboard 楂樼骇閰嶇疆銆佺湡瀹?GitHub OAuth 娴忚鍣ㄨ仈璋冦€丷eport withdraw / history / multi-reviewer銆丷unner 褰诲簳閫€鍦轰粛鏈ˉ榻?
### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/app/_components/console/console-copy.test.tsx src/app/_components/console/screen-console-controls.test.tsx src/lib/services/race-track-calibration.test.ts`
- `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-6 Screen Feed Works + Final Leaderboard 鍩虹嚎

> 鏈妭鐢ㄤ簬 `DEV-6` 杩欐 鈥渟creen feed works + final leaderboard鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-domain-analysis.v0.3.md`銆乣docs/grs004/ary-mvp.ia.md`銆乣src/lib/services/projections.ts` 涓庡搴?spec / plan / 浠ｇ爜鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `screen_feed_projection`
    - `Live銆乧urrent_leaderboard_projection銆乴eaderboard_read_model銆乄orks銆丄nnouncement`
  - `screen_feed_projection 搴斿尯鍒?feed item 绫诲瀷`
- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console`
    - `screen_feed_projection銆乧urrent_leaderboard_projection銆乴eaderboard_read_model銆丄nnouncement`
  - `Screen Display / Screen Console` 蹇呴』鍖哄垎杩囩▼姒滀笌鏈€缁堟
- `docs/superpowers/specs/2026-07-11-grs004-dev6-screen-feed-works-final-leaderboard-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev6-screen-feed-works-final-leaderboard-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/evidence-projection-helpers.ts`
  - `buildScreenFeedProjectionPayload()` 鐜板凡鏀寔锛?    - `announcement`
    - `current_leaderboard_projection`
    - `leaderboard_read_model`
    - `works`
    - `session_summary`
- `src/lib/services/projections.ts`
  - `rebuildRaceProcessProjections()` 鐜板湪浼氭妸锛?    - 宸插彂甯冩渶缁堟鍙敤
    - 鍏紑浣滃搧鍙敤
    涔熷啓鍏?`SCREEN_FEED`
- `src/app/_components/public/billboard-display.tsx`
  - `Screen Feed` 鍖哄潡鐜板湪鍙锛?    - `鍏憡`
    - `杩囩▼姒渀
    - `鏈€缁堟`
    - `浣滃搧`
    - `Session 鎽樿`
- `src/lib/jumbotron/adapter.ts`
  - 缁х画浼樺厛璇诲彇 `SCREEN_FEED`
  - `leaderboard_read_model` 鐜版寜 milestone 璇箟澶勭悊

### 鏈疆宸插畬鎴愮殑鐐?
- `SCREEN_FEED` 宸茶ˉ榻愭枃妗ｉ噷鏄惧紡瑕佹眰鐨勪袱绫?item锛?  - `leaderboard_read_model`
  - `works`
- Billboard 椤甸潰鐜板湪鍙互鏄惧紡鍖哄垎锛?  - 杩囩▼姒?  - 鏈€缁堟
  - 浣滃搧
- 娌℃湁鏂板鏂扮殑 ProjectionType

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `SCREEN_FEED` 浠嶆槸鏈€灏忔憳瑕佸眰锛屼笉鏄鏉傜殑澶у睆缂栨帓灞?- Billboard 瑙嗚涓婁粛鏄渶灏忎俊鎭湅鏉垮熀绾?- 鏇村畬鏁寸殑澶у睆涓婚绯荤粺銆佸畬鏁存牎鍑嗗璞″苟鍏?`ScreenDisplay`銆丅illboard 楂樼骇閰嶇疆銆佺湡瀹?GitHub OAuth 娴忚鍣ㄨ仈璋冦€丷eport withdraw / history / multi-reviewer銆丷unner 褰诲簳閫€鍦轰粛鏈ˉ榻?
### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/lib/services/screen-feed-projection.test.ts src/lib/services/projections-convergence.test.ts src/app/_components/public/billboard-display.test.tsx`
- `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-6 Announcement 鍙戝竷涓庡叕鍛婂ぇ灞忓熀绾?
> 鏈妭鐢ㄤ簬 `DEV-6` 杩欐 鈥淎nnouncement publish/hide + announcement display baseline鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-permission-matrix.md`銆乣docs/grs004/ary-domain-analysis.v0.3.md`銆乣docs/grs004/ary-mvp.ia.md` 涓庡搴?spec / plan / 浠ｇ爜鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-permission-matrix.md`
  - `3.12 Announcement`
    - `view_public`
    - `view_private`
    - `create`
    - `edit`
    - `publish`
    - `hide`
  - `3.13 ScreenDisplay`
    - `view_public_display`
    - `switch_mode`
    - `fallback_to_static_notice`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Announcement`
  - `Screen Display Flow`
  - `ScreenDisplay`
- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console`
  - `Announcement Display`
  - `Live Hall` 杈呭姪鍏憡
- `docs/superpowers/specs/2026-07-11-grs004-dev6-announcement-screen-display-baseline-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev6-announcement-screen-display-baseline-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `prisma/schema.prisma`
  - 宸叉柊澧?`Announcement`
    - `raceId`
    - `title`
    - `body`
    - `visibility`
    - `publishedAt`
  - 瀵瑰簲 migration 宸茶惤鍦帮細
    - `prisma/migrations/20260711190000_grs004_dev6_announcement_screen_display_baseline/`
- `src/lib/services/announcements.ts`
  - 宸叉柊澧烇細
    - `listAnnouncementsForRace()`
    - `listPublishedAnnouncementsForRace()`
    - `getLatestPublishedAnnouncementForRace()`
    - `createAnnouncementDraftForRace()`
    - `updateAnnouncementDraftForRace()`
    - `publishAnnouncementForRace()`
    - `hideAnnouncementForRace()`
- `src/app/actions.ts`
  - 宸叉柊澧烇細
    - `createAnnouncementDraftAction()`
    - `updateAnnouncementDraftAction()`
    - `publishAnnouncementAction()`
    - `hideAnnouncementAction()`
- `src/app/_components/console/console-shell.tsx`
  - organizer section 宸叉柊澧?`announcements`
- `src/app/console/races/[raceSlug]/organizer/[section]/page.tsx`
  - 宸叉柊澧?`announcements: "鍏憡"` label
- `src/app/_components/console/organizer-console-page.tsx`
  - 宸叉柊澧?`announcements` section
  - 鐜板湪鍙锛?    - `鍒涘缓鍏憡鑽夌`
    - `鍏憡鑽夌`
    - `宸插彂甯冨叕鍛奰
    - `淇濆瓨鍏憡鑽夌`
    - `鍙戝竷鍏憡`
    - `闅愯棌鍏憡`
    - `鎵撳紑 Announcement Display`
- `src/app/_components/console/screen-console-page.tsx`
  - `announcement` 妯″紡涓嶅啀鍙槸鍗犱綅璇存槑
  - 鐜板湪浼氭彁渚涳細
    - `鎵撳紑鍏憡澶у睆`
    - 鏈€杩戝凡鍙戝竷鍏憡姒傝
- `src/app/_components/public/announcement-display.tsx`
  - 宸叉柊澧炵嫭绔嬪叕鍛婃挱鏀剧粍浠?- `src/app/screen/[raceSlug]/announcement/page.tsx`
  - 宸叉柊澧炲叕寮€鍏憡鎾斁椤?- `src/lib/services/races.ts`
  - organizer read model 宸插甫涓?`announcements`
- `src/lib/services/public-routes.ts`
  - public read model 宸插彧甯︿笂 `visibility=PUBLIC && publishedAt!=null` 鐨勫叕鍛?- `src/app/_components/public/live-hall.tsx`
  - 宸叉柊澧?`鏈€杩戝叕鍛奰 鍗＄墖
- `src/app/_components/public/static-display-fallback.tsx`
  - 闈欐€佸叕鍛婁紭鍏堢骇宸叉敼涓猴細
    - 鏈€鏂板凡鍙戝竷鍏憡
    - `organizerComment`
    - `race.summary`
    - 榛樿 fallback 鏂囨

### 鏈疆宸插畬鎴愮殑鐐?
- `Announcement` 宸叉垚涓虹嫭绔嬩簨瀹炴簮锛屼笉鍐嶅彧闈?`Notification / organizerComment` 浠ｇ敤
- Organizer 鐜板湪鍙互鍦?managed race 涓嬪垱寤恒€佺紪杈戙€佸彂甯冦€侀殣钘忓叕鍛?- `Screen Console / announcement` 鐜板湪宸叉湁鐙珛鎾斁鍏ュ彛
- 鏂板鍏紑 `Announcement Display`
- `Live Hall` 涓庨潤鎬?fallback 鐜板湪閮戒細浼樺厛璇诲彇鏈€杩戝凡鍙戝竷鍏憡
- 鍏紑璇诲彇涓嶄細鏆撮湶绉佹湁鑽夌鎴栧凡闅愯棌鍏憡

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈夊畬鏁存寔涔呭寲 `ScreenDisplay` 妯″瀷
- 杩樻病鏈夊鏉″叕鍛婃挱鏀剧紪鎺?/ playlist
- 杩樻病鏈夊叕鍛婂巻鍙插綊妗ｃ€佺増鏈?diff 鎴栧鏍告祦
- 鍏朵粬 `live / leaderboard / works / billboard` 妯″紡浠嶄富瑕佹槸杩囨浮鎾斁缁撴瀯
- 鐪熷疄 GitHub OAuth 娴忚鍣ㄨ仈璋冦€丷eport withdraw / history / multi-reviewer銆丷unner 褰诲簳閫€鍦轰粛鏈ˉ榻?
### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/lib/services/announcements.test.ts src/app/_components/console/organizer-announcement-controls.test.tsx src/app/_components/public/announcement-display.test.tsx src/app/_components/public/live-hall.test.tsx src/app/_components/console/console-copy.test.tsx`
- `node --import tsx --test src/lib/services/announcements.test.ts src/app/_components/console/organizer-announcement-controls.test.tsx src/app/_components/public/announcement-display.test.tsx src/app/_components/public/live-hall.test.tsx src/app/_components/console/console-copy.test.tsx src/app/_components/console/organizer-console-page.test.tsx src/app/_components/console/organizer-award-controls.test.tsx src/lib/services/public-routes.test.ts src/lib/services/results.test.ts src/lib/services/review.test.ts`
- `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-6 ScreenDisplay 鎸佷箙鍖栫姸鎬佸熀绾?
> 鏈妭鐢ㄤ簬 `DEV-6` 杩欐 鈥淪creenDisplay state baseline鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-permission-matrix.md`銆乣docs/grs004/ary-domain-analysis.v0.3.md`銆乣docs/grs004/ary-mvp.ia.md` 涓庡搴?spec / plan / 浠ｇ爜鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-permission-matrix.md`
  - `3.13 ScreenDisplay`
    - `view_public_display`
    - `configure`
    - `switch_mode`
    - `fallback_to_stable_projection`
    - `fallback_to_static_notice`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `ScreenDisplay`
  - `ScreenMode`
  - `Screen Display Flow`
- `docs/grs004/ary-mvp.ia.md`
  - `Screen Console`
  - `Screen Display`
  - `Theme / Calibration / Fallback`
- `docs/superpowers/specs/2026-07-11-grs004-dev6-screen-display-state-baseline-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev6-screen-display-state-baseline-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `prisma/schema.prisma`
  - 宸叉柊澧烇細
    - `ScreenMode`
    - `ScreenFallbackMode`
    - `ScreenDisplay`
  - 瀵瑰簲 migration 宸茶惤鍦帮細
    - `prisma/migrations/20260711194000_grs004_dev6_screen_display_state_baseline/`
- `src/lib/services/screen-display.ts`
  - 宸叉柊澧烇細
    - `getOrCreateScreenDisplayForRace()`
    - `updateScreenDisplayModeForRace()`
    - `updateScreenDisplayThemeForRace()`
    - `fallbackScreenDisplayToStableProjection()`
    - `fallbackScreenDisplayToStaticNotice()`
    - `resolveScreenDisplayHref()`
- `src/lib/services/races.ts`
  - console-safe race read model 宸插甫涓?`screenDisplay`
- `src/lib/services/public-routes.ts`
  - public-safe race read model 宸插甫涓?`screenDisplay`
- `src/app/actions.ts`
  - 宸叉柊澧烇細
    - `updateScreenDisplayModeAction()`
    - `updateScreenDisplayThemeAction()`
    - `fallbackScreenDisplayToStableAction()`
    - `fallbackScreenDisplayToStaticAction()`
  - 褰撳墠宸插吋瀹?`Admin` system 鏉冮檺涓?Organizer managed race 鏉冮檺
- `src/app/_components/console/screen-console-page.tsx`
  - 宸叉柊澧?`褰撳墠 ScreenDisplay` 鐘舵€佸崱
  - 褰撳墠鍙锛?    - 褰撳墠妯″紡
    - 褰撳墠 Theme
    - 褰撳墠 Fallback
    - 褰撳墠鍏紑鎾斁鍏ュ彛
    - `鍒囧埌澶у睆 / 鐪嬫澘 / 瀹炲喌 / 姒滃崟 / 浣滃搧 / 鍏憡`
    - `淇濆瓨 Theme`
    - `鍒囧埌绋冲畾 Projection fallback`
    - `鍒囧埌闈欐€佸叕鍛?fallback`
- `src/app/screen/[raceSlug]/page.tsx`
  - 宸叉柊澧炵ǔ瀹氬叕鍏辨挱鏀惧叆鍙?  - 浼氭寜 `ScreenDisplay` 褰撳墠鐘舵€佸垎鍙戝埌瀹為檯鎾斁鐩爣
- `src/app/screen/[raceSlug]/static/page.tsx`
  - 宸叉柊澧為潤鎬?fallback 鍏叡鎾斁椤?- `src/app/jumbotron/[raceId]/page.tsx`
  - 宸叉敮鎸?`?source=stable`
  - 鐢ㄤ簬 `ScreenDisplay` 寮哄埗绋冲畾 Projection fallback
- `src/app/_components/public/announcement-display.tsx`
  - 宸插紑濮嬫秷璐?`theme`
- `src/app/_components/public/static-display-fallback.tsx`
  - 宸插紑濮嬫秷璐?`race.screenDisplay?.theme`

### 鏈疆宸插畬鎴愮殑鐐?
- `ScreenDisplay` 宸叉垚涓虹嫭绔嬫寔涔呭寲璇绘ā鍨嬶紝涓嶅啀鍙瓨鍦ㄤ簬璺敱鍙傛暟
- Screen Console 鐜板湪鍙互淇敼褰撳墠鍏紑鏄剧ず鐘舵€侊紝鑰屼笉鍙槸鍒囬瑙堣矾鐢?- `/screen/{raceSlug}` 宸叉垚涓虹ǔ瀹氬叕鍏辨挱鏀惧叆鍙?- 褰撳墠 `mode / theme / fallback override` 閮芥湁鏄庣‘鐘舵€?- `stable_projection` 涓?`static_notice` override 宸茶兘鐪熷疄褰卞搷鍏紑鎾斁鍑哄彛

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `billboard / live / works` 褰撳墠浠嶄富瑕佸鐢ㄧ幇鏈?public 杈撳嚭锛岃繕涓嶆槸鐙珛涓撶敤澶у睆 UI
- `theme` 鏈疆鍙厛鍦?`Announcement Display` 涓?`Static Notice` 涓婃湁鏈€灏忔秷璐?- `calibration` 浠嶅湪鐜版湁鐙珛宸ュ叿閲岋紝娌℃湁骞跺叆 `ScreenDisplay`
- 鐪熷疄 GitHub OAuth 娴忚鍣ㄨ仈璋冦€丷eport withdraw / history / multi-reviewer銆丷unner 褰诲簳閫€鍦轰粛鏈ˉ榻?
### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/lib/services/screen-display.test.ts src/app/_components/console/screen-console-controls.test.tsx`
- `node --import tsx --test src/lib/services/screen-display.test.ts src/lib/services/announcements.test.ts src/app/_components/console/screen-console-controls.test.tsx src/app/_components/console/console-copy.test.tsx src/app/_components/console/organizer-announcement-controls.test.tsx src/app/_components/public/announcement-display.test.tsx src/app/_components/public/live-hall.test.tsx src/lib/services/public-routes.test.ts src/lib/services/results.test.ts src/lib/services/review.test.ts`
- `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-6 Dedicated Screen Mode Pages 鍩虹嚎

> 鏈妭鐢ㄤ簬 `DEV-6` 杩欐 鈥渄edicated screen mode pages baseline鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-mvp.ia.md`銆乣docs/grs004/ary-domain-analysis.v0.3.md`銆乣docs/grs004/ux-hifi.taskbook.md` 涓庡搴?spec / plan / 浠ｇ爜鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-mvp.ia.md`
  - `Screen Display`
    - `Jumbotron`
    - `Billboard`
    - `Live Display`
    - `Leaderboard Display`
    - `Works Display`
    - `Announcement Display`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Billboard`
  - `Screen Display Flow`
  - `screen_feed_projection`
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Display`
    - 澶у瓧鍙?    - 寮虹姸鎬?    - 杩滆窛绂诲彲璇?- `docs/superpowers/specs/2026-07-11-grs004-dev6-screen-mode-pages-baseline-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev6-screen-mode-pages-baseline-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/app/_components/public/screen-display-shell.tsx`
  - 宸叉柊澧炵粺涓€ `Screen Display` 澶栧３
- `src/app/_components/public/billboard-display.tsx`
  - 宸叉柊澧炴渶灏?`Billboard` 淇℃伅鐪嬫澘
- `src/app/screen/[raceSlug]/billboard/page.tsx`
  - 宸叉柊澧?`Billboard` 鎾斁椤?- `src/app/screen/[raceSlug]/live/page.tsx`
  - 宸叉柊澧?`Live Display` 鎾斁椤?  - 褰撳墠澶嶇敤 `LiveHallView`
- `src/app/screen/[raceSlug]/leaderboard/page.tsx`
  - 宸叉柊澧?`Leaderboard Display` 鎾斁椤?  - 褰撳墠澶嶇敤 `ResultsPageView`
- `src/app/screen/[raceSlug]/works/page.tsx`
  - 宸叉柊澧?`Works Display` 鎾斁椤?  - 褰撳墠澶嶇敤 `WorksPageView`
- `src/lib/services/screen-display.ts`
  - `resolveScreenDisplayHref()` 鐜板凡鏇存柊涓猴細
    - `billboard` -> `/screen/{raceSlug}/billboard`
    - `live` -> `/screen/{raceSlug}/live`
    - `leaderboard` -> `/screen/{raceSlug}/leaderboard`
    - `works` -> `/screen/{raceSlug}/works`
    - `announcement` -> `/screen/{raceSlug}/announcement`
    - `jumbotron` -> `/jumbotron/{raceId}`

### 鏈疆宸插畬鎴愮殑鐐?
- `Billboard` 鐜板湪宸叉垚涓虹湡瀹炴挱鏀鹃〉锛屼笉鍐嶅彧鏄枃妗ｆā寮忓悕
- `Live / Leaderboard / Works` 宸叉嫢鏈夌嫭绔?`screen/*` 妯″紡椤?- `/screen/{raceSlug}` 鍦?`auto` 妯″紡涓嬬幇鍦ㄤ紭鍏堝垎鍙戝埌鐪熸鐨?`screen/*` 鎾斁椤?- 鏂版ā寮忛〉缁х画鍙秷璐圭幇鏈?public-safe read model

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `live / leaderboard / works` 瑙嗚涓婁粛涓昏澶嶇敤鐜版湁 public 瑙嗗浘锛屼笉鏄渶缁堜笓鐢ㄥぇ灞忚璁?- `billboard` 鐩墠鏄渶灏忎俊鎭澘锛屾病鏈夋洿澶嶆潅鐨勮疆鎾?/ 鍒嗗尯閰嶇疆
- `jumbotron` 浠嶆槸鐙珛璺敱锛屼笉鍦ㄦ湰杞粺涓€鍒?`/screen/*`
- 鏇村畬鏁寸殑澶у睆涓婚绯荤粺銆佹牎鍑嗗悎娴併€佺湡瀹?GitHub OAuth 娴忚鍣ㄨ仈璋冦€丷eport withdraw / history / multi-reviewer銆丷unner 褰诲簳閫€鍦轰粛鏈ˉ榻?
### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/lib/services/screen-display.test.ts src/app/_components/public/billboard-display.test.tsx`
- `node --import tsx --test src/lib/services/screen-display.test.ts src/lib/services/announcements.test.ts src/app/_components/public/billboard-display.test.tsx src/app/_components/console/screen-console-controls.test.tsx src/app/_components/console/console-copy.test.tsx src/app/_components/public/announcement-display.test.tsx src/app/_components/public/live-hall.test.tsx`
- `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-6 Live Display 涓撶敤澶у睆杈撳嚭鍩虹嚎

> 鏈妭鐢ㄤ簬 `DEV-6` 杩欐 鈥淟ive Display dedicated output baseline鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ux-hifi.taskbook.md`銆乣docs/grs004/design-prototype/index.html`銆乣docs/grs004/design-prototype/script.js` 涓庡搴?spec / plan / 浠ｇ爜鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Display`
    - 鐜板満瑙傜湅浜х墿
    - 涓嶆槸鍚庡彴椤甸潰鏀惧ぇ鐗?    - 杩滆窛绂诲彲璇?    - 寮虹姸鎬?- `docs/grs004/design-prototype/index.html`
  - `page-screen`
  - `Live Riding Board`
  - `screen-metrics`
- `docs/grs004/design-prototype/script.js`
  - `active riders`
  - `sessions`
  - `cost watch`
  - `submit left`
- `docs/superpowers/specs/2026-07-11-grs004-dev6-live-display-dedicated-output-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev6-live-display-dedicated-output-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/app/_components/public/live-display.tsx`
  - 宸叉柊澧炰笓鐢?`LiveDisplayView`
  - 褰撳墠缁撴瀯宸插寘鍚細
    - 椤堕儴鐘舵€佹潯
    - `Live Riding Board`
    - `JumbotronInline` 鎴?`StaticDisplayFallback`
    - 澶у瓧鎸囨爣锛?      - `active riders`
      - `sessions`
      - `椋庨櫓鏁癭
      - `submit left`
    - 杈呭姪鎽樿锛?      - 鏈€杩戝叕鍛?      - 杩囩▼姒滃墠涓?      - 鏈€杩戜簨浠?- `src/app/screen/[raceSlug]/live/page.tsx`
  - 宸叉敼涓轰娇鐢?`LiveDisplayView`
  - 涓嶅啀鐩存帴娓叉煋 `LiveHallView`

### 鏈疆宸插畬鎴愮殑鐐?
- `/screen/{raceSlug}/live` 宸蹭笉鍐嶅彧鏄櫘閫?`Live Hall` 鐨勫寘澹?- 椤甸潰缁撴瀯鏇存帴杩戝師鍨嬩腑鐨?`Live Riding Board`
- 褰撳墠浠嶅彧娑堣垂鐜版湁 public-safe read model 涓?snapshot 閾捐矾
- `stable / static fallback` 鎻愮ず浠嶄繚鐣欏湪涓撶敤澶у睆椤典腑

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `Leaderboard / Works Display` 浠嶄富瑕佸鐢ㄧ幇鏈?public 瑙嗗浘
- `Live Display` 杩樻病鏈夋洿澶嶆潅鐨勭幇鍦哄姩鐢荤紪鎺掓垨淇℃伅鍒嗗尯鍒囨崲
- 鏇村畬鏁寸殑澶у睆涓婚绯荤粺銆佹牎鍑嗗悎娴併€佺湡瀹?GitHub OAuth 娴忚鍣ㄨ仈璋冦€丷eport withdraw / history / multi-reviewer銆丷unner 褰诲簳閫€鍦轰粛鏈ˉ榻?
### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/app/_components/public/live-display.test.tsx src/app/_components/public/live-hall.test.tsx src/lib/services/screen-display.test.ts src/app/_components/console/screen-console-controls.test.tsx`
- `node --import tsx --test src/lib/services/screen-display.test.ts src/lib/services/announcements.test.ts src/app/_components/public/billboard-display.test.tsx src/app/_components/public/live-display.test.tsx src/app/_components/console/screen-console-controls.test.tsx src/app/_components/console/console-copy.test.tsx src/app/_components/public/announcement-display.test.tsx src/app/_components/public/live-hall.test.tsx`
- `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-6 Leaderboard Display 涓撶敤澶у睆杈撳嚭鍩虹嚎

> 鏈妭鐢ㄤ簬 `DEV-6` 杩欐 鈥淟eaderboard Display dedicated output baseline鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-domain-analysis.v0.3.md`銆乣docs/grs004/ary-mvp.ia.md`銆乣docs/grs004/ux-hifi.taskbook.md` 涓庡搴?spec / plan / 浠ｇ爜鏂囦欢鏍稿銆?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Current Leaderboard`
    - 杩囩▼姒滐紝涓嶆槸鏈€缁?Award 鎺掑悕
  - `leaderboard_read_model`
    - 鏈€缁堟璇诲彇 `Award`
  - `screen_feed_projection 搴斿尯鍒?feed item 绫诲瀷`
- `docs/grs004/ary-mvp.ia.md`
  - `Results`
    - `Award Leaderboards`
    - `Winning Works`
    - `Riding Skill Highlights`
  - `Screen Display / Screen Console` 蹇呴』鍖哄垎杩囩▼姒滀笌鏈€缁堟
- `docs/grs004/ux-hifi.taskbook.md`
  - `Screen Display 鐨勫疄鏃舵鍗曞拰 Results 鐨勬渶缁堟鍗曟病鏈夊尯鍒哷
- `docs/superpowers/specs/2026-07-11-grs004-dev6-leaderboard-display-dedicated-output-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev6-leaderboard-display-dedicated-output-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/app/_components/public/leaderboard-display.tsx`
  - 宸叉柊澧炰笓鐢?`LeaderboardDisplayView`
  - 褰撳墠鍙秷璐癸細
    - `awards`
    - `raceReport`
    - `ridingSkillHighlights`
  - 褰撳墠鏄庣‘涓嶆秷璐癸細
    - `CURRENT_LEADERBOARD`
- `src/app/screen/[raceSlug]/leaderboard/page.tsx`
  - 宸叉敼涓轰娇鐢?`LeaderboardDisplayView`
  - 涓嶅啀鐩存帴娓叉煋 `ResultsPageView`
- `src/lib/services/screen-display.ts`
  - `resolveScreenDisplayHref()` 鐜板凡绋冲畾鎸囧悜 `/screen/{raceSlug}/leaderboard`
- `src/lib/services/screen-display.ts`
  - 宸叉柊澧炴渶灏?SQLite busy retry锛屽噺灏戝苟鍙戞祴璇曟椂鐨?`database is locked`

### 鏈疆宸插畬鎴愮殑鐐?
- `/screen/{raceSlug}/leaderboard` 宸蹭笉鍐嶅彧鏄櫘閫?`Results` 椤靛３
- 椤甸潰鍙〃杈炬渶缁堟锛屼笉鍐嶆贩鍏ヨ繃绋嬫鎺緸
- 浠嶇户缁彧娑堣垂 `Award / Report / published results` 閾捐矾

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- `Works Display` 浠嶄富瑕佸鐢ㄧ幇鏈?public `Works` 瑙嗗浘
- `Leaderboard Display` 瑙嗚涓婁粛鏄渶灏忓熀绾匡紝涓嶆槸鏈€缁堥珮淇濈湡澶у睆璁捐
- 鏇村畬鏁寸殑澶у睆涓婚绯荤粺銆佹牎鍑嗗悎娴併€佺湡瀹?GitHub OAuth 娴忚鍣ㄨ仈璋冦€丷eport withdraw / history / multi-reviewer銆丷unner 褰诲簳閫€鍦轰粛鏈ˉ榻?
### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/app/_components/public/leaderboard-display.test.tsx src/lib/services/results.test.ts src/lib/services/review.test.ts`
- `node --import tsx --test src/lib/services/screen-display.test.ts src/lib/services/announcements.test.ts src/app/_components/public/billboard-display.test.tsx src/app/_components/public/live-display.test.tsx src/app/_components/public/leaderboard-display.test.tsx src/app/_components/console/screen-console-controls.test.tsx src/app/_components/console/console-copy.test.tsx src/app/_components/public/announcement-display.test.tsx src/app/_components/public/live-hall.test.tsx src/lib/services/results.test.ts src/lib/services/review.test.ts`
- `npm run build`

## 2026-07-11 涓婁笅鏂囧帇缂╁揩鐓э細GRS004 / DEV-7 Award 鑽夌缂栬緫鍩虹嚎

> 鏈妭鐢ㄤ簬 `DEV-7` 杩欐 鈥淎ward draft edit baseline鈥?鍒囩墖鐨勬仮澶嶅叆鍙ｃ€傝嫢鍚庣画浼氳瘽浠庤繖閲岀户缁紝鍏堣鏈妭锛屽啀鍥炲埌 `docs/grs004/ary-permission-matrix.md`銆乣docs/grs004/ary-domain-analysis.v0.3.md`銆乣docs/superpowers/specs/2026-07-11-grs004-dev7-award-draft-edit-baseline-design.md` 涓庣浉鍏冲疄鐜版枃浠舵牳瀵广€?
### 鏉冨▉鍏ュ彛

- `docs/grs004/ary-permission-matrix.md`
  - `3.8 Award / Leaderboard`
    - `edit_draft`
- `docs/grs004/ary-domain-analysis.v0.3.md`
  - `Award Name`
  - `Award Rank`
  - `decisionReason`
  - `Award.rank` uniqueness constraints
- `docs/superpowers/specs/2026-07-11-grs004-dev7-award-draft-edit-baseline-design.md`
- `docs/superpowers/plans/2026-07-11-grs004-dev7-award-draft-edit-baseline-implementation-plan.md`

### 褰撳墠浠ｇ爜鐪熷疄鐘舵€?
- `src/lib/services/awards.ts`
  - 鏂板锛?    - `updateAwardDraftForRace()`
  - 褰撳墠 draft edit 鍏佽淇敼锛?    - `awardName`
    - `rank`
    - `decisionReason`
  - 褰撳墠浠嶄繚鎸佸喕缁擄細
    - `registrationId`
    - `workId`
    - `sourceRefJson`
    - `sourceDigest`
- `src/app/actions.ts`
  - 鏂板锛?    - `updateAwardDraftAction()`
- `src/app/_components/console/organizer-console-page.tsx`
  - `濂栭」鑽夌` 鍖哄煙鐜板湪宸叉湁锛?    - `awardName` input
    - `rank` input
    - `decisionReason` textarea
    - `淇濆瓨 Award 鑽夌`
- `src/lib/services/awards-draft-withdraw.test.ts`
  - 宸茶鐩栵細
    - draft edit 鎴愬姛
    - duplicate `(awardName, rank)` draft slot 琚嫆缁?    - published award 涓嶈兘鐩存帴缂栬緫
- `src/app/_components/console/organizer-award-controls.test.tsx`
  - 宸茶鐩栵細
    - award draft edit controls
    - 淇濆瓨鎸夐挳鍙

### 鏈疆宸插畬鎴愮殑鐐?
- Organizer 鐜板湪鍙互缂栬緫 Award 鑽夌
- 鍙厑璁哥紪杈?`awardName / rank / decisionReason`
- 宸插彂甯?Award 淇濇寔鍙
- draft edit 浠嶇劧閬靛畧 `(raceId, awardName, rank)` 鍞竴鎬?- 鍏紑 `results / review / rider / work / race` 閾捐矾浠嶅彧璇诲彇 published awards

### 褰撳墠浠嶆湭瀹屾垚鐨勭偣

- 杩樻病鏈夋墜宸ユ敼鍐?winner identity
- 杩樻病鏈?per-award withdraw
- 杩樻病鏈?Award version history / diff
- report withdraw / version history / multi-reviewer 浠嶆湭琛ラ綈

### 鏂伴矞楠岃瘉璇佹嵁

- `node --import tsx --test src/lib/services/awards-publication.test.ts src/lib/services/awards-draft-withdraw.test.ts src/app/_components/console/organizer-award-controls.test.tsx`
- `node --import tsx --test src/lib/services/results.test.ts src/lib/services/review.test.ts src/lib/services/public-routes.test.ts`
- `npm run build`


- 2026-07-11 已完成 `GRS004 / Organizer core friendly error surface extension` 的设计、实现与验证：已新增 `docs/superpowers/specs/2026-07-11-grs004-organizer-core-friendly-error-surface-extension-design.md` 与 `docs/superpowers/plans/2026-07-11-grs004-organizer-core-friendly-error-surface-extension-implementation-plan.md`；`src/lib/action-feedback.ts` 已继续扩展 `organizer_settings / organizer_announcements / organizer_awards / organizer_reports` 四类 scope，并补齐赛事发布、公告、榜单、报告高频错误到统一中文提示的映射；`publishRaceAction`、`updateRaceAction`、`updateDisplayOptionsAction`、`updateOrganizerCommentAction`、`createAnnouncementDraftAction`、`updateAnnouncementDraftAction`、`publishAnnouncementAction`、`hideAnnouncementAction`、`generateAwardDraftsAction`、`updateAwardDraftAction`、`publishLeaderboardAction`、`withdrawPublishedAwardsAction`、`generateReportsAction`、`updateReportDraftAction`、`publishReportAction`、`markReportReviewedAction` 现已统一改为 `try/catch + buildActionFeedbackHref(...) + redirect(returnTo)`；`src/app/_components/console/organizer-console-page.tsx` 已为 settings / announcements / awards / reports 表单补齐 `raceSlug + returnTo`，保证失败时回到当前 organizer 分区并复用既有 `ErrorNotice` 样式；聚焦验证 `node --import tsx --test "src/lib/action-feedback.test.ts" "src/app/actions.return-to.test.ts" "src/app/console/races/[raceSlug]/organizer/[section]/page.test.ts" "src/app/console/races/[raceSlug]/rider/[section]/page.test.ts" "src/app/races/[raceSlug]/register/page.test.ts" "src/app/_components/public/race-register-page.test.tsx" "src/app/_components/console/rider-console-page.test.tsx" "src/app/_components/console/organizer-console-page.test.tsx"` 与 `npm run build` 已通过。

- 2026-07-11 已完成 `GRS004 / Admin Cooperation Maintenance friendly error surface extension` 的设计、实现与验证：已新增 `docs/superpowers/specs/2026-07-11-grs004-admin-cooperation-maintenance-friendly-error-surface-extension-design.md` 与 `docs/superpowers/plans/2026-07-11-grs004-admin-cooperation-maintenance-friendly-error-surface-extension-implementation-plan.md`；`src/lib/action-feedback.ts` 已继续扩展 `admin_roles / create_race / cooperation_request / admin_race_requests / organizer_ca_status / organizer_maintenance` 六类 scope，并补齐 `screen_console` scope 归一化漏项，以及 cooperation 附件校验、CA operator 等英文技术错误到统一中文提示的映射；`updateUserRolesAction`、`createRaceAction`、`cooperationRequestAction`、`approveCooperationRequestAction`、`rejectCooperationRequestAction`、`disableCAConnectionAction`、`enableCAConnectionAction`、`rebuildProcessModelsAction`、`generateRaceSnapshotAction`、`archiveRaceAction` 现已统一改为 `try/catch + buildActionFeedbackHref(...) + redirect(returnTo)` 或跳转到新赛事 organizer overview；`src/app/console/admin/[section]/page.tsx`、`src/app/console/races/new/page.tsx`、`src/app/cooperation/page.tsx` 已接入 route-level feedback 与既有 `ErrorNotice`；`src/app/_components/cooperation-form.tsx` 已修正 `taskPackageFile / proposalFile` 字段名与后端 action 对齐，并让 `/cooperation?submitted=1` 真正驱动成功态显示；聚焦验证 `node --import tsx --test "src/lib/action-feedback.test.ts" "src/app/actions.return-to.test.ts" "src/app/console/races/new/page.test.tsx" "src/app/console/admin/[section]/page.test.ts" "src/app/cooperation/page.test.ts" "src/app/_components/create-race-form-client.test.tsx" "src/app/_components/cooperation-form.test.tsx" "src/app/_components/console/admin-console-page.test.tsx" "src/app/_components/console/race-requests-page.test.tsx"`、`node --import tsx --test "src/app/_components/console/organizer-console-page.test.tsx"` 与 `npm run build` 已通过。

- 2026-07-11 completed `GRS004 / Console root friendly error fallback surface`: added `docs/superpowers/specs/2026-07-11-grs004-console-root-friendly-error-fallback-surface-design.md` and `docs/superpowers/plans/2026-07-11-grs004-console-root-friendly-error-fallback-surface-implementation-plan.md`; `src/app/console/page.tsx` and `src/app/console/races/page.tsx` now read `feedbackMessage` and `feedbackScope`, resolve them through `getActionFeedbackContent(...)`, and render the existing `ErrorNotice` inside `ConsoleShell`; this closes the remaining fallback display hole for root console destinations such as `submitJudgingRecordAction` defaulting to `/console/races`; focused verification `node --import tsx --test src/app/console/page.test.tsx src/app/console/races/page.test.tsx` and `npm run build` are both passing.

- 2026-07-11 completed `GRS004 / GitHub OAuth friendly error closure`: added `docs/superpowers/specs/2026-07-11-grs004-github-oauth-friendly-error-closure-design.md` and `docs/superpowers/plans/2026-07-11-grs004-github-oauth-friendly-error-closure-implementation-plan.md`; `src/lib/github-oauth.ts` now exports `GitHubOAuthError`, `GitHubOAuthErrorCode`, and `resolveGitHubOAuthErrorCode(...)`, and marks known failures such as state mismatch, token exchange failure, profile fetch failure, and not-configured credentials with stable codes; `src/app/actions.ts` now wraps `loginWithGitHubAction()` so non-redirect startup failures return to `/login` with `oauthError=<stable-code>` while preserving `returnTo`; `src/app/api/auth/github/callback/route.ts` now maps callback failures to stable `oauthError=` codes without leaking raw `detail=` text into the URL; `src/app/login/page.tsx` now renders dedicated friendly messages for `github_start_failed`, `github_state_mismatch`, `github_exchange_failed`, and `github_profile_failed` using the existing `ErrorNotice` surface; focused verification `node --import tsx --test src/lib/github-oauth-feedback.test.ts src/app/api/auth/github/callback/route.test.ts src/app/_components/public/public-auth-entry-regression.test.tsx src/app/actions.return-to.test.ts` and `npm run build` are both passing.

