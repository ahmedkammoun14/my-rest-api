const request = require('supertest');

// Mock pg AVANT d'importer l'app
jest.mock('pg', () => {
    const mockPool = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    return {
        Pool: jest.fn(() => mockPool),
    };
});

const app = require('../server');
const { Pool } = require('pg');

describe('REST API Tests', () => {
    let mockPool;

    beforeEach(() => {
        mockPool = new Pool();
        mockPool.query.mockClear();
    });

    describe('GET /api/users', () => {
        it('should return all users', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: [
                    { id: 1, name: 'Alice', email: 'alice@example.com' },
                    { id: 2, name: 'Bob', email: 'bob@example.com' }
                ]
            });

            const res = await request(app).get('/api/users');
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBe(2);
        });
    });

    describe('POST /api/users', () => {
        it('should create a new user', async () => {
            const newUser = {
                name: 'Test User',
                email: 'test@example.com'
            };

            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: 3, name: 'Test User', email: 'test@example.com' }]
            });

            const res = await request(app)
                .post('/api/users')
                .send(newUser);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe(newUser.name);
        });
    });

    describe('GET /api/users/:id', () => {
        it('should return a specific user', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: [{ id: 1, name: 'Alice', email: 'alice@example.com' }]
            });

            const res = await request(app).get('/api/users/1');
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('id');
        });

        it('should return 404 for non-existent user', async () => {
            mockPool.query.mockResolvedValueOnce({
                rows: []
            });

            const res = await request(app).get('/api/users/9999');
            expect(res.statusCode).toBe(404);
        });
    });
});
