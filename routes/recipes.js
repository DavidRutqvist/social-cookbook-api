module.exports = function(app, router, database) {
  router.get("/recipes", function(req, res) {
    //Get all recipes with pagination
    res.json({
      message: "Not yet implemented"
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

  router.put("/recipes/:id/:param", function(req, res) {
    //Update the parameter :param in recipe with id req.params.id
    res.json({
      message: "Not yet implemented"
    });
  });

  router.delete("/recipes/:id", function(req, res) {
    //Delete recipe with id req.params.id
    res.json({
      message: "Not yet implemented"
    });
  });
}
