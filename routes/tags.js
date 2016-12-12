module.exports = function(app, router, database) {
  router.get("/tags/:tag", function(req, res){
    var newestFirst = true;

    if(req.query.order !== undefined){
      if(req.query.order.toLowerCase() === "asc"){
        newestFirst = false;
      }
    }
    database.tags.getRecipesByTag(req.params.tag, newestFirst, function(success, recipes){
      res.json(recipes);
    });
  });

  router.get("/tags", function(req, res) {
    database.tags.getTags(function(success, tags){
      res.json(tags);
    });
  });
}
