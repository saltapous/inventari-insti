const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const items = require('../controllers/items');
const { isLoggedIn, isResponsable, validateSchema } = require('../middleware');
const { itemSchema } = require('../schemas');
const item = require('../models/item');

const validateItem = validateSchema(itemSchema)

router.route('/')
.get(catchAsync(items.index))
.post(isLoggedIn, validateItem, catchAsync(items.createItem))

router.route('/all')
.get(catchAsync(items.getItems))

router.get('/new', isLoggedIn, items.renderNewForm);

router.route('/:id')
.get(catchAsync(items.showItem))
.put(isLoggedIn, isResponsable(item), validateItem, catchAsync(items.updateItem))
.delete(isLoggedIn, isResponsable(item), catchAsync(items.deleteItem));


router.get('/:id/edit', isLoggedIn, isResponsable(item), catchAsync(items.renderEditForm));


module.exports = router;