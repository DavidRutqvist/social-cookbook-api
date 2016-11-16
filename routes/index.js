module.exports = function(app, router, jwt) {
  //NOTE: /authenticate must be first in this file, otherwise it will be protected by login i.e. API will be inaccessible
  //Authenticate using a POST call to the route with post data email and password
  router.post("/authenticate", function(req, res) {
    //TODO: Facebook authentication as well, could be specified using a method-parameter
    
    if(req.body.email === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory email"
      });
    }

    if(req.body.password === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory password"
      });
    }

    //TODO: authenticate
    var user = {//Should get through database
      email: req.body.email
    };

    //All good, create token
    var token = jwt.sign(user, app.get("jwtSecret"), {
      expiresIn: 1440 //24 hours
    });

    return res.json({
      success: true,
      token: token
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
