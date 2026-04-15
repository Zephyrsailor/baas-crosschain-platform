# 金赋水 BaaS 跨链平台（MVP）

一个面向企业的跨链 BaaS 平台最小可运行实现，覆盖统一上链、浏览器查询、跨链部署、链节点治理、DID+CA、RBAC 与审计。

## 已实现模块

- 统一网关 API（`src/server.js`）
- 链适配层（`ChainAdapter`）
- 上链任务服务（幂等 requestId）
- 浏览器服务（概览 + 搜索）
- 合约跨链部署服务（逐链结果）
- 链/节点治理与告警服务
- DID 注册/撤销 + CA 适配
- IAM RBAC 权限校验
- 审计日志服务

## 目录结构

- `src/server.js`：统一 API 入口
- `src/adapters/`：链适配、CA 适配
- `src/services/`：业务服务层
- `src/iam/rbac.js`：权限控制
- `src/data/store.js`：内存数据存储（MVP）
- `tests/`：服务与 API 测试
- `docs/`：PRD、技术设计、任务拆分

## 快速开始

```bash
cd /Users/zephyr/Desktop/lab/deep-research/ai-pipeline/projects/baas-crosschain-platform
npm install
npm start
```

默认启动地址：`http://localhost:3300`

## 运行测试

```bash
npm test
```

## 关键接口（MVP）

- `GET /api/v1/health`
- `POST /api/v1/onchain/data`
- `GET /api/v1/onchain/tasks/:id`
- `GET /api/v1/explorer/overview`
- `GET /api/v1/explorer/search?q=`
- `POST /api/v1/contracts/deploy`
- `GET /api/v1/contracts/jobs/:id`
- `GET /api/v1/chainops`
- `POST /api/v1/chainops/node/health`
- `GET /api/v1/chainops/alerts`
- `POST /api/v1/did/register`
- `POST /api/v1/did/revoke`
- `GET /api/v1/did/list`
- `GET /api/v1/audit/logs`

## 说明

当前为 MVP 演示版：
- 数据存储为内存（重启后重置）
- 链交易与 CA 流程为 mock/抽象实现
- 已预留 Adapter 与服务边界，便于接入真实链节点、数据库与消息队列
