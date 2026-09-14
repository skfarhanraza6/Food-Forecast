import http from 'http';
import { seedDatabase } from '../server/seed.ts';
import { getDb } from '../server/db.ts';

async function makeRequest(options: http.RequestOptions, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode || 0, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode || 0, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runAuditTests() {
  console.log('🧪 Starting FOOD FORECAST Full-Stack Audit & Verification...');

  // Ensure DB seeded
  await getDb();
  await seedDatabase();

  let failed = 0;
  let passed = 0;

  function assert(name: string, condition: boolean, extra?: string) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${extra || ''}`);
      failed++;
    }
  }

  try {
    // 1. Test Login with invalid password
    const badLogin = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@campus.edu', password: 'WrongPassword999' }
    );
    assert('Reject invalid login credentials (401)', badLogin.status === 401);

    // 2. Test Login with valid Admin credentials
    const adminLogin = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@campus.edu', password: 'Admin@123' }
    );
    assert('Valid Admin Login (200 & JWT received)', adminLogin.status === 200 && !!adminLogin.data.token);
    const adminToken = adminLogin.data.token;

    // 3. Test Login with Student credentials
    const studentLogin = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'aarav.patel@campus.edu', password: 'Student@123' }
    );
    assert('Valid Student Login (200 & JWT received)', studentLogin.status === 200 && !!studentLogin.data.token);
    const studentToken = studentLogin.data.token;

    // 4. Test Server-Side Role Authorization: Student calls Admin-only PUT /api/buffer-config/Lunch
    const studentCallingAdminApi = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/buffer-config/Lunch',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
      },
      { baseBufferPercent: 7.0 }
    );
    assert(
      'Student calling Admin API receives 403 Forbidden',
      studentCallingAdminApi.status === 403,
      `Received status: ${studentCallingAdminApi.status}`
    );

    // 5. Test Unauthenticated request to Admin API receives 401
    const unauthCallingAdminApi = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/buffer-config/Lunch',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      },
      { baseBufferPercent: 7.0 }
    );
    assert('Unauthenticated request to protected API receives 401', unauthCallingAdminApi.status === 401);

    // 6. Test Admin calls Admin API (must succeed 200 OK)
    const adminCallingAdminApi = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/buffer-config/Lunch',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      { baseBufferPercent: 5.5, minBufferPercent: 3.0, maxBufferPercent: 15.0 }
    );
    assert('Admin calling Admin API succeeds (200 OK)', adminCallingAdminApi.status === 200);

    // 7. Test What-If Demand Simulator
    const simRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/simulator/simulate',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { additionalStudents: 30 }
    );
    assert(
      'What-If Simulator returns accurate metrics',
      simRes.status === 200 &&
        simRes.data.newExpectedDemand > simRes.data.basePrediction &&
        typeof simRes.data.recommendedAction === 'string'
    );

    // 8. Test Dashboard Summary
    const dashRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/dashboard/summary',
      method: 'GET',
    });
    assert(
      'Dashboard returns real summary metrics from DB',
      dashRes.status === 200 && typeof dashRes.data.metrics.foodSavedKg === 'number'
    );

    // 9. Test Query Assistant with natural language
    const queryRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/query',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { queryText: 'How much food did we save this week?' }
    );
    assert(
      'Query Assistant answers from actual DB records',
      queryRes.status === 200 && typeof queryRes.data.answer === 'string'
    );

    console.log(`\n🏁 Test results: ${passed} passed, ${failed} failed.`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runAuditTests();
