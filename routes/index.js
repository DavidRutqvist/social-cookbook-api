module.exports = function(app, router, jwt, util, database) {
  //NOTE: /authenticate must be first in this file, otherwise it will be protected by login i.e. API will be inaccessible
  //Authenticate using a POST call to the route with post data token and userId where token is the OAuth token received from Facebook auth in client for user with supplied userId
  /**
  * @api {post} /api/autenticate Authenticate
  * @apiDescription Authenticate to the API using Facebook Graph API token
  * @apiName Authenticate
  * @apiGroup General
  * @apiParam {String} token  OAuth token obtained by authenticating a user against Facebook's Graph API
  * @apiParam {Number} userId Facebook user id associated with the supplied token, must match in order to be authenticated
  *
  * @apiSuccess {Boolean} success Indicates whether the authentication process was successful
  * @apiSuccess {String}  token   Token used to make the following calls to the API
  * @apiSuccess {Object}  user  An object representing the authenticated user
  * @apiSuccess {String}  user.firstName  First name of user
  * @apiSuccess {String}  user.lastName   Last name of user
  * @apiSuccess {Number}  user.userId     Facebook user id
  * @apiSuccess {String}  user.email      Email address of user
  * @apiSuccess {String}  user.role       Name of role to which the user belongs
  *
  * @apiError   {Boolean} success Indicates whether the autentication process was successful
  * @apiError   {String}  message Description of error occured
  */
  router.post("/authenticate", function(req, res) {
    if(req.body.token === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory token"
      });
    }

    if(req.body.userId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory userId"
      });
    }

    //The client supplies an token corresponding to an authentication for user with the supplied userId
    //Validate token by calling /me endpoint of Facebook API, if userId at the endpoint is the same as the supplied userId then we are authenticated
    util.performRequest("graph.facebook.com", "/v2.8/me", "GET", {
      access_token: req.body.token
    }, function(data) {
      if((data !== undefined) && (data.id === req.body.userId)) {
        database.getUser(data.id, function(success, user) {
          if(success) {
            //All good, create token
            var token = jwt.sign(user, app.get("jwtSecret"), {
              expiresIn: 3600 //60 minutes
            });

            res.json({
              success: true,
              token: token,
              user: user
            });
          }
          else {
            res.status(403).json({
              success: false,
              message: "Could not find user in database, are you registered?"
            });
          }
        });
      }
      else {
        res.status(403).json({
          success: false,
          message: "Token verification failed"
        });
      }
    });
  });

  //Should not require the user to be authenticated
  /**
  * @api {post} /api/register Register
  * @apiDescription Register a new user
  * @apiName Register
  * @apiGroup General
  * @apiParam {String} token  OAuth token obtained by authenticating a user against Facebook's Graph API
  * @apiParam {Number} userId Facebook user id associated with the supplied token, must match in order for the user to become a registered user
  *
  * @apiSuccess {Boolean} success Indicates whether the registration process was successful
  * @apiSuccess {String}  message Description of successful operation
  *
  * @apiError   {Boolean} success Indicates whether the registration process was successful
  * @apiError   {String}  message Description of error occured
  */
  router.post("/register", function(req, res) {
    if(req.body.token === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory token"
      });
    }

    if(req.body.userId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory userId"
      });
    }

    //The client supplies an token corresponding to an authentication for user with the supplied userId
    //Validate token by calling /me endpoint of Facebook API, if userId at the endpoint is the same as the supplied userId then we are authenticated
    //Also request firstName, lastName and email from Facebook's API
    util.performRequest("graph.facebook.com", "/v2.8/me", "GET", {
      access_token: req.body.token,
      fields: "id,first_name,last_name,email"
    }, function(data) {
      if((data !== undefined) && (data.id === req.body.userId)) {
        database.register(data.id, data.first_name, data.last_name, data.email, function(success) {
          if(success) {
            res.status(201).json({
              success: true,
              message: "User registered, you may now authenticate at /authenticate endpoint"
            });
          }
          else {
            res.status(500).json({
              success: false,
              message: "Something went wrong when trying to register the user. Are you already registered?"//TODO: Should deal with already registered users separately and return better response code
            });
          }
        });
      }
      else {
        res.status(400).json({
          success: false,
          message: "Token verification failed, supplied userId and corresponding userId to token did not match."
        });
      }
    });
  });

  //Protect every route below and since this file is included first then all routes with /api will be protected
  router.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {
      jwt.verify(token, app.get("jwtSecret"), function(err, decoded) {
        if(err !== false) {
          if((decoded === undefined) || (decoded.exp < Math.floor(Date.now() / 1000))) {
            return res.status(401).json({
              success: false,
              message: "Token expired"
            });
          }
          else {
            //Auth OK
            req.decoded = decoded;
            next();
          }
        }
        else {
          return res.status(401).json({
            success: false,
            message: "Token verification failed"
          });
        }
      });
    }
    else {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }
  });

  /**
  * @api {get} /api/me Current User
  * @apiDescription Gets information about the user currently associated with the given token
  * @apiName Get Current User
  * @apiGroup General
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiSuccess {Number} id User id of the current user
  * @apiSuccess {String} firstName First name of current user
  * @apiSuccess {String} lastName Last name of current user
  * @apiSuccess {String} email Email address of current user
  * @apiSuccess {Boolean} isAdmin Indicates whether the current user has administrator privileges in order to display user interface accordingly
  *
  * @apiError   {Boolean} success Indicates whether the request was successful
  * @apiError   {String}  message Description of error occured
  */
  router.get('/me', function(req, res, next) {
    database.getUser(req.decoded.userId, function(success, user) {
      if(success) {
        database.isAdmin(user.userId, function(isAdmin) {
          user.isAdmin = isAdmin;
          res.json({
            id: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isAdmin: user.isAdmin
          });
        });
      }
      else {
        res.status(404).json({
          success: false,
          message: "The user associated with this token could not be found"
        });
      }
    });
  });
}
