import express from 'express';
import * as todosDao from '../../db/todos-dao';
import mongoose from 'mongoose';

// const HTTP_OK = 200; // Not really needed; this is the default if you don't set something else.
const HTTP_CREATED = 201;
const HTTP_NOT_FOUND = 404;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;

const router = express.Router();

// TODO Exercise Four: Add your RESTful routes here.

/**
 * A trick to include the check for a valid id in one place, rather than in every single method that needs it.
 * If "next()" is called, the next route below that matches will be called. Otherwise, we just end the response.
 * The "use()" function will match ALL HTTP request method types (i.e. GET, PUT, POST, DELETE, etc).
 */
router.use('/:id', async (req, res, next) => {
    const { id } = req.params;
    if (mongoose.isValidObjectId(id)) {
        next();
    }
    else {
        res.status(HTTP_BAD_REQUEST)
            .contentType('text/plain').send('Invalid ID');
    }
});

// Create todo
router.post('/', async (req, res) => {
    if (!req.body.title) {
        res.status(HTTP_BAD_REQUEST)
            .contentType('text/plain').send('New todos must have a title');
        return;
    }
    const newTodo = await todosDao.createTodo(req.body);
    res.status(HTTP_CREATED)
        .header('location', `/api/todos/${newTodo._id}`)
        .json(newTodo);
});

// Retrieve todo list
router.get('/', async (req, res) => {

    // Uncomment this code if you want to introduce an artificial delay.
    // setTimeout(async () => {
    //     res.json(await todosDao.retrieveAllTodos());
    // }, 2000);

    // Comment this code if you want to introduce an artificial delay.
    res.json(await todosDao.retrieveAllTodos());
});

// Retrieve single todo
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const todo = await todosDao.retrieveTodo(id);
    if (todo) {
        res.json(todo);
    }
    else {
        res.sendStatus(HTTP_NOT_FOUND);
    }
});

// Update todo
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const todo = {
        ...req.body,
        _id: id
    };
    const success = await todosDao.updateTodo(todo);
    res.sendStatus(success ? HTTP_NO_CONTENT : HTTP_NOT_FOUND);
});

// Delete todo
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    await todosDao.deleteTodo(id);
    res.sendStatus(HTTP_NO_CONTENT);
})

export default router;