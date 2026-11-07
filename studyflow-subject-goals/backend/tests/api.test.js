import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import User from '../models/User';
import Subject from '../models/Subject';
import Chapter from '../models/Chapter';
import Topic from '../models/Topic';
import StudyGoal from '../models/StudyGoal';
import StudyEntry from '../models/StudyEntry';

let userAToken = '';
let userBToken = '';
let userAId = '';
let userBId = '';
let testSubjectId = '';
let testChapterId = '';
let testTopicId = '';
let testGoalId = '';

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studyflow';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
  // Clean up any test users
  await User.deleteMany({ email: { $in: ['test_user_a@studyflow.ai', 'test_user_b@studyflow.ai'] } });
});

afterAll(async () => {
  if (userAId) {
    await Promise.all([
      User.deleteOne({ _id: userAId }),
      Subject.deleteMany({ userId: userAId }),
      Chapter.deleteMany({ userId: userAId }),
      Topic.deleteMany({ userId: userAId }),
      StudyGoal.deleteMany({ userId: userAId }),
      StudyEntry.deleteMany({ userId: userAId }),
    ]);
  }
  if (userBId) {
    await Promise.all([
      User.deleteOne({ _id: userBId }),
      Subject.deleteMany({ userId: userBId }),
      Chapter.deleteMany({ userId: userBId }),
      Topic.deleteMany({ userId: userBId }),
      StudyGoal.deleteMany({ userId: userBId }),
      StudyEntry.deleteMany({ userId: userBId }),
    ]);
  }
  await mongoose.disconnect();
});

describe('1. Authentication Module', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'User Alpha',
      email: 'test_user_a@studyflow.ai',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test_user_a@studyflow.ai');
    userAToken = res.body.token;
    userAId = res.body.user.id;
  });

  it('should reject registration with duplicate email', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'User Alpha Duplicate',
      email: 'test_user_a@studyflow.ai',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test_user_a@studyflow.ai',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should login user with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test_user_a@studyflow.ai',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('should get current user profile with /api/auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test_user_a@studyflow.ai');
  });

  it('should register User Beta for isolation testing', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'User Beta',
      email: 'test_user_b@studyflow.ai',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(res.status).toBe(201);
    userBToken = res.body.token;
    userBId = res.body.user.id;
  });
});

describe('2. Subject Module & Ownership Isolation', () => {
  it('should allow User A to create a subject', async () => {
    const res = await request(app)
      .post('/api/subjects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Compiler Design',
        code: 'CS501',
        description: 'Lexical analysis, parsing, semantic analysis, and code generation.',
        category: 'Computer Science',
        color: '#6366f1',
        estimatedHours: 40,
        status: 'In Progress',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Compiler Design');
    expect(res.body.data.progressPercentage).toBe(0);
    testSubjectId = res.body.data._id;
  });

  it('User B should NOT see User A subjects', async () => {
    const res = await request(app)
      .get('/api/subjects')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('User B should NOT be able to view User A subject by ID', async () => {
    const res = await request(app)
      .get(`/api/subjects/${testSubjectId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
  });
});

describe('3. Chapter & Topic Module with Auto Progress Calculations', () => {
  it('should create a chapter under the subject', async () => {
    const res = await request(app)
      .post(`/api/subjects/${testSubjectId}/chapters`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Lexical Analysis',
        description: 'Tokens, regular expressions, NFAs, and DFAs.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Lexical Analysis');
    testChapterId = res.body.data._id;
  });

  it('should create topic 1 under the chapter', async () => {
    const res = await request(app)
      .post(`/api/chapters/${testChapterId}/topics`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Thompsons Construction',
        estimatedMinutes: 60,
        difficulty: 'Medium',
        status: 'Not Started',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.topic.title).toBe('Thompsons Construction');
    expect(res.body.data.chapterProgress.progressPercentage).toBe(0);
    testTopicId = res.body.data.topic._id;
  });

  it('should create topic 2 under the chapter', async () => {
    const res = await request(app)
      .post(`/api/chapters/${testChapterId}/topics`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'DFA Minimization',
        estimatedMinutes: 45,
        difficulty: 'Hard',
        status: 'Not Started',
      });

    expect(res.status).toBe(201);
  });

  it('should automatically recalculate progress when topic is completed', async () => {
    const res = await request(app)
      .patch(`/api/topics/${testTopicId}/status`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        status: 'Completed',
      });

    expect(res.status).toBe(200);
    // 1 of 2 topics completed = 50%
    expect(res.body.data.chapterProgress.progressPercentage).toBe(50);
    expect(res.body.data.subjectProgress.progressPercentage).toBe(50);
  });
});

describe('4. Study Goals & Progress Tracking', () => {
  it('should create a study goal', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        subjectId: testSubjectId,
        chapterId: testChapterId,
        title: 'Finish Compiler Lexer Unit',
        targetHours: 4,
        type: 'Weekly goal',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'High',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Finish Compiler Lexer Unit');
    expect(res.body.data.actualHours).toBe(0);
    testGoalId = res.body.data._id;
  });

  it('should reject study entry with zero or negative duration', async () => {
    const res = await request(app)
      .post('/api/study-entries')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        subjectId: testSubjectId,
        goalId: testGoalId,
        durationMinutes: 0,
      });

    expect(res.status).toBe(400);
  });

  it('should record study entry and automatically update goal actual hours', async () => {
    const res = await request(app)
      .post('/api/study-entries')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        subjectId: testSubjectId,
        goalId: testGoalId,
        durationMinutes: 120, // 2 hours
        notes: 'Constructed NFAs for regex patterns.',
      });

    expect(res.status).toBe(201);

    // Verify goal progress updated
    const goalRes = await request(app)
      .get(`/api/goals/${testGoalId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(goalRes.status).toBe(200);
    expect(goalRes.body.data.actualHours).toBe(2);
    expect(goalRes.body.data.progressPercentage).toBe(50); // 2 hrs / 4 hrs = 50%
  });
});

describe('5. Analytics Dashboard', () => {
  it('should retrieve real-time calculated dashboard analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalSubjects).toBeGreaterThanOrEqual(1);
    expect(res.body.data.summary.totalGoals).toBeGreaterThanOrEqual(1);
    expect(res.body.data.summary.actualHours).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.data.subjectProgress)).toBe(true);
    expect(Array.isArray(res.body.data.weeklyStudyHours)).toBe(true);
  });
});
