CREATE TABLE Favorites (
  UserId BIGINT NOT NULL,
  RecipeId INT NOT NULL,
  CreationTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (UserId, RecipeId),
  FOREIGN KEY (UserId) REFERENCES Users(Id),
  FOREIGN KEY (RecipeId) REFERENCES Recipes(Id)
);
