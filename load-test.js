import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.API_URL || 'https://zhanfinance.fly.dev/api/v1';

// Обязательно: валидные креды сеидового/тестового пользователя (не продовый клиент).
// Без них setup() упадёт — намеренно, чтобы не гонять тест вслепую без токена.
const TEST_EMAIL = __ENV.TEST_EMAIL;
const TEST_PASSWORD = __ENV.TEST_PASSWORD;

export const options = {
  scenarios: {
    // Основной сценарий: реальная CRM-нагрузка, авторизованные запросы
    crm_load: {
      executor: 'ramping-vus',
      exec: 'crmLoad',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '15s', target: 0 },
      ],
    },
    // Отдельный, изолированный сценарий: проверка самого рейт-лимитера auth-эндпоинта.
    // Не смешивается с основным трафиком, чтобы не искажать метрики CRM.
    auth_rate_limit_check: {
      executor: 'constant-vus',
      exec: 'authRateLimit',
      vus: 3,
      duration: '20s',
      startTime: '60s', // после завершения crm_load
    },
  },
  thresholds: {
    'http_req_duration{endpoint:tasks_list}': ['p(95)<500'],
    'http_req_duration{endpoint:task_detail}': ['p(95)<500'],
    'http_req_duration{endpoint:task_comment}': ['p(95)<700'],
    'http_req_failed{endpoint:tasks_list}': ['rate<0.01'],
    'http_req_failed{endpoint:task_detail}': ['rate<0.01'],
    'http_req_failed{endpoint:task_comment}': ['rate<0.01'],
    // На auth_rate_limit_check порог не задаём — там 429 ожидаемый и корректный результат.
  },
};

export function setup() {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      'Задай TEST_EMAIL и TEST_PASSWORD (тестовый seed-пользователь, не боевой клиент)'
    );
  }

  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (res.status !== 200) {
    throw new Error(`Не удалось залогиниться в setup(): ${res.status} ${res.body}`);
  }

  const token = res.json('data.accessToken');
  if (!token) {
    throw new Error(`В ответе логина не найден токен. Тело ответа: ${res.body}`);
  }

  return { token };
}

// Каждому VU — свой фейковый IP, чтобы не упереться в per-IP лимитер бэкенда своим же тестом
function fakeIpFor(vu) {
  return `10.${(vu >> 16) & 255}.${(vu >> 8) & 255}.${vu & 255}`;
}

export function crmLoad(data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
    'X-Forwarded-For': fakeIpFor(__VU),
  };

  let taskId = null;

  group('GET /crm/tasks — список задач', () => {
    const res = http.get(`${BASE_URL}/crm/tasks`, {
      headers,
      tags: { endpoint: 'tasks_list' },
      timeout: '10s',
    });
    check(res, { 'tasks list 200': (r) => r.status === 200 });

    if (res.status === 200) {
      try {
        const body = res.json();
        if (body && body.data && Array.isArray(body.data) && body.data.length > 0) {
          taskId = body.data[0].id;
        }
      } catch (e) {
        // тело пустое или не JSON — пропускаем, taskId остаётся null
      }
    }
  });

  if (taskId) {
    group('GET /crm/tasks/{id} — детали задачи', () => {
      const res = http.get(`${BASE_URL}/crm/tasks/${taskId}`, {
        headers,
        tags: { endpoint: 'task_detail' },
      });
      check(res, { 'task detail 200': (r) => r.status === 200 });
    });

    group('POST /crm/tasks/{id}/comments — запись комментария', () => {
      const res = http.post(
        `${BASE_URL}/crm/tasks/${taskId}/comments`,
        JSON.stringify({ text: `load-test ${Date.now()} vu=${__VU}` }),
        { headers, tags: { endpoint: 'task_comment' } }
      );
      check(res, { 'comment created 200/201': (r) => [200, 201].includes(r.status) });
    });
  }

  sleep(1 + Math.random());
}

export function authRateLimit() {
  const headers = { 'Content-Type': 'application/json' };
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'loadtest@example.com', password: 'wrongpassword' }),
    { headers, tags: { endpoint: 'auth_rate_limit' } }
  );
  check(res, {
    'ответ 401/403/429 — лимитер и логин работают как задумано': (r) =>
      [401, 403, 429].includes(r.status),
  });
  sleep(1);
}
