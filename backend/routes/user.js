const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authentication");
const { currentUser, updateUser } = require("../controllers/user");

//* Current User
router.get("/", verifyToken.required, currentUser);
//* Update User
router.put("/", verifyToken.required, updateUser);

module.exports = router;
