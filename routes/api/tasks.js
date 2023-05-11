const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /tasks:
 *  get:
 *    summary: Retrieve a list of tasks
 *    tags: [Tasks]
 *    responses:
 *      200:
 *        description: A list of tasks
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Task'
 */
router.get('/tasks', (req, res) => {
  // Your logic to retrieve tasks
});

module.exports = router;
