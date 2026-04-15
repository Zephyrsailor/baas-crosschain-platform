# 技术设计文档：金赋水 BaaS 跨链平台

- 项目：`baas-crosschain-platform`
- 版本：v1.0（对应 PRD v1.0）
- PRD：`/Users/zephyr/Desktop/lab/deep-research/ai-pipeline/projects/baas-crosschain-platform/docs/prd.md`

---

## 1. 设计目标与范围

### 1.1 目标
面向企业级跨链基础设施，交付统一 BaaS 平台能力：
1. 统一数据上链 API + SDK（Java/Node.js）
2. 多链浏览器（区块/交易/地址/合约 + 全局搜索）
3. 跨链合约部署（模板管理 + 批量部署 + 结果追踪）
4. 链与节点治理（注册、监控、告警、故障切换）
5. DID + CA + 国密认证闭环
6. 用户与权限体系（RBAC + 自助门户 + 审计日志）

### 1.2 非目标
- 完整跨链资产桥
- 商业计费结算
- 外部 SaaS 商城化

---

## 2. 总体架构

采用**分层微服务 + 插件化链适配**架构：

1. **接入层（API Gateway）**
   - 统一鉴权、签名校验、防重放、限流
   - 路由到各业务服务

2. **业务服务层**
   - Onchain Service（数据上链/任务管理）
   - Explorer Service（浏览器查询与聚合）
   - Contract Service（模板、构建、跨链部署）
   - ChainOps Service（链/节点管理、告警）
   - DID Service（登记、认证、吊销）
   - IAM Service（用户、角色、权限、Token）
   - Audit Service（审计日志、检索、归档）

3. **能力适配层**
   - Chain Adapter（EVM/FISCO/Fabric 等插件接口）
   - CA Adapter（厂商差异屏蔽）
   - Crypto Provider（SM2/SM3/SM4 + 标准算法）

4. **数据与基础设施层**
   - PostgreSQL（事务数据）
   - Redis（缓存/幂等键/短期状态）
   - Kafka/RabbitMQ（异步任务与事件总线）
   - Object Storage（合约产物、日志归档）
   - Prometheus + Grafana + Alertmanager（监控告警）

---

## 3. 核心模块设计

## 3.1 数据上链模块

### 功能
- 同步提交、异步确认
- 幂等与防重复
- 批量任务、重试与失败分类

### 关键设计
- `requestId` 作为幂等主键（tenantId + bizKey + payloadHash）
- 提交成功即返回 `taskId/requestId/txHash?`
- 通过任务状态机推进：
  - `PENDING -> SUBMITTED -> CONFIRMING -> SUCCESS | FAILED`

### 接口
- `POST /api/v1/onchain/data`
- `GET /api/v1/onchain/tasks/{id}`

## 3.2 SDK 套件
- Java / Node.js 首发
- 内置签名、重试、超时、回调
- 统一错误码：签名失败、链拒绝、节点异常、Gas不足

## 3.3 区块链浏览器模块
- 多链看板：高度、TPS、24h 交易量、活跃地址
- 查询：区块/交易/地址/合约
- 全局搜索：区块号、TxHash、地址、合约地址
- 数据来源：链索引器（异步消费链事件并入库）

## 3.4 跨链合约部署模块
- 模板管理：上传、版本、标签
- 构建校验：语法/依赖/环境参数
- 批量跨链部署：逐链结果、失败重试、可选回滚策略
- 结果模型：`chainId -> deployStatus -> contractAddress/error`

## 3.5 链与节点管理模块
- 链注册与版本化配置
- 节点池（主备、权重、健康检查、自动切换）
- 事务清单与执行状态追踪
- 告警规则：离线、同步停滞、超时、错误率突增

## 3.6 DID + CA + 国密模块
- DID 生命周期：创建、绑定、撤销
- 证书签发与验签：CA Adapter
- 国密能力：SM2 签名、SM3 摘要、SM4 加密
- 凭证摘要上链，保留隐私原文在链下安全存储

## 3.7 用户管理与审计模块
- RBAC 资源级权限控制（Tenant/Chain/API/Console）
- 自助门户：注册、资料维护、密码重置
- API Key/Token：签发、轮换、吊销、白名单
- 审计日志：谁在何时对何资源执行何操作（不可篡改）

---

## 4. 数据模型（核心实体）

- `tenant`
- `user`
- `role` / `permission` / `role_permission`
- `chain` / `node`
- `onchain_task` / `onchain_task_event`
- `contract_template` / `contract_deploy_job` / `contract_deploy_result`
- `did_profile` / `did_credential` / `did_revocation`
- `api_credential`
- `audit_log`

关键索引建议：
- `onchain_task(request_id, tenant_id)` 唯一
- `contract_deploy_result(job_id, chain_id)` 唯一
- `audit_log(tenant_id, actor_id, created_at)` 复合索引

---

## 5. API 设计原则

1. RESTful + 统一响应结构（code/message/data/requestId）
2. 幂等接口要求 `Idempotency-Key`
3. 签名头：`X-Timestamp/X-Nonce/X-Signature`
4. 错误码分层：平台错误 / 业务错误 / 链适配错误
5. OpenAPI 3.0 文档自动生成

---

## 6. 非功能设计

### 6.1 性能
- 上链接口 P95 <= 800ms（不含链确认）
- 查询接口 P95 <= 500ms

### 6.2 可用性
- 核心 API >= 99.9%
- 节点池自动切换，单节点故障无感降级

### 6.3 安全
- 全链路 TLS
- HMAC/SM2 请求签名 + 防重放
- 最小权限 RBAC
- 审计日志防篡改（哈希链或WORM存储）

### 6.4 合规
- 国密算法支持
- CA 流程可审计
- 日志留存周期可配置

---

## 7. 监控与运维

- 指标：QPS、成功率、P95、链确认耗时、节点健康
- 日志：业务日志、审计日志、安全日志分级
- 告警：SLA、节点异常、任务堆积、失败率突增
- 灰度：按租户/链/接口维度灰度发布

---

## 8. 验收映射

1. 两条链接入成功：Chain Adapter + ChainOps
2. 上链任务全流程追踪：Onchain Task 状态机
3. 多链部署结果可见：Contract Deploy Result
4. 浏览器四类查询：Explorer Service
5. 节点看板与告警：ChainOps + Monitor
6. DID 闭环：DID Service + CA Adapter
7. RBAC 阻断越权：IAM + Audit

---

## 9. 里程碑实施方案（8周）

- W1-W2：链适配框架、Onchain API、SDK v1
- W3-W4：浏览器基础、链节点管理、告警
- W5-W6：合约部署、RBAC、门户、审计
- W7：DID/CA/国密联调
- W8：压测、安全测试、UAT 与上线准备

---

## 10. 风险与缓解

1. 多链协议差异
   - 插件化适配层 + 契约测试
2. 节点不稳定
   - 节点池健康探测 + 自动切换
3. 国密/CA 联调复杂
   - 提前 PoC + 并行联调
4. 权限模型过复杂
   - 先落地核心角色，逐步细化权限点
