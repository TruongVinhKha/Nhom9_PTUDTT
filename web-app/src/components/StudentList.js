import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function StudentList({ classId, onSelectStudent, onBack }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStudents() {
      try {
        console.log('Bắt đầu lấy dữ liệu học sinh với classId:', classId);
        setError(null);
        
        if (!classId) {
          console.log('Không có classId, trả về mảng rỗng');
          setStudents([]);
          setLoading(false);
          return;
        }

        // Lấy tất cả học sinh nếu classId là 'all', ngược lại lọc theo classId
        let q;
        if (classId === 'all') {
          q = query(collection(db, 'students'));
          console.log('Lấy tất cả học sinh');
        } else {
          q = query(collection(db, 'students'), where('data.classId', '==', classId));
          console.log('Lọc học sinh theo classId:', classId);
        }

        // Thêm log để debug query
        console.log('Query:', q);

        const querySnapshot = await getDocs(q);
        console.log('Số học sinh lấy được:', querySnapshot.docs.length);
        
        if (querySnapshot.docs.length === 0) {
          console.log('Không tìm thấy học sinh nào');
          // Thử lấy tất cả học sinh để kiểm tra
          const allStudentsQuery = query(collection(db, 'students'));
          const allStudentsSnapshot = await getDocs(allStudentsQuery);
          console.log('Tổng số học sinh trong database:', allStudentsSnapshot.docs.length);
          console.log('Mẫu dữ liệu học sinh:', allStudentsSnapshot.docs.slice(0, 3).map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        } else {
          console.log('Danh sách học sinh:', querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }

        const studentList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data().data // Lấy data từ trường data
        }));
        
        setStudents(studentList);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu học sinh:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [classId]);

  if (loading) return <div style={{textAlign:'center',marginTop:40,color:'#2d6cdf'}}>Đang tải danh sách học sinh...</div>;

  if (error) return (
    <div style={{textAlign:'center',marginTop:40,color:'#dc3545'}}>
      Lỗi: {error}
    </div>
  );

  return (
    <div style={{maxWidth:600,margin:'40px auto',background:'#fff',borderRadius:16,boxShadow:'0 4px 24px rgba(0,0,0,0.08)',padding:32,position:'relative'}}>
      {onBack && (
        <button onClick={onBack} style={{position:'absolute',left:16,top:16,background:'#eaf2fb',border:'none',borderRadius:8,padding:'6px 14px',color:'#2d6cdf',fontWeight:600,cursor:'pointer',boxShadow:'0 1px 4px #e3eefd'}}>← Quay lại</button>
      )}
      <h3 style={{color:'#2d6cdf',textAlign:'center',marginBottom:24}}>Danh sách học sinh lớp {classId}</h3>
      <div style={{display:'flex',flexWrap:'wrap',gap:16,justifyContent:'center'}}>
        {students.length === 0 ? (
          <div style={{color:'#888',fontSize:16}}>Không có học sinh nào trong lớp này.</div>
        ) : students.map(stu => (
          <button key={stu.id} onClick={() => onSelectStudent(stu)}
            style={{minWidth:160,padding:'16px 0',background:'#f7fafd',border:'1px solid #bcd0ee',borderRadius:12,fontSize:17,fontWeight:500,color:'#2d6cdf',cursor:'pointer',boxShadow:'0 2px 8px #e3eefd'}}>
            {stu.name || stu.id}
          </button>
        ))}
      </div>
    </div>
  );
}
