module.exports = function(app, router, database) {
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
