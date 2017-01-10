var multer = require('multer');
var upload = multer();
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
