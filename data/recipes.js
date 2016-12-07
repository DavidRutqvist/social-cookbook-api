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
  count: function(callback) {
    connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }

      connection.query("SELECT COUNT(*) AS count FROM Recipes", function(err, rows, fields) {
        if(err) {
          throw err;
        }

        connection.release();
        callback(rows[0].count);
      });
    });
  },
  getList: function(page, pageSize, newestFirst, callback) {
    connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }

      var order = "DESC";
      if(newestFirst === false) {
        order = "ASC";
      }
      connection.query("SELECT Recipes.Id AS recipeId, Recipes.Title AS title, Recipes.CreationTime AS creationTime, \
                          Users.FirstName AS firstName, Users.LastName AS lastName, Users.Id AS userId \
                        FROM Recipes \
                        JOIN Users ON Recipes.UserId = Users.Id \
                        ORDER BY creationTime " + order + " \
                        LIMIT ?, ?", [(page - 1) * pageSize, pageSize], function(err, rows, fields) {
                          if(err) {
                            throw err;
                          }

                          var recipes = [];
                          for(var i = 0; i < rows.length; i++) {
                            var row = rows[i];
                            var recipe = {
                              id: row.recipeId,
                              title: row.title,
                              creationTime: row.creationTime,
                              byUser: {
                                id: row.userId,
                                firstName: row.firstName,
                                lastName: row.lastName
                              }
                            };

                            recipes.push(recipe);
                          }

                          connection.release();
                          callback(recipes);
                        });
    });
  },
  get: function(recipeId, callback) {
    connectionPool.getConnection(function(err, connection) {//TODO: Add left join with images
      connection.query("SELECT Recipes.Id AS recipeId, Recipes.Title AS title, Recipes.Content AS content, Recipes.CreationTime AS creationTime, Recipes.NumberOfPortions AS numberOfPortions, \
                          Users.FirstName AS firstName, Users.LastName AS lastName, Users.Id AS userId, \
                          Images.Id AS imageId, Images.Thumbnail AS imageThumbnail, Images.Original AS imageOriginal \
                        FROM Recipes \
                        JOIN Users ON Recipes.UserId = Users.Id \
                        LEFT OUTER JOIN Images ON Recipes.ImageId = Images.Id \
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

                            if((rows[0].imageId !== undefined) && (rows[0].imageId !== null)) {
                              recipe.image = {
                                id: rows[0].imageId,
                                thumbnail: rows[0].imageThumbnail,
                                original: rows[0].imageOriginal
                              };
                            }
                            else {
                              recipe.image = null;
                            }

                            getIngredients(connection, recipe, function(recipe) {
                              getLikes(connection, recipe, function(success, recipe) {
                                if(success) {
                                  connection.release();
                                  callback(true, recipe);
                                }
                                else {
                                  connection.release();
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
