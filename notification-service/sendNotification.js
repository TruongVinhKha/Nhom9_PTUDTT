const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function sendPushNotification(deviceToken, title, body) {
  const message = {
    notification: { title, body },
    token: deviceToken,
    android: {
      priority: "high",
      notification: {
        channelId: "default", // Tên channel sẽ tạo ở client
      },
    },
  };
  await admin.messaging().send(message);
  console.log('Notification sent!');
}

// Ví dụ: lấy token từ Firestore và gửi
async function main() {
  const userId = process.argv[2]; // Truyền userId qua dòng lệnh
  if (!userId) {
    console.error('Vui lòng truyền userId phụ huynh!');
    process.exit(1);
  }
  const db = admin.firestore();
  const doc = await db.collection('users').doc(userId).get();
  if (doc.exists) {
    const { deviceToken } = doc.data();
    if (!deviceToken) {
      console.error('User chưa có deviceToken!');
      process.exit(1);
    }
    await sendPushNotification(deviceToken, 'Thông báo mới', 'Bạn có thông báo từ nhà trường!');
  } else {
    console.error('Không tìm thấy user!');
  }
}

main(); 