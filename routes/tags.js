module.exports = function(app, router, database) {

  /**
  * @api {get} /api/tags/:tag Get Recipes by Tag
  * @apiDescription Gets all recipes containing the given tag
  * @apiName Get all recipes by tag
  * @apiGroup Tags
  * @apiHeader {String} x-access-token Token obtained using authentication process
  * @apiParam {String} [order=DESC] Order of recipes by date added (ASC or DESC)
  * @apiParam {String} tag Tag to get recipes for
  *
  * @apiSuccess {Object[]} recipes List of recipes containing the given tag
  * @apiSuccess {Number} recipes.id Id of recipe
  * @apiSuccess {String} recipes.title Title of recipe
  * @apiSuccess {Date} recipes.creationTime Timestamp when the recipe was originally created
  * @apiSuccess {String} recipes.image Path to recipe's image
  * @apiSuccess {Object} recipes.byUser User information of creator
  * @apiSuccess {Number} recipes.byUser.id User id of creator
  * @apiSuccess {String} recipes.byUser.firstName First name of creator
  * @apiSuccess {String} recipes.byUser.lastName Last name of creator
  */
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

  /**
  * @api {get} /api/tags Get Tags
  * @apiDescription Gets a list of all tags
  * @apiName Get all tags
  * @apiGroup Tags
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiSuccess {Object[]} tags List of tags available in the system
  * @apiSuccess {String} tags.name Name of tag
  * @apiSuccess {Number} tags.count Number of recipes containing the tag
  */
  router.get("/tags", function(req, res) {
    database.tags.getTags(function(success, tags){
      res.json(tags);
    });
  });
}
