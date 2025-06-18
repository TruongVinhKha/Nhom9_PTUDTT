import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export default function ClassList({ onSelectClass, onBack }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClasses() {
      const querySnapshot = await getDocs(collection(db, 'classes'));
      setClasses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchClasses();
  }, []);

  if (loading) return <div style={{textAlign:'center',marginTop:40,color:'#2d6cdf'}}>Đang tải danh sách lớp...</div>;

  return (
    <div style={{maxWidth:600,margin:'40px auto',background:'#fff',borderRadius:16,boxShadow:'0 4px 24px rgba(0,0,0,0.08)',padding:32,position:'relative'}}>
      {onBack && (
        <button onClick={onBack} style={{position:'absolute',left:16,top:16,background:'#eaf2fb',border:'none',borderRadius:8,padding:'6px 14px',color:'#2d6cdf',fontWeight:600,cursor:'pointer',boxShadow:'0 1px 4px #e3eefd'}}>← Quay lại</button>
      )}
      <h2 style={{color:'#2d6cdf',textAlign:'center',marginBottom:24}}>Danh sách lớp</h2>
      <div style={{display:'flex',flexWrap:'wrap',gap:16,justifyContent:'center'}}>
        {classes.map(cls => (
          <button key={cls.id} onClick={() => onSelectClass(cls)}
            style={{minWidth:160,padding:'18px 0',background:'#eaf2fb',border:'1px solid #bcd0ee',borderRadius:12,fontSize:18,fontWeight:600,color:'#2d6cdf',cursor:'pointer',boxShadow:'0 2px 8px #e3eefd'}}>
            {cls.name || cls.id}
          </button>
        ))}
      </div>
    </div>
  );
}
