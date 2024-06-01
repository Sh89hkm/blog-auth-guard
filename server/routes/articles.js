const express = require('express');
const router = express.Router();

const Article = require('./../models/article');
const ensureAuthenticated = require('../middleware/ensureAuthenticated');

// Renders new article page
router.get('/new', ensureAuthenticated(), (req, res) => {
  res.render('articles/new', { article: new Article() });
});

// Renders edit article page
router.get('/edit/:id', ensureAuthenticated(), async (req, res) => {
  const article = await Article.findById(req.params.id);
  res.render('articles/edit', { article: article });
});

// Renders requested article page
router.get('/:slug', async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug });
  if (article == null) res.redirect('/');
  res.render('articles/show', { article: article });
});

// Handles new article request from new article page
router.post(
  '/',
  ensureAuthenticated(),
  async (req, res, next) => {
    req.article = new Article();
    next();
  },
  saveArticleAndRedirect('new')
);

// Handles edit article request from edit article page
router.put(
  '/:id',
  ensureAuthenticated(),
  async (req, res, next) => {
    const user = req.session.user;
    req.article = await Article.findById(req.params.id);
    if (req.article.author.id === user._id) next();
    else res.status(403).end();
  },
  saveArticleAndRedirect('edit')
);

// Handles delete article request
router.delete('/:id', ensureAuthenticated(), async (req, res) => {
  const user = req.session.user;
  const article = await Article.findById(req.params.id);
  if (article.author.id === user._id) {
    await Article.findByIdAndDelete(req.params.id);
    res.redirect('/');
  } else res.status(403).end();
});

// Reusable function to add/edit an article
function saveArticleAndRedirect(path) {
  return async (req, res) => {
    let article = req.article;
    article.title = req.body.title;
    article.snippet = req.body.snippet;
    article.markdown = req.body.markdown;
    try {
      article.author = req.session?.user?._id ?? null;
      article = await article.save();
      res.redirect(`/articles/${article.slug}`);
    } catch (e) {
      console.log(e);
      res.render(`articles/${path}`, { article: article });
    }
  };
}

module.exports = router;
