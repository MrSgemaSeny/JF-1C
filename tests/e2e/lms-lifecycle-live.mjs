/**
 * Live LMS Courses Lifecycle E2E Suite
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

async function runLmsLifecycleTests() {
  console.log('===============================================================');
  console.log(`Starting Live LMS Courses Lifecycle E2E Suite against ${BASE_URL}`);
  console.log('===============================================================\n');

  const actors = await getAuthActors();
  const { adminToken, learnerToken, learnerId } = actors;

  const rand = Math.floor(Math.random() * 90000) + 10000;
  const courseTitle = `E2E Accounting Course ${rand}`;

  // 1. Admin Creates Course
  const createCourseRes = await request(`/v1/admin/courses?title=${encodeURIComponent(courseTitle)}&description=Comprehensive%20E2E%20Test%20Course&isPublished=false`, {
    method: 'POST'
  }, adminToken);
  const courseId = createCourseRes.data?.data?.id;
  record('1. Admin Creates Course (POST /v1/admin/courses)', createCourseRes.status === 200 && !!courseId, {
    expected: 'status 200 with courseId',
    actual: `status ${createCourseRes.status}, courseId: ${courseId}`
  });

  if (!courseId) {
    console.error('Abort: Course creation failed.');
    return;
  }

  // 2. Admin Creates Chapter
  const chapterTitle = `Chapter 1 - Basics ${rand}`;
  const createChapRes = await request(`/v1/admin/courses/${courseId}/chapters?title=${encodeURIComponent(chapterTitle)}&orderIndex=1`, {
    method: 'POST'
  }, adminToken);
  record('2. Admin Creates Chapter (POST /v1/admin/courses/{id}/chapters)', createChapRes.status === 200, {
    expected: 200,
    actual: createChapRes.status
  });

  // 3. Admin Creates Lesson on Course
  const lessonTitle = `Lesson 1 - Fundamentals ${rand}`;
  const createLessonRes = await request(`/v1/admin/courses/${courseId}/lessons?title=${encodeURIComponent(lessonTitle)}&type=DOCUMENT&orderIndex=1&durationMinutes=15`, {
    method: 'POST'
  }, adminToken);
  const lessonId = createLessonRes.data?.data?.id;
  record('3. Admin Creates Lesson (POST /v1/admin/courses/{id}/lessons)', createLessonRes.status === 200 && !!lessonId, {
    expected: 'status 200 with lessonId',
    actual: `status ${createLessonRes.status}, lessonId: ${lessonId}`
  });

  // 4. Admin Publishes Course
  const publishRes = await request(`/v1/admin/courses/${courseId}?title=${encodeURIComponent(courseTitle)}&isPublished=true`, {
    method: 'PUT'
  }, adminToken);
  record('4. Admin Publishes Course (PUT /v1/admin/courses/{id}?isPublished=true)', publishRes.status === 200 && publishRes.data?.data?.status === 'PUBLISHED', {
    expected: "status == 'PUBLISHED'",
    actual: `status: ${publishRes.data?.data?.status}`
  });

  // 5. Learner Queries Published Courses
  const getCoursesRes = await request('/v1/courses', { method: 'GET' }, learnerToken);
  const coursesList = getCoursesRes.data?.data || [];
  const foundCourse = coursesList.find(c => c.id === courseId);
  record('5. Learner Discovers Published Course (GET /v1/courses)', getCoursesRes.status === 200 && !!foundCourse, {
    expected: 'course in published list',
    actual: foundCourse ? 'found' : 'not found'
  });

  // 6. Learner Retrieves Course Structure & Lessons
  const getCourseDetailRes = await request(`/v1/courses/${courseId}`, { method: 'GET' }, learnerToken);
  record('6. Learner Retrieves Course Structure (GET /v1/courses/{id})', getCourseDetailRes.status === 200 && getCourseDetailRes.data?.data?.title === courseTitle, {
    expected: `title == ${courseTitle}`,
    actual: `title: ${getCourseDetailRes.data?.data?.title}`
  });

  // 7. Learner Marks Lesson as Complete
  if (lessonId) {
    const completeRes = await request(`/v1/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: 'POST'
    }, learnerToken);
    record('7. Learner Marks Lesson Complete (POST /v1/courses/{id}/lessons/{id}/complete)', completeRes.status === 200, {
      expected: 200,
      actual: completeRes.status
    });

    // 8. Learner Verifies Progress Update
    const progressRes = await request(`/v1/courses/${courseId}/progress`, { method: 'GET' }, learnerToken);
    const progressData = progressRes.data?.data;
    record('8. Learner Verifies Progress Update (GET /v1/courses/{id}/progress)', progressRes.status === 200 && progressData !== null, {
      expected: 'status 200 with progress data',
      actual: `status ${progressRes.status}, data: ${JSON.stringify(progressData)}`
    });
  }

  // 9. Admin Unpublishes Course
  const unpublishRes = await request(`/v1/admin/courses/${courseId}?title=${encodeURIComponent(courseTitle)}&isPublished=false`, {
    method: 'PUT'
  }, adminToken);
  record('9. Admin Unpublishes Course (PUT /v1/admin/courses/{id}?isPublished=false)', unpublishRes.status === 200 && unpublishRes.data?.data?.status === 'DRAFT', {
    expected: "status == 'DRAFT'",
    actual: `status: ${unpublishRes.data?.data?.status}`
  });

  // 10. Learner Verifies Course Removed From Published Catalog
  const verifyCatalogRes = await request('/v1/courses', { method: 'GET' }, learnerToken);
  const updatedCatalog = verifyCatalogRes.data?.data || [];
  const stillInCatalog = updatedCatalog.some(c => c.id === courseId);
  record('10. Learner Verifies Unpublished Course Hidden (GET /v1/courses)', verifyCatalogRes.status === 200 && !stillInCatalog, {
    expected: 'course hidden from catalog',
    actual: stillInCatalog ? 'still visible' : 'hidden'
  });

  // 11. Test Course Deletion on Standalone Unenrolled Course
  const randDraft = Math.floor(Math.random() * 90000) + 10000;
  const draftCourseRes = await request(`/v1/admin/courses?title=${encodeURIComponent(`Draft To Delete ${randDraft}`)}&isPublished=false`, {
    method: 'POST'
  }, adminToken);
  const draftCourseId = draftCourseRes.data?.data?.id;
  if (draftCourseId) {
    const deleteDraftRes = await request(`/v1/admin/courses/${draftCourseId}`, { method: 'DELETE' }, adminToken);
    record('11. Admin Deletes Unenrolled Course (DELETE /v1/admin/courses/{id})', deleteDraftRes.status === 200, {
      expected: 200,
      actual: deleteDraftRes.status
    });
  }

  console.log('\n===============================================================');
  console.log(`LMS Courses Lifecycle Results: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log('===============================================================');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runLmsLifecycleTests().catch(err => {
  console.error('[FATAL] Unhandled error:', err);
  process.exit(1);
});
