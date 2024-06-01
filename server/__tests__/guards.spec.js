const request = require('supertest');
const mongoose = require('mongoose');
const db = require('../db');
const app = require('../app');
const { ROUTES, correctUser, newUser, newArticle } = require('./data');

jest.setTimeout(1500);

afterAll(async () => await db.closeDatabase());

describe('All guards implemented', () => {
  describe("When there isn't user in session", () => {
    const agent = request.agent(app);
    test('GET new article page redirects to login', async () => {
      const res = await agent.get(ROUTES.NEW_ARTICLE);
      expect(res.statusCode).toBe(302);
      expect(res.header['location']).toBe(ROUTES.SIGN_IN);
    });

    test('GET edit article page redirects to login', async () => {
      const res = await agent.get(ROUTES.EDIT_ARTICLE);
      expect(res.statusCode).toBe(302);
      expect(res.header['location']).toBe(ROUTES.SIGN_IN);
    });

    test('GET article page renders article', async () => {
      const res = await agent.get(ROUTES.SLUG_ARTICLE);
      expect(res.statusCode).toBe(200);
      expect(res.text).toMatch(/bring your designs to life/i);
    });

    test('GET home page (/) renders articles list', async () => {
      const res = await agent.get(ROUTES.HOME);
      expect(res.statusCode).toBe(200);
      expect(res.text).toMatch(/replace null with es6 symbols/i);
      expect(res.text).toMatch(/how unit testing is useful for engineers/i);
    });

    test('POST an article is rejected with 403', async () => {
      const articlesBefore = await mongoose.connection
        .collection('articles')
        .find({});
      const res = await agent
        .post(ROUTES.ARTICLES)
        .type('form')
        .send({ ...newArticle, title: 'Some title' });
      const articlesAfter = await mongoose.connection
        .collection('articles')
        .find({});

      expect(articlesBefore).toMatchObject(articlesAfter);
      expect(res.statusCode).toBe(403);
    });

    test('PUT an article is rejected with 403', async () => {
      const newArticleUpdate = { ...newArticle, title: 'New Title Now' };

      const articlesBefore = await mongoose.connection
        .collection('articles')
        .find({});
      const res = await agent
        .put(ROUTES.ID_ARTICLE)
        .type('form')
        .send(newArticleUpdate);
      const articlesAfter = await mongoose.connection
        .collection('articles')
        .find({});

      expect(articlesBefore).toMatchObject(articlesAfter);
      expect(res.statusCode).toBe(403);
    });

    test('DELETE an article is rejected with 403', async () => {
      const articlesBefore = await mongoose.connection
        .collection('articles')
        .find({});
      const res = await agent.delete(ROUTES.ID_ARTICLE);
      const articlesAfter = await mongoose.connection
        .collection('articles')
        .find({});

      expect(articlesBefore).toMatchObject(articlesAfter);
      expect(res.statusCode).toBe(403);
    });

    test('GET logout page will redirect to home', async () => {
      const res = await agent.get(ROUTES.SIGN_OUT);
      expect(res.statusCode).toBe(302);
      expect(res.header['location']).toBe(ROUTES.HOME);
    });

    test('GET authenticated page will redirect to home', async () => {
      const res = await agent.get(ROUTES.AUTHENTICATED);
      expect(res.statusCode).toBe(302);
      expect(res.header['location']).toBe(ROUTES.HOME);
    });
  });

  describe('When there is user in session', () => {
    const agentUser1 = request.agent(app);
    const agentUser2 = request.agent(app);
    let articleId;

    beforeAll(async () => {
      await agentUser1.post(ROUTES.SIGN_IN).type('form').send(correctUser);
      await agentUser2.post(ROUTES.SIGN_UP).type('form').send(newUser);
    });

    afterAll(async () => db.clearDatabase());

    test('Logged in user can navigate to new article page', async () => {
      const res = await agentUser1.get(ROUTES.NEW_ARTICLE);
      expect(res.statusCode).toBe(200);
      expect(res.text).toMatch(/new article/i);
    });

    test('Logged in user can navigate to edit article page', async () => {
      const res = await agentUser1.get(ROUTES.EDIT_ARTICLE);
      expect(res.statusCode).toBe(200);
      expect(res.text).toMatch(/edit article/i);
    });

    test('Logged in user can submit new article', async () => {
      const res = await agentUser2
        .post(ROUTES.ARTICLES)
        .type('form')
        .send(newArticle);
      expect(res.statusCode).toBe(302);

      // check article created
      const article = await mongoose.connection
        .collection('articles')
        .findOne({}, { sort: { createdAt: -1 } });

      expect(article).not.toBe(null);
      expect(article).toMatchObject(newArticle);

      articleId = article._id;
    });

    test("Logged in user cannot update other's articles", async () => {
      const newArticleUpdate = { ...newArticle, title: 'New Title Wrong' };
      const res = await agentUser1
        .put(`${ROUTES.ARTICLES}/${articleId}`)
        .type('form')
        .send(newArticleUpdate);

      const article = await mongoose.connection
        .collection('articles')
        .findOne(articleId);

      expect(article).not.toBe(null);
      expect(article).toMatchObject(newArticle);
      expect(res.statusCode).toBe(403);
    });

    test('Logged in user can update their articles', async () => {
      const newArticleUpdate = { ...newArticle, title: 'New Title Now' };

      const res = await agentUser2
        .put(`${ROUTES.ARTICLES}/${articleId}`)
        .type('form')
        .send(newArticleUpdate);

      const article = await mongoose.connection
        .collection('articles')
        .findOne({ _id: articleId });

      expect(article).toMatchObject(newArticleUpdate);
      expect(res.statusCode).toBe(302);
    });

    test("Logged in user cannot delete other's articles", async () => {
      const res = await agentUser1.delete(`${ROUTES.ARTICLES}/${articleId}`);

      const article = await mongoose.connection
        .collection('articles')
        .findOne({ _id: articleId });

      expect(article).not.toBe(null);
      expect(res.statusCode).toBe(403);
    });

    test('Logged in user can delete their articles', async () => {
      const res = await agentUser2.delete(`${ROUTES.ARTICLES}/${articleId}`);

      const article = await mongoose.connection
        .collection('articles')
        .findOne({ _id: articleId });

      expect(article).toBe(null);
      expect(res.statusCode).toBe(302);
    });

    test("Logged in user can't navigate to sign in/up pages", async () => {
      const resLogin = await agentUser1.get(ROUTES.SIGN_IN);
      const resRegister = await agentUser1.get(ROUTES.SIGN_UP);
      expect(resLogin.statusCode).toBe(302);
      expect(resRegister.statusCode).toBe(302);
    });
  });
});
