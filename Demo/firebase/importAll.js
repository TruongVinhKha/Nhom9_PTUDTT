const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Khởi tạo Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json"))
});

const auth = admin.auth();
const firestore = admin.firestore();

<<<<<<< HEAD:Demo/data/importAll.js
// Hàm tạo search keywords từ content
function generateSearchKeywords(content) {
  if (!content) return [];
  
  // Loại bỏ dấu tiếng Việt và chuyển thành chữ thường
  const normalized = content
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
    .replace(/[^\w\s]/g, ' ') // Loại bỏ ký tự đặc biệt
    .split(/\s+/)
    .filter(word => word.length > 2); // Chỉ lấy từ có độ dài > 2
  
  return [...new Set(normalized)]; // Loại bỏ duplicate
}

// Hàm tạo tags từ content và subject
function generateTags(content, subject) {
  const tags = [];
  
  if (subject) {
    tags.push(subject.toLowerCase());
  }
  
  // Thêm tags dựa trên nội dung
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('tiến bộ') || lowerContent.includes('tốt')) {
    tags.push('tiến bộ', 'tốt');
  }
  
  if (lowerContent.includes('cần cải thiện') || lowerContent.includes('cần')) {
    tags.push('cần cải thiện');
  }
  
  if (lowerContent.includes('toán')) {
    tags.push('toán');
  }
  
  if (lowerContent.includes('văn')) {
    tags.push('văn');
  }
  
  if (lowerContent.includes('tiếng anh')) {
    tags.push('tiếng anh');
  }
  
  if (lowerContent.includes('hoạt động')) {
    tags.push('hoạt động');
  }
  
  if (lowerContent.includes('kỹ năng')) {
    tags.push('kỹ năng');
  }
  
  if (lowerContent.includes('lịch sử')) {
    tags.push('lịch sử');
  }
  
  if (lowerContent.includes('kỷ luật')) {
    tags.push('kỷ luật');
  }
  
  return [...new Set(tags)];
}

// Hàm chuyển đổi rating thành ratingScore
function getRatingScore(rating) {
  const ratingMap = {
    'Tốt': 5,
    'Khá': 4,
    'Trung bình': 3,
    'Yếu': 2,
    'Kém': 1
  };
  return ratingMap[rating] || 3;
}

// Hàm tạo comment với cấu trúc tối ưu
function createOptimizedComment(commentData, studentsMap, teachersMap, classesMap) {
  // Lấy thông tin từ các map
  const student = studentsMap[commentData.studentId];
  const teacher = teachersMap[commentData.teacherId];
  const classInfo = classesMap[commentData.classId];
  
  return {
    // Core data
    content: commentData.content,
    studentId: commentData.studentId,
    studentName: student ? student.fullName : null,
    teacherId: commentData.teacherId,
    teacherName: teacher ? teacher.fullName : null,
    classId: commentData.classId,
    className: classInfo ? classInfo.name : null,
    parentId: null, // Sẽ được set sau khi có thông tin parent
    parentName: null, // Sẽ được set sau khi có thông tin parent
    subject: commentData.subject,
    
    // Metadata
    timestamp: commentData.createdAt ? new Date(commentData.createdAt) : admin.firestore.FieldValue.serverTimestamp(),
    createdAt: commentData.createdAt || new Date().toISOString(),
    updatedAt: null,
    
    // Status & Rating
    rating: commentData.rating || 'Trung bình',
    ratingScore: getRatingScore(commentData.rating || 'Trung bình'),
    
    // Search optimization
    searchKeywords: generateSearchKeywords(commentData.content),
    tags: generateTags(commentData.content, commentData.subject),
    
    // Analytics
    viewCount: 0,
    replyCount: 0,
    
    // Soft delete
    isDeleted: false,
    deletedAt: null,
    
    // Import metadata
    importedAt: admin.firestore.FieldValue.serverTimestamp(),
    source: 'importAll'
  };
}

=======
>>>>>>> c2cc58b64035e0c58b33fe04f3553b9cd39d6024:Demo/firebase/importAll.js
async function importData() {
  console.log('🚀 Bắt đầu import tất cả dữ liệu...');
  
  try {
    // Đọc dữ liệu từ các file
    const users = JSON.parse(fs.readFileSync("./usersToCreate_updated.json", "utf8"));
    const students = JSON.parse(fs.readFileSync("./students_updated.json", "utf8"));
    const classes = JSON.parse(fs.readFileSync("./classes.json", "utf8"));
    const teachers = JSON.parse(fs.readFileSync("./teachers.json", "utf8"));
    const comments = JSON.parse(fs.readFileSync("./comments.json", "utf8"));
    const notifications = JSON.parse(fs.readFileSync("./notifications.json", "utf8"));
    const notificationsForClass = JSON.parse(fs.readFileSync("./notificationsForClass.json", "utf8"));
    const guests = JSON.parse(fs.readFileSync("./guests.json", "utf8"));

    console.log(`📊 Đọc được dữ liệu:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Classes: ${classes.length}`);
    console.log(`   - Teachers: ${teachers.length}`);
    console.log(`   - Comments: ${comments.length}`);
    console.log(`   - Notifications: ${notifications.length}`);
    console.log(`   - NotificationsForClass: ${notificationsForClass.length}`);
    console.log(`   - Guests: ${guests.length}`);

    // 1. Import Users (Firebase Auth + Firestore)
    console.log('\n👥 Importing Users...');
    for (const user of users) {
      try {
        const userRecord = await auth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.fullName
        });

        const uid = userRecord.uid;

        // Set custom claim
        if (user.role) {
          await auth.setCustomUserClaims(uid, { role: user.role });
        }

        // Ghi Firestore
        await firestore.collection("users").doc(uid).set({
          uid: uid,
          fullName: user.fullName,
          role: user.role,
          email: user.email,
          phone: user.phone || null,
          linkedStudentIds: user.linkedStudentIds || [],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`  ✅ Created user: ${user.email}`);
      } catch (err) {
        console.error(`  ❌ Error creating user ${user.email}:`, err.message);
      }
    }

    // 2. Import Teachers
    console.log('\n👨‍🏫 Importing Teachers...');
    for (const teacher of teachers) {
      try {
        await firestore.collection("teachers").doc(teacher.id).set({
          fullName: teacher.fullName,
          email: teacher.email,
          phone: teacher.phone,
          role: teacher.role,
          classIds: teacher.classIds,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`  ✅ Imported teacher: ${teacher.fullName}`);
      } catch (err) {
        console.error(`  ❌ Error importing teacher ${teacher.id}:`, err.message);
      }
    }
    console.log(`  ✅ Imported ${teachers.length} teachers`);

    // 3. Import Students
    console.log('\n👤 Importing Students...');
    for (const student of students) {
      try {
        await firestore.collection("students").doc(student.id).set({
          fullName: student.fullName,
          classId: student.classId,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          academicYear: student.academicYear,
<<<<<<< HEAD:Demo/data/importAll.js
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
=======
          createdAt: admin.firestore.FieldValue.serverTimestamp()
>>>>>>> c2cc58b64035e0c58b33fe04f3553b9cd39d6024:Demo/firebase/importAll.js
        });
        console.log(`  ✅ Imported student: ${student.fullName}`);
      } catch (err) {
        console.error(`  ❌ Error importing student ${student.id}:`, err.message);
      }
    }
    console.log(`  ✅ Imported ${students.length} students`);

    // 4. Import Classes
    console.log('\n🏫 Importing Classes...');
    for (const classData of classes) {
      try {
        await firestore.collection("classes").doc(classData.id).set({
          ...classData,
          createdAt: classData.createdAt ? new Date(classData.createdAt) : admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`  ✅ Imported class: ${classData.name}`);
      } catch (err) {
        console.error(`  ❌ Error importing class ${classData.id}:`, err.message);
      }
    }
    console.log(`  ✅ Imported ${classes.length} classes`);

    // 5. Import Comments
    console.log('\n💬 Importing Comments...');
<<<<<<< HEAD:Demo/data/importAll.js
    
    // Tạo map để truy cập nhanh thông tin
    const studentsMap = {};
    students.forEach(student => {
      studentsMap[student.id] = student;
    });
    
    const teachersMap = {};
    teachers.forEach(teacher => {
      teachersMap[teacher.id] = teacher;
      // Map thêm teacher001 -> teacher1 để tương thích với comments
      if (teacher.id === 'teacher1') {
        teachersMap['teacher001'] = teacher;
      }
    });
    
    const classesMap = {};
    classes.forEach(classData => {
      classesMap[classData.id] = classData;
    });
    
    // Lấy danh sách tất cả parentId
    const allParentIds = users.filter(u => u.role === 'parent').map(u => u.email.split('@')[0].replace('example.com', '').replace(/[^a-zA-Z0-9]/g, ''));
    
    for (const commentData of comments) {
      try {
        const optimizedComment = createOptimizedComment(commentData, studentsMap, teachersMap, classesMap);
        const commentId = commentData.id || `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Loại bỏ các trường undefined trước khi lưu
        const cleanComment = Object.fromEntries(
          Object.entries(optimizedComment).filter(([_, value]) => value !== undefined)
        );
        
        await firestore.collection("comments").doc(commentId).set(cleanComment);
        
        // Tạo subcollection isRead cho tất cả parent
        for (const parentId of allParentIds) {
          await firestore.collection("comments").doc(commentId).collection("isRead").doc(parentId).set({
            isRead: false,
            readAt: null
          });
        }
=======
    for (const commentData of comments) {
      try {
        const commentId = commentData.id || `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Import đúng dữ liệu gốc từ JSON
        const commentToSave = {
          content: commentData.content,
          studentId: commentData.studentId,
          teacherId: commentData.teacherId,
          classId: commentData.classId,
          subject: commentData.subject,
          rating: commentData.rating,
          createdAt: commentData.createdAt ? new Date(commentData.createdAt) : admin.firestore.FieldValue.serverTimestamp()
        };
        
        await firestore.collection("comments").doc(commentId).set(commentToSave);
        
        // Tạo subcollection isRead với 1 document parent1
        await firestore.collection("comments").doc(commentId).collection("isRead").doc("parent1").set({
          isRead: false,
          readAt: null
        });
>>>>>>> c2cc58b64035e0c58b33fe04f3553b9cd39d6024:Demo/firebase/importAll.js
        
        console.log(`  ✅ Imported comment: ${commentId}`);
      } catch (err) {
        console.error(`  ❌ Error importing comment ${commentData.id}:`, err.message);
      }
    }
    console.log(`  ✅ Imported ${comments.length} comments`);

    // 6. Import Notifications
    console.log('\n📢 Importing Notifications...');
    for (const notification of notifications) {
      try {
        await firestore.collection("notifications").doc(notification.id).set({
          ...notification,
          createdAt: notification.createdAt ? new Date(notification.createdAt) : admin.firestore.FieldValue.serverTimestamp(),
          isDeleted: false
        });
        // Tạo subcollection isRead với 1 document parent1
        await firestore.collection("notifications").doc(notification.id).collection("isRead").doc("parent1").set({
          isRead: false,
          readAt: null
        });
      } catch (err) {
        console.error(`  ❌ Error importing notification ${notification.id}:`, err.message);
      }
    }
    console.log(`  ✅ Imported ${notifications.length} notifications`);

    // 7. Import NotificationsForClass
    console.log('\n📢 Importing NotificationsForClass...');
    for (const notification of notificationsForClass) {
      try {
        await firestore.collection("notificationsForClass").doc(notification.id).set({
          ...notification,
          createdAt: notification.createdAt ? new Date(notification.createdAt) : admin.firestore.FieldValue.serverTimestamp(),
          isDeleted: false
        });
        // Tạo subcollection isRead với 1 document parent1
        await firestore.collection("notificationsForClass").doc(notification.id).collection("isRead").doc("parent1").set({
          isRead: false,
          readAt: null
        });
      } catch (err) {
        console.error(`  ❌ Error importing notificationForClass ${notification.id}:`, err.message);
      }
    }
    console.log(`  ✅ Imported ${notificationsForClass.length} notificationsForClass`);

    // 8. Import Guests
    console.log('\n👤 Importing Guests...');
    for (const guest of guests) {
      try {
        await firestore.collection("guests").doc(guest.uid).set({
          ...guest,
          createdAt: guest.createdAt ? new Date(guest.createdAt) : admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {
        console.error(`  ❌ Error importing guest ${guest.uid}:`, err.message);
      }
    }
    console.log(`  ✅ Imported ${guests.length} guests`);

    // 9. Tạo summary report
    const summary = {
      importedAt: new Date().toISOString(),
      totalUsers: users.length,
      totalTeachers: teachers.length,
      totalStudents: students.length,
      totalClasses: classes.length,
      totalComments: comments.length,
      totalNotifications: notifications.length,
      totalNotificationsForClass: notificationsForClass.length,
      totalGuests: guests.length,
      source: 'importAll'
    };

    console.log('\n🎉 Import hoàn thành!');
    console.log('\n📋 Summary Report:');
    console.log(JSON.stringify(summary, null, 2));

    console.log('\n📋 Next steps:');
    console.log('1. Deploy Firestore indexes: firebase deploy --only firestore:indexes');
    console.log('2. Test the application with new data structure');
    console.log('3. Verify all collections are working correctly');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình import:', error);
    throw error;
  }
}

// Chạy import
importData()
  .then(() => {
    console.log('\n✅ Import script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import script failed:', error);
    process.exit(1);
  });
