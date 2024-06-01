const request = require('supertest');
const db = require('../db');
const cookieParser = require('cookie');
const app = require('../app');
const { ROUTES, correctUser, newUser } = require('./data');

jest.setTimeout(1500);

afterAll(async () => await db.closeDatabase());

describe('Short session tasks implemented', () => {
  const COOKIE_NAME = 'sid';
  let agentRegister = request.agent(app);
  let agentLogin = request.agent(app);
  let resLogin, resRegister;
  let cookiesLogin, cookiesRegister;

  beforeAll(async () => {
    app.get('/me', (req, res) => {
      if (req.session && req.session.user) res.json(req.session.user);
      else res.status(403).json({});
    });

    app.get('/session', (req, res) => {
      if (req.session) res.json(req.session);
      else res.status(403).json({});
    });

    resLogin = await agentLogin
      .post(ROUTES.SIGN_IN)
      .type('form')
      .send(correctUser);
    resRegister = await agentRegister
      .post(ROUTES.SIGN_UP)
      .type('form')
      .send(newUser);

    cookiesLogin = resLogin.header['set-cookie']?.map(cookieParser.parse) || [];
    cookiesRegister =
      resRegister.header['set-cookie']?.map(cookieParser.parse) || [];
  });

  afterAll(async () => db.clearDatabase());

  test('login and register response have valid cookie with name sid', () => {
    const expected = [
      expect.objectContaining({
        [COOKIE_NAME]: expect.stringMatching(/[a-zA-Z0-9]+/),
      }),
    ];

    expect(cookiesLogin).toEqual(expect.arrayContaining(expected));
    expect(cookiesRegister).toEqual(expect.arrayContaining(expected));
  });

  test('cookie is valid for 1 session', () => {
    const cookieLogin = cookiesLogin.find((c) => !!c[COOKIE_NAME]);
    const cookieRegister = cookiesRegister.find((c) => !!c[COOKIE_NAME]);
    const notExpected = { Expires: expect.any(String) };

    expect(cookieLogin).toBeDefined();
    expect(cookieRegister).toBeDefined();

    expect(cookieLogin).toEqual(expect.not.objectContaining(notExpected));
    expect(cookieRegister).toEqual(expect.not.objectContaining(notExpected));
  });

  test('after login, requests are authenticated', async () => {
    let meLogin = (await agentLogin.get('/me')).body;
    const expectedLogin = {
      _id: '6179ddb959261eb8c736c58d',
      username: 'madeline.mayer',
    };
    expect(meLogin).toEqual(expect.objectContaining(expectedLogin));
  });

  test('after register, requests are authenticated', async () => {
    let meRegister = (await agentRegister.get('/me')).body;

    const expectedRegister = {
      _id: expect.stringMatching(/[a-z0-9]/i),
      username: 'sarah.ali',
    };

    expect(meRegister).toEqual(expect.objectContaining(expectedRegister));
  });

  test('after login, session have an object "user"', async () => {
    let sessLogin = (await agentLogin.get('/session')).body;
    const expectedLogin = {
      user: {
        _id: '6179ddb959261eb8c736c58d',
        username: 'madeline.mayer',
      },
    };

    expect(sessLogin).toMatchObject(expectedLogin);
  });

  test('after register, session have an object "user"', async () => {
    let sessRegister = (await agentRegister.get('/session')).body;
    const expectedRegister = {
      user: {
        _id: expect.stringMatching(/[a-z0-9]/i),
        username: 'sarah.ali',
      },
    };

    expect(sessRegister).toMatchObject(expectedRegister);
  });

  describe('loggin out will destroy session', () => {
    let resLogout, resMe, resSess;
    beforeAll(async () => {
      resLogout = await agentLogin.get(ROUTES.SIGN_OUT);
      resMe = await agentLogin.get('/me');
      resSess = await agentLogin.get('/session');
    });

    test('loggin out will redirect user', () => {
      expect(resLogout.statusCode).toBe(302); // on success, redirects to '/'
    });

    test("session doesn't have a user in it", () => {
      expect(resMe.statusCode).toBe(403);
    });

    test('session is destroyed', () => {
      expect(resSess.body).toEqual({
        cookie: {
          originalMaxAge: null,
          expires: null,
          httpOnly: true,
          path: '/',
        },
      });
    });
  });
});

describe('Long session tasks implemented', () => {
  const COOKIE_NAME = 'sid';

  const agent = request.agent(app);
  let res, cookies;

  beforeAll(async () => {
    res = await agent
      .post(ROUTES.SIGN_IN)
      .type('form')
      .send({ ...correctUser, rememberMe: 'on' });

    cookies = res.header['set-cookie']?.map(cookieParser.parse) || [];
  });

  test('cookie is valid for 14 days', () => {
    const cookie = cookies.find((c) => !!c[COOKIE_NAME]);
    expect(cookie).toEqual(
      expect.objectContaining({ Expires: expect.any(String) })
    );

    const expires = new Date(cookie['Expires']);
    const diffHours = (expires - new Date()) / 1000 / 3600;
    // Test for range between 13 and 15 days
    expect(diffHours).toBeGreaterThan(13 * 24); // 13 days
    expect(diffHours).toBeLessThan(15 * 24); // 15 days
  });

  test('subsequent requests are authenticated', async () => {
    const res = await agent.get('/me');
    const expected = {
      _id: '6179ddb959261eb8c736c58d',
      username: 'madeline.mayer',
    };
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(expect.objectContaining(expected));
  });
});
