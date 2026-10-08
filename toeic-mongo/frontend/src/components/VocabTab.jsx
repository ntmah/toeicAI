import React, { useState, useEffect } from 'react'
import { AgentBanner, Btn, Chip, TypingDots } from './UI'
import { agentAPI } from '../data/api'
import { VOCAB_CHIPS } from '../data/questions'

export default function VocabTab() {
  const [word, setWord] = useState('')
  const [poem, setPoem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  
  // State quản lý danh sách các từ vựng/bài thơ đã được lưu vào lịch sử trên web
  const [savedVocabs, setSavedVocabs] = useState([])

   // Lấy lịch sử từ MongoDB khi load trang
// Tải danh sách lịch sử từ vựng qua thơ từ Database khi mở tab
  useEffect(() => {
    const fetchVocabHistory = async () => {
      try {
        console.log("⏳ Đang gọi API lấy lịch sử từ vựng qua thơ...");
        const currentUserId = localStorage.getItem('toeic_user') ? JSON.parse(localStorage.getItem('toeic_user')).id : null;
        
        if (!currentUserId) {
          console.log("⚠️ Chưa tìm thấy ID người dùng đăng nhập!");
          return;
        }

        // Gọi API lấy lịch sử từ vựng của user (bé chú ý tên hàm gọi API trong agentAPI của bé nhé)
        const response = await agentAPI.getVocabHistory(currentUserId);
        
        console.log("📥 Dữ liệu lịch sử thơ trả về từ Database:", response);
        
        if (response) {
          let fetchedVocabs = [];
          if (Array.isArray(response)) fetchedVocabs = response;
          else if (Array.isArray(response.data)) fetchedVocabs = response.data;
          else if (Array.isArray(response.history)) fetchedVocabs = response.history;
            
          setSavedVocabs(fetchedVocabs); 
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải lịch sử từ vựng:", err);
      }
    };

    fetchVocabHistory();
  }, []);

  const generate = async (w) => {
    const target = w || word.trim()
    if (!target) return
    setLoading(true); setError(null); setPoem(null)
    try {
      const data = await agentAPI.generatePoem(target)
      setPoem(data)
      setHistory(prev => [data, ...prev.slice(0, 4)])
      setWord('')
    } catch {
      setError('Không kết nối được. Thử lại nhé!')
    } finally {
      setLoading(false)
    }
  }

 

  // Hàm lưu bài thơ hiện tại vào danh sách lịch sử
  const saveCurrentPoem = () => {
    if (!poem) return
    const isAlreadySaved = savedVocabs.some(item => item.word.toLowerCase() === poem.word.toLowerCase());
    if (isAlreadySaved) {
      alert("Từ này đã có trong lịch sử của bạn rồi nhé! 💡");
      return;
    }
    if (!savedVocabs.some(item => item.word === poem.word)) {
      setSavedVocabs(prev => [poem, ...prev])
      alert("Đã lưu từ vựng vào lịch sử của bạn! 🎉")
    } else {
      alert("Từ này đã có trong lịch sử rồi nhé!")
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, padding:20 }}>
      <AgentBanner icon="🎵" title="Học từ vựng qua thơ">
        AI sáng tác bài thơ tiếng Việt lồng từ vựng TOEIC để bạn nhớ lâu hơn!
      </AgentBanner>

      <div style={{ display:'flex', gap:8 }}>
        <input
          value={word}
          onChange={e => setWord(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder="Nhập từ TOEIC (vd: postpone, negotiate...)"
          style={{
            flex:1, fontFamily:'var(--font)', fontSize:14, padding:'10px 14px',
            border:'1.5px solid var(--border2)', borderRadius:'var(--radius)',
            background:'var(--bg)', color:'var(--text)', outline:'none'
          }}
          onFocus={e => e.target.style.borderColor='var(--purple)'}
          onBlur={e => e.target.style.borderColor='var(--border2)'}
        />
        <Btn onClick={() => generate()} disabled={loading}>
          {loading ? '⏳' : '✨'} {loading ? 'Đang tạo...' : 'Tạo thơ'}
        </Btn>
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {VOCAB_CHIPS.map(c => <Chip key={c} label={c} onClick={() => generate(c)} />)}
      </div>

      {loading && (
        <div style={{ background:'linear-gradient(135deg,#EEEDFE,#E1F5EE)', borderRadius:'var(--radius-lg)', padding:'20px 22px' }}>
          <TypingDots />
        </div>
      )}

      {error && <div style={{ color:'var(--coral)', fontSize:13 }}>{error}</div>}

      {/* Hiển thị bài thơ mới tạo kèm nút lưu */}
      {poem && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PoemCard data={poem} />
          <Btn onClick={saveCurrentPoem} style={{ background: 'var(--purple)', color: '#fff' }}>
            💾 Lưu từ này vào lịch sử của bạn
          </Btn>
        </div>
      )}
{/* 
      {history.length > 0 && (
        <>
          <div style={{ fontSize:12, fontWeight:800, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.8, marginTop:4 }}>Đã học gần đây</div>
          {history.slice(1).map((p, i) => <PoemCard key={i} data={p} compact />)}
        </>
      )} */}

      <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '8px 0' }} />

      {/* Khu vực hiển thị kho lịch sử từ vựng đã lưu trên web */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
          📚 LỊCH SỬ TỪ VỰNG ĐÃ LƯU ({savedVocabs.length})
        </div>
        
        {savedVocabs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg)', borderRadius: 12, color: 'var(--text2)', fontSize: 14 }}>
            Chưa có từ vựng nào được lưu. Hãy tạo và lưu lại nhé!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {savedVocabs.map((item, idx) => (
              <PoemCard key={idx} data={item} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// function PoemCard({ data, compact }) {
//   return (
//     <div style={{
//       background:'linear-gradient(135deg,#EEEDFE,#E1F5EE)',
//       borderRadius:'var(--radius-lg)', padding: compact ? '14px 16px' : '20px 22px',
//       position:'relative', overflow:'hidden'
//     }}>
//       <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(83,74,183,.08)' }} />
//       <div style={{ fontSize: compact ? 16 : 22, fontWeight:900, color:'var(--purple)', letterSpacing:-.5 }}>{data.word}</div>
//       {data.phonetic && <div style={{ fontSize:13, color:'var(--purple-md)', fontFamily:'var(--mono)', margin:'2px 0 6px' }}>{data.phonetic}</div>}
//       <div style={{ fontSize:13, fontWeight:700, color:'#3C3489', background:'rgba(255,255,255,.6)', display:'inline-block', padding:'3px 10px', borderRadius:99, marginBottom: compact ? 8 : 12 }}>
//         {data.meaning}
//       </div>
//       {!compact && (
//         <div style={{ fontSize:14, lineHeight:2, color:'#26215C', fontStyle:'italic', whiteSpace:'pre-wrap', fontWeight:600 }}>
//           {data.poem}
//         </div>
//       )}
//       {data.example && (
//         <div style={{ marginTop: compact ? 4 : 12, fontSize:13, color:'var(--text2)', background:'rgba(255,255,255,.7)', borderRadius:10, padding:'10px 12px', lineHeight:1.6, fontFamily:'var(--mono)' }}>
//           📝 {data.example}
//         </div>
//       )}
//     </div>
//   )
// }

function PoemCard({ data, compact }) {
  return (
    <div style={{
      background:'linear-gradient(135deg,#EEEDFE,#E1F5EE)',
      borderRadius:'var(--radius-lg)', padding: compact ? '14px 16px' : '20px 22px',
      position:'relative', overflow:'hidden'
    }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(83,74,183,.08)' }} />
      <div style={{ fontSize: compact ? 16 : 22, fontWeight:900, color:'var(--purple)', letterSpacing:-.5 }}>{data.word}</div>
      {data.phonetic && <div style={{ fontSize:13, color:'var(--purple-md)', fontFamily:'var(--mono)', margin:'2px 0 6px' }}>{data.phonetic}</div>}
      <div style={{ fontSize:13, fontWeight:700, color:'#3C3489', background:'rgba(255,255,255,.6)', display:'inline-block', padding:'3px 10px', borderRadius:99, marginBottom: 12 }}>
        {data.meaning}
      </div>
      
      {/* 👉 Luôn hiển thị bài thơ, dù là compact hay không */}
      {data.poem && (
        <div style={{ fontSize:14, lineHeight:2, color:'#26215C', fontStyle:'italic', whiteSpace:'pre-wrap', fontWeight:600, marginBottom: 8 }}>
          {data.poem}
        </div>
      )}

      {data.example && (
        <div style={{ fontSize:13, color:'var(--text2)', background:'rgba(255,255,255,.7)', borderRadius:10, padding:'10px 12px', lineHeight:1.6, fontFamily:'var(--mono)' }}>
          📝 {data.example}
        </div>
      )}
    </div>
  )
}