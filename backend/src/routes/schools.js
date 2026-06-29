'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/schoolController');

router.get('/district',     ctrl.getDistrictInfo);
router.get('/breakdown',    ctrl.getSchoolBreakdown);
router.get('/',             ctrl.getSchools);
router.get('/:id',          ctrl.getSchoolById);
router.get('/:id/grades',   ctrl.getSchoolGradeLevels);
router.get('/:id/staff',    ctrl.getSchoolStaff);

module.exports = router;
