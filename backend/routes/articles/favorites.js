const express = require("express");
const router = express.Router();
const verifyToken = require("../../middleware/authentication");
const { favoriteToggler } = require("../../controllers/favorites");

//* Favorite Article
router.post("/:slug/favorite", verifyToken.required, favoriteToggler);
//* Unfavorite Article
router.delete("/:slug/favorite", verifyToken.required, favoriteToggler);

module.exports = router;
