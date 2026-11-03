const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authentication");
const { getProfile, followToggler } = require("../controllers/profiles");

//? Profile
router.get("/:username", verifyToken, getProfile);

//* Follow Profile
router.post("/:username/follow", verifyToken.required, followToggler);

//* Unfollow Profile
router.delete("/:username/follow", verifyToken.required, followToggler);

module.exports = router;
