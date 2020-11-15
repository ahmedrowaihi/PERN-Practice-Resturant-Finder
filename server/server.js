require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const db = require("./db");
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());
// Get All Restaurants
app.get("/api/v1/restaurants", async (req, res) => {
  try {
    const results = await db.query("select * from restaurants");
    const restaurantRatingData = await db.query(
      "select * from restaurants left join (select restaurant_id, COUNT(*), TRUNC(AVG(rating),1) as average_rating from reviews group by restaurant_id) reviews on restaurants.id = reviews.restaurant_id;"
    );
    // const AVG = await db.query("select avg(rating)")
    res.status(200).json({
      status: "success",
      results: restaurantRatingData.rows.length,
      data: {
        restaurants: restaurantRatingData.rows,
      },
    });
  } catch (err) {
    res.status(504).send();
  }
});
// Get a restaurant
app.get("/api/v1/restaurants/:id", async ({ params }, res) => {
  try {
    const restaurant = await db.query(
      `select * from restaurants left join (select restaurant_id, COUNT(*), TRUNC(AVG(rating),1) as average_rating from reviews group by restaurant_id) reviews on restaurants.id = reviews.restaurant_id where id = $1`,
      [params.id]
    );
    // $1 $2 within the query represent [$1,$2]
    // select * from restaurants where id = params.id
    const reviews = await db.query(
      `select * from reviews where restaurant_id = $1`,
      [params.id]
    );

    res.status(200).json({
      status: "success",
      data: {
        restaurant: restaurant.rows[0],
        reviews: reviews.rows,
      },
    });
  } catch (error) {
    res.status(504).send();
  }
});
// Create a restaurant
app.post("/api/v1/restaurants", async ({ body }, res) => {
  try {
    const results = await db.query(
      "INSERT INTO restaurants (name, location, price_range) values ($1, $2, $3) returning *",
      [body.name, body.location, body.price_range]
    );
    res.status(200).json({
      status: "success",
      data: {
        restaurant: results.rows[0],
      },
    });
  } catch (error) {
    res.status(504).json({
      status: "failed",
    });
  }
});
// Update a restaurant
app.put("/api/v1/restaurants/:id", async ({ params, body }, res) => {
  try {
    const { name, location, price_range } = body;
    const results = await db.query(
      "UPDATE restaurants SET name = $1, location = $2, price_range = $3  WHERE id = $4 returning *;",
      [name, location, price_range, params.id]
    );
    res.status(200).json({
      status: "success",
      data: {
        restaurant: results.rows[0],
      },
    });
  } catch (error) {
    res.status(504).json({
      status: "failed",
    });
  }
});
// Delete a restaurant
app.delete("/api/v1/restaurants/:id", async ({ params }, res) => {
  try {
    const results = await db.query("DELETE FROM restaurants WHERE id = $1;", [
      params.id,
    ]);
    res.status(200).json({
      status: "success",
      data: {
        restaurant: results.rows,
      },
    });
  } catch (error) {
    res.status(504).json({
      status: "failed",
    });
  }
});

app.post("/api/v1/restaurants/:id/addReview", async ({ params, body }, res) => {
  try {
    const { name, review, rating } = body;
    const result = await db.query(
      "INSERT INTO reviews (restaurant_id,name,review,rating) values ($1,$2,$3, $4) returning *;",
      [params.id, name, review, rating]
    );
    res.status(200).json({
      status: "success",
      data: {
        review: result.rows[0],
      },
    });
  } catch (err) {
    res.status(504).json({
      status: err,
    });
  }
});
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`server is up on port ${port}`));
