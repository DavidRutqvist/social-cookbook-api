module.exports = function(app, router, database) {
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

    database.recipes.insert(req.decoded.userId, req.body.title, req.body.content, req.body.numberOfPortions, req.body.ingredients , req.body.image, function(success, recipeId) {
      if(success) {
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
              message: "Recipe was create but only " + numberOfAddedIngredients + " ingredients could be added the rest failed"
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

  router.post("/recipes/:id/likes/:type", function(req, res) {
    var typeId = 0;
    if(req.params.type.toLowerCase() === "yum") {
      typeId = 1;
    }
    else if(req.params.type.toLowerCase() === "yuck") {
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
        res.status(400).json({
          success: false,
          message: "You already like this recipe. You may only like it once, either yum or yuck not both."
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

  router.put("/recipes/:id", function(req, res) {
    //Update the parameters supplied in the request body in recipe with id req.params.id
    res.json({
      message: "Not yet implemented"
    });
  });

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
