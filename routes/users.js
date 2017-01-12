module.exports = function(app, router, database) {

  /**
  * @api {get} /api/users Get Users
  * @apiDescription Gets a list of all users. Requires administrator privileges.
  * @apiName Get users
  * @apiGroup Users
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiSuccess {Boolean} success Indicates whether the request was successful
  * @apiSuccess {String} message Status message
  * @apiSuccess {Object[]} users A list containing all users in the system
  * @apiSuccess {Number} users.userId Id of user
  * @apiSuccess {String} users.email Email of user
  * @apiSuccess {String} users.firstName First name of user
  * @apiSuccess {String} users.lastName Last name of user
  * @apiSuccess {String} users.role Name of role which the user belongs to
  *
  * @apiError {String} message Status message
  */
  router.get("/Users",function(req, res) {
    database.isAdmin(req.decoded.userId, function(isAdmin){
      if(isAdmin){
        database.getUsers(function(success, users){
          res.status(200).json({
            success: success,
            users: users,
            message: "Users retrieved successfully"
          });
        });
      }
      else{
        res.status(401).json({
          message : "Not authorized"
        });
      }
    });
  });


  /**
  * @api {get} /api/users/me Get Current User's Information
  * @apiDescription Gets the currently logged in user's information along with recipes added by the user
  * @apiName Get current user's information
  * @apiGroup Users
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiSuccess {Boolean} success Indicates whether the request was successful
  * @apiSuccess {String} message Status message
  * @apiSuccess {Object} user The current user's information
  * @apiSuccess {Number} user.userId Id of user
  * @apiSuccess {String} user.email Email of user
  * @apiSuccess {String} user.firstName First name of user
  * @apiSuccess {String} user.lastName Last name of user
  * @apiSuccess {String} user.role Name of role which the user belongs to
  * @apiSuccess {Object[]} user.recipes List of recipes added by the user
  * @apiSuccess {Number} user.recipes.id Id of recipe
  * @apiSuccess {String} user.recipes.title Title of recipe
  * @apiSuccess {Date} user.recipes.creationTime Timestamp when the recipe was originally created
  * @apiSuccess {String} user.recipes.image Path to recipe's image
  * @apiSuccess {Object} user.recipes.byUser User information of creator
  * @apiSuccess {Number} user.recipes.byUser.id User id of creator
  * @apiSuccess {String} user.recipes.byUser.firstName First name of creator
  * @apiSuccess {String} user.recipes.byUser.lastName Last name of creator
  *
  * @apiError {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  */
  router.get("/Users/me", function(req, res){
    database.getUser(req.decoded.userId, function(success, user){
      if(user !== null){
        database.recipes.getRecipesByUser(user.userId, true, function(success, recipes){
          user.recipes = recipes;
          res.status(200).json({
            success: true,
            user: user,
            message: "User retrieved"
          });
        });
      }
      else{
        res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
    });
  });


  /**
  * @api {get} /api/users/me Get User's Information
  * @apiDescription Gets a given user's information along with recipes added by the user
  * @apiName Get user's information
  * @apiGroup Users
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiSuccess {Boolean} success Indicates whether the request was successful
  * @apiSuccess {String} message Status message
  * @apiSuccess {Object} user The user's information
  * @apiSuccess {Number} user.userId Id of user
  * @apiSuccess {String} user.email Email of user
  * @apiSuccess {String} user.firstName First name of user
  * @apiSuccess {String} user.lastName Last name of user
  * @apiSuccess {String} user.role Name of role which the user belongs to
  * @apiSuccess {Object[]} user.recipes List of recipes added by the user
  * @apiSuccess {Number} user.recipes.id Id of recipe
  * @apiSuccess {String} user.recipes.title Title of recipe
  * @apiSuccess {Date} user.recipes.creationTime Timestamp when the recipe was originally created
  * @apiSuccess {String} user.recipes.image Path to recipe's image
  * @apiSuccess {Object} user.recipes.byUser User information of creator
  * @apiSuccess {Number} user.recipes.byUser.id User id of creator
  * @apiSuccess {String} user.recipes.byUser.firstName First name of creator
  * @apiSuccess {String} user.recipes.byUser.lastName Last name of creator
  *
  * @apiError {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  */
  router.get("/Users/:id", function(req, res){
    database.getUser(req.params.id, function(success, user){
      if(user !== null){
        database.recipes.getRecipesByUser(user.userId, true, function(success, recipes){
          user.recipes = recipes;
          res.status(200).json({
            success: true,
            user: user,
            message: "User retrieved"
          });
        });
      }
      else{
        res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
    });
  });

}
