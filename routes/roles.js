module.exports = function(app, router, database) {
  router.get("/roles", function(req, res){
    database.isAdmin(req.decoded.userId, function(isAdmin){
      if(isAdmin){
        database.getRoles(function(roles){
          res.status(200).json({
            roles: roles,
            success: true,
            message: "Roles retrieved successfully"
          });
        });
      }
      else{
        res.status(401).json({
          success: false,
          message: "Not authorized"
        });
      }
    });
  });
  router.put("/users/:id", function(req, res){
    database.isAdmin(req.decoded.userId, function(isAdmin){
      if(isAdmin){
        database.setRole(req.params.id, req.body.role, function(success){
          if(success){
            res.status(200).json({
              success: success,
              message: "Role updated successfully"
            });
          }
          else{
            res.status(500).json({
              success: success,
              message: "Something went wrong"
            });
          }
        });
      }
      else{
        res.status(401).json({
          message: "Not authorized"
        });
      }
    });
  });
}
