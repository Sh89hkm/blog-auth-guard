// to test login
const correctUser = {
  username: 'madeline.mayer',
  password: 'N0nSt0P',
};

const incorrectUser1 = {
  username: 'mdeli.maye',
  password: 'N0nSt0P',
};

const incorrectUser2 = {
  username: 'madeline.mayer',
  password: 'N0nStP',
};

// to test registration
const newUser = {
  username: 'sarah.ali',
  firstname: 'Sarah',
  lastname: 'Ali',
  password: 'testPassword',
  password2: 'testPassword',
  avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
  acceptTos: 'on',
};

const newArticle = {
  title: 'Test article',
  snippet: 'Testing writing articles',
  markdown: '# Heading',
};

const ROUTES = {
  SIGN_IN: '/user/signin',
  SIGN_UP: '/user/signup',
  SIGN_OUT: '/user/signout',
  NEW_ARTICLE: '/articles/new',
  EDIT_ARTICLE: '/articles/edit/6179eec2fa1cb9ff468a799c',
  SLUG_ARTICLE: '/articles/interactive-components-less-wiring-more-inspiring',
  HOME: '/',
  AUTHENTICATED: '/user/authenticated',
  ARTICLES: '/articles',
  ID_ARTICLE: '/articles/6179eec2fa1cb9ff468a799c',
};

module.exports = {
  correctUser,
  incorrectUser1,
  incorrectUser2,
  newUser,
  newArticle,
  ROUTES,
};
