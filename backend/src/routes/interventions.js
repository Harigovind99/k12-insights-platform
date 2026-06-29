'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/interventionController');

router.get('/summary',   ctrl.getInterventionSummary);
router.get('/types',     ctrl.getInterventionTypes);
router.get('/timeline',  ctrl.getInterventionTimeline);
router.get('/:id',       ctrl.getInterventionById);
router.get('/',          ctrl.getInterventions);

module.exports = router;
