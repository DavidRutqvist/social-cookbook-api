module.exports = function(app, router, database) {

  /**
  * @api {get} /api/favorites Get Favorites
  * @apiDescription Gets a list of favorites for the current user
  * @apiName Get Current User's Favorites
  * @apiGroup Favorites
  * @apiHeader {String} x-access-token Token obtained using authentication process
  * @apiParam {String} [order=DESC] Order of recipes by date added (ASC or DESC)
  *
  * @apiSuccess {Object[]} recipes List of recipes marked as favorite
  * @apiSuccess {Number} recipes.id Id of recipe
  * @apiSuccess {String} recipes.title Title of recipe
  * @apiSuccess {Date} recipes.creationTime Timestamp when the recipe was originally created
  * @apiSuccess {String} recipes.image Path to recipe's image
  * @apiSuccess {Object} recipes.byUser User information of creator
  * @apiSuccess {Number} recipes.byUser.id User id of creator
  * @apiSuccess {String} recipes.byUser.firstName First name of creator
  * @apiSuccess {String} recipes.byUser.lastName Last name of creator
  */
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

  /**
  * @api {get} /api/recipes/:id/favorite Check favorite
  * @apiDescription Checks whether a given recipe is favorited by the current user
  * @apiName Check favorite
  * @apiGroup Favorites
  * @apiHeader {String} x-access-token Token obtained using authentication process
  * @apiParam {Number} id Id of recipe to check
  *
  * @apiSuccess {Boolean} isFavorite Indicates whether the recipe is a favorite
  * @apiSuccess {String} message Status message
  *
  * @apiError {Boolean} isFavorite Indicates whether the recipe is a favorite
  * @apiError {String} message Status message
  */
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

  /**
  * @api {post} /api/recipes/:id/favorite Favorite recipe
  * @apiDescription Favorites the recipe with the given id.
  * @apiName Favorite a recipe
  * @apiGroup Favorites
  * @apiHeader {String} x-access-token Token obtained using authentication process
  * @apiParam {Number} id Id of recipe to favorite
  *
  * @apiSuccess {Boolean} success Indicates whether the recipe was favorited
  * @apiSuccess {String} message Status message
  *
  * @apiError {Boolean} success Indicates whether the recipe was favorited
  * @apiError {String} message Status message
  */
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

  /**
  * @api {delete} /api/recipes/:id/favorite Unfavorite recipe
  * @apiDescription Unfavorites the recipe with the given id.
  * @apiName Unfavorite a recipe
  * @apiGroup Favorites
  * @apiHeader {String} x-access-token Token obtained using authentication process
  * @apiParam {Number} id Id of recipe to unfavorite
  *
  * @apiSuccess {Boolean} success Indicates whether the recipe was unfavorited
  * @apiSuccess {String} message Status message
  *
  * @apiError {Boolean} success Indicates whether the recipe was unfavorited
  * @apiError {String} message Status message
  */
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
