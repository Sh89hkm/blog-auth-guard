module.exports =
  (redirect = '/user/signin') =>
  (req, res, next) => {
    // Check if user session is active, that is if user is already authenticated
    if (!req.session?.user) {
      // since most get requests are page renders, redirect to signin page is used if unauthenticated user tries to access any guarded page.
      if (req.method === 'GET') res.redirect(redirect);
      // For other operational requests, the HTTP 403 Forbidden response status code is sent which indicates that the server refuses to authorize the request.
      else res.status(403).end();
    } else {
      next();
    }
  };

