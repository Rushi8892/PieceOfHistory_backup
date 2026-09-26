import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { test } from "node:test";

const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? "/repl/tools/bin/chromium";
const DEFAULT_BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "http://127.0.0.1:25721";
const BASE_URL = (process.env.E2E_BASE_URL ?? DEFAULT_BASE_URL).replace(
  /\/+$/,
  "",
);
const API_HEALTH_URL = (
  process.env.E2E_API_HEALTH_URL ?? `${BASE_URL}/api/healthz`
).replace(/\/+$/, "");
const READINESS_TIMEOUT_MS = 5_000;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function assertServiceReady(
  serviceName: string,
  url: string,
  expectedHealthStatus?: string,
  fetchImplementation: typeof fetch = fetch,
) {
  let response: Response;
  try {
    response = await fetchImplementation(url, {
      signal: AbortSignal.timeout(READINESS_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(
      `Archive link release check preflight failed: ${serviceName} is unreachable at ${url}. ` +
        `Start the ${serviceName} workflow and retry (${errorMessage(error)}).`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Archive link release check preflight failed: ${serviceName} at ${url} returned HTTP ${response.status}. ` +
        `Start or fix the ${serviceName} workflow and retry.`,
    );
  }

  if (expectedHealthStatus === undefined) return;

  let body: { status?: unknown };
  try {
    body = (await response.json()) as { status?: unknown };
  } catch (error) {
    throw new Error(
      `Archive link release check preflight failed: API health endpoint ${url} returned invalid JSON. ` +
        `Fix the API workflow and retry (${errorMessage(error)}).`,
    );
  }

  if (body.status !== expectedHealthStatus) {
    throw new Error(
      `Archive link release check preflight failed: API health endpoint ${url} returned status ` +
        `${JSON.stringify(body.status)} instead of ${JSON.stringify(expectedHealthStatus)}. ` +
        `Fix the API workflow and retry.`,
    );
  }
}

async function assertReleaseServicesReady() {
  await assertServiceReady("frontend", `${BASE_URL}/`);
  await assertServiceReady("API", API_HEALTH_URL, "ok");
}

function assertErrorContains(error: unknown, expectedFragments: string[]) {
  assert.ok(error instanceof Error);
  for (const fragment of expectedFragments) {
    assert.ok(
      error.message.includes(fragment),
      `Expected error to contain ${JSON.stringify(fragment)}, received: ${error.message}`,
    );
  }
  return true;
}

test("release check preflight reports an unreachable frontend", async () => {
  const endpoint = "http://frontend.example.test/";
  await assert.rejects(
    () =>
      assertServiceReady(
        "frontend",
        endpoint,
        undefined,
        async () => {
          throw new Error("connection refused");
        },
      ),
    (error: unknown) =>
      assertErrorContains(error, [
        "frontend",
        endpoint,
        "Start the frontend workflow and retry",
      ]),
  );
});

test("release check preflight reports a timed-out API request", async () => {
  const endpoint = "http://api.example.test/api/healthz";
  await assert.rejects(
    () =>
      assertServiceReady(
        "API",
        endpoint,
        "ok",
        async () => {
          throw new DOMException(
            "The operation was aborted due to timeout",
            "TimeoutError",
          );
        },
      ),
    (error: unknown) =>
      assertErrorContains(error, [
        "API",
        endpoint,
        "The operation was aborted due to timeout",
        "Start the API workflow and retry",
      ]),
  );
});

test("release check preflight reports an unhealthy API response", async () => {
  const endpoint = "http://api.example.test/api/healthz";
  await assert.rejects(
    () =>
      assertServiceReady(
        "API",
        endpoint,
        undefined,
        async () => new Response("service unavailable", { status: 503 }),
      ),
    (error: unknown) =>
      assertErrorContains(error, [
        "API",
        endpoint,
        "HTTP 503",
        "Start or fix the API workflow and retry",
      ]),
  );
});

test("release check preflight reports invalid API health JSON", async () => {
  const endpoint = "http://api.example.test/api/healthz";
  await assert.rejects(
    () =>
      assertServiceReady(
        "API",
        endpoint,
        "ok",
        async () => new Response("{invalid-json", { status: 200 }),
      ),
    (error: unknown) =>
      assertErrorContains(error, [
        "API",
        endpoint,
        "invalid JSON",
        "Fix the API workflow and retry",
      ]),
  );
});

test("release check preflight reports a non-ok API health payload", async () => {
  const endpoint = "http://api.example.test/api/healthz";
  await assert.rejects(
    () =>
      assertServiceReady(
        "API",
        endpoint,
        "ok",
        async () =>
          new Response(JSON.stringify({ status: "degraded" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    (error: unknown) =>
      assertErrorContains(error, [
        "API",
        endpoint,
        '"degraded"',
        '"ok"',
        "Fix the API workflow and retry",
      ]),
  );
});

type CdpMessage = {
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { message: string };
};

class CdpClient {
  private nextId = 1;
  private readonly pending = new Map<number, {
    resolve: (message: CdpMessage) => void;
    reject: (error: Error) => void;
  }>();
  private readonly events = new Map<string, Array<(message: CdpMessage) => void>>();

  private constructor(private readonly socket: WebSocket) {
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as CdpMessage;
      if (message.id !== undefined) {
        const request = this.pending.get(message.id);
        if (!request) return;
        this.pending.delete(message.id);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message);
        return;
      }

      if (!message.method) return;
      for (const listener of this.events.get(message.method) ?? []) listener(message);
    });
  }

  static async connect(url: string): Promise<CdpClient> {
    const socket = await new Promise<WebSocket>((resolve, reject) => {
      const candidate = new WebSocket(url);
      candidate.addEventListener("open", () => resolve(candidate));
      candidate.addEventListener("error", () => reject(new Error(`Could not connect to ${url}`)));
    });
    return new CdpClient(socket);
  }

  send(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<CdpMessage> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  waitForEvent(method: string, timeoutMs = 10_000): Promise<CdpMessage> {
    return new Promise((resolve, reject) => {
      const listeners = this.events.get(method) ?? [];
      const listener = (message: CdpMessage) => {
        clearTimeout(timeout);
        this.events.set(method, listeners.filter((entry) => entry !== listener));
        resolve(message);
      };
      listeners.push(listener);
      this.events.set(method, listeners);
      const timeout = setTimeout(() => {
        this.events.set(method, listeners.filter((entry) => entry !== listener));
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
    });
  }

  close() {
    this.socket.close();
  }
}

class ChromiumPage {
  private constructor(
    private readonly process: ChildProcessWithoutNullStreams,
    private readonly tempProfile: string,
    private readonly cdp: CdpClient,
    private readonly sessionId: string,
  ) {}

  static async launch(): Promise<ChromiumPage> {
    const tempProfile = await mkdtemp(join(tmpdir(), "piece-of-history-browser-"));
    const browser = spawn(CHROMIUM_PATH, [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--remote-debugging-port=0",
      `--user-data-dir=${tempProfile}`,
      "about:blank",
    ]);

    const endpoint = await new Promise<string>((resolve, reject) => {
      let output = "";
      const onData = (chunk: Buffer) => {
        output += chunk.toString();
        const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
        if (match) resolve(match[1]);
      };
      browser.stderr.on("data", onData);
      browser.stdout.on("data", onData);
      browser.once("error", reject);
      browser.once("exit", (code) => reject(new Error(`Chromium exited before startup (${code}): ${output}`)));
    });

    const cdp = await CdpClient.connect(endpoint);
    const targetResponse = await cdp.send("Target.createTarget", { url: "about:blank" });
    const targetId = String(targetResponse.result?.targetId);
    const attached = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    const sessionId = String(attached.result?.sessionId);
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    return new ChromiumPage(browser, tempProfile, cdp, sessionId);
  }

  async goto(url: string) {
    const loadEvent = this.cdp.waitForEvent("Page.loadEventFired");
    await this.cdp.send("Page.navigate", { url }, this.sessionId);
    await loadEvent;
  }

  async evaluate<T>(expression: string): Promise<T> {
    const response = await this.cdp.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    }, this.sessionId);
    const exception = response.result?.exceptionDetails as { text?: string } | undefined;
    if (exception) throw new Error(exception.text ?? "Browser evaluation failed");
    return (response.result?.result as { value: T }).value;
  }

  async waitFor<T>(expression: string, timeoutMs = 15_000): Promise<T> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const result = await this.evaluate<T | undefined>(expression);
      if (result !== undefined && result !== null && result !== false) return result as T;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Timed out waiting for browser condition: ${expression}`);
  }

  async close() {
    this.cdp.close();
    if (this.process.exitCode === null) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 2_000);
        this.process.once("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
        this.process.kill();
      });
    }
    await rm(this.tempProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

function archiveLinkState(selector: string) {
  return `(() => {
    const link = document.querySelector(${JSON.stringify(selector)});
    if (!link) return null;
    return {
      href: link.getAttribute("href"),
      path: window.location.pathname,
    };
  })()`;
}

function detailState() {
  return `(() => {
    const loaded = Boolean(document.querySelector('[data-testid="data-archive-detail"]'));
    return loaded ? { path: window.location.pathname, loaded } : null;
  })()`;
}

async function clickAndReadDetail(page: ChromiumPage, href: string) {
  await page.evaluate(`document.querySelector('a[href="${href}"]')?.click()`);
  return page.waitFor<{ path: string; loaded: boolean }>(detailState());
}

test("seeded archive links use date-only hrefs and open their matching detail page", async () => {
  await assertReleaseServicesReady();
  const page = await ChromiumPage.launch();
  try {
    await page.goto(`${BASE_URL}/`);

    const homepage = await page.waitFor<{ href: string; path: string }>(
      archiveLinkState('a[data-testid^="link-home-history-"]'),
    );
    assert.match(homepage.href, /^\/archive\/\d{4}-\d{2}-\d{2}$/);
    const homepageDate = homepage.href.slice("/archive/".length);

    const homepageDetail = await clickAndReadDetail(page, homepage.href);
    assert.equal(homepageDetail.path, homepage.href);
    assert.equal(homepageDetail.loaded, true);

    await page.goto(`${BASE_URL}/archive`);
    const archive = await page.waitFor<{ href: string; path: string }>(
      archiveLinkState('a[data-testid^="link-archive-item-"]'),
    );
    assert.match(archive.href, /^\/archive\/\d{4}-\d{2}-\d{2}$/);
    assert.equal(archive.href, homepage.href);
    assert.equal(archive.href.slice("/archive/".length), homepageDate);

    const archiveDetail = await clickAndReadDetail(page, archive.href);
    assert.equal(archiveDetail.path, archive.href);
    assert.equal(archiveDetail.loaded, true);

    await page.goto(`${BASE_URL}/archive`);
    await page.waitFor<{ href: string; path: string }>(
      archiveLinkState('a[data-testid^="link-archive-item-"]'),
    );
    await page.evaluate("document.querySelector('[data-testid=\"button-archive-next\"]')?.click()");

    const laterArchive = await page.waitFor<{ href: string; path: string }>(`(() => {
      const link = document.querySelector('a[data-testid^="link-archive-item-"]');
      const href = link?.getAttribute("href");
      return href && href !== ${JSON.stringify(archive.href)}
        ? { href, path: window.location.pathname }
        : null;
    })()`);
    assert.match(laterArchive.href, /^\/archive\/\d{4}-\d{2}-\d{2}$/);
    assert.notEqual(laterArchive.href, archive.href);

    const laterArchiveDetail = await clickAndReadDetail(page, laterArchive.href);
    assert.equal(laterArchiveDetail.path, laterArchive.href);
    assert.equal(laterArchiveDetail.loaded, true);
  } finally {
    await page.close();
  }
});