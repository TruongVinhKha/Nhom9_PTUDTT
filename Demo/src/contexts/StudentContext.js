import firestore from '@react-native-firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const StudentContext = createContext();

export function StudentProvider({ children }) {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (!user) {
      setStudents([]);
      setSelectedStudent(null);
      return;
    }
    const fetchStudents = async () => {
      try {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const linkedStudentIds = userDoc.data()?.linkedStudentIds || [];
        if (linkedStudentIds.length === 0) {
          setStudents([]);
          setSelectedStudent(null);
          return;
        }
        const studentDocs = await Promise.all(
          linkedStudentIds.map(id => firestore().collection('students').doc(id).get())
        );
        const studentList = studentDocs
          .filter(doc => doc.exists)
          .map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentList);
        setSelectedStudent(studentList[0] || null);
      } catch (e) {
        setStudents([]);
        setSelectedStudent(null);
      }
    };
    fetchStudents();
  }, [user]);

  return (
    <StudentContext.Provider value={{ students, selectedStudent, setSelectedStudent }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  return useContext(StudentContext);
} 