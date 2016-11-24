module.exports = function(app, router, jwt, util) {
  //NOTE: /authenticate must be first in this file, otherwise it will be protected by login i.e. API will be inaccessible
  //Authenticate using a POST call to the route with post data token and userId where token is the OAuth token received from Facebook auth in client for user with supplied userId
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
        var user = {//Should get through database
          name: data.name,
          email: 'test@test.com'
        };

        //All good, create token
        var token = jwt.sign(user, app.get("jwtSecret"), {
          expiresIn: 1440 //24 hours
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
          message: "Token verification failed"
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
          //Auth OK
          req.decoded = decoded;
          next();
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

  router.get('/', function(req, res, next) {
    res.json({
      message: "testing"
    })
  });
}
