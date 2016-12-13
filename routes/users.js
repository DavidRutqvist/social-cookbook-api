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
}
