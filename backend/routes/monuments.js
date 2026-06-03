const router = require('express').Router();
const lang = require('../middleware/lang');
const ctrl = require('../controllers/monumentController');

router.get('/', lang, ctrl.getAll);
router.get('/:id', lang, ctrl.getOne);

module.exports = router;
