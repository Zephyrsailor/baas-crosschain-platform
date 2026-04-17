# BaaS 跨链平台 PRD（v1.1）

> 在 v1.0 基础上增强：补齐 PRD→Prototype 映射、页面字段级原型说明、接口清单（含示例/错误码）、UAT 清单与人天评估。

## 1. 文档信息
- 项目名称：金赋水 BaaS 跨链平台
- 版本：v1.1
- 阶段：需求冻结（可进入原型深化与技术实现）
- 目标读者：产品、架构、前后端、测试、安全、运维

## 2. 背景与目标
### 2.1 背景
面向内部开发团队，建设统一 BaaS 平台，支撑产业数据上链、跨链合约部署、链/节点治理、DID 认证与多链浏览能力，并为“金赋水链”接入预留跨链生态能力。

### 2.2 业务目标
1. 提供统一上链接口，降低业务系统接入复杂度
2. 实现多链合约部署标准化，缩短上线周期
3. 建立链与节点运营可观测能力
4. 建立 DID + CA + 国密的身份底座
5. 形成 RBAC + 审计闭环，确保安全与可追溯

### 2.3 非目标（本期）
- 完整资产跨链桥清结算
- 对外商业计费系统
- 高级增长运营后台

---

## 3. 用户与角色
### 3.1 用户
- 内部开发团队
- 运维与安全团队
- 审计与治理团队

### 3.2 角色
- SuperAdmin：平台全局管理
- TenantAdmin：租户与应用管理
- Developer：上链、部署、查询
- Auditor：日志与合规审计
- Viewer：只读

---

## 4. 功能范围（6 大模块）
1. 数据上链 API/SDK
2. 集成化区块链浏览器
3. 跨链合约部署管理
4. 链与节点管理
5. DID 数字身份登记认证
6. BaaS 用户体系（RBAC + 自助门户 + UBA）

---

## 5. PRD→Prototype 映射（v1.1 新增）

| 业务模块 | 原型页面 | 核心交互 | 对应后端能力 |
|---|---|---|---|
| 登录与权限 | `#/login` | 输入 userId / API Base / 登录态切换 | IAM、RBAC |
| 数据上链 | `#/onchain` | 提交 payload、查看任务回执 | `/api/v1/onchain/*` |
| 合约部署 | `#/contracts` | 选择链、参数编辑、触发部署 | `/api/v1/contracts/*` |
| 链节点监控 | `#/monitor` | 查看节点状态、告警、健康上报 | `/api/v1/chainops/*` |
| 区块浏览器 | `#/explorer` | 区块/交易/地址检索 | `/api/v1/explorer/*` |
| DID 管理 | `#/did` | 注册、撤销、查询 DID | `/api/v1/did/*` |

> 注：当前前端 MVP 已在 `web/public` 落地，上述路由可直接演示。

---

## 6. 页面级原型说明（字段级）

## 6.1 登录页（#/login）
- 字段：`User ID`、`API Base URL`
- 操作：登录、切换用户、退出
- 校验：User ID 必填
- 成功态：进入默认模块页
- 失败态：401/403 显示错误提示

## 6.2 上链任务页（#/onchain）
- 字段：`bizType`、`bizId`、`payload(JSON)`、`chainId`
- 操作：提交上链、查询任务状态
- 展示：requestId、txHash、status、errorCode
- 异常：非法 JSON（400）、权限不足（403）

## 6.3 合约部署页（#/contracts）
- 字段：`templateId`、`version`、`targetChains[]`、`params(JSON)`
- 操作：发起部署、查看逐链结果
- 展示：deployJobId、每条链状态、失败原因

## 6.4 链/节点监控页（#/monitor）
- 展示：节点在线/离线、同步高度、延迟、告警数
- 操作：节点健康上报（受限权限）
- 过滤：按链、状态、时间

## 6.5 区块浏览器页（#/explorer）
- 输入：关键字（区块号/TxHash/地址/合约地址）
- 展示：概览卡片 + 明细列表
- 结果：区块信息、交易详情、地址历史、合约事件

## 6.6 DID 管理页（#/did）
- 字段：主体类型、主体标识、证书摘要
- 操作：注册、查询、撤销
- 展示：did、状态、签发时间、撤销时间

---

## 7. API 清单（v1.1 增强）

## 7.1 数据上链
### POST /api/v1/onchain/data
请求示例：
```json
{
  "bizType": "supply-order",
  "bizId": "SO-2026-0001",
  "chainId": "evm-testnet",
  "payload": {"hash":"0xabc..."}
}
```
响应示例：
```json
{
  "requestId":"req_123",
  "txHash":"0xaaa",
  "status":"submitted"
}
```

### GET /api/v1/onchain/tasks/{id}
返回任务状态与错误信息。

## 7.2 合约部署
### POST /api/v1/contracts/deploy
```json
{
  "templateId":"tpl_asset_v2",
  "targetChains":["evm-testnet","evm-mainnet"],
  "params":{"owner":"0x123"}
}
```

## 7.3 浏览器
- GET /api/v1/explorer/overview
- GET /api/v1/explorer/search?q=

## 7.4 链节点
- GET /api/v1/chainops
- POST /api/v1/chainops/node/health

## 7.5 DID
- POST /api/v1/did/register
- POST /api/v1/did/revoke
- GET /api/v1/did/list

## 7.6 认证/审计
- POST /api/v1/auth/verify-signature
- GET /api/v1/audit/logs

### 通用错误码
- 400：参数错误/JSON 非法
- 401：未认证（缺失身份）
- 403：权限不足
- 404：资源不存在
- 413：请求体超限（>1MB）
- 429：限流
- 500：系统异常

---

## 8. 安全与合规要求（v1.1 固化）
1. 不允许默认 admin 提权
2. 敏感接口必须权限校验
3. 请求体限制 1MB，非法 JSON 返回 400
4. 全链路 TLS + 请求签名防重放
5. 审计日志不可篡改
6. 国密（SM2/SM3/SM4）与 CA 对接可扩展

---

## 9. MoSCoW 优先级
### Must
- 上链 API + SDK
- 浏览器核心查询
- 合约部署基础版
- 链节点监控与告警
- DID 注册/撤销/查询
- RBAC + 审计日志

### Should
- 批量任务编排
- UBA 风险看板
- 高级筛选与报表

### Could
- 合约灰度发布
- 自动链路由优化

### Won’t
- 跨链资产桥完整闭环
- 对外商业计费

---

## 10. 验收标准（UAT）
1. 至少 2 条链接入并可稳定上链
2. 上链任务全链路可追踪（提交→确认→完成）
3. 合约可多链部署并给出逐链结果
4. 浏览器支持区块/交易/地址/合约查询
5. 链节点监控可见在线/离线/告警
6. DID 完成登记-查询-撤销闭环
7. 无身份请求访问敏感接口返回 401
8. 无权限请求访问敏感接口返回 403
9. 非法 JSON 返回 400，超大 body 返回 413

---

## 11. 里程碑与人天评估（建议）
- W1-W2：链适配、上链 API、SDK（8~12 人天）
- W3-W4：浏览器、链节点监控（8~10 人天）
- W5-W6：合约部署、RBAC（10~12 人天）
- W7：DID + CA 联调（6~8 人天）
- W8：测试/压测/安全整改/UAT（8~10 人天）

---

## 12. 风险与应对
- 多链差异：适配层插件化
- 节点不稳定：节点池+故障切换
- 安全缺陷：安全基线门禁+回归测试
- 国密/CA复杂：先做 PoC，接口前置冻结

---

## 13. 交付物清单
1. `docs/prd-v1.1.md`（本文件）
2. `docs/tech-design.md`
3. `docs/tasks.md`
4. `docs/demo-script.md`
5. `web/` 前端 MVP 控制台

> 如确认 v1.1，可将此版本升级为主 PRD（覆盖 `docs/prd.md`）。
