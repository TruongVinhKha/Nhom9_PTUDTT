const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Hàm cập nhật deviceToken cho tất cả phụ huynh
async function updateAllParentTokens() {
  console.log("Đang cập nhật deviceToken cho tất cả phụ huynh...");
  
  const parentsSnap = await db.collection("users")
    .where("role", "==", "parent")
    .get();

  let count = 0;
  for (const doc of parentsSnap.docs) {
    const data = doc.data();
    if (data.deviceToken === "" || !data.deviceToken) {
      // Tạo token test duy nhất cho mỗi phụ huynh
      const testToken = `test_token_${doc.id}_${Date.now()}`;
      await doc.ref.update({ deviceToken: testToken });
      count++;
      console.log(`Đã cập nhật ${data.fullName}: ${testToken}`);
    }
  }
  
  console.log(`✅ Đã cập nhật ${count} phụ huynh`);
}

// Chạy hàm cập nhật
updateAllParentTokens();