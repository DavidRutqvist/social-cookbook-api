var connectionPool;
var ingredientsHelper = require("./ingredients");
var likesHelper = require("./likes");
module.exports = {
  init: function(dbPool) {
    connectionPool = dbPool;
    ingredientsHelper.init(connectionPool);
    likesHelper.init(connectionPool);
  },
  insert: function(userId, title, content, numberOfPortions, ingredients, image, callback) {
    connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }

      connection.query("INSERT INTO Recipes (Title, Content, UserId, ImageId, NumberOfPortions) VALUES (?, ?, ?, ?, ?)", [title, content, userId, image, numberOfPortions], function(err, result) {
        if(err) {
          throw err;
        }

        if(result.affectedRows > 0) {
          connection.release();
          callback(true, result.insertId);
        }
        else {
          connection.release();
          callback(false, null);
        }
      });
    });
  },
  addIngredients: function(recipeId, ingredients, callback) {
    connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }

      addNextIngredient(connection, recipeId, 0, ingredients, function(success, numberOfAddedIngredients) {
        callback(success, numberOfAddedIngredients);
      });
    });
  },
  addIngredient: function(recipeId, ingredientId, amount, unit, callback) {
    connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }

      addIngredient(connection, recipeId, ingredientId, amount, unit, function(success) {
        connection.release();
      });
    });
  },
  get: function(recipeId, callback) {
    connectionPool.getConnection(function(err, connection) {//TODO: Add left join with images
      connection.query("SELECT Recipes.Id AS recipeId, Recipes.Title AS title, Recipes.Content AS content, Recipes.CreationTime AS creationTime, Recipes.NumberOfPortions AS numberOfPortions, \
                          Users.FirstName AS firstName, Users.LastName AS lastName, Users.Id AS userId \
                        FROM Recipes \
                        JOIN Users ON Recipes.UserId = Users.Id \
                        WHERE Recipes.Id = ? LIMIT 1", [recipeId], function(err, rows, fields) {
                          if(err) {
                            throw err;
                          }

                          if(rows.length > 0) {
                            var recipe = {
                              id: rows[0].recipeId,
                              title: rows[0].title,
                              creationTime: rows[0].creationTime,
                              numberOfPortions: rows[0].numberOfPortions,
                              content: rows[0].content,
                              byUser: {
                                id: rows[0].userId,
                                firstName: rows[0].firstName,
                                lastName: rows[0].lastName
                              }
                            };

                            getIngredients(connection, recipe, function(recipe) {
                              getLikes(connection, recipe, function(success, recipe) {
                                if(success) {
                                  callback(true, recipe);
                                }
                                else {
                                  callback(false, recipe);
                                }
                              });
                            });
                          }
                          else {
                            connection.release();
                            callback(false, null);
                          }
                        });
    });
  }
}

function getLikes(connection, recipe, callback) {
  likesHelper.getLikes(connection, recipe.id, function(success, likes){
    if(success)
    {
      recipe.likes = likes;
      callback(true, recipe);
    }
    else {
      callback(false, recipe);
    }
  });
}

function getIngredients(connection, recipe, callback) {
  ingredientsHelper.getIngredients(connection, recipe.id, function(ingredients) {
    recipe.ingredients = ingredients;
    callback(recipe);
  });
}

function addNextIngredient(connection, recipeId, index, ingredients, callback) {
  if(index >= ingredients.length) {
    callback(true, ingredients.length);
  }
  else {
    var ingredient = ingredients[index];

    ingredientsHelper.addOrGet(connection, ingredient, function(ingredientId) {
      addIngredientToDatabase(connection, recipeId, ingredientId, ingredient.amount, ingredient.unit, function(success) {
        if(success) {
          addNextIngredient(connection, recipeId, index + 1, ingredients, callback);
        }
        else {
          callback(false, index);//Index here is the number of successfully inserted ingredients before failiure
        }
      });
    });
  }
}

function addIngredientToDatabase(connection, recipeId, ingredientId, amount, unit, callback) {
  connection.query("INSERT INTO IngredientsInRecipes (RecipeId, IngredientId, Amount, Unit) VALUES (?, ?, ?, ?)", [recipeId, ingredientId, amount, unit], function(err, result) {
    if(err) {
      throw err;
    }

    if(result.affectedRows > 0) {
      callback(true);
    }
    else {
      callback(false);
    }
  });
}
