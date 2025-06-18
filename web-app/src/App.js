import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import ClassList from './components/ClassList';
import StudentList from './components/StudentList';
import AddComment from './components/AddComment';
import CommentHistory from './components/CommentHistory';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f7fafd'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '32px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e3eefd',
            borderTop: '4px solid #2d6cdf',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ color: '#2d6cdf', fontSize: '18px', fontWeight: '500' }}>Đang tải...</div>
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

  return (
    <div className="App" style={{ minHeight: '100vh', background: '#f7fafd', padding: '20px' }}>
      {!selectedClass ? (
        <ClassList onSelectClass={setSelectedClass} onBack={() => auth.signOut()} />
      ) : !selectedStudent ? (
        <StudentList classId={selectedClass.id} onSelectStudent={setSelectedStudent} onBack={() => setSelectedClass(null)} />
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <AddComment 
            student={selectedStudent} 
            onCommentAdded={() => {}} 
            onBack={() => setSelectedStudent(null)} 
          />
          <CommentHistory 
            studentId={selectedStudent.id} 
            onBack={() => setSelectedStudent(null)} 
          />
        </div>
      )}
    </div>
  );
}

export default App;
