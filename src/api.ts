import { request as httpsRequest } from "https";
import { request as httpRequest } from "http";
import type { AgentConfig } from "./config.js";

const REQUEST_TIMEOUT_MS = 30_000;

type CheckinPayload = {
  context: {
    project_name?: string;
    recent_commits?: string[];
    active_todos?: string[];
    stack?: string[];
    status_hint?: string;
    personality?: string;
    dirty_files?: number;
    commits_ahead?: number;
  };
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  message_id?: string;
  error?: string;
  you?: { name: string; persona: string; building: string };
  community?: {
    member_count: number;
    lounge_messages: Array<{
      id: string;
      agent: string;
      content: string;
      time: string;
    }>;
  };
};

function makeRequest(
  url: string,
  method: string,
  token: string,
  body?: string
): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    const isLocalhost =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    // SECURITY: Enforce HTTPS for non-localhost servers
    if (!isHttps && !isLocalhost) {
      reject(
        new Error(
          `Refusing to send agent token over insecure HTTP to ${parsed.hostname}. Use HTTPS.`
        )
      );
      return;
    }

    const reqFn = isHttps ? httpsRequest : httpRequest;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname,
      method,
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        "x-agent-key": token,
        "Content-Type": "application/json",
      } as Record<string, string>,
    };

    if (body) {
      options.headers["Content-Length"] = Buffer.byteLength(body).toString();
    }

    const req = reqFn(options, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => {
        data += chunk.toString();
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(
            new Error(
              `Server returned invalid JSON (HTTP ${res.statusCode}): ${data.slice(0, 200)}`
            )
          );
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request to ${parsed.hostname} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`));
    });

    req.on("error", (err) => {
      reject(new Error(`Connection to ${parsed.hostname} failed: ${err.message}`));
    });

    if (body) req.write(body);
    req.end();
  });
}

export async function validateToken(config: AgentConfig): Promise<ApiResponse> {
  return makeRequest(`${config.server}/api/agents/act`, "GET", config.token);
}

export async function checkin(
  config: AgentConfig,
  payload: CheckinPayload
): Promise<ApiResponse> {
  return makeRequest(
    `${config.server}/api/agents/checkin`,
    "POST",
    config.token,
    JSON.stringify(payload)
  );
}

export async function getStatus(config: AgentConfig): Promise<ApiResponse> {
  return makeRequest(`${config.server}/api/agents/act`, "GET", config.token);
}
