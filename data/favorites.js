var connectionPool;
module.exports = {
  init: function(dbPool) {
    connectionPool = dbPool;
  },
  addNewFavorite: function(userId, recipeId, callback){
    connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }
      addNewFavorite(connection, userId, recipeId, function(success, result) {
        connection.release();
        callback(success, result);
      });
    });
  },
  removeFavorite: function(userId, recipeId, callback){
    connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }
      removeFavorite(connection, userId, recipeId, function(success, result) {
        connection.release();
        callback(success, result);
      });
    });
  },
  removeFavoritesFromRecipe: function(connection, recipeId, callback) {
    connection.query("DELETE FROM Favorites WHERE  RecipeId = ?", [recipeId], function(err, result){
      if(err){
        throw err;
      }

      callback(true);
    });
  },
  checkIfFavorite: function(userId, recipeId, callback) {
    connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }
      checkIfFavorite(connection, userId, recipeId, function(success) {
        connection.release();
        callback(success);
      });
    });
  },
  getFavorites: function(userId, newestFirst, callback) {
    connectionPool.getConnection(function(err, connection) {
      if(err) {
        throw err;
      }
      getFavorites(connection, userId, newestFirst, function(success, favorites) {
        connection.release();
        callback(success, favorites);
      });
    });
  }

};

function addNewFavorite(connection, userId, recipeId, callback){
  connection.query("INSERT INTO Favorites (UserId, RecipeId) VALUES (?, ?)", [userId, recipeId], function(err, result){
    if(err){
      throw err;
    }
    if(result.affectedRows > 0){
      callback(true, result.insertId);
    }
    else{
      callback(false, result);
    }
  });
}

function checkIfFavorite(connection, userId, recipeId, callback) {
  connection.query("SELECT COUNT(*) as count FROM Favorites WHERE UserId = ? AND RecipeId = ?", [userId, recipeId], function(err, rows, fields){
    if(err){
      throw err;
    }
    if(rows[0].count > 0){
      callback(true);
    }
    else{
      callback(false);
    }

  });
}

function removeFavorite(connection, userId, recipeId, callback){
  connection.query("DELETE FROM Favorites WHERE UserId = ? AND RecipeId = ?", [userId, recipeId], function(err, result){
    if(err){
      throw err;
    }
    if(result.affectedRows > 0){
      callback(true);
    }
    else{
      //Check if already deleted (i.e. if user uses multiple tabs)
      checkIfFavorite(connection, userId, recipeId, function(isFavorite) {
        callback(!isFavorite);//If not favorite then we say it was deleted since the user could have deleted it in another tab
      });
    }
  });
}

function getFavorites(connection, userId, newestFirst, callback) {
  var order = "DESC";
  if(newestFirst === false){
    order = "ASC";
  }
  connection.query("SELECT Recipes.Id AS recipeId, Recipes.Title AS title, Recipes.CreationTime AS creationTime, \
  Users.FirstName AS firstName, Users.LastName AS lastName, Users.Id AS userId, \
  Images.Original AS image \
  FROM Favorites \
  JOIN Recipes On Favorites.RecipeId = Recipes.Id \
  JOIN Users ON Recipes.UserId = Users.Id \
  LEFT OUTER JOIN Images ON Recipes.ImageId = Images.Id \
  WHERE Favorites.userId = ? \
  ORDER BY creationTime " + order , [userId], function(err, rows, fields){
    if(err){
      throw err;
    }

    var recipes = [];
    for(var i = 0; i < rows.length; i++){
      var row = rows[i];
      var recipe = {
        id: row.recipeId,
        title: row.title,
        creationTime: row.creationTime,
        image: row.image,
        byUser: {
          id: row.userId,
          firstName: row.firstName,
          lastName: row.lastName
        }
      };

      recipes.push(recipe);
    }

    callback(true, recipes);
  });

}
