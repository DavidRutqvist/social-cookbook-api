module.exports = function(app, router, database) {
  router.get("/favorites", function(req, res){

    var newestFirst = true;

    if(req.query.order !== undefined){
      if(req.query.order.toLowerCase() === "asc"){
        newestFirst = false;
      }
    }
    database.favorites.getFavorites(req.decoded.userId, newestFirst, function(success, recipes){
      res.json(recipes);
    });
  });
  router.get("/recipes/:id/favorite", function(req, res){
    database.favorites.checkIfFavorite(req.decoded.userId, req.params.id, function(success){
      if(success){
        res.status(200).json({
          isFavorite: true,
          message: "Recipe already a favorite"
        });
      }
      else{
        res.status(404).json({
          isFavorite: false,
          message: "Recipe is not a favorite"
        });
      }
    });
  });
  router.post("/recipes/:id/favorite", function(req, res){
    database.favorites.addNewFavorite(req.decoded.userId, req.params.id, function(success, result){
      if(success){
        res.status(201).json({
          success: true,
          message: "Favorite added successfully"
        });
      }
      else{
        res.status(500).json({
          success: false,
          message: "Something went wrong"
        });
      }
    });
  });
  router.delete("/recipes/:id/favorite", function(req, res){
    database.favorites.removeFavorite(req.decoded.userId, req.params.id, function(success){
      if(success){
        res.status(200).json({
          success: true,
          message: "Favorite successfully removed"
        });
      }
      else{
        res.status(500).json({
          success: false,
          message: "Something went wrong"
        });
      }
    });
  });

}
