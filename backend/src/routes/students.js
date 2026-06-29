'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/studentController');

router.get('/search',              ctrl.searchStudents);
router.get('/grades',              ctrl.getGradeLevels);
router.get('/',                    ctrl.getStudents);
router.get('/:id',                 ctrl.getStudent);
router.get('/:id/attendance',      ctrl.getStudentAttendance);
router.get('/:id/assessments',     ctrl.getStudentAssessments);
router.get('/:id/interventions',   ctrl.getStudentInterventions);

module.exports = router;
