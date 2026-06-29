'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/assessmentController');

router.get('/types',        ctrl.getAssessmentTypes);
router.get('/summary',      ctrl.getDistrictSummary);
router.get('/distribution', ctrl.getScoreDistribution);
router.get('/student/:id',  ctrl.getStudentAssessments);
router.get('/',             ctrl.getAssessmentsByType);

module.exports = router;
