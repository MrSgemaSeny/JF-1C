import fs from 'fs';

async function run() {
  try {
    const baseUrl = 'https://zhanfinance.fly.dev';
    
    // 1. Register a new user
    const email = 'test' + Date.now() + '@example.com';
    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Test User', email: email, password: 'password123', role: 'CLIENT' })
    });
    console.log('Register status:', registerRes.status);
    console.log('Register response:', await registerRes.text());
    
    // 2. Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: 'password123' })
    });
    console.log('Login status:', loginRes.status);
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    
    // 3. Batch Update
    const task = {
      id: Date.now(),
      title: 'New Task',
      status: 'NEW',
      priority: 'MEDIUM',
      subtasks: [
        { id: Date.now() + 1, taskId: Date.now(), title: 'First step', status: 'NEW', createdAt: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: { id: 1, fullName: 'Admin', email: '', role: 'ADMIN' }
    };
    
    const batchRes = await fetch(`${baseUrl}/api/crm/tasks/batch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ updates: [task] })
    });
    console.log('Batch status:', batchRes.status);
    const getRes = await fetch(`${baseUrl}/api/crm/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('GET /tasks status:', getRes.status);
    const getResData = await getRes.json();
    const existingTasks = getResData.data;
    
    // Batch Update with existing tasks
    const batchRes2 = await fetch(`${baseUrl}/api/crm/tasks/batch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ updates: existingTasks })
    });
    console.log('Batch2 status:', batchRes2.status);
    console.log('Batch2 response:', await batchRes2.text());
    
  } catch (e) {
    console.error(e);
  }
}
run();
