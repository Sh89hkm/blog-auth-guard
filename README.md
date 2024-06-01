# Blog authentication guard

In this lab, the basic functions to login and register have been implemented for you. What you need to do in this lab is to guard some of the routes that needs authentication. That is mainly to ensure:

- To post an article, the user needs to be signed in
- The user can't edit or delete an article unless it belongs to them
- Not signed-in users can only read articles, register, and log in
- The signed-in user has the option to sign out

## Tests

The app will still test for correct implementation of sign in and sign up functions from previous lab.

Additionally, these tests will be run:

### Session

In order to persis a user's sign in, you need to use sessions and cookies. This lab will test:

- On login or register, the response have a valid **cookie** with the name `sid` that contains the session id
- The cookie won't have an `Expires` attribute  I.E. _valid for 1 session only_
- On login with _remember me_, the response have a valid cookie with `Expires` attribute for **14 days**
- Subsequent request will have the user in the session after they login or register
- On registration, the cookie will be valid for 1 session only as well
- On logout, subsequent requests will not be authenticated

> 💡 TIP: You can use the library [`express-session`](https://www.npmjs.com/package/express-session).

> 💡 TIP: For app secret, you can use `process.env.SECRET_KEY` environment variable already set up for secure app secret

### Guards

In order to guard a route, you need to have a middleware that redirects the user to login in case they need to access an authenticated only route like `/articles/new`. And for owner only routes, you need to check if article's author match current user.

This lab will test:

- If there is no user in session, i.e. anonymous user:
  - A GET request to `/articles/new` will redirect to `/user/login`
  - A GET request to `/articles/edit/:id` will redirect to `/user/login`
  - a GET request to `/articles/:slug` will correctly render the requested article
  - a GET request to `/` will correctly render the list of all articles
  - A POST request to `/articles/` will result in 403 status code and **not** create a new article
  - A PUT, DELETE request to `/articles/:id` will result in 403 status code and **not** update or delete any article
  - A GET request to `/user/logout` will redirect to `/`
  - A GET request to `/user/authenticated` will redirect to `/`

- If there is a logged in user:
  - All the previous requests would be served correctly
  - A GET request to `/user/signin` will redirect to `/user/authenticated`
  - A GET request to `/user/signup` will redirect to `/`
  - A PUT request to `/articles/:id` of another user's article will result in 403 status code and **not** update article
  - A PUT request to `/articles/:id` of current user's article will update the article and redirect the user to the article's slug `/articles/:slug`
  - A DELETE request to `/articles/:id` of another user's article will result in 403 status code and **not** delete article
  - A DELETE request to `/articles/:id` of current user's article will delete the article and redirect the user to home `/`

## Working with docker

This app is bootstraped with docker and docker-compose. It containerize the server, as well as the database. The database comes with predefined data for testing purposes.

### To start the server

run the command `yarn && yarn start`. This will install all the dependencies and build the docker image

### To run the tests

run the command `yarn test`. Make sure that the server is up and running as well as the database

### To install packages

when you run `yarn add PACKAGE` the package will be installed in docker as well automatically. However if you run into issues, you need to stop the server first with `yarn run stop` then you can run `yarn run build` to rebuild the docker image and start again.

### To prune the containers and data

> ⚠️ WARNING: This is a destructuve command that would delete the containers and all the data inside like database data, and uploads

you can run `yarn run prune` to shutdown the server and delete all the volumes associated with it. This serves as a start fresh command, that will return your server environment to original. It will not affect your code changes though.
