'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/schoolYearController');

router.get('/current',      ctrl.getCurrentSchoolYear);
router.get('/:id',          ctrl.getSchoolYearById);
router.get('/:year/stats',  ctrl.getSchoolYearStats);
router.get('/',             ctrl.getSchoolYears);

module.exports = router;
