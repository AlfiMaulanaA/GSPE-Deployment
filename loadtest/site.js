import http from "k6/http";
import { check, sleep } from "k6";

const targetUrl = (__ENV.TARGET_URL || "").replace(/\/$/, "");
const profile = __ENV.TEST_PROFILE || "smoke";

if (!targetUrl) {
  throw new Error("TARGET_URL is required");
}

const scenarios = {
  smoke: {
    executor: "constant-vus",
    vus: 1,
    duration: "15s",
  },
  load: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "30s", target: 5 },
      { duration: "1m", target: 10 },
      { duration: "30s", target: 0 },
    ],
    gracefulRampDown: "10s",
  },
};

if (!scenarios[profile]) {
  throw new Error(`Unknown TEST_PROFILE: ${profile}`);
}

export const options = {
  scenarios: { website: scenarios[profile] },
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500", "p(99)<2500"],
  },
};

export default function runWebsiteScenario() {
  const response = http.get(`${targetUrl}/`, {
    tags: { page: "home" },
    timeout: "10s",
  });

  check(response, {
    "home page returns HTTP 200": (res) => res.status === 200,
    "home page has HTML content": (res) =>
      (res.headers["Content-Type"] || "").includes("text/html"),
  });

  sleep(1);
}
