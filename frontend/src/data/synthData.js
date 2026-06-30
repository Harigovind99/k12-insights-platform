// ── Exact port of all constants and data generation from the HTML prototype ──

export const SCHOOLS = ['Jefferson Elementary','Lincoln Middle','Washington High','Roosevelt K-8','Adams Elementary'];
export const GRADES_ALL = ['K','1','2','3','4','5','6','7','8','9','10','11','12'];
export const MONTHS_ALL = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
export const STUDENT_GROUPS_ALL = ['General','English Learners','Special Education','Socioeconomically Disadvantaged','Foster Youth','Homeless','Gifted','504'];
export const COUNSELORS = ['Dr. Rivera','Ms. Chen','Mr. Johnson','Ms. Park','Dr. Adams'];

export const SCHOOL_GRADES = {
  'Jefferson Elementary': ['K','1','2','3','4','5'],
  'Lincoln Middle':       ['6','7','8'],
  'Washington High':      ['9','10','11','12'],
  'Roosevelt K-8':        ['K','1','2','3','4','5','6','7','8'],
  'Adams Elementary':     ['K','1','2','3','4','5'],
};

const GROUP_ABSENCE_RANGE = {
  'General': [0, 12], 'English Learners': [10, 20], 'Special Education': [14, 28],
  'Socioeconomically Disadvantaged': [8, 16], 'Foster Youth': [25, 40], 'Homeless': [20, 38],
  'Gifted': [0, 8], '504': [0, 8],
};

const SCHOOL_ABSENCE_BASE = {
  'Jefferson Elementary': [3, 5], 'Lincoln Middle': [6, 9], 'Washington High': [8, 14],
  'Roosevelt K-8': [4, 7], 'Adams Elementary': [3, 5],
};

const GROUP_WEIGHTS = {
  'General':40, 'English Learners':12, 'Special Education':10,
  'Socioeconomically Disadvantaged':15, 'Foster Youth':4, 'Homeless':3, 'Gifted':9, '504':7,
};

const FIRST_NAMES = ['Aaliyah','Marcus','Sofia','James','Destiny','Ethan','Isabella','Noah','Amara','Liam','Priya','Tyler','Zoe','Caleb','Maya','Oliver','Chloe','Aiden','Luna','Jackson','Ella','Lucas','Mia','Owen','Aria','Leo','Layla','Mateo','Nora','Elijah','Avery','Daniel','Scarlett','Henry','Lily','Samuel','Grace','Carter','Hazel','Jayden','Violet','Wyatt','Stella','Gabriel','Penelope','Julian','Riley','Grayson','Zoey','Levi'];
const LAST_NAMES  = ['Johnson','Williams','Martinez','Chen','Brown','Davis','Thompson','Garcia','Washington','Rodriguez','Patel','Jackson','Anderson','Taylor','Thomas','Moore','Martin','Lee','Harris','Clark','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Hill','Green','Adams','Baker','Nelson','Carter','Mitchell','Perez','Roberts','Turner','Phillips'];

export function seededVal(seed, min, max) {
  const x = ((seed * 2654435761) >>> 0) % 10000;
  return min + (x / 10000) * (max - min);
}
export function seededInt(seed, min, max) {
  return Math.floor(seededVal(seed, min, max + 0.999));
}
export function seededPick(seed, arr) {
  return arr[seededInt(seed, 0, arr.length - 1)];
}

function monthToQuarter(m) {
  const qi = { Aug:'Q1',Sep:'Q1',Oct:'Q1',Nov:'Q2',Dec:'Q2',Jan:'Q2',Feb:'Q3',Mar:'Q3',Apr:'Q3',May:'Q4',Jun:'Q4' };
  return qi[m] || 'Q1';
}

function riskFromDays(d) {
  if (d <= 8)  return 'Low';
  if (d <= 17) return 'At-Risk';
  if (d <= 35) return 'Moderate';
  return 'Chronic';
}

function generateStudents() {
  const students = [];
  const groupKeys = Object.keys(GROUP_WEIGHTS);
  const groupCum  = [];
  let cum = 0;
  groupKeys.forEach(g => { cum += GROUP_WEIGHTS[g]; groupCum.push(cum); });

  for (let i = 0; i < 500; i++) {
    const s1=i*7+31, s2=i*13+47, s3=i*17+61, s4=i*23+79,
          s5=i*29+97, s6=i*37+113, s7=i*41+127, s8=i*43+139;

    const school = SCHOOLS[seededInt(s1, 0, 4)];
    const grade  = seededPick(s2, SCHOOL_GRADES[school]);

    const groupRoll = seededInt(s3, 0, cum - 1);
    let group = 'General';
    for (let g = 0; g < groupCum.length; g++) {
      if (groupRoll < groupCum[g]) { group = groupKeys[g]; break; }
    }

    const [sMin,sMax] = SCHOOL_ABSENCE_BASE[school];
    const [gMin,gMax] = GROUP_ABSENCE_RANGE[group];
    const blendMin    = Math.max(0,  Math.round((sMin+gMin)/2));
    const blendMax    = Math.min(40, Math.round((sMax+gMax)/2));
    const daysAbsent  = seededInt(s4, blendMin, blendMax);
    const daysPresent = 180 - daysAbsent;
    const attendanceRate = parseFloat(((daysPresent/180)*100).toFixed(1));

    const typeRoll   = seededInt(s5, 0, 99);
    const absenceType = typeRoll < 42 ? 'Excused' : typeRoll < 77 ? 'Unexcused' : 'Tardy';

    const month   = seededPick(s6, MONTHS_ALL);
    const quarter = monthToQuarter(month);
    const riskLevel = riskFromDays(daysAbsent);

    let interventionStatus = 'None';
    if      (riskLevel === 'Chronic')  interventionStatus = seededPick(s7, ['Active','Active','Pending','Completed']);
    else if (riskLevel === 'Moderate') interventionStatus = seededPick(s7, ['Active','Pending','None','None']);
    else if (riskLevel === 'At-Risk')  interventionStatus = seededPick(s7, ['None','None','Pending','Active']);

    const counselor    = seededPick(s8, COUNSELORS);
    const firstName    = seededPick(i*3+5, FIRST_NAMES);
    const lastName     = seededPick(i*5+3, LAST_NAMES);
    const p1First      = seededPick(s7+11, FIRST_NAMES);
    const p2First      = seededPick(s8+12, FIRST_NAMES);
    const p1Rel        = seededPick(s7+19, ['Mother','Father','Guardian','Caregiver']);
    const p2Rel        = seededPick(s8+23, ['Father','Mother','Guardian','Caregiver']);
    const p1Phone      = `555-${String((s7*3)%900+100)}-${String((s7*7)%9000).padStart(4,'0')}`;
    const p2Phone      = `555-${String((s8*5)%900+100)}-${String((s8*11)%9000).padStart(4,'0')}`;
    const p1Email      = `${p1First.toLowerCase()}.${lastName.toLowerCase()}@family.example.org`;
    const p2Email      = `${p2First.toLowerCase()}.${lastName.toLowerCase()}@family.example.org`;

    students.push({
      id: 'STU-' + String(10000+i).padStart(5,'0'),
      name: firstName + ' ' + lastName,
      school, grade, group, month, quarter, absenceType,
      daysAbsent, daysPresent, attendanceRate, riskLevel,
      interventionStatus, counselor,
      parents: [
        { name:`${p1First} ${lastName}`, relationship:p1Rel, phone:p1Phone, email:p1Email, preferred:'Email' },
        { name:`${p2First} ${lastName}`, relationship:p2Rel, phone:p2Phone, email:p2Email, preferred:'Phone' },
      ],
    });
  }
  return students;
}

export const ALL_STUDENTS = generateStudents();

export function buildStudentProfileInfo(student) {
  const nameSlug  = student.name.toLowerCase().replace(/\s+/g,'.');
  const idDigits  = parseInt(student.id.replace(/\D/g,''),10) || 12345;
  const dobDay    = String((idDigits%28)+1).padStart(2,'0');
  const dobMonth  = String((idDigits%12)+1).padStart(2,'0');
  const dobYear   = 2008 + (parseInt(student.grade,10)||8) - 6;
  const status    = student.riskLevel==='Chronic'?'At Risk':student.riskLevel==='Moderate'?'Monitoring':'Good Standing';
  return {
    profileFields: [
      { label:'Student ID', value:student.id },
      { label:'School',     value:student.school },
      { label:'Grade',      value:student.grade },
      { label:'Email',      value:`${nameSlug}@mveca.org` },
      { label:'Gender',     value:idDigits%2?'Female':'Male' },
      { label:'Phone',      value:`555-${String(idDigits%900+100)}-${String((idDigits*7)%9000).padStart(4,'0')}` },
      { label:'Birthday',   value:`${dobYear}-${dobMonth}-${dobDay}` },
      { label:'Status',     value:status },
    ],
    status,
    advisor: student.counselor || 'Ms. Chen',
    schedule: [
      { course:'English Language Arts', teacher:'Ms. Blake',  room:'B101', period:'1' },
      { course:'Math',                  teacher:'Mr. Chen',   room:'C202', period:'2' },
      { course:'Science',               teacher:'Dr. Hayes',  room:'D103', period:'3' },
      { course:'History',               teacher:'Ms. Rivera', room:'A204', period:'4' },
      { course:'PE',                    teacher:'Coach Lee',  room:'Gym',  period:'5' },
    ],
    assessments: [
      { name:'NWEA MAP Growth',  score:'RIT 216',      change:'+3 pts', detail:'Performance is trending above district average for grade level.' },
      { name:'Acadience Reading',score:'Level 3',      change:'+1',     detail:'Literacy growth remains steady with small gains this semester.' },
      { name:'CAASPP/SBAC',      score:'Near Standard',change:'+2%',   detail:'Approaching proficiency; targeted support indicated.' },
    ],
    behavior: [
      { title:'Behavior Incident', detail:'One minor office referral in May for classroom disruption.' },
      { title:'Intervention Plan', detail:'Positive behavior plan active with weekly counselor check-ins.' },
    ],
    grades: [
      { subject:'ELA',     value:'B+' },
      { subject:'Math',    value:'A-' },
      { subject:'Science', value:'B'  },
      { subject:'History', value:'B+' },
    ],
    wellness: [
      { label:'SEL Check-in',       value:'Good' },
      { label:'Attendance Trend',   value:`${student.attendanceRate.toFixed(1)}%` },
      { label:'Counselor Sessions', value:'2 this month' },
    ],
    forms: [
      { name:'Emergency Contact', status:'Complete' },
      { name:'Consent Form',      status:'Complete' },
      { name:'504 Plan',          status:'Active'   },
    ],
    plans: [
      { title:'Academic Support Plan', status:'In progress' },
      { title:'Wellness Check Plan',   status:'Active' },
    ],
    payments: [
      { name:'Field Trip Fees',    amount:'$0 due' },
      { name:'Cafeteria Balance',  amount:'$12.50' },
    ],
  };
}

export const DOMAIN_TABS = [
  'Strategic Plan','Accountability','Climate & Culture','School Improvement',
  'Early Warning','MTSS/RTI','Whole Child','Well-being','Assessments','Academics',
  'Attendance','Behavior & Discipline','Graduation Readiness','College Career Life',
  'Portrait of a Graduate','Community Engagement','Family Engagement','Safety',
  'Enrollment','IDEA','EdTech Impact','Finance','Staff','Custom',
];

export const DEFAULT_FILTERS = {
  schoolYear:         '2024-25',
  school:             'All',
  grade:              'All',
  group:              'All',
  absenceType:        'All',
  month:              'All',
  quarter:            'All',
  riskLevel:          'All',
  threshold:          '10',
  interventionStatus: 'All',
  search:             '',
};
