module.exports = function(app, router, database) {
  router.get("/Users",function(req, res) {
    database.getUsers(function(success, users){
      res.json(users);
    });
  });
}
