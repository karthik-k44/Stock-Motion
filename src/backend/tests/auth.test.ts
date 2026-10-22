import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/backend/db/client';
import { app, RefreshCookie, ResetDatabase, SetupDatabase, SignUp } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetDatabase);
afterAll(() => db.close());

describe('accounts and sessions', () => {
  it('signs up with an httpOnly refresh cookie and an access token', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Ada', email: 'Ada@Example.com', password: 'long-enough-pw' });
    expect(res.status).toBe(201);
    expect(res.body.account).toMatchObject({ name: 'Ada', email: 'ada@example.com' });
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body).not.toHaveProperty('refreshToken');
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('sm_refresh='))!;
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Path=\/api\/auth/);

    const me = await request(app).get('/api/auth/me').set('authorization', `Bearer ${res.body.accessToken}`);
    expect(me.body.email).toBe('ada@example.com');
  });

  it('rejects duplicate emails, wrong passwords and missing tokens', async () => {
    const owner = await SignUp();
    const dup = await request(app).post('/api/auth/register').send({ name: 'X', email: owner.email, password: 'long-enough-pw' });
    expect(dup.status).toBe(409);
    const wrong = await request(app).post('/api/auth/login').send({ email: owner.email, password: 'nope-nope-nope' });
    expect(wrong.status).toBe(401);
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('authorization', 'Bearer not-a-jwt')).status).toBe(401);
    const short = await request(app).post('/api/auth/register').send({ name: 'Y', email: 'y@example.com', password: 'short' });
    expect(short.status).toBe(400);
  });

  it('rotates refresh tokens and ends every session when an old one is replayed', async () => {
    const owner = await SignUp();
    const first = await request(app).post('/api/auth/refresh').set('cookie', owner.cookie);
    expect(first.status).toBe(200);
    const rotated = RefreshCookie(first);
    expect(rotated).not.toBe(owner.cookie);

    // Replaying the already-used cookie is treated as theft: it fails and revokes the new one too.
    expect((await request(app).post('/api/auth/refresh').set('cookie', owner.cookie)).status).toBe(401);
    expect((await request(app).post('/api/auth/refresh').set('cookie', rotated)).status).toBe(401);
  });

  it('logs out by revoking the refresh token', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: (await SignUp()).email, password: 'correct-horse-battery' });
    const cookie = RefreshCookie(res);
    expect((await request(app).post('/api/auth/logout').set('cookie', cookie)).status).toBe(204);
    expect((await request(app).post('/api/auth/refresh').set('cookie', cookie)).status).toBe(401);
  });
});
