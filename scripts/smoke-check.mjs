#!/usr/bin/env node
import { spawn } from "node:child_process";
import { getPort, checkPort } from "get-port-please";
import waitOn from "wait-on";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const FIXED_PORT = 6103;
const PORT_CHECK_TIMEOUT = 5000;

function logStep(msg) {
  console.log(`\n🔍 [smoke] ${msg}`);
}

function logSuccess(msg) {
  console.log(`✅ [smoke] ${msg}`);
}

function logWarn(msg) {
  console.log(`⚠️  [smoke] ${msg}`);
}

function logError(msg) {
  console.error(`❌ [smoke] ${msg}`);
}

async function ensureDistExists() {
  if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, "index.html"))) {
    logStep("dist 目录不存在或不完整，先执行 build...");
    await new Promise((resolve, reject) => {
      const child = spawn("npm", ["run", "build"], {
        cwd: projectRoot,
        stdio: "inherit",
        shell: process.platform === "win32"
      });
      child.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`build 失败，退出码 ${code}`));
      });
      child.on("error", reject);
    });
  } else {
    logStep("检测到已存在的 dist 目录，跳过 build");
  }
}

async function resolvePort() {
  const checkResult = await checkPort(FIXED_PORT, "127.0.0.1");
  const isFixedPortTaken = checkResult === false;

  if (isFixedPortTaken) {
    logWarn(`固定端口 ${FIXED_PORT} 已被占用，为避免流水线误失败，将使用动态空闲端口...`);
    const freePort = await getPort({
      portRange: [49152, 65535],
      random: true,
      host: "127.0.0.1"
    });
    return { port: freePort, isFixed: false };
  }

  return { port: FIXED_PORT, isFixed: true };
}

function startPreview(port) {
  logStep(`启动 vite preview 服务（端口 ${port}）...`);
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
      {
        cwd: projectRoot,
        stdio: ["ignore", "pipe", "pipe"],
        shell: process.platform === "win32"
      }
    );

    let stderrBuf = "";
    child.stderr?.on("data", (d) => {
      stderrBuf += d.toString();
    });

    child.on("error", reject);
    child.on("spawn", () => resolve({ child, stderrBuf: () => stderrBuf }));
  });
}

async function waitForServer(port) {
  logStep(`等待服务就绪（http://127.0.0.1:${port}）...`);
  await waitOn({
    resources: [`http://127.0.0.1:${port}/`],
    delay: 500,
    interval: 300,
    timeout: 30000,
    tcpTimeout: 5000,
    validateStatus: (status) => status >= 200 && status < 500
  });
}

async function fetchAndAssert(port) {
  logStep("发起 HTTP 请求并检查响应...");
  const res = await fetch(`http://127.0.0.1:${port}/`);
  if (!res.ok) {
    throw new Error(`HTTP 状态码异常：${res.status}`);
  }
  const html = await res.text();
  if (!html.includes(`<title>昆虫旅馆</title>`)) {
    throw new Error("响应 HTML 中未找到预期的 <title>昆虫旅馆</title>");
  }
  if (!html.includes(`<div id="root"></div>`)) {
    throw new Error("响应 HTML 中未找到 React 挂载点 <div id=\"root\"></div>");
  }
  if (!/\/assets\/index-[A-Za-z0-9-]+\.js/.test(html)) {
    throw new Error("响应 HTML 中未找到构建后的 JS 资源 (/assets/index-*.js)");
  }
  if (!/\/assets\/index-[A-Za-z0-9-]+\.css/.test(html)) {
    throw new Error("响应 HTML 中未找到构建后的 CSS 资源 (/assets/index-*.css)");
  }
  logSuccess("HTML 响应校验通过：包含 title、root 挂载点、构建后的 JS 与 CSS 资源");
}

async function main() {
  logStep("=== 开始冒烟检查 ===");

  try {
    await ensureDistExists();

    const { port, isFixed } = await resolvePort();
    if (isFixed) {
      logSuccess(`固定端口 ${FIXED_PORT} 可用，将使用此端口`);
    }

    const { child } = await startPreview(port);
    let stopCalled = false;
    const stopServer = () => {
      if (stopCalled) return;
      stopCalled = true;
      logStep("关闭 preview 服务...");
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", String(child.pid), "/f", "/t"]);
        } else {
          process.kill(-child.pid, "SIGTERM");
        }
      } catch (_) {
        child.kill("SIGKILL");
      }
    };

    process.on("SIGINT", () => { stopServer(); process.exit(130); });
    process.on("SIGTERM", () => { stopServer(); process.exit(143); });

    try {
      await waitForServer(port);
      logSuccess(`服务已就绪，端口 ${port}`);

      await fetchAndAssert(port);
    } finally {
      stopServer();
      await new Promise((r) => setTimeout(r, 800));
    }

    logSuccess("=== 冒烟检查全部通过 🎉 ===");
    process.exit(0);
  } catch (err) {
    logError(err instanceof Error ? err.message : String(err));
    logError("=== 冒烟检查失败 ===");
    process.exit(1);
  }
}

main();
