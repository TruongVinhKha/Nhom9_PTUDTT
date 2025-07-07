import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ClassList from './components/class/ClassList';
import StudentList from './components/student/StudentList';
import AddComment from './components/comment/AddComment';
import CommentHistory from './components/comment/CommentHistory';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AdminDashboard from './components/dashboard/AdminDashboard';
import TeacherDashboard from './components/dashboard/TeacherDashboard';

function AppContent() {
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // Thông tin user Firestore
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(true);
      if (user) {
        // Lấy thông tin user từ Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            setUserData(null);
          }
        } catch (err) {
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="App flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="unified-card text-center" style={{ padding: '32px' }}>
          <div className="unified-loading mb-16"></div>
          <div className="unified-gradient-text" style={{ fontSize: '18px', fontWeight: '500' }}>
            Đang tải...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="App" style={{ minHeight: '100vh', background: '#f7fafd', padding: '20px' }}>
        {showRegister ? (
          <Register onSwitchToLogin={() => setShowRegister(false)} onBack={() => setShowRegister(false)} />
        ) : (
          <Login onSwitchToRegister={() => setShowRegister(true)} />
        )}
      </div>
    );
  }

  // Nếu là admin thì vào luôn dashboard admin
  if (userData && userData.role === 'admin') {
    return <AdminDashboard onBack={() => auth.signOut()} currentUser={user} userData={userData} />;
  }

  // Nếu là teacher thì vào TeacherDashboard
  if (userData && userData.role === 'teacher') {
    return <TeacherDashboard onBack={() => auth.signOut()} currentUser={user} />;
  }

  // Nếu là parent thì vào giao diện cũ
  return (
    <div className="App" style={{ minHeight: '100vh', background: '#f7fafd', padding: '20px' }}>
      {!selectedClass ? (
        <ClassList onSelectClass={setSelectedClass} userData={userData} />
      ) : !selectedStudent ? (
        <StudentList classId={selectedClass.id} onSelectStudent={setSelectedStudent} />
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <CommentHistory 
            studentId={selectedStudent.id} 
            onBack={() => setSelectedStudent(null)}
            renderAddComment={(addNewComment) => (
              <AddComment 
                student={selectedStudent} 
                onCommentAdded={addNewComment} 
                onBack={() => setSelectedStudent(null)}
                currentUser={user}
                userData={userData}
              />
            )}
          />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AppContent />
  );
}

export default App;
