const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const StudyGoal = require('../models/StudyGoal');
const StudyEntry = require('../models/StudyEntry');
const { calculateSubjectProgress, calculateChapterProgress, recalculateGoalProgress } = require('../services/progressService');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Cleaning up demo user and data...');
    const demoEmail = 'alex@studyflow.ai';
    let demoUser = await User.findOne({ email: demoEmail });

    if (demoUser) {
      await Promise.all([
        Subject.deleteMany({ userId: demoUser._id }),
        Chapter.deleteMany({ userId: demoUser._id }),
        Topic.deleteMany({ userId: demoUser._id }),
        StudyGoal.deleteMany({ userId: demoUser._id }),
        StudyEntry.deleteMany({ userId: demoUser._id }),
        User.deleteOne({ _id: demoUser._id }),
      ]);
    }

    console.log('[Seed] Creating demo user...');
    demoUser = await User.create({
      name: 'Alex Morgan',
      email: demoEmail,
      password: 'Password123!',
      timezone: 'America/New_York',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    console.log(`[Seed] User created: ${demoUser.email} (Password: Password123!)`);

    // 1. Data Structures and Algorithms
    const dsa = await Subject.create({
      userId: demoUser._id,
      name: 'Data Structures and Algorithms',
      code: 'CS201',
      description: 'Core concepts of data structures, algorithm design techniques, complexity analysis, and problem-solving.',
      category: 'Computer Science',
      color: '#3b82f6', // Blue
      targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      estimatedHours: 60,
      status: 'In Progress',
    });

    // 2. Database Management Systems
    const dbms = await Subject.create({
      userId: demoUser._id,
      name: 'Database Management Systems',
      code: 'CS301',
      description: 'Relational models, SQL, normalization, concurrency control, transaction processing, and query optimization.',
      category: 'Computer Science',
      color: '#6366f1', // Indigo / Purple
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      estimatedHours: 45,
      status: 'In Progress',
    });

    // 3. Operating Systems
    const os = await Subject.create({
      userId: demoUser._id,
      name: 'Operating Systems',
      code: 'CS304',
      description: 'Processes, threads, CPU scheduling, synchronization, deadlocks, memory management, and file systems.',
      category: 'Computer Science',
      color: '#0ea5e9', // Sky blue
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      estimatedHours: 50,
      status: 'Not Started',
    });

    // 4. Computer Networks
    const cn = await Subject.create({
      userId: demoUser._id,
      name: 'Computer Networks',
      code: 'CS305',
      description: 'OSI and TCP/IP models, routing protocols, transport layer flow control, wireless networks, and network security.',
      category: 'Computer Science',
      color: '#8b5cf6', // Purple
      targetDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
      estimatedHours: 40,
      status: 'In Progress',
    });

    // 5. Machine Learning
    const ml = await Subject.create({
      userId: demoUser._id,
      name: 'Machine Learning',
      code: 'CS401',
      description: 'Supervised and unsupervised learning, regression, classification, neural networks, and model evaluation.',
      category: 'Artificial Intelligence',
      color: '#10b981', // Emerald
      targetDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      estimatedHours: 70,
      status: 'In Progress',
    });

    console.log('[Seed] 5 Subjects created.');

    // CHAPTERS & TOPICS FOR DBMS
    const dbmsCh1 = await Chapter.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      title: 'Database Fundamentals',
      description: 'Core concepts, architectures, and data modeling abstractions.',
      order: 1,
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'In Progress',
    });

    const dbmsCh2 = await Chapter.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      title: 'SQL and Relational Algebra',
      description: 'Data Definition Language, Data Manipulation Language, Joins, and Subqueries.',
      order: 2,
      targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'In Progress',
    });

    const dbmsCh3 = await Chapter.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      title: 'Normalization and Schema Design',
      description: 'Functional dependencies, 1NF, 2NF, 3NF, and BCNF decomposition.',
      order: 3,
      targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: 'Not Started',
    });

    // Topics for DBMS Ch1
    const tIntro = await Topic.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      chapterId: dbmsCh1._id,
      title: 'Introduction to DBMS',
      description: 'History, file systems vs DBMS, characteristics of database approach.',
      estimatedMinutes: 45,
      actualMinutes: 45,
      difficulty: 'Easy',
      status: 'Completed',
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: 'Reviewed 3-schema architecture and data independence.',
    });

    const tArch = await Topic.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      chapterId: dbmsCh1._id,
      title: 'Database Architecture',
      description: 'ANSI/SPARC 3-level architecture, client-server DBMS, physical vs logical independence.',
      estimatedMinutes: 60,
      actualMinutes: 30,
      difficulty: 'Medium',
      status: 'In Progress',
      notes: 'Draw conceptual diagrams of client-server vs cloud DBMS.',
    });

    await Topic.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      chapterId: dbmsCh1._id,
      title: 'Data Models & ER Diagrams',
      description: 'Entity sets, relationships, cardinalities, weak entity types, ER-to-relational mapping.',
      estimatedMinutes: 90,
      actualMinutes: 0,
      difficulty: 'Medium',
      status: 'Not Started',
      notes: 'Practice drawing ER diagrams for hospital and university systems.',
    });

    await Topic.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      chapterId: dbmsCh1._id,
      title: 'Database Languages (DDL, DML, DCL, TCL)',
      description: 'Commands breakdown, syntax comparison, and transaction control statements.',
      estimatedMinutes: 50,
      actualMinutes: 0,
      difficulty: 'Easy',
      status: 'Not Started',
    });

    // Topics for DBMS Ch2
    await Topic.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      chapterId: dbmsCh2._id,
      title: 'DDL Commands & Constraints',
      description: 'CREATE, ALTER, DROP, TRUNCATE, Primary Key, Foreign Key, Check, Unique.',
      estimatedMinutes: 60,
      actualMinutes: 60,
      difficulty: 'Easy',
      status: 'Completed',
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    await Topic.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      chapterId: dbmsCh2._id,
      title: 'SQL Joins & Aggregations',
      description: 'INNER, LEFT, RIGHT, FULL OUTER joins, GROUP BY, HAVING, and window functions.',
      estimatedMinutes: 90,
      actualMinutes: 45,
      difficulty: 'Hard',
      status: 'In Progress',
    });

    await Topic.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      chapterId: dbmsCh2._id,
      title: 'Nested Queries & Correlated Subqueries',
      description: 'EXISTS, IN, ANY, ALL clauses and subqueries in SELECT/FROM/WHERE.',
      estimatedMinutes: 75,
      actualMinutes: 0,
      difficulty: 'Hard',
      status: 'Not Started',
    });

    // Topics for DBMS Ch3
    await Topic.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      chapterId: dbmsCh3._id,
      title: 'Functional Dependencies & Armstrong Axioms',
      description: 'Closure of attribute sets, canonical cover, and minimal keys.',
      estimatedMinutes: 60,
      actualMinutes: 0,
      difficulty: 'Medium',
      status: 'Not Started',
    });

    await Topic.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      chapterId: dbmsCh3._id,
      title: '1NF, 2NF, 3NF and BCNF Decomposition',
      description: 'Lossless join decomposition and dependency preservation proofs.',
      estimatedMinutes: 120,
      actualMinutes: 0,
      difficulty: 'Hard',
      status: 'Not Started',
    });

    // CHAPTERS & TOPICS FOR DSA
    const dsaCh1 = await Chapter.create({
      userId: demoUser._id,
      subjectId: dsa._id,
      title: 'Arrays & Two-Pointer Techniques',
      description: 'Sliding window, fast & slow pointers, prefix sums.',
      order: 1,
      targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'Completed',
    });

    const dsaCh2 = await Chapter.create({
      userId: demoUser._id,
      subjectId: dsa._id,
      title: 'Trees & Binary Search Trees',
      description: 'Traversals, BST operations, balancing trees, LCA.',
      order: 2,
      targetDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: 'In Progress',
    });

    await Topic.create({
      userId: demoUser._id,
      subjectId: dsa._id,
      chapterId: dsaCh1._id,
      title: 'Two Sum & 3-Sum Optimal Solutions',
      description: 'Hash map approach vs sorted two-pointer approach.',
      estimatedMinutes: 60,
      actualMinutes: 60,
      difficulty: 'Medium',
      status: 'Completed',
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    await Topic.create({
      userId: demoUser._id,
      subjectId: dsa._id,
      chapterId: dsaCh1._id,
      title: 'Sliding Window Maximum & Min Subarray',
      description: 'Monotonic queue and variable size sliding window.',
      estimatedMinutes: 80,
      actualMinutes: 80,
      difficulty: 'Hard',
      status: 'Completed',
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    });

    await Topic.create({
      userId: demoUser._id,
      subjectId: dsa._id,
      chapterId: dsaCh2._id,
      title: 'Binary Tree Invert & Diameter',
      description: 'Recursive post-order traversal and subtree heights.',
      estimatedMinutes: 45,
      actualMinutes: 45,
      difficulty: 'Easy',
      status: 'Completed',
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    await Topic.create({
      userId: demoUser._id,
      subjectId: dsa._id,
      chapterId: dsaCh2._id,
      title: 'Lowest Common Ancestor in BST and Binary Tree',
      description: 'Path tracing vs single-pass recursive traversal.',
      estimatedMinutes: 70,
      actualMinutes: 30,
      difficulty: 'Medium',
      status: 'In Progress',
    });

    console.log('[Seed] Chapters and topics created.');

    // STUDY GOALS
    // Sample goal required by prompt:
    // Title: Complete DBMS Unit 1
    // Subject: Database Management Systems
    // Target: 5 study hours
    // Deadline: 7 days
    // Priority: High
    // Type: Weekly
    // Status: In Progress
    const g1 = await StudyGoal.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      chapterId: dbmsCh1._id,
      title: 'Complete DBMS Unit 1',
      description: 'Master database fundamentals, 3-tier architecture, and entity-relationship models.',
      type: 'Weekly goal',
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      targetHours: 5,
      actualHours: 0,
      priority: 'High',
      status: 'In Progress',
    });

    const g2 = await StudyGoal.create({
      userId: demoUser._id,
      subjectId: dsa._id,
      chapterId: dsaCh1._id,
      title: 'Master Two Pointers & Sliding Window',
      description: 'Solve 15 LeetCode medium array problems using two-pointer patterns.',
      type: 'Weekly goal',
      startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      targetHours: 8,
      actualHours: 0,
      priority: 'Urgent',
      status: 'In Progress',
    });

    const g3 = await StudyGoal.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      chapterId: dbmsCh2._id,
      title: 'SQL Complex Joins & Subqueries Lab',
      description: 'Complete hands-on queries with 4-table joins and correlated subqueries.',
      type: 'Chapter completion goal',
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      targetHours: 6,
      actualHours: 0,
      priority: 'Medium',
      status: 'In Progress',
    });

    const g4 = await StudyGoal.create({
      userId: demoUser._id,
      subjectId: ml._id,
      title: 'Machine Learning Midterm Prep',
      description: 'Review gradient descent, cost functions, logistic regression, and regularization.',
      type: 'Exam preparation goal',
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      targetHours: 12,
      actualHours: 0,
      priority: 'High',
      status: 'In Progress',
    });

    const g5 = await StudyGoal.create({
      userId: demoUser._id,
      subjectId: cn._id,
      title: 'TCP/IP 3-Way Handshake Deep Dive',
      description: 'Wireshark packet capture analysis of TCP SYN, SYN-ACK, and ACK flags.',
      type: 'Daily goal',
      startDate: new Date(),
      deadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // Due today
      targetHours: 2.5,
      actualHours: 0,
      priority: 'High',
      status: 'In Progress',
    });

    const g6 = await StudyGoal.create({
      userId: demoUser._id,
      subjectId: dsa._id,
      title: 'DSA Array Basics Refresh',
      description: 'Quick review of array memory allocation, amortized insertion in dynamic arrays.',
      type: 'Custom goal',
      startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Finished in the past
      targetHours: 4,
      actualHours: 4,
      priority: 'Low',
      status: 'Completed',
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    console.log('[Seed] Study goals created.');

    // STUDY ENTRIES
    // Day 1: 1 hour (60 min)
    // Day 2: 1.5 hours (90 min)
    // Day 3: 1 hour (60 min)
    // Day 4: 1.5 hours (90 min)
    // Example from prompt section 7 for DBMS Unit 1:
    await StudyEntry.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      goalId: g1._id,
      chapterId: dbmsCh1._id,
      topicId: tIntro._id,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      durationMinutes: 60, // 1 hour
      notes: 'Day 1: Read Chapter 1 introduction and 3-schema architecture.',
    });

    await StudyEntry.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      goalId: g1._id,
      chapterId: dbmsCh1._id,
      topicId: tArch._id,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      durationMinutes: 90, // 1.5 hours
      notes: 'Day 2: Studied client-server architecture vs cloud multi-tenant DBMS.',
    });

    await StudyEntry.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      goalId: g1._id,
      chapterId: dbmsCh1._id,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      durationMinutes: 60, // 1 hour
      notes: 'Day 3: Solved practice quiz questions on data independence.',
    });

    await StudyEntry.create({
      userId: demoUser._id,
      subjectId: dbms._id,
      goalId: g1._id,
      chapterId: dbmsCh1._id,
      date: new Date(),
      durationMinutes: 90, // 1.5 hours
      notes: 'Day 4: Completed ER modeling practice and summary sheet.',
    });

    // Entries for DSA Goal
    await StudyEntry.create({
      userId: demoUser._id,
      subjectId: dsa._id,
      goalId: g2._id,
      chapterId: dsaCh1._id,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      durationMinutes: 120, // 2 hours
      notes: 'Solved Two Sum II and 3Sum closest on LeetCode.',
    });

    await StudyEntry.create({
      userId: demoUser._id,
      subjectId: dsa._id,
      goalId: g2._id,
      chapterId: dsaCh1._id,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      durationMinutes: 180, // 3 hours
      notes: 'Sliding window maximum using Deque.',
    });

    // Entries for ML Goal
    await StudyEntry.create({
      userId: demoUser._id,
      subjectId: ml._id,
      goalId: g4._id,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      durationMinutes: 120, // 2 hours
      notes: 'Derived cost function gradient for logistic regression.',
    });

    console.log('[Seed] Study entries recorded.');

    // Recalculate all metrics
    await recalculateGoalProgress(g1._id);
    await recalculateGoalProgress(g2._id);
    await recalculateGoalProgress(g3._id);
    await recalculateGoalProgress(g4._id);
    await recalculateGoalProgress(g5._id);

    await calculateChapterProgress(dbmsCh1._id);
    await calculateChapterProgress(dbmsCh2._id);
    await calculateChapterProgress(dbmsCh3._id);
    await calculateChapterProgress(dsaCh1._id);
    await calculateChapterProgress(dsaCh2._id);

    await calculateSubjectProgress(dbms._id);
    await calculateSubjectProgress(dsa._id);
    await calculateSubjectProgress(os._id);
    await calculateSubjectProgress(cn._id);
    await calculateSubjectProgress(ml._id);

    console.log('[Seed] All metrics recalculated successfully.');
    console.log('--------------------------------------------------');
    console.log('StudyFlow AI Seeded Successfully!');
    console.log(`Demo User:     alex@studyflow.ai`);
    console.log(`Demo Password: Password123!`);
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
