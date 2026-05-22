const express = require('express');
const aiRouter =  express.Router();
const { verifyToken, loadUser } = require('../middleware/auth');
const solveDoubt = require('../controllers/solveDoubt');
const createRateLimiter = require("../middleware/rateLimiterMiddleware");

aiRouter.post('/chat', verifyToken, loadUser,createRateLimiter(60, 20), solveDoubt);

module.exports = aiRouter;