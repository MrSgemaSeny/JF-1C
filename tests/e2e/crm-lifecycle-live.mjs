/**
 * Live CRM Tasks & Pipeline Lifecycle E2E Suite
 * Target: https://zhanfinance.fly.dev/api
 */

import { BASE_URL, request, getAuthActors, delay } from './auth-helper.mjs';

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function record(name, passed, details = {}) {
  results.tests.push({ name, passed, ...details });
  if (passed) {
    results.passed++;
    console.log(`[PASS] ${name}`);
  } else {
    results.failed++;
    console.error(`[FAIL] ${name} — expected ${details.expected}, got ${details.actual} (statusText: ${details.statusText || ''})`);
  }
}

async function runCrmLifecycleTests() {
  console.log('===============================================================');
  console.log(`Starting Live CRM Tasks Lifecycle E2E Suite against ${BASE_URL}`);
  console.log('===============================================================\n');

  const actors = await getAuthActors();
  const { adminToken, empToken, empId, clientToken, clientId } = actors;

  // 1. Discover Pipelines and Stages
  const pipeRes = await request('/v1/crm/pipelines', { method: 'GET' }, adminToken);
  const pipelines = pipeRes.data?.data || [];
  record('1. Fetch CRM Pipelines and Stages (200)', pipeRes.status === 200 && pipelines.length > 0, {
    expected: 'status 200 and pipelines.length > 0',
    actual: `status ${pipeRes.status}, count: ${pipelines.length}`
  });

  const defaultPipeline = pipelines.find(p => p.isDefault) || pipelines[0];
  const stages = defaultPipeline?.stages || [];
  record('2. Verify Default Pipeline has stages', stages.length >= 2, {
    expected: '>= 2 stages',
    actual: `${stages.length} stages`
  });

  const initialStage = stages[0];
  const targetStage = stages[1] || stages[0];

  // 3. Admin Creates Task
  const rand = Math.floor(Math.random() * 90000) + 10000;
  const taskTitle = `E2E Task ${rand}`;
  const createTaskRes = await request('/v1/crm/tasks', {
    method: 'POST',
    body: {
      title: taskTitle,
      description: 'Automated CRM Lifecycle Verification Task',
      clientId: clientId,
      pipelineId: defaultPipeline.id
    }
  }, adminToken);
  const taskId = createTaskRes.data?.data?.id;
  record('3. Admin Creates CRM Task (POST /v1/crm/tasks)', createTaskRes.status === 200 && !!taskId, {
    expected: 'status 200 with valid taskId',
    actual: `status ${createTaskRes.status}, taskId: ${taskId}`
  });

  if (!taskId) {
    console.error('Abort: Task was not created, cannot continue lifecycle.');
    return;
  }

  // 4. Retrieve Task Details
  const getTaskRes = await request(`/v1/crm/tasks/${taskId}`, { method: 'GET' }, adminToken);
  record('4. Retrieve Task Details (GET /v1/crm/tasks/{id})', getTaskRes.status === 200 && getTaskRes.data?.data?.title === taskTitle, {
    expected: `title == ${taskTitle}`,
    actual: `title: ${getTaskRes.data?.data?.title}`
  });

  // 5. Update Task Details
  const updatedDesc = 'Updated task description for verification';
  const updateTaskRes = await request(`/v1/crm/tasks/${taskId}`, {
    method: 'PUT',
    body: {
      title: `${taskTitle} (Updated)`,
      description: updatedDesc
    }
  }, adminToken);
  record('5. Update Task Details (PUT /v1/crm/tasks/{id})', updateTaskRes.status === 200, {
    expected: 200,
    actual: updateTaskRes.status
  });

  // 6. Move Task to Next Stage
  if (targetStage && targetStage.id !== initialStage?.id) {
    const stageRes = await request(`/v1/crm/tasks/${taskId}/stage`, {
      method: 'PATCH',
      body: {
        stageId: targetStage.id
      }
    }, adminToken);
    record('6. Move Task to Next Stage (PATCH /v1/crm/tasks/{id}/stage)', stageRes.status === 200, {
      expected: 200,
      actual: stageRes.status
    });
  } else {
    record('6. Move Task to Next Stage (Skipped - only 1 stage found)', true);
  }

  // 7. Assign Task to Employee
  if (empId) {
    const assignRes = await request(`/v1/crm/tasks/${taskId}/assign?assigneeId=${empId}`, {
      method: 'PATCH'
    }, adminToken);
    record('7. Assign Task to Employee (PATCH /v1/crm/tasks/{id}/assign)', assignRes.status === 200, {
      expected: 200,
      actual: assignRes.status
    });
  }

  // 8. Add Comment to Task
  const commentText = `E2E audit verification comment ${rand}`;
  const addCommentRes = await request(`/v1/crm/tasks/${taskId}/comments`, {
    method: 'POST',
    body: { text: commentText }
  }, adminToken);
  record('8. Add Comment to Task (POST /v1/crm/tasks/{id}/comments)', addCommentRes.status === 200, {
    expected: 200,
    actual: addCommentRes.status
  });

  // 9. Retrieve Task Comments
  const getCommentsRes = await request(`/v1/crm/tasks/${taskId}/comments`, { method: 'GET' }, empToken);
  const comments = getCommentsRes.data?.data || [];
  const foundComment = comments.find(c => c.text === commentText);
  record('9. Retrieve Comments as Employee (GET /v1/crm/tasks/{id}/comments)', getCommentsRes.status === 200 && !!foundComment, {
    expected: 'found added comment',
    actual: foundComment ? 'found' : 'not found'
  });

  // 10. Retrieve Task Activity History
  const getHistoryRes = await request(`/v1/crm/tasks/${taskId}/history`, { method: 'GET' }, adminToken);
  const historyItems = getHistoryRes.data?.data || [];
  record('10. Retrieve Task Audit History (GET /v1/crm/tasks/{id}/history)', getHistoryRes.status === 200 && historyItems.length > 0, {
    expected: 'history items > 0',
    actual: `history count: ${historyItems.length}`
  });

  // 11. Delete Task
  const delTaskRes = await request(`/v1/crm/tasks/${taskId}`, { method: 'DELETE' }, adminToken);
  record('11. Delete Task (DELETE /v1/crm/tasks/{id})', delTaskRes.status === 200, {
    expected: 200,
    actual: delTaskRes.status
  });

  // 12. Verify Task 404 After Deletion
  const getDeletedRes = await request(`/v1/crm/tasks/${taskId}`, { method: 'GET' }, adminToken);
  record('12. Verify Task 404 After Deletion', getDeletedRes.status === 404, {
    expected: 404,
    actual: getDeletedRes.status
  });

  console.log('\n===============================================================');
  console.log(`CRM Tasks Lifecycle Results: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log('===============================================================');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runCrmLifecycleTests().catch(err => {
  console.error('[FATAL] Unhandled error:', err);
  process.exit(1);
});
