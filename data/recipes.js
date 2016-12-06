var connectionPool;
var ingredientsHelper;
module.exports = {
  init: function(dbPool, ingredientsHelperObject) {
    connectionPool = dbPool;
    ingredientsHelper = ingredientsHelperObject;
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
  }
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
