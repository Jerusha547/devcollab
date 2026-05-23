const request = require('supertest');
const express = require('express');

// Mock pool
jest.mock('../db', () => ({
  query: jest.fn()
}));

const pool = require('../db');

const notifyUser = jest.fn();
const isAuthenticated = (req, res, next) => {
  req.user = { username: 'testuser', access_token: 'test_token' };
  next();
};

const prRoutes = require('../routes/prs')(notifyUser, isAuthenticated);
const app = express();
app.use(express.json());
app.use('/prs', prRoutes);

describe('PR Routes', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /prs/submitted returns list of PRs', async () => {
    pool.query.mockResolvedValue({
      rows: [
        { id: 1, title: 'Test PR', status: 'pending', submitter_id: 'testuser' }
      ]
    });

    const res = await request(app).get('/prs/submitted');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Test PR');
  });

  test('GET /prs/assigned returns list of assigned PRs', async () => {
    pool.query.mockResolvedValue({
      rows: [
        { id: 2, title: 'Assigned PR', status: 'in-review', reviewer_id: 'testuser' }
      ]
    });

    const res = await request(app).get('/prs/assigned');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('PATCH /prs/:id/status updates status', async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 1, title: 'Test PR', status: 'approved', submitter_id: 'testuser' }]
    });

    const res = await request(app)
      .patch('/prs/1/status')
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });

  test('PATCH /prs/:id/status rejects invalid status', async () => {
    const res = await request(app)
      .patch('/prs/1/status')
      .send({ status: 'invalid-status' });

    expect(res.status).toBe(400);
  });

});