const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log("🚀 Firestore Listener đã khởi động!");
console.log("📱 Đang lắng nghe nhận xét mới từ giáo viên...");

db.collection("comments").onSnapshot(snapshot => {
  snapshot.docChanges().forEach(async change => {
    if (change.type === "added") {
      const comment = change.doc.data();
      const studentId = comment.studentId;
      const content = comment.content;
      const teacherName = comment.teacherName || "Giáo viên";

      console.log("\n=== 📝 NHẬN XÉT MỚI ===");
      console.log("👨‍🎓 StudentId:", studentId);
      console.log("📝 Content:", content);
      console.log("👨‍🏫 Teacher:", teacherName);

      try {
        // Tìm phụ huynh có linkedStudentIds chứa studentId
        const parentsSnap = await db.collection("users")
          .where("role", "==", "parent")
          .where("linkedStudentIds", "array-contains", studentId)
          .get();

        console.log("🔍 Số phụ huynh tìm thấy:", parentsSnap.size);

        if (parentsSnap.empty) {
          console.log("❌ Không tìm thấy phụ huynh nào cho studentId:", studentId);
          return;
        }

        const tokens = [];
        const validParents = [];

        parentsSnap.forEach(doc => {
          const data = doc.data();
          console.log("👨‍👩‍👧‍👦 Phụ huynh:", data.fullName);
          console.log("  - 📧 Email:", data.email);
          console.log("  - 🔗 LinkedStudentIds:", data.linkedStudentIds);
          
          if (data.deviceToken && data.deviceToken.trim() !== "") {
            tokens.push(data.deviceToken);
            validParents.push(data.fullName);
            console.log("  - ✅ DeviceToken:", data.deviceToken.substring(0, 20) + "...");
          } else {
            console.log("  - ❌ Không có deviceToken");
          }
        });

        if (tokens.length === 0) {
          console.log("❌ Không tìm thấy deviceToken hợp lệ cho bất kỳ phụ huynh nào.");
          return;
        }

        console.log("✅ Sẽ gửi notification cho", tokens.length, "phụ huynh:", validParents.join(", "));

        // Gửi notification đến tất cả phụ huynh
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: `Nhận xét mới từ ${teacherName}`,
            body: content.length > 100 ? content.substring(0, 100) + "..." : content,
          },
          android: {
            priority: "high",
            notification: {
              channelId: "default",
            },
          },
          data: {
            type: "new_comment",
            studentId: studentId,
            commentId: change.doc.id,
          }
        });

        console.log("✅ Đã gửi notification thành công!");
        console.log("  - 📤 Gửi thành công:", response.successCount, "phụ huynh");
        console.log("  - ❌ Gửi thất bại:", response.failureCount, "phụ huynh");
        
        if (response.failureCount > 0) {
          console.log("  - 🔍 Chi tiết lỗi:", response.responses);
        }

      } catch (error) {
        console.error("❌ Lỗi khi xử lý comment mới:", error);
      }
    }
  });
}, error => {
  console.error("❌ Lỗi khi lắng nghe Firestore:", error);
});

// Lắng nghe thông báo mới cho lớp (1 lớp hoặc nhiều lớp)
db.collection("notificationsForClass").onSnapshot(snapshot => {
  snapshot.docChanges().forEach(async change => {
    if (change.type === "added") {
      const notification = change.doc.data();
      const classIds = notification.classIds || (notification.classId ? [notification.classId] : []);
      if (classIds.length === 0) return;

      try {
        // Tìm tất cả học sinh thuộc các lớp này
        const studentsSnap = await db.collection("students")
          .where("classId", "in", classIds)
          .get();
        const studentIds = studentsSnap.docs.map(doc => doc.id);
        if (studentIds.length === 0) {
          console.log("❌ Không tìm thấy học sinh nào cho classIds:", classIds.join(", "));
          return;
        }

        // Tìm phụ huynh có linkedStudentIds chứa bất kỳ studentId nào
        const parentsSnap = await db.collection("users")
          .where("role", "==", "parent")
          .where("linkedStudentIds", "array-contains-any", studentIds)
          .get();

        const tokens = [];
        const validParents = [];
        parentsSnap.forEach(doc => {
          const data = doc.data();
          console.log("👨‍👩‍👧‍👦 Phụ huynh:", data.fullName);
          console.log("  - 📧 Email:", data.email);
          console.log("  - 🔗 LinkedStudentIds:", data.linkedStudentIds);
          if (data.deviceToken && data.deviceToken.trim() !== "") {
            tokens.push(data.deviceToken);
            validParents.push(data.fullName);
            console.log("  - ✅ DeviceToken:", data.deviceToken.substring(0, 20) + "...");
          } else {
            console.log("  - ❌ Không có deviceToken");
          }
        });
        if (tokens.length === 0) {
          console.log("❌ Không tìm thấy deviceToken hợp lệ cho bất kỳ phụ huynh nào.");
          return;
        }

        console.log("\n=== 📢 THÔNG BÁO MỚI CHO LỚP (nhiều lớp) ===");
        console.log("🔔 Title:", notification.title);
        console.log("📝 Content:", notification.content);
        console.log("🏫 ClassIds:", classIds.join(", "));
        console.log("👨‍👩‍👧‍👦 Số phụ huynh nhận thông báo:", tokens.length, validParents.join(", "));

        // Gửi notification
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: notification.title,
            body: notification.content.length > 100 ? notification.content.substring(0, 100) + "..." : notification.content,
          },
          android: {
            priority: "high",
            notification: {
              channelId: "default",
            },
          },
          data: {
            type: "class_notification",
            notificationId: change.doc.id,
          }
        });

        // Tự động xoá deviceToken không hợp lệ
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorMsg = resp.error && resp.error.message;
            if (
              errorMsg &&
              (errorMsg.includes('registration token is not a valid FCM registration token') ||
               errorMsg.includes('Requested entity was not found'))
            ) {
              const tokenToRemove = tokens[idx];
              db.collection('users')
                .where('deviceToken', '==', tokenToRemove)
                .get()
                .then(snapshot => {
                  snapshot.forEach(doc => {
                    doc.ref.update({ deviceToken: admin.firestore.FieldValue.delete() });
                    console.log(`🧹 Đã xoá deviceToken không hợp lệ cho user: ${doc.id}`);
                  });
                });
            }
          }
        });

        console.log("✅ Đã gửi notification thành công!");
        console.log("  - 📤 Gửi thành công:", response.successCount, "phụ huynh");
        console.log("  - ❌ Gửi thất bại:", response.failureCount, "phụ huynh");
        if (response.failureCount > 0) {
          console.log("  - 🔍 Chi tiết lỗi:", response.responses);
        }
      } catch (error) {
        console.error("❌ Lỗi khi xử lý thông báo lớp:", error);
      }
    }
  });
}, error => {
  console.error("❌ Lỗi khi lắng nghe notificationsForClass:", error);
});

// Lắng nghe thông báo mới cho 1 lớp từ collection notifications
db.collection("notifications").onSnapshot(snapshot => {
  snapshot.docChanges().forEach(async change => {
    if (change.type === "added") {
      const notification = change.doc.data();
      const classId = notification.classId;
      if (!classId) return;

      try {
        // Tìm tất cả học sinh thuộc lớp này
        const studentsSnap = await db.collection("students")
          .where("classId", "==", classId)
          .get();
        const studentIds = studentsSnap.docs.map(doc => doc.id);
        if (studentIds.length === 0) {
          console.log("❌ Không tìm thấy học sinh nào cho classId:", classId);
          return;
        }

        // Tìm phụ huynh có linkedStudentIds chứa bất kỳ studentId nào
        const parentsSnap = await db.collection("users")
          .where("role", "==", "parent")
          .where("linkedStudentIds", "array-contains-any", studentIds)
          .get();

        const tokens = [];
        const validParents = [];
        parentsSnap.forEach(doc => {
          const data = doc.data();
          console.log("👨‍👩‍👧‍👦 Phụ huynh:", data.fullName);
          console.log("  - 📧 Email:", data.email);
          console.log("  - 🔗 LinkedStudentIds:", data.linkedStudentIds);
          if (data.deviceToken && data.deviceToken.trim() !== "") {
            tokens.push(data.deviceToken);
            validParents.push(data.fullName);
            console.log("  - ✅ DeviceToken:", data.deviceToken.substring(0, 20) + "...");
          } else {
            console.log("  - ❌ Không có deviceToken");
          }
        });
        if (tokens.length === 0) {
          console.log("❌ Không tìm thấy deviceToken hợp lệ cho bất kỳ phụ huynh nào.");
          return;
        }

        console.log("\n=== 📢 THÔNG BÁO MỚI CHO LỚP (1 lớp) ===");
        console.log("🔔 Title:", notification.title);
        console.log("📝 Content:", notification.content);
        console.log("🏫 ClassId:", classId);
        console.log("👨‍👩‍👧‍👦 Số phụ huynh nhận thông báo:", tokens.length, validParents.join(", "));

        // Gửi notification
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: notification.title,
            body: notification.content.length > 100 ? notification.content.substring(0, 100) + "..." : notification.content,
          },
          android: {
            priority: "high",
            notification: {
              channelId: "default",
            },
          },
          data: {
            type: "class_notification",
            notificationId: change.doc.id,
          }
        });

        // Tự động xoá deviceToken không hợp lệ
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorMsg = resp.error && resp.error.message;
            if (
              errorMsg &&
              (errorMsg.includes('registration token is not a valid FCM registration token') ||
               errorMsg.includes('Requested entity was not found'))
            ) {
              const tokenToRemove = tokens[idx];
              db.collection('users')
                .where('deviceToken', '==', tokenToRemove)
                .get()
                .then(snapshot => {
                  snapshot.forEach(doc => {
                    doc.ref.update({ deviceToken: admin.firestore.FieldValue.delete() });
                    console.log(`🧹 Đã xoá deviceToken không hợp lệ cho user: ${doc.id}`);
                  });
                });
            }
          }
        });

        console.log("✅ Đã gửi notification thành công!");
        console.log("  - 📤 Gửi thành công:", response.successCount, "phụ huynh");
        console.log("  - ❌ Gửi thất bại:", response.failureCount, "phụ huynh");
        if (response.failureCount > 0) {
          console.log("  - 🔍 Chi tiết lỗi:", response.responses);
        }
      } catch (error) {
        console.error("❌ Lỗi khi xử lý thông báo lớp (notifications):", error);
      }
    }
  });
}, error => {
  console.error("❌ Lỗi khi lắng nghe notifications:", error);
});

console.log("🎯 Listener đang chạy... Nhấn Ctrl+C để dừng.");