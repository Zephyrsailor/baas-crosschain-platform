const state = {
  apiBase: localStorage.getItem('apiBase') || '/api/v1',
  userId: localStorage.getItem('userId') || '',
};

const app = document.getElementById('app');
const statusEl = document.getElementById('status');
const sessionInfo = document.getElementById('session-info');

function setStatus(text, ok = true) {
  statusEl.textContent = text;
  statusEl.className = `status ${ok ? 'ok' : 'err'}`;
}

function updateSessionInfo() {
  sessionInfo.textContent = state.userId
    ? `已登录：${state.userId} | API: ${state.apiBase}`
    : '未登录';
}

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-request-id': `web-${Date.now()}`,
    ...(state.userId ? { 'x-user-id': state.userId } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${state.apiBase}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  return data.data;
}

function renderTable(headers, rows) {
  const head = headers.map((h) => `<th>${h}</th>`).join('');
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`)
    .join('');
  return `<table class="table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function loginPage() {
  app.innerHTML = `
    <div class="card">
      <h2>登录页</h2>
      <p>演示账号（后端内置）：u-admin / u-ops</p>
      <div class="form-grid">
        <div>
          <label>用户 ID（会写入请求头 x-user-id）</label>
          <input id="login-user" value="${state.userId || 'u-admin'}" />
        </div>
        <div>
          <label>API Base（支持真实路径配置）</label>
          <input id="login-api" value="${state.apiBase}" />
        </div>
      </div>
      <div style="margin-top:10px">
        <button id="btn-login">保存并测试健康检查</button>
      </div>
      <pre id="login-result">等待操作...</pre>
    </div>
  `;

  document.getElementById('btn-login').onclick = async () => {
    state.userId = document.getElementById('login-user').value.trim();
    state.apiBase = document.getElementById('login-api').value.trim() || '/api/v1';
    localStorage.setItem('userId', state.userId);
    localStorage.setItem('apiBase', state.apiBase);
    updateSessionInfo();
    try {
      const health = await api('/health', { method: 'GET', headers: {} });
      document.getElementById('login-result').textContent = JSON.stringify(health, null, 2);
      setStatus('登录配置已保存，健康检查通过');
    } catch (e) {
      setStatus(`登录保存成功，但健康检查失败：${e.message}`, false);
    }
  };
}

function onchainPage() {
  app.innerHTML = `
    <div class="card">
      <h2>上链任务页</h2>
      <div class="form-grid">
        <div>
          <label>链 ID</label>
          <input id="onchain-chain" value="evm-testnet" />
        </div>
        <div>
          <label>业务类型</label>
          <input id="onchain-type" value="invoice" />
        </div>
        <div class="full">
          <label>payload(JSON)</label>
          <textarea id="onchain-payload" rows="4">{"orderId":"A1001","amount":2000}</textarea>
        </div>
      </div>
      <button id="btn-submit-onchain">提交上链任务</button>
      <pre id="onchain-result">等待操作...</pre>
    </div>
    <div class="card">
      <h3>查询任务状态</h3>
      <div class="form-grid">
        <div><input id="task-id" placeholder="输入 taskId" /></div>
        <div><button id="btn-query-task" class="secondary">查询</button></div>
      </div>
      <pre id="task-result">等待操作...</pre>
    </div>
  `;

  document.getElementById('btn-submit-onchain').onclick = async () => {
    try {
      const payload = JSON.parse(document.getElementById('onchain-payload').value || '{}');
      const data = await api('/onchain/data', {
        method: 'POST',
        body: JSON.stringify({
          chainId: document.getElementById('onchain-chain').value,
          bizType: document.getElementById('onchain-type').value,
          payload,
          requestId: `biz-${Date.now()}`,
        }),
      });
      document.getElementById('onchain-result').textContent = JSON.stringify(data, null, 2);
      document.getElementById('task-id').value = data.taskId || '';
      setStatus('上链任务已提交');
    } catch (e) {
      setStatus(`上链提交失败：${e.message}`, false);
    }
  };

  document.getElementById('btn-query-task').onclick = async () => {
    const taskId = document.getElementById('task-id').value.trim();
    if (!taskId) return setStatus('请先输入 taskId', false);
    try {
      const data = await api(`/onchain/tasks/${taskId}`);
      document.getElementById('task-result').textContent = JSON.stringify(data, null, 2);
      setStatus('任务状态查询成功');
    } catch (e) {
      setStatus(`任务查询失败：${e.message}`, false);
    }
  };
}

function contractsPage() {
  app.innerHTML = `
    <div class="card">
      <h2>合约部署页</h2>
      <div class="form-grid">
        <div><label>合约名</label><input id="contract-name" value="Escrow" /></div>
        <div><label>版本</label><input id="contract-version" value="v1.0.0" /></div>
        <div class="full"><label>目标链（逗号分隔）</label><input id="contract-targets" value="evm-testnet,fisco-dev" /></div>
      </div>
      <button id="btn-deploy">发起部署</button>
      <pre id="deploy-result">等待操作...</pre>
    </div>
    <div class="card">
      <h3>查询部署任务</h3>
      <div class="form-grid">
        <div><input id="deploy-job-id" placeholder="输入 jobId" /></div>
        <div><button id="btn-query-job" class="secondary">查询</button></div>
      </div>
      <pre id="job-result">等待操作...</pre>
    </div>
  `;

  document.getElementById('btn-deploy').onclick = async () => {
    try {
      const targetChains = document
        .getElementById('contract-targets')
        .value.split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      const data = await api('/contracts/deploy', {
        method: 'POST',
        body: JSON.stringify({
          contractName: document.getElementById('contract-name').value,
          version: document.getElementById('contract-version').value,
          targetChains,
        }),
      });
      document.getElementById('deploy-result').textContent = JSON.stringify(data, null, 2);
      document.getElementById('deploy-job-id').value = data.jobId || '';
      setStatus('部署任务已创建');
    } catch (e) {
      setStatus(`部署失败：${e.message}`, false);
    }
  };

  document.getElementById('btn-query-job').onclick = async () => {
    const id = document.getElementById('deploy-job-id').value.trim();
    if (!id) return setStatus('请输入 jobId', false);
    try {
      const data = await api(`/contracts/jobs/${id}`);
      document.getElementById('job-result').textContent = JSON.stringify(data, null, 2);
      setStatus('部署任务查询成功');
    } catch (e) {
      setStatus(`部署任务查询失败：${e.message}`, false);
    }
  };
}

function monitorPage() {
  app.innerHTML = `
    <div class="card">
      <h2>链/节点监控页</h2>
      <button id="btn-load-monitor">刷新链与节点</button>
      <div id="monitor-list" style="margin-top:10px"></div>
    </div>
    <div class="card">
      <h3>更新节点健康状态</h3>
      <div class="form-grid">
        <div><label>节点 ID</label><input id="node-id" value="n-evm-1" /></div>
        <div>
          <label>健康状态</label>
          <select id="node-healthy"><option value="true">healthy</option><option value="false">unhealthy</option></select>
        </div>
      </div>
      <button id="btn-update-node">提交状态</button>
      <pre id="node-result">等待操作...</pre>
    </div>
    <div class="card">
      <h3>告警</h3>
      <button id="btn-alerts" class="secondary">刷新告警</button>
      <pre id="alerts-result">等待操作...</pre>
    </div>
  `;

  async function loadMonitor() {
    try {
      const data = await api('/chainops');
      const chainRows = data.chains.map((c) => [c.chainId, c.name, c.status, c.height]);
      const nodeRows = data.nodes.map((n) => [n.nodeId, n.chainId, n.url, String(n.healthy)]);
      document.getElementById('monitor-list').innerHTML = `
        <h4>链状态</h4>${renderTable(['chainId', 'name', 'status', 'height'], chainRows)}
        <h4>节点状态</h4>${renderTable(['nodeId', 'chainId', 'url', 'healthy'], nodeRows)}
      `;
      setStatus('链/节点信息已刷新');
    } catch (e) {
      setStatus(`监控刷新失败：${e.message}`, false);
    }
  }

  document.getElementById('btn-load-monitor').onclick = loadMonitor;
  document.getElementById('btn-update-node').onclick = async () => {
    try {
      const data = await api('/chainops/node/health', {
        method: 'POST',
        body: JSON.stringify({
          nodeId: document.getElementById('node-id').value,
          healthy: document.getElementById('node-healthy').value === 'true',
        }),
      });
      document.getElementById('node-result').textContent = JSON.stringify(data, null, 2);
      setStatus('节点状态更新成功');
      loadMonitor();
    } catch (e) {
      setStatus(`节点更新失败：${e.message}`, false);
    }
  };
  document.getElementById('btn-alerts').onclick = async () => {
    try {
      const data = await api('/chainops/alerts');
      document.getElementById('alerts-result').textContent = JSON.stringify(data, null, 2);
      setStatus('告警刷新成功');
    } catch (e) {
      setStatus(`告警刷新失败：${e.message}`, false);
    }
  };

  loadMonitor();
}

function explorerPage() {
  app.innerHTML = `
    <div class="card">
      <h2>区块浏览器页</h2>
      <button id="btn-overview">加载概览</button>
      <pre id="overview-result">等待操作...</pre>
    </div>
    <div class="card">
      <h3>搜索交易 / 块 / 地址</h3>
      <div class="form-grid">
        <div><input id="search-q" placeholder="例如 0xabc / block / addr" /></div>
        <div><button id="btn-search" class="secondary">搜索</button></div>
      </div>
      <pre id="search-result">等待操作...</pre>
    </div>
  `;

  document.getElementById('btn-overview').onclick = async () => {
    try {
      const data = await api('/explorer/overview');
      document.getElementById('overview-result').textContent = JSON.stringify(data, null, 2);
      setStatus('浏览器概览加载成功');
    } catch (e) {
      setStatus(`概览加载失败：${e.message}`, false);
    }
  };

  document.getElementById('btn-search').onclick = async () => {
    const q = encodeURIComponent(document.getElementById('search-q').value.trim());
    if (!q) return setStatus('请输入搜索关键字', false);
    try {
      const data = await api(`/explorer/search?q=${q}`);
      document.getElementById('search-result').textContent = JSON.stringify(data, null, 2);
      setStatus('搜索成功');
    } catch (e) {
      setStatus(`搜索失败：${e.message}`, false);
    }
  };
}

function didPage() {
  app.innerHTML = `
    <div class="card">
      <h2>DID 管理页</h2>
      <div class="form-grid">
        <div><label>主体名称</label><input id="did-name" value="Alice Corp" /></div>
        <div><label>主体类型</label><input id="did-type" value="enterprise" /></div>
      </div>
      <button id="btn-register-did">注册 DID</button>
      <pre id="did-register-result">等待操作...</pre>
    </div>
    <div class="card">
      <h3>撤销 DID</h3>
      <div class="form-grid">
        <div><input id="did-value" placeholder="did:example:xxxx" /></div>
        <div><button id="btn-revoke-did" class="secondary">撤销</button></div>
      </div>
      <pre id="did-revoke-result">等待操作...</pre>
    </div>
    <div class="card">
      <h3>DID 列表</h3>
      <button id="btn-list-did">刷新列表</button>
      <pre id="did-list-result">等待操作...</pre>
    </div>
  `;

  document.getElementById('btn-register-did').onclick = async () => {
    try {
      const data = await api('/did/register', {
        method: 'POST',
        body: JSON.stringify({
          subjectName: document.getElementById('did-name').value,
          subjectType: document.getElementById('did-type').value,
        }),
      });
      document.getElementById('did-register-result').textContent = JSON.stringify(data, null, 2);
      document.getElementById('did-value').value = data.did || '';
      setStatus('DID 注册成功');
    } catch (e) {
      setStatus(`DID 注册失败：${e.message}`, false);
    }
  };

  document.getElementById('btn-revoke-did').onclick = async () => {
    try {
      const did = document.getElementById('did-value').value.trim();
      if (!did) return setStatus('请先输入 DID', false);
      const data = await api('/did/revoke', {
        method: 'POST',
        body: JSON.stringify({ did }),
      });
      document.getElementById('did-revoke-result').textContent = JSON.stringify(data, null, 2);
      setStatus('DID 撤销成功');
    } catch (e) {
      setStatus(`DID 撤销失败：${e.message}`, false);
    }
  };

  document.getElementById('btn-list-did').onclick = async () => {
    try {
      const data = await api('/did/list');
      document.getElementById('did-list-result').textContent = JSON.stringify(data, null, 2);
      setStatus('DID 列表加载成功');
    } catch (e) {
      setStatus(`DID 列表加载失败：${e.message}`, false);
    }
  };
}

function route() {
  const page = location.hash.replace('#/', '') || 'login';
  updateSessionInfo();
  setStatus('');
  switch (page) {
    case 'login':
      return loginPage();
    case 'onchain':
      return onchainPage();
    case 'contracts':
      return contractsPage();
    case 'monitor':
      return monitorPage();
    case 'explorer':
      return explorerPage();
    case 'did':
      return didPage();
    default:
      location.hash = '#/login';
  }
}

window.addEventListener('hashchange', route);
route();
