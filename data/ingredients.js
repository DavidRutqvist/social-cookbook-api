var connectionPool;
module.exports = {
  init: function(dbPool) {
    connectionPool = dbPool;
  },
  addOrGet: function(ingredient, callback) {
    connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }

      this.addOrGet(connection, ingredient, function(ingredientId) {
        connection.release();
        callback(ingredientId);
      });
    });
  },
  addOrGet: function(connection, ingredient, callback) {
    connection.query("SELECT Id FROM Ingredients WHERE Name = ? LIMIT 1", [ingredient.name.toLowerCase()], function(err, rows, fields) {
      if(err) {
        throw err;
      }

      if(rows.length > 0) {
        callback(rows[0].Id);
      }
      else {
        //TODO: Use nutritionix and look-up calories, fat and proteins for ingredient
        connection.query("INSERT INTO Ingredients (Name) VALUES (?)", [ingredient.name.toLowerCase()], function(err, result) {
          if(err) {
            throw err;
          }

          if(result.affectedRows > 0) {
            callback(result.insertId);
          }
          else {
            callback(null);
          }
        });
      }
    });
  },
  getIngredients: function(connection, recipeId, callback) {
    connection.query("SELECT Ingredients.Id AS id, Ingredients.Name AS name, IngredientsInRecipes.Amount AS amount, IngredientsInRecipes.Unit AS unit \
                      FROM IngredientsInRecipes JOIN Ingredients ON IngredientsInRecipes.IngredientId = Ingredients.Id \
                      WHERE IngredientsInRecipes.RecipeId = ?",
                      [recipeId],
                      function(err, rows, fields) {
                        if(err) {
                          throw err;
                        }

                        callback(rows);
                      });
  }
}
