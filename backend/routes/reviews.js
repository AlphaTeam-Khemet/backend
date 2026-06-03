const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/reviewController');

router.get('/monument/:monumentId', ctrl.getByMonument);
router.post('/', auth, ctrl.add);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
