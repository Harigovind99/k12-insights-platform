const express        = require('express');
const schemaMiddleware = require('../middleware/schema');

const studentRoutes     = require('./students');
const attendanceRoutes  = require('./attendance');
const assessmentRoutes  = require('./assessments');
const schoolRoutes      = require('./schools');
const schoolYearRoutes  = require('./schoolYears');
const interventionRoutes = require('./interventions');

const router = express.Router();

// Apply schema middleware globally so all routes get req.schema
router.use(schemaMiddleware);

// Mount resource routes
router.use('/students',      studentRoutes);
router.use('/attendance',    attendanceRoutes);
router.use('/assessments',   assessmentRoutes);
router.use('/schools',       schoolRoutes);
router.use('/school-years',  schoolYearRoutes);
router.use('/interventions', interventionRoutes);

module.exports = router;
