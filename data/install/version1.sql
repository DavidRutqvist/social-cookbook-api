CREATE TABLE Users (
  Id BIGINT NOT NULL,
  Email VARCHAR(255) NOT NULL,
  FirstName VARCHAR(255) NOT NULL,
  LastName VARCHAR(255) NOT NULL,

  PRIMARY KEY (Id)
);

CREATE TABLE Ingredients (
  Id INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,
  Calories DOUBLE NULL,
  Fat DOUBLE NULL,
  Proteins DOUBLE NULL,

  PRIMARY KEY (Id)
);

CREATE TABLE Images (
  Id INT NOT NULL AUTO_INCREMENT,
  Thumbnail VARCHAR(255)NOT NULL,
  Original VARCHAR(255)NOT NULL,

  PRIMARY KEY (Id)
);

CREATE TABLE Recipes (
  Id INT NOT NULL AUTO_INCREMENT,
  Title TEXT NOT NULL,
  Content LONGTEXT NOT NULL,
  CreationTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UserId BIGINT NOT NULL,
  ImageId INT NULL,

  PRIMARY KEY (Id),
  FOREIGN KEY (UserId) REFERENCES Users(Id),
  FOREIGN KEY (ImageId) REFERENCES Images(Id)
);

CREATE TABLE IngredientsInRecipes (
  IngredientId INT NOT NULL,
  RecipeId INT NOT NULL,
  Amount DOUBLE NOT NULL,
  Unit VARCHAR(15) NOT NULL,

  PRIMARY KEY (IngredientId, RecipeId),
  FOREIGN KEY (IngredientId) REFERENCES Ingredients(Id),
  FOREIGN KEY (RecipeId) REFERENCES Recipes(Id)
);

CREATE TABLE Likes (
  UserId BIGINT NOT NULL,
  RecipeId INT NOT NULL,
  Type INT NOT NULL,

  PRIMARY KEY (UserId, RecipeId),
  FOREIGN KEY (UserId) REFERENCES Users(Id),
  FOREIGN KEY (RecipeId) REFERENCES Recipes(Id)
);

CREATE TABLE Comments (
  Id INT NOT NULL AUTO_INCREMENT,
  UserId BIGINT NOT NULL,
  RecipeId INT NOT NULL,
  CreationTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Content TEXT NOT NULL,

  PRIMARY KEY (Id),
  FOREIGN KEY (UserId) REFERENCES Users(Id),
  FOREIGN KEY (RecipeId) REFERENCES Recipes(Id)
);

CREATE TABLE Tags (
  Id INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(255) NOT NULL,

  PRIMARY KEY (Id)
);

CREATE TABLE RecipeTags (
  RecipeId INT NOT NULL,
  TagId INT NOT NULL,

  PRIMARY KEY (RecipeId, TagId),
  FOREIGN KEY (RecipeId) REFERENCES Recipes(Id),
  FOREIGN KEY (TagId) REFERENCES Tags(Id)
);