const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const db = require('../db');
const app = require('../app');
const {
  ROUTES,
  correctUser,
  newUser,
  incorrectUser1,
  incorrectUser2,
} = require('./data');

jest.setTimeout(1500);

afterAll(async () => await db.closeDatabase());

describe('Signin tasks implemented', () => {
  test('responds to get /user/signin', async () => {
    const res = await request(app).get(ROUTES.SIGN_IN);

    expect(res.header['content-type']).toBe('text/html; charset=utf-8');
    expect(res.statusCode).toBe(200);
  });

  test('logs in user successfully', async () => {
    const res = await request(app)
      .post(ROUTES.SIGN_IN)
      .type('form')
      .send(correctUser);

    expect(res.statusCode).toBe(302);
    expect(res.header['location']).toBe(ROUTES.AUTHENTICATED);
    expect(res.header['user']).toBe('6179ddb959261eb8c736c58d');
  });

  test('handles wrong username', async () => {
    const res = await request(app)
      .post(ROUTES.SIGN_IN)
      .type('form')
      .send(incorrectUser1);

    expect(res.header['location']).toBe(undefined);
    expect(res.statusCode).toBe(400);
    expect(res.text).toMatch(/wrong username or password/i);
  });

  test('handles wrong password', async () => {
    const res = await request(app)
      .post(ROUTES.SIGN_IN)
      .type('form')
      .send(incorrectUser2);

    expect(res.header['location']).toBe(undefined);
    expect(res.statusCode).toBe(400);
    expect(res.text).toMatch(/wrong username or password/i);
  });
});

describe('Signup tasks implemented', () => {
  // clear database after each test
  afterEach(async () => await db.clearDatabase());

  test('responds to get /user/signup', async () => {
    const res = await request(app).get(ROUTES.SIGN_UP);

    expect(res.header['content-type']).toBe('text/html; charset=utf-8');
    expect(res.statusCode).toBe(200);
  });

  test('registers a new user successfully', async () => {
    const res = await request(app)
      .post(ROUTES.SIGN_UP)
      .type('form')
      .send(newUser);

    expect(res.statusCode).toBe(302);
    expect(res.header['location']).toBe(ROUTES.AUTHENTICATED);

    // check user in db
    const user = await mongoose.connection
      .collection('users')
      .findOne({ username: newUser.username });

    expect(user).toBeDefined();
    expect(user.username).toEqual(newUser.username);
  });

  test('hashes password with bcrypt', async () => {
    await request(app).post(ROUTES.SIGN_UP).type('form').send(newUser);

    const user = await mongoose.connection
      .collection('users')
      .findOne({ username: newUser.username });

    expect(user).toBeDefined();

    const valid =
      user && (await bcrypt.compare(newUser.password, user.password_hash));

    expect(valid).toBe(true);
  });

  test('handles used username', async () => {
    const newUserLocal = { ...newUser, username: 'madeline.mayer' };

    const res = await request(app)
      .post(ROUTES.SIGN_UP)
      .type('form')
      .send(newUserLocal);

    expect(res.header['location']).toBe(undefined);
    expect(res.statusCode).toBe(400);
    expect(res.text).toMatch(/username already used/i);
  });

  test('handles wrong password confirm', async () => {
    const newUserLocal = { ...newUser, password2: 'ANOTHER_PASSWORD' };

    const res = await request(app)
      .post(ROUTES.SIGN_UP)
      .type('form')
      .send(newUserLocal);

    expect(res.header['location']).toBe(undefined);
    expect(res.statusCode).toBe(400);
    expect(res.text).toMatch(/passwords do not match/i);
  });
});
