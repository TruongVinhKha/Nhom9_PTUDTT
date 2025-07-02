const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log("Đang lắng nghe nhận xét mới...");

db.collection("comments").onSnapshot(snapshot => {
  snapshot.docChanges().forEach(async change => {
    if (change.type === "added") {
      const comment = change.doc.data();
      const studentId = comment.studentId;
      const content = comment.content;

      console.log("=== NHẬN XÉT MỚI ===");
      console.log("StudentId:", studentId);
      console.log("Content:", content);

      // Tìm phụ huynh có linkedStudentIds chứa studentId
      const parentsSnap = await db.collection("users")
        .where("role", "==", "parent")
        .where("linkedStudentIds", "array-contains", studentId)
        .get();

      console.log("Số phụ huynh tìm thấy:", parentsSnap.size);

      const tokens = [];
      parentsSnap.forEach(doc => {
        const data = doc.data();
        console.log("Phụ huynh:", data.fullName);
        console.log("  - Email:", data.email);
        console.log("  - LinkedStudentIds:", data.linkedStudentIds);
        console.log("  - DeviceToken:", data.deviceToken);
        if (data.deviceToken && data.deviceToken !== "") {
          tokens.push(data.deviceToken);
        }
      });

      if (tokens.length === 0) {
        console.log("❌ Không tìm thấy deviceToken hợp lệ.");
        return;
      }

      console.log("✅ Sẽ gửi notification cho", tokens.length, "phụ huynh");

      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: "Nhận xét mới cho con bạn",
            body: content,
          }
        });
        console.log("✅ Đã gửi notification thành công:", response.successCount);
      } catch (error) {
        console.error("❌ Lỗi khi gửi notification:", error);
      }
    }
  });
});