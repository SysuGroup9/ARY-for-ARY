# GRS004 / P1-D 合作办赛材料读取校验 + 审计 Design

## 目的

本设计直接承接：

- `docs/grs004/防伪与防篡改计划.md`
  - `§10 企业题目防篡改`
    - 题目文件上传时未计算和存储哈希值
    - 文件读取时未校验完整性
    - 缺少文件修改的审计日志
- `docs/superpowers/specs/2026-07-10-grs004-p1a-material-integrity-foundation-design.md`
- `docs/superpowers/specs/2026-07-10-grs004-p1c-security-audit-design.md`

`P1-A` 已经在合作办赛申请上传时补上：

- `taskPackageFileHash`
- `proposalFileHash`

但当前真实读链路里，`approveCooperationRequest()` 直接消费数据库中记录的 `filePath + fileHash` 构建 `Race.challengeSourceRefJson`，还没有在审批前重新读取文件并核验完整性，也没有记录这次读取验证的审计事实。

本轮目标是：**把已写入的 hash 真正用于合作办赛材料读取校验，并在审批路径上接入最小审计。**

## 范围

### 本轮纳入

- 只收口合作办赛材料：
  - `taskPackageFile*`
  - `proposalFile*`
- 只收口 `approveCooperationRequest()`
- 在审批前重新读取文件并比对当前 hash
- 使用现有 `SecurityAudit` 记录：
  - 材料校验成功
  - 材料缺失
  - 材料 hash 不匹配

### 本轮不纳入

- 不新增新的 schema 字段
- 不引入数字签名
- 不新增独立文件存储服务
- 不补“所有读路径”统一校验，只先补审批主链路
- 不扩展到选手代码材料
- 不新增 admin 文件下载或预览页

## 约束

### 当前代码现实

- `src/lib/services/cooperation.ts`
  - `submitCooperationRequest()` 已在上传时写入：
    - `taskPackageFileHash`
    - `proposalFileHash`
    - 对应 public path
  - `approveCooperationRequest()` 目前直接信任数据库中的 path/hash 构建 `challengeSourceRef`
- `public/uploads/...`
  - 文件当前落在本地文件系统
- `src/lib/security-audit-helpers.ts`
  - 已有通用 `SecurityAudit` 写入 helper

因此本轮应遵循：**不改上传协议，只补审批前的读取校验和最小审计。**

## 方案选择

### 方案 A：审批前逐个文件重算 hash 并校验

做法：

- 将 `/uploads/...` public path 解析回工作区绝对路径
- 在 `approveCooperationRequest()` 里：
  - 读取 `taskPackageFilePath`
  - 读取 `proposalFilePath`
  - 重算 hash
  - 与数据库中的 `taskPackageFileHash / proposalFileHash` 比对

优点：

- 直接命中 `docs/grs004` 第 10 节的“文件读取时未校验完整性”
- 不需要新表
- 改动小、风险清晰

缺点：

- 当前只覆盖审批路径，不是全局文件访问框架

### 方案 B：统一文件访问网关

优点：

- 更彻底

缺点：

- 超出当前最小切片
- 会把工作扩展到下载、预览、后台展示等更多路径

### 推荐方案

采用 **方案 A：审批前逐个文件重算 hash 并校验**。

原因：

- 这是第 10 节当前最小、最真实、最容易验证的收口点
- 用户要求尽量减少额外想法，不应先做泛化文件网关

## 审计策略

使用现有 `SecurityAudit`：

- `action = cooperation_request.materials_verify`
- `targetType = CooperationRequest`
- `targetId = request.id`

### 成功

- `result = accepted`
- `reason = ""`

### 失败

可能原因：

- `task_package_missing`
- `proposal_missing`
- `task_package_hash_mismatch`
- `proposal_hash_mismatch`
- `invalid_upload_path`

### actor

- `actorKind = USER`
- `userId = adminUserId`

因为触发点是真实 admin 审批动作。

## 运行时规则

### 1. 仅在 request 里存在文件 path/hash 时校验

- 如果某个文件根本未上传，不把它视为失败
- 只有“已记录文件”的材料才参与校验

### 2. 文件缺失时拒绝审批

- 如果 path 指向的文件不存在：
  - 写 `SecurityAudit`
  - 拒绝审批
  - 不创建 Race

### 3. hash 不匹配时拒绝审批

- 如果当前文件重算 hash 与数据库记录不一致：
  - 写 `SecurityAudit`
  - 拒绝审批
  - 不创建 Race

### 4. 校验通过后才创建 Race

- `challengeSourceRefJson / challengeContentHash` 只建立在通过验证的材料上

## 测试对齐

需要新增或扩展：

- `src/lib/services/material-integrity-cooperation.test.ts`

覆盖：

- 上传时仍会写入 hash
- 审批时会把 `challengeSourceRef` 和 digest 带入 `Race`
- 审批前若文件被篡改，审批失败
- 审批前若文件缺失，审批失败
- 失败路径会写 `SecurityAudit`

## 验收对齐

本轮完成后，需要能证明：

1. 合作办赛材料在审批读取前会重新校验 hash
2. 文件被替换或删除时，`approveCooperationRequest()` 不再继续创建 Race
3. 校验结果会进入 `SecurityAudit`
4. 本轮没有新增新的 schema 或存储系统

## 一句话结论

`P1-D` 的目标是：*把合作办赛材料上传时已经记录下来的 hash 真正用在审批读取链路上，并把“校验通过 / 文件缺失 / hash 不匹配”落到统一 `SecurityAudit`。*

## 已落地实现补记（2026-07-10）

- `src/lib/material-integrity-helpers.ts`
  - 已新增：
    - `resolvePublicUploadAbsolutePath()`
    - `verifyStoredUploadHash()`
  - 当前只允许解析 `/uploads/...` 下的 public path
- `src/lib/services/cooperation.ts`
  - `approveCooperationRequest()` 现在会在创建 Race 前重新校验：
    - `taskPackageFilePath + taskPackageFileHash`
    - `proposalFilePath + proposalFileHash`
  - 当前失败原因已落地为：
    - `task_package_missing`
    - `proposal_missing`
    - `task_package_hash_mismatch`
    - `proposal_hash_mismatch`
    - `invalid_upload_path`
  - 校验失败会拒绝审批，并写入：
    - `action = cooperation_request.materials_verify`
    - `result = rejected`
  - 校验成功后会写入：
    - `action = cooperation_request.materials_verify`
    - `result = accepted`
- `src/lib/services/material-integrity-cooperation.test.ts`
  - 已补：
    - 上传后存储 hash
    - 审批成功写入 challenge sourceRef / digest
    - 审批前文件被篡改时拒绝
    - 审批前文件缺失时拒绝
    - 失败路径写审计

### 本轮明确没有做的事

- 没有新增数字签名
- 没有新增文件下载 / 预览页
- 没有扩展到选手代码读取校验
- 没有引入新的文件存储系统

### 新鲜验证证据

- `node --import tsx --test src/lib/services/material-integrity-cooperation.test.ts`
- `npm run build`
