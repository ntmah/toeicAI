// import React, { useEffect, useState } from 'react'
// import { AgentBanner, TypingDots, Btn } from './UI'
// import { agentAPI } from '../data/api'
// import { MODES } from '../data/questions'

// export default function HomeTab({ stats, accuracy, weakest, selectedMode, onSelectMode, onStart, user }) {
//   const [agentMsg, setAgentMsg] = useState(null)
//   const [loading, setLoading]   = useState(true)

//   useEffect(() => {
//     setLoading(true)
//     agentAPI.analyze(stats)
//       .then(data => { setAgentMsg(data.message); if (data.weakest) onSelectMode(data.weakest) })
//       .catch(() => setAgentMsg('Hãy làm bài để Agent theo dõi và đề xuất lộ trình phù hợp!'))
//       .finally(() => setLoading(false))
//   }, [stats])

//   return (
//     <div style={{ display:'flex', flexDirection:'column', gap:16, padding:20 }}>
//       {user && (
//         <div style={{ fontSize:13, color:'var(--text2)', fontWeight:600 }}>
//           Xin chào, <strong style={{ color:'var(--purple)' }}>{user.email}</strong> 👋
//         </div>
//       )}

//       <AgentBanner title="AI Agent phân tích điểm yếu">
//         {loading ? <TypingDots /> : agentMsg}
//       </AgentBanner>

//       <div style={{ fontSize:12, fontWeight:800, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.8 }}>
//         Chọn phần luyện tập
//       </div>

//       <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 }}>
//         {MODES.map(m => {
//           const acc  = accuracy(m.id)
//           const weak = weakest() === m.id
//           const sel  = selectedMode === m.id
//           return (
//             <div key={m.id} onClick={() => onSelectMode(m.id)} style={{
//               border:`1.5px solid ${weak?'var(--coral)':sel?'var(--purple)':'var(--border)'}`,
//               borderRadius:'var(--radius-lg)', padding:'14px 10px', cursor:'pointer',
//               textAlign:'center', transition:'all .15s', position:'relative',
//               background: sel ? 'var(--purple-lt)' : 'var(--bg)',
//             }}>
//               {weak && (
//                 <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', fontSize:10, fontWeight:800, background:'var(--coral)', color:'#fff', padding:'2px 8px', borderRadius:99, whiteSpace:'nowrap' }}>
//                   ⚠ Cần luyện thêm
//                 </div>
//               )}
//               <div style={{ fontSize:28, marginBottom:6 }}>{m.icon}</div>
//               <div style={{ fontSize:13, fontWeight:800 }}>{m.label}</div>
//               <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{m.sub}</div>
//               <div style={{ fontSize:11, fontWeight:700, marginTop:4, color: acc===null?'var(--text3)':acc>=70?'var(--teal)':'var(--coral)' }}>
//                 {acc===null ? '—' : `${acc}% đúng`}
//               </div>
//             </div>
//           )
//         })}
//       </div>

//       <div style={{ display:'flex', justifyContent:'flex-end' }}>
//         <Btn onClick={onStart}>▶ Bắt đầu luyện</Btn>
//       </div>
//     </div>
//   )
// }


// import React, { useEffect, useState } from 'react'
// import { AgentBanner, TypingDots, Btn } from './UI'
// import { agentAPI } from '../data/api'
// import { MODES } from '../data/questions'

// export default function HomeTab({ stats, accuracy, weakest, selectedMode, onSelectMode, onStart, user }) {
//   const [agentMsg, setAgentMsg] = useState(null)
//   const [loading, setLoading]   = useState(true)
//   const [isGenerating, setIsGenerating] = useState(false)
//   // const [aiQuestions, setAiQuestions] = useState(null)

//   // 1. Lấy lời khuyên từ AI Agent khi load trang
//   useEffect(() => {
//     setLoading(true)
//     agentAPI.analyze(stats)
//       .then(data => { 
//         setAgentMsg(data.message)
//         // Nếu AI thấy điểm yếu và user chưa chọn part nào thì tự động focus vào part yếu nhất
//         if (data.weakest && !selectedMode) onSelectMode(data.weakest)
//       })
//       .catch(() => setAgentMsg('Hãy làm bài test ban đầu để Agent theo dõi và đề xuất lộ trình!'))
//       .finally(() => setLoading(false))
//   }, [stats])

//   // 2. KIỂM TRA LẦN ĐẦU: Lấy data của kỹ năng ĐANG CHỌN ra check
//   const currentStats = stats[selectedMode] || { done: 0 };
//   const isFirstTime = currentStats.done === 0;

//   // 3. Hàm xử lý khi bấm nút bắt đầu luyện tập
//   const handleStartPractice = async () => {
//     if (!selectedMode) return alert('Vui lòng chọn một kỹ năng để luyện tập!');
    
//     // NẾU LÀ LẦN ĐẦU -> Bỏ qua AI, báo cho cha biết là xài câu hỏi CÓ SẴN (truyền null)
//     if (isFirstTime) {
//       onStart(selectedMode, null); 
//       return;
//     }

//     // NẾU ĐÃ CÓ ĐIỂM -> Gọi AI tạo câu hỏi dựa vào part ĐANG CHỌN và SỐ ĐIỂM của part đó
//     setIsGenerating(true);
//     try {
//       const res = await agentAPI.generate(stats, selectedMode);
//       onStart(selectedMode, res.questions); // Truyền bộ 15 câu hỏi AI gen sang QuizTab
//     } catch (error) {
//       alert('AI đang quá tải, không thể tạo câu hỏi lúc này!');
//     } finally {
//       setIsGenerating(false);
//     }
//   }

//   return (
//     <div style={{ display:'flex', flexDirection:'column', gap:16, padding:20 }}>
//       {user && (
//         <div style={{ fontSize:13, color:'var(--text2)', fontWeight:600 }}>
//           Xin chào, <strong style={{ color:'var(--purple)' }}>{user.email}</strong> 👋
//         </div>
//       )}

//       <AgentBanner title="AI Agent phân tích điểm yếu">
//         {loading ? <TypingDots /> : agentMsg}
//       </AgentBanner>

//       <div style={{ fontSize:12, fontWeight:800, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.8 }}>
//         Chọn phần luyện tập
//       </div>

//       {/* DANH SÁCH TỪNG PART ĐỂ NGƯỜI DÙNG CLICK CHỌN */}
//       <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 }}>
//         {MODES.map(m => {
//           const acc  = accuracy(m.id)
//           const weak = weakest() === m.id
//           const sel  = selectedMode === m.id
          
//           return (
//             <div key={m.id} onClick={() => !isGenerating && onSelectMode(m.id)} style={{
//               border:`1.5px solid ${weak ? 'var(--coral)' : sel ? 'var(--purple)' : 'var(--border)'}`,
//               borderRadius:'var(--radius-lg)', padding:'14px 10px', 
//               cursor: isGenerating ? 'not-allowed' : 'pointer', // Đang load thì khóa click
//               opacity: isGenerating && !sel ? 0.5 : 1, // Làm mờ các part khác khi đang gen
//               textAlign:'center', transition:'all .15s', position:'relative',
//               background: sel ? 'var(--purple-lt)' : 'var(--bg)',
//             }}>
//               {weak && (
//                 <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', fontSize:10, fontWeight:800, background:'var(--coral)', color:'#fff', padding:'2px 8px', borderRadius:99, whiteSpace:'nowrap' }}>
//                   ⚠ Cần luyện thêm
//                 </div>
//               )}
//               <div style={{ fontSize:28, marginBottom:6 }}>{m.icon}</div>
//               <div style={{ fontSize:13, fontWeight:800 }}>{m.label}</div>
//               <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{m.sub}</div>
//               <div style={{ fontSize:11, fontWeight:700, marginTop:4, color: acc===null?'var(--text3)':acc>=70?'var(--teal)':'var(--coral)' }}>
//                 {acc===null ? '—' : `${acc}% đúng`}
//               </div>
//             </div>
//           )
//         })}
//       </div>

//       {/* NÚT BẤM (Tự đổi chữ tuỳ theo Part đó đã có điểm hay chưa) */}
//       <div style={{ display:'flex', justifyContent:'flex-end' }}>
//         <Btn onClick={handleStartPractice} disabled={isGenerating}>
//           {isGenerating 
//             ? `⏳ AI đang soạn bài ${selectedMode}...` 
//             : (isFirstTime ? '▶ Bắt đầu Test Đánh Giá' : '🤖 Luyện tập cùng AI')}
//         </Btn>
//       </div>
//     </div>
//   )
// }

import React, { useEffect, useState } from 'react'
import { AgentBanner, TypingDots, Btn } from './UI'
import { agentAPI } from '../data/api'
import { MODES } from '../data/questions'

export default function HomeTab({ stats, accuracy, weakest, selectedMode, onSelectMode, onStart, user }) {
  const [agentMsg, setAgentMsg] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    setLoading(true)
    agentAPI.analyze(stats)
      .then(data => { 
        setAgentMsg(data.message)
        if (data.weakest && !selectedMode) onSelectMode(data.weakest)
      })
      .catch(() => setAgentMsg('Hãy làm bài test ban đầu để Agent theo dõi và đề xuất lộ trình!'))
      .finally(() => setLoading(false))
  }, [stats])

  const currentStats = stats[selectedMode] || { done: 0 };
  const isFirstTime = currentStats.done === 0;

  const handleStartPractice = async () => {
    if (!selectedMode) return alert('Vui lòng chọn một kỹ năng để luyện tập!');
    
    // NẾU LÀ LẦN ĐẦU -> Đưa null lên cho Mẹ
    if (isFirstTime) {
      onStart(selectedMode, null); 
      return;
    }

    // NẾU ĐÃ CÓ ĐIỂM -> Gọi API
    setIsGenerating(true);
    try {
      const res = await agentAPI.generate(stats, selectedMode);
      // Đưa 15 câu AI lên cho Mẹ App.js
      onStart(selectedMode, res.questions); 
    } catch (error) {
      alert('AI đang quá tải, không thể tạo câu hỏi lúc này!');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, padding:20 }}>
      {user && (
        <div style={{ fontSize:13, color:'var(--text2)', fontWeight:600 }}>
          Xin chào, <strong style={{ color:'var(--purple)' }}>{user.email}</strong> 👋
        </div>
      )}

      <AgentBanner title="AI Agent phân tích điểm yếu">
        {loading ? <TypingDots /> : agentMsg}
      </AgentBanner>

      <div style={{ fontSize:12, fontWeight:800, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.8 }}>
        Chọn phần luyện tập
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 }}>
        {MODES.map(m => {
          const acc  = accuracy(m.id)
          const weak = weakest() === m.id
          const sel  = selectedMode === m.id
          
          return (
            <div key={m.id} onClick={() => !isGenerating && onSelectMode(m.id)} style={{
              border:`1.5px solid ${weak ? 'var(--coral)' : sel ? 'var(--purple)' : 'var(--border)'}`,
              borderRadius:'var(--radius-lg)', padding:'14px 10px', 
              cursor: isGenerating ? 'not-allowed' : 'pointer', 
              opacity: isGenerating && !sel ? 0.5 : 1, 
              textAlign:'center', transition:'all .15s', position:'relative',
              background: sel ? 'var(--purple-lt)' : 'var(--bg)',
            }}>
              {weak && (
                <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', fontSize:10, fontWeight:800, background:'var(--coral)', color:'#fff', padding:'2px 8px', borderRadius:99, whiteSpace:'nowrap' }}>
                  ⚠ Cần luyện thêm
                </div>
              )}
              <div style={{ fontSize:28, marginBottom:6 }}>{m.icon}</div>
              <div style={{ fontSize:13, fontWeight:800 }}>{m.label}</div>
              <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{m.sub}</div>
              <div style={{ fontSize:11, fontWeight:700, marginTop:4, color: acc===null?'var(--text3)':acc>=70?'var(--teal)':'var(--coral)' }}>
                {acc===null ? '—' : `${acc}% đúng`}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <Btn onClick={handleStartPractice} disabled={isGenerating}>
          {isGenerating 
            ? `⏳ AI đang soạn bài ${selectedMode}...` 
            : (isFirstTime ? '▶ Bắt đầu Test Đánh Giá' : '🤖 Luyện tập cùng AI')}
        </Btn>
      </div>
    </div>
  )
}