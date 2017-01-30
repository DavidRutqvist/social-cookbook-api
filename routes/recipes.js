var multer = require('multer');
var upload = multer();
module.exports = function(app, router, database) {

  /**
  * @api {get} /api/recipes List Recipes
  * @apiDescription Gets a list of recipes for the given page
  * @apiName Get list of recipes, paginated
  * @apiGroup Recipes
  * @apiHeader {String} x-access-token Token obtained using authentication process
  * @apiParam {Number} [page=1] Page
  * @apiParam {String} [order=DESC] Order of recipes by date added (ASC or DESC)
  *
  * @apiSuccess {Number} page Current page number
  * @apiSuccess {Number} pageSize Page size used when paging results
  * @apiSuccess {Number} totalCount Total number of recipes stored
  * @apiSuccess {Object[]} recipes List of recipes
  * @apiSuccess {Number} recipes.id Id of recipe
  * @apiSuccess {String} recipes.title Title of recipe
  * @apiSuccess {Date} recipes.creationTime Timestamp when the recipe was originally created
  * @apiSuccess {String} recipes.image Path to recipe's image
  * @apiSuccess {Object} recipes.byUser User information of creator
  * @apiSuccess {Number} recipes.byUser.id User id of creator
  * @apiSuccess {String} recipes.byUser.firstName First name of creator
  * @apiSuccess {String} recipes.byUser.lastName Last name of creator
  */
  router.get("/recipes", function(req, res) {
    //Get all recipes with pagination
    var page = 1;
    var pageSize = 20;
    var newestFirst = true;

    if(req.query.page !== undefined) {
      page = req.query.page;
    }

    if(req.query.order !== undefined) {
      if(req.query.order.toLowerCase() === "asc") {
        newestFirst = false;
      }
    }

    database.recipes.count(function(recipeCount) {
      database.recipes.getList(page, pageSize, newestFirst, function(recipes) {
        var responseObject = {
          page: page,
          pageSize: pageSize,
          totalCount: recipeCount,
          recipes: recipes
        };

        res.json(responseObject);
      });
    });
  });

  /**
  * @api {post} /api/recipes Add Recipe
  * @apiDescription Add a new recipe to the cookbook
  * @apiName Add a new recipe
  * @apiGroup Recipes
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiParam {String} title Title of new recipe
  * @apiParam {String} content HTML content of recipe, will be sanitized by API. Allows simple tags like bold, underline et cetera.
  * @apiParam {Number} numberOfPortions Number of portions the recipe is following
  * @apiParam {Object[]} ingredients List of ingredients
  * @apiParam {String} ingredients.name Name of ingredients
  * @apiParam {Number} ingredients.amount Amount of ingredient, may be a decimal
  * @apiParam {String} ingredients.unit Unit which the amount is measured in
  *
  * @apiSuccess {Boolean} success Indicates whether the request was successful
  * @apiSuccess {Number} recipeId Id of newly created recipe
  * @apiSuccess {String} message Status message
  *
  * @apiError {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  */
  router.post("/recipes", function(req, res) {
    //Add a new recipe
    var missingFields = "";
    if(req.body.title === undefined) {
      missingFields += "title, ";
    }

    if(req.body.content === undefined) {
      missingFields += "content, ";
    }

    if((req.body.ingredients === undefined) || (req.body.ingredients.length == 0)) {
      missingFields += "ingredients, ";
    }

    if(req.body.numberOfPortions === undefined) {
      missingFields += "numberOfPortions, ";
    }

    if(missingFields !== "") {
      missingFields = missingFields.substring(0, missingFields.length - 2);
      return res.status(400).json({
        success: false,
        message: "Missing mandatory fields " + missingFields
      });
    }

    for(var i = 0; i < req.body.ingredients.length; i++) {
      var ingredient = req.body.ingredients[i];
      if((ingredient.name === undefined) || (ingredient.amount === undefined) || (ingredient.unit === undefined)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ingredient(s) supplied"
        });
      }
    }

    var tags = [];
    if(req.body.tags !== undefined){
      tags = req.body.tags;
    }

    database.recipes.insert(req.decoded.userId, req.body.title, req.body.content, req.body.numberOfPortions, req.body.ingredients , null, function(success, recipeId) {
      if(success) {
        database.tags.addTags(recipeId, tags, function(success, numberOfAddedTags){
          if(success){
            database.recipes.addIngredients(recipeId, req.body.ingredients, function(succcess, numberOfAddedIngredients) {
              if(success) {
                res.status(201).json({
                  success: true,
                  recipeId: recipeId,
                  message: "Recipe created successfully"
                });
              }
              else {
                res.status(201).json({
                  success: true,
                  recipeId: recipeId,
                  message: "Recipe was created but only " + numberOfAddedIngredients + " ingredients could be added the rest failed"
                });
              }
            });
          }
          else {
            res.status(201).json({
              success: true,
              recipeId: recipeId,
              message: "Recipe was created but only " + numberOfAddedTags + " tags could be added the rest failed"
            });
          }
        });
      }
      else {
        res.status(500).json({
          success: false,
          message: "Something went wrong"
        });
      }
    });
  });

  /**
  * @api {get} /api/recipes/:id Get Recipe
  * @apiDescription Gets a specific recipe containing all information about the recipe
  * @apiName Get a specific recipe
  * @apiGroup Recipes
  * @apiHeader {String} x-access-token Token obtained using authentication process
  * @apiParam {Number} id Id of the recipe to get
  *
  * @apiSuccess {Number} id Id of recipe
  * @apiSuccess {String} title Title of recipe
  * @apiSuccess {Date} creationTime Timestamp when the recipe was originally created
  * @apiSuccess {String} image Path to recipe's image
  * @apiSuccess {Number} numberOfPortions The number of portions the recipe is for
  * @apiSuccess {String} content HTML content of the recipe, i.e. the actual descriptions
  * @apiSuccess {Object} byUser User information of creator
  * @apiSuccess {Number} byUser.id User id of creator
  * @apiSuccess {String} byUser.firstName First name of creator
  * @apiSuccess {String} byUser.lastName Last name of creator
  * @apiSuccess {Object[]} ingredients Ingredients used in the recipe
  * @apiSuccess {Number} ingredients.id Id of ingredient
  * @apiSuccess {String} ingredients.name Name of ingredients
  * @apiSuccess {Number} ingredients.amount Amount used for the specific ingredients
  * @apiSuccess {String} ingredients.unit Unit which the ingredient is measured in
  * @apiSuccess {String[]} tags Tags
  * @apiSuccess {Object[]} comments Comments on the recipeId
  * @apiSuccess {Number} comments.id Id of comments
  * @apiSuccess {String} comments.content Content of comment
  * @apiSuccess {Date} comments.creationTime Timestamp of comment
  * @apiSuccess {String} comments.firstName First name of user who commented
  * @apiSuccess {String} comments.lastName Last name of user who commented
  * @apiSuccess {Number} comments.userId User id of user who commented
  * @apiSuccess {Object} likes Object containing count of likes
  * @apiSuccess {Number} likes.yum Number of "yums"
  * @apiSuccess {Number} likes.yuck Number of "yucks"
  */
  router.get("/recipes/:id", function(req, res) {
    //Get a specific recipe with id req.params.id
    database.recipes.get(req.params.id, function(success, recipe) {
      if(success) {
        res.json(recipe);
      }
      else {
        res.status(404).json({
          success: false,
          message: "Recipe not found"
        });
      }
    });
  });

  /**
  * @api {post} /api/recipes/:id/comments Add Comment
  * @apiDescription Add a new comment to a specific recipe
  * @apiName Add a comment
  * @apiGroup Recipes
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiParam {Number} id Id of the recipe to comment
  * @apiParam {String} content Content of comment, no HTML allowed but if HTML is supplied will it be removed by the API
  *
  * @apiSuccess {Boolean} success Indicates whether the request was successful
  *
  * @apiError {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  */
  router.post("/recipes/:id/comments", function(req, res) {
    if((req.body.comment === undefined) || (req.body.comment === null) || (req.body.comment === "")) {
      res.status(400).json({
        success: false,
        message: "Missing mandatory comment"
      });
    }
    else {
      database.comments.addNewComment(req.decoded.userId, req.params.id, req.body.comment, function(success, commentId) {
        if(success) {
          res.json({
            success: true
          });
        }
        else {
          res.status(500).json({
            success: false,
            message: "Could not add comment"
          });
        }
      })
    }
  });

  /**
  * @api {delete} /api/recipes/:id/likes Remove like
  * @apiDescription Removes a like from the recipe which was added by the current user. Since a user can only like a recipe once is no id or type required.
  * @apiName Remove a like
  * @apiGroup Recipes
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiParam {Number} id Id of the recipe to unlike
  *
  * @apiSuccess {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  *
  * @apiError {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  */
  router.delete("/recipes/:id/likes", function(req, res) {
    database.likes.getLikeByUser(req.decoded.userId, req.params.id, function(success, type) {
      if(success) {
        //Remove like
        database.likes.removeLike(req.decoded.userId, req.params.id, function(success) {
          if(success === true) {
            res.status(200).json({
              success: true,
              message: "Recipe unliked"
            });
          }
          else {
            res.status(500).json({
              success: false,
              message: "Could not remove like from recipe"
            });
          }
        });
      }
      else {
        res.status(200).json({
          success: true,
          message: "You did not like the recipe from the beginning (still success true since you don't like the recipe)"
        });
      }
    });
  });

  /**
  * @api {post} /api/recipes/:id/likes Add like
  * @apiDescription Adds a like to the current recipe. If the current user has already liked the recipe then the like type, i.e. yum or yuck, will be updated accordingly.
  * @apiName Add a like
  * @apiGroup Recipes
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiParam {Number} id Id of the recipe to like
  * @apiParam {String} type Type of like, must be yum or yuck
  *
  * @apiSuccess {Boolean} success Indicates whether the request was successful
  *
  * @apiError {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  */
  router.post("/recipes/:id/likes", function(req, res) {
    if(!req.body.type) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory like type parameter"
      });
    }

    var typeId = 0;
    if(req.body.type.toLowerCase() === "yum") {
      typeId = 1;
    }
    else if(req.body.type.toLowerCase() === "yuck") {
      typeId = 0;
    }
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid like type"
      });
    }

    database.likes.getLikeByUser(req.decoded.userId, req.params.id, function(success, type) {
      if(success) {
        database.likes.updateLike(req.decoded.userId, req.params.id, typeId, function(success) {
          if(success) {
            res.status(200).json({
              success: true
            });
          }
          else {
            res.status(500).json({
              success: false,
              message: "Could change like"
            });
          }
        });
      }
      else {
        database.likes.addNewLike(req.decoded.userId, req.params.id, typeId, function(success, likeId) {
          if(success) {
            res.status(201).json({
              success: true
            });
          }
          else {
            res.status(500).json({
              success: false,
              message: "Could not add new like"
            });
          }
        });
      }
    });
  });

  /**
  * @api {get} /api/recipes/:id/likes Get likes
  * @apiDescription Gets likes for the recipe
  * @apiName Get likes for recipe
  * @apiGroup Recipes
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiParam {Number} id Id of the recipe to get likes for
  *
  * @apiSuccess {Number} yum Number of "yums"
  * @apiSuccess {Number} yuck Number of "yucks"
  *
  * @apiError {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  */
  router.get("/recipes/:id/likes", function(req, res) {
    database.likes.getLikes(req.params.id, function(success, likes) {
      if(success) {
        res.json(likes);
      }
      else {
        res.status(500).json({
          success: false,
          message: "Could not get likes"
        })
      }
    });
  });

  /**
  * @api {get} /api/recipes/:id/likes/me Get current user's like
  * @apiDescription Checks whether current user has likes the recipe and returns the type of like
  * @apiName Get current user's like
  * @apiGroup Recipes
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiParam {Number} id Id of the recipe to get like for
  *
  * @apiSuccess {Boolean} likes Indicates whether the current user likes the recipe or not
  * @apiSuccess {String} type If the user likes the current recipe is the type of like returned, i.e. yum och yuck
  */
  router.get("/recipes/:id/likes/me", function(req, res) {
    database.likes.getLikeByUser(req.decoded.userId, req.params.id, function(success, type) {
      if(success) {
        var typeName = "";
        if(type === 0) {
          typeName = "yuck";
        }
        else if(type === 1) {
          typeName = "yum";
        }
        res.json({
          likes: true,
          type: typeName
        });
      }
      else {
        res.json({
          likes: false
        });
      }
    })
  });

  /**
  * @api {put} /api/recipes/:id Update Recipe
  * @apiDescription Updates the specified recipe. The current user must either be creator of the recipe or an administrator.
  * @apiName Update a Recipe
  * @apiGroup Recipes
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiParam {String} title Title of recipe
  * @apiParam {String} content HTML content of recipe, will be sanitized by API. Allows simple tags like bold, underline et cetera.
  * @apiParam {Number} numberOfPortions Number of portions the recipe is following
  * @apiParam {Object[]} ingredients List of ingredients
  * @apiParam {String} ingredients.name Name of ingredients
  * @apiParam {Number} ingredients.amount Amount of ingredient, may be a decimal
  * @apiParam {String} ingredients.unit Unit which the amount is measured in
  *
  * @apiSuccess {Boolean} success Indicates whether the request was successful
  * @apiSuccess {String} message Status message
  *
  * @apiError {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  */
  router.put("/recipes/:id", function(req, res) {
    //Update recipe
    var recipeId = req.params.id;
    var missingFields = "";
    if(req.body.title === undefined) {
      missingFields += "title, ";
    }

    if(req.body.content === undefined) {
      missingFields += "content, ";
    }

    if((req.body.ingredients === undefined) || (req.body.ingredients.length == 0)) {
      missingFields += "ingredients, ";
    }

    if(req.body.numberOfPortions === undefined) {
      missingFields += "numberOfPortions, ";
    }

    if(missingFields !== "") {
      missingFields = missingFields.substring(0, missingFields.length - 2);
      return res.status(400).json({
        success: false,
        message: "Missing mandatory fields " + missingFields
      });
    }

    for(var i = 0; i < req.body.ingredients.length; i++) {
      var ingredient = req.body.ingredients[i];
      if((ingredient.name === undefined) || (ingredient.amount === undefined) || (ingredient.unit === undefined)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ingredient(s) supplied"
        });
      }
    }

    var tags = [];
    if(req.body.tags !== undefined){
      tags = req.body.tags;
    }

    database.recipes.update(recipeId, req.body.title, req.body.content, req.body.numberOfPortions, function(success) {
      if(success) {
        database.tags.removeTagsFromRecipe(recipeId, function(success) {
          if(success) {
            database.tags.addTags(recipeId, tags, function(success, numberOfAddedTags){
              if(success){
                database.recipes.removeAllIngredients(recipeId, function(success) {
                  if(success) {
                    database.recipes.addIngredients(recipeId, req.body.ingredients, function(succcess, numberOfAddedIngredients) {
                      if(success) {
                        res.status(200).json({
                          success: true,
                          message: "Recipe updated successfully"
                        });
                      }
                      else {
                        res.status(200).json({
                          success: true,
                          message: "Recipe was updated but only " + numberOfAddedIngredients + " ingredients could be added the rest failed"
                        });
                      }
                    });
                  }
                  else {
                    res.status(200).json({
                      success: true,
                      message: "Recipe was updated but could not add ingredients, thus all ingredients were removed"
                    });
                  }
                });
              }
              else {
                res.status(200).json({
                  success: true,
                  message: "Recipe was updated but only " + numberOfAddedTags + " tags could be added the rest failed"
                });
              }
            });
          }
          else {
            res.status(200).json({
              success: true,
              message: "Recipe was updated but could not update tags. Tags and ingredients were therefore not updated"
            });
          }
        });
      }
      else {
        res.status(500).json({
          success: false,
          message: "Something went wrong"
        });
      }
    });
  });

  /**
  * @api {put} /api/recipes/:id/image Set image
  * @apiDescription Sets the image for the recipe. If an image is provided is it uploaded to the API servers, otherwise is the current image set to no image.
  * @apiName Set image of recipe
  * @apiGroup Recipes
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiParam {Number} id Id of the recipe to set image for
  * @apiParam {File} [image] Image supplied as multipart/form-data. If leaved then current image is removed.
  *
  * @apiSuccess {Boolean} success Indicates whether the request was successful
  *
  * @apiError {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  */
  router.put("/recipes/:id/image", upload.single('image'), function(req, res) {
    if(req.file !== undefined) {
      database.images.upload(req.decoded.userId, req.file, function(image) {
        //Update image in database
        if((image !== undefined) && (image !== null)) {
          database.recipes.setImage(req.params.id, image, function(success) {
            if(success) {
              res.json({
                success: true
              });
            }
            else {
              //Recipe not found
              res.status(404).json({
                success: false,
                message: "Recipe not found"
              });
            }
          });
        }
        else {
          res.status(500).json({
            success: false,
            message: "File upload failed"
          });
        }
      });
    }
    else {//Remove image from recipe, i.e. set null
      database.recipes.setImage(req.params.id, null, function(success) {
        if(success) {
          res.json({
            success: true
          });
        }
        else {
          //Recipe not found
          res.status(404).json({
            success: false,
            message: "Recipe not found"
          });
        }
      });
    }
  });

  /**
  * @api {delete} /api/recipes/:id Delete Recipe
  * @apiDescription Deletes the recipe and all associated data, i.e. comments, likes, favorites et cetera. The current user must either be creator or administrator in order to be able to delete a recipe.
  * @apiName Delete a Recipe
  * @apiGroup Recipes
  * @apiHeader {String} x-access-token Token obtained using authentication process
  *
  * @apiParam {Number} id Id of the recipe to delete
  *
  * @apiSuccess {Boolean} success Indicates whether the request was successful
  * @apiSuccess {String} message Status message
  *
  * @apiError {Boolean} success Indicates whether the request was successful
  * @apiError {String} message Status message
  */
  router.delete("/recipes/:id", function(req, res) {
    //Delete recipe with id req.params.id
    database.recipes.getCreator(req.params.id, function(success, creatorId) {
      if(success) {
        if(creatorId.toString() === req.decoded.userId.toString()) {
          deleteRecipe(res, database.recipes, req.params.id);
        }
        else {
          database.isAdmin(req.decoded.userId, function(isAdmin) {
            if(isAdmin) {
              deleteRecipe(res, database.recipes, req.params.id);
            }
            else {
              res.status(403).json({
                success: false,
                message: "You are not either administrator or the creator of the recipe, hence you are not allowed to delete it"
              });
            }
          });
        }
      }
      else {
        res.status(404).json({
          success: false,
          message: "Recipe not found"
        });
      }
    });
  });
}

function deleteRecipe(res, recipes, recipeId) {
  recipes.delete(recipeId, function(success) {
    if(success) {
      res.json({
        success: true
      });
    }
    else {
      res.status(500).json({
        success: false,
        message: "Could not delete recipe"
      });
    }
  });
}
