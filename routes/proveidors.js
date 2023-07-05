const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const proveidors = require('../controllers/proveidors');
const { isLoggedIn, isResponsable, validateSchema } = require('../middleware');
const { proveidorSchema } = require('../schemas');
const proveidor = require('../models/proveidor');

const validateProveidor = validateSchema(proveidorSchema)

router.route('/')
.get(catchAsync(proveidors.index))
.post(isLoggedIn, validateProveidor, catchAsync(proveidors.createProveidor))

router.route('/all')
.get(catchAsync(proveidors.getProveidors))

router.get('/new', isLoggedIn, proveidors.renderNewForm);

router.route('/:id')
.get(catchAsync(proveidors.showProveidor))
.put(isLoggedIn, isResponsable(proveidor), validateProveidor, catchAsync(proveidors.updateProveidor))
.delete(isLoggedIn, isResponsable(proveidor), catchAsync(proveidors.deleteProveidor));


router.get('/:id/edit', isLoggedIn, isResponsable(proveidor), catchAsync(proveidors.renderEditForm));


module.exports = router;