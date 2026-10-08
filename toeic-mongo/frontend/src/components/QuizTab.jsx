// import React, { useState, useEffect } from 'react'
// import { AgentBanner, TypingDots, Btn } from './UI'
// import { agentAPI } from '../data/api'
// import { QUESTIONS } from '../data/questions'

// const LETTERS = ['A', 'B', 'C', 'D']

// export default function QuizTab({ selectedMode, recordAnswer, onFinish }) {
//   const [questions, setQuestions] = useState([])
//   const [current, setCurrent] = useState(0)
//   const [picked, setPicked] = useState(null)
//   const [showResult, setShowResult] = useState(false)
//   const [session, setSession] = useState({ correct: 0, total: 0 })
//   const [agentMsg, setAgentMsg] = useState(null)
//   const [agentLoading, setAgentLoading] = useState(false)
//   const [estimated, setEstimated] = useState(null)

//   useEffect(() => {
//     const pool = QUESTIONS.filter(q => q.mode === selectedMode)
//     const shuffled = [...pool].sort(() => Math.random() - .5).slice(0, 5)
//     setQuestions(shuffled)
//     setCurrent(0)
//     setPicked(null)
//     setShowResult(false)
//     setSession({ correct: 0, total: 0 })
//   }, [selectedMode])

//   const q = questions[current]

//   const handlePick = (idx) => {
//     if (picked !== null) return
//     const ok = idx === q.ans
//     setPicked(idx)
//     recordAnswer(q.mode, ok)
//     const newSession = { correct: session.correct + (ok ? 1 : 0), total: session.total + 1 }
//     setSession(newSession)
//   }

//   const handleNext = () => {
//     if (current + 1 >= questions.length) {
//       // Session done – get agent analysis
//       setShowResult(true)
//       const acc = Math.round((session.correct + (picked === q?.ans ? 1 : 0)) / questions.length * 100)
//       setEstimated(300 + Math.round(acc * 5.95))
//       setAgentLoading(true)
//       agentAPI.sessionResult(selectedMode, questions.length, session.correct + (picked === q?.ans ? 1 : 0))
//         .then(data => { setAgentMsg(data.message); setEstimated(data.estimated_score) })
//         .catch(() => setAgentMsg(`Bạn đạt ${acc}% – ${acc >= 70 ? 'tốt lắm!' : 'cố gắng luyện thêm nhé!'}`))
//         .finally(() => setAgentLoading(false))
//     } else {
//       setCurrent(c => c + 1)
//       setPicked(null)
//     }
//   }

//   if (!q && !showResult) return <div style={{ padding:20, color:'var(--text2)' }}>Đang tải câu hỏi...</div>

//   if (showResult) {
//     const acc = Math.round(session.correct / questions.length * 100)
//     return (
//       <div style={{ display:'flex', flexDirection:'column', gap:16, padding:20 }}>
//         <div style={{ textAlign:'center', padding:'10px 0' }}>
//           <div style={{ fontSize:56, fontWeight:900, fontFamily:'var(--mono)', color:'var(--purple)' }}>{estimated || '—'}</div>
//           <div style={{ fontSize:14, color:'var(--text2)', marginTop:4 }}>điểm TOEIC ước tính • {questions.length} câu • {acc}% đúng</div>
//         </div>
//         <AgentBanner title="Agent phân tích kết quả">
//           {agentLoading ? <TypingDots /> : agentMsg}
//         </AgentBanner>
//         <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
//           <Btn secondary onClick={() => onFinish('vocab')}>🎵 Học từ vựng thơ</Btn>
//           <Btn onClick={() => onFinish('home')}>Luyện tiếp ↩</Btn>
//         </div>
//       </div>
//     )
//   }

//   const pct = Math.round(current / questions.length * 100)

//   return (
//     <div style={{ display:'flex', flexDirection:'column', gap:14, padding:20 }}>
//       {/* Progress */}
//       <div style={{ height:5, background:'var(--bg3)', borderRadius:99, overflow:'hidden' }}>
//         <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,var(--purple),var(--teal))', borderRadius:99, transition:'width .4s ease' }} />
//       </div>

//       {/* Header */}
//       <div style={{ display:'flex', alignItems:'center', gap:8 }}>
//         <span style={{ fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:99, background:'var(--purple-lt)', color:'var(--purple)', textTransform:'uppercase', letterSpacing:.5 }}>
//           {q.part}
//         </span>
//         <span style={{ fontSize:12, color:'var(--text2)', fontWeight:600, marginLeft:'auto' }}>
//           {current + 1} / {questions.length}
//         </span>
//       </div>

//       {/* Question */}
//       <div style={{ background:'var(--bg2)', borderRadius:'var(--radius-lg)', padding:16, fontSize:15, fontWeight:600, lineHeight:1.65 }}>
//         {q.q}
//         {q.s && (
//           <div style={{ fontFamily:'var(--mono)', fontSize:13, background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:10, padding:'12px 14px', marginTop:10, lineHeight:1.9, color:'var(--text2)' }}
//             dangerouslySetInnerHTML={{ __html: q.s.replace('_____', '<span style="display:inline-block;border-bottom:2px solid var(--purple);min-width:64px;text-align:center;color:var(--purple);font-weight:700">_____</span>') }}
//           />
//         )}
//       </div>

//       {/* Options */}
//       <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
//         {q.opts.map((opt, i) => {
//           let bg = 'var(--bg)', borderColor = 'var(--border)', color = 'var(--text)'
//           if (picked !== null) {
//             if (i === q.ans) { bg = 'var(--teal-lt)'; borderColor = 'var(--teal)'; color = '#085041' }
//             else if (i === picked && picked !== q.ans) { bg = 'var(--coral-lt)'; borderColor = 'var(--coral)'; color = '#4A1B0C' }
//           }
//           return (
//             <button
//               key={i}
//               onClick={() => handlePick(i)}
//               disabled={picked !== null}
//               style={{
//                 fontFamily:'var(--font)', fontSize:14, fontWeight:600, textAlign:'left',
//                 padding:'11px 16px', border:`1.5px solid ${borderColor}`,
//                 borderRadius:'var(--radius)', background:bg, color, cursor: picked !== null ? 'default' : 'pointer',
//                 display:'flex', alignItems:'center', gap:10, transition:'all .12s'
//               }}
//             >
//               <span style={{
//                 fontSize:11, fontWeight:800, width:22, height:22, borderRadius:'50%',
//                 display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
//                 background: picked !== null && i === q.ans ? 'var(--teal)' : picked !== null && i === picked ? 'var(--coral)' : 'var(--bg2)',
//                 color: picked !== null && (i === q.ans || i === picked) ? '#fff' : 'var(--text2)',
//               }}>{LETTERS[i]}</span>
//               {opt}
//             </button>
//           )
//         })}
//       </div>

//       {/* Explanation */}
//       {picked !== null && (
//         <div style={{
//           borderRadius:'var(--radius-lg)', padding:'14px 16px', fontSize:13, lineHeight:1.7,
//           background: picked === q.ans ? 'var(--teal-lt)' : 'var(--coral-lt)',
//           border: `1px solid ${picked === q.ans ? 'var(--teal-md)' : 'var(--coral-md)'}`,
//           color: picked === q.ans ? '#085041' : '#4A1B0C',
//         }}>
//           <div style={{ fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>
//             {picked === q.ans ? '✓ Chính xác!' : '✗ Chưa đúng – lý do:'}
//           </div>
//           {q.ex}
//         </div>
//       )}

//       {picked !== null && (
//         <div style={{ display:'flex', justifyContent:'flex-end' }}>
//           <Btn onClick={handleNext}>
//             {current + 1 >= questions.length ? 'Xem kết quả 🏁' : 'Tiếp theo →'}
//           </Btn>
//         </div>
//       )}
//     </div>
//   )
// }



import React, { useState, useEffect } from 'react'
import { AgentBanner, TypingDots, Btn } from './UI'
import { agentAPI } from '../data/api'
import { QUESTIONS } from '../data/questions'

const LETTERS = ['A', 'B', 'C', 'D']

// 🔥 NHẬN prop customQuestions TỪ APP.JS TRUYỀN XUỐNG
export default function QuizTab({ selectedMode, recordAnswer, onFinish, customQuestions }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [picked, setPicked] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [session, setSession] = useState({ correct: 0, total: 0 })
  
  const [agentMsg, setAgentMsg] = useState(null)
  const [agentLoading, setAgentLoading] = useState(false)
  const [estimated, setEstimated] = useState(null)

  useEffect(() => {
    // 🔥 NẾU LÀ LUYỆN TẬP (CÓ DATA TỪ AI)
    if (customQuestions && customQuestions.length > 0) {
      const mappedQuestions = customQuestions.map((item, index) => {
        const ansLetter = item.answer ? item.answer.trim().toUpperCase() : 'A'
        const ansIndex = LETTERS.indexOf(ansLetter)
        const cleanOpts = item.options.map(opt => opt.replace(/^[A-D][.\:]\s*/, ''))

        return {
          mode: selectedMode,
          part: `AI PART`,
          q: "Hoàn thành câu / Trả lời câu hỏi sau:", 
          s: item.question, 
          opts: cleanOpts,
          ans: ansIndex !== -1 ? ansIndex : 0,
          ex: item.explanation
        }
      })
      setQuestions(mappedQuestions)
    } 
    // 🔥 NẾU LÀ LẦN ĐẦU ĐÁNH GIÁ (DATA AI LÀ NULL)
    else {
      const pool = QUESTIONS.filter(q => q.mode === selectedMode)
      const shuffled = [...pool].sort(() => Math.random() - .5).slice(0, 10) 
      setQuestions(shuffled)
    }

    setCurrent(0)
    setPicked(null)
    setShowResult(false)
    setSession({ correct: 0, total: 0 })
  }, [selectedMode, customQuestions])

  const q = questions[current]

  const handlePick = (idx) => {
    if (picked !== null) return
    const ok = idx === q.ans
    setPicked(idx)
    recordAnswer(q.mode, ok)
    const newSession = { correct: session.correct + (ok ? 1 : 0), total: session.total + 1 }
    setSession(newSession)
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setShowResult(true)
      const acc = Math.round((session.correct + (picked === q?.ans ? 1 : 0)) / questions.length * 100)
      setEstimated(300 + Math.round(acc * 5.95))
      setAgentLoading(true)
      agentAPI.sessionResult(selectedMode, questions.length, session.correct + (picked === q?.ans ? 1 : 0))
        .then(data => { setAgentMsg(data.message); setEstimated(data.estimated_score) })
        .catch(() => setAgentMsg(`Bạn đạt ${acc}% – ${acc >= 70 ? 'tốt lắm!' : 'cố gắng luyện thêm nhé!'}`))
        .finally(() => setAgentLoading(false))
    } else {
      setCurrent(c => c + 1)
      setPicked(null)
    }
  }

  if (!q && !showResult) return <div style={{ padding:20, color:'var(--text2)' }}>Đang tải câu hỏi...</div>

  if (showResult) {
    const acc = Math.round(session.correct / questions.length * 100)
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:16, padding:20 }}>
        <div style={{ textAlign:'center', padding:'10px 0' }}>
          <div style={{ fontSize:56, fontWeight:900, fontFamily:'var(--mono)', color:'var(--purple)' }}>{estimated || '—'}</div>
          <div style={{ fontSize:14, color:'var(--text2)', marginTop:4 }}>điểm TOEIC ước tính • {questions.length} câu • {acc}% đúng</div>
        </div>
        <AgentBanner title="Agent phân tích kết quả">
          {agentLoading ? <TypingDots /> : agentMsg}
        </AgentBanner>
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          <Btn secondary onClick={() => onFinish('vocab')}>🎵 Học từ vựng thơ</Btn>
          <Btn onClick={() => onFinish('home')}>Luyện tiếp ↩</Btn>
        </div>
      </div>
    )
  }

  const pct = Math.round(current / questions.length * 100)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, padding:20 }}>
      <div style={{ height:5, background:'var(--bg3)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,var(--purple),var(--teal))', borderRadius:99, transition:'width .4s ease' }} />
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:99, background:'var(--purple-lt)', color:'var(--purple)', textTransform:'uppercase', letterSpacing:.5 }}>
          {q.part}
        </span>
        <span style={{ fontSize:12, color:'var(--text2)', fontWeight:600, marginLeft:'auto' }}>
          {current + 1} / {questions.length}
        </span>
      </div>

      <div style={{ background:'var(--bg2)', borderRadius:'var(--radius-lg)', padding:16, fontSize:15, fontWeight:600, lineHeight:1.65 }}>
        {q.q}
        {q.s && (
          <div style={{ fontFamily:'var(--mono)', fontSize:13, background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:10, padding:'12px 14px', marginTop:10, lineHeight:1.9, color:'var(--text2)' }}
            dangerouslySetInnerHTML={{ __html: q.s.replace('_____', '<span style="display:inline-block;border-bottom:2px solid var(--purple);min-width:64px;text-align:center;color:var(--purple);font-weight:700">_____</span>') }}
          />
        )}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {q.opts.map((opt, i) => {
          let bg = 'var(--bg)', borderColor = 'var(--border)', color = 'var(--text)'
          if (picked !== null) {
            if (i === q.ans) { bg = 'var(--teal-lt)'; borderColor = 'var(--teal)'; color = '#085041' }
            else if (i === picked && picked !== q.ans) { bg = 'var(--coral-lt)'; borderColor = 'var(--coral)'; color = '#4A1B0C' }
          }
          return (
            <button
              key={i}
              onClick={() => handlePick(i)}
              disabled={picked !== null}
              style={{
                fontFamily:'var(--font)', fontSize:14, fontWeight:600, textAlign:'left',
                padding:'11px 16px', border:`1.5px solid ${borderColor}`,
                borderRadius:'var(--radius)', background:bg, color, cursor: picked !== null ? 'default' : 'pointer',
                display:'flex', alignItems:'center', gap:10, transition:'all .12s'
              }}
            >
              <span style={{
                fontSize:11, fontWeight:800, width:22, height:22, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                background: picked !== null && i === q.ans ? 'var(--teal)' : picked !== null && i === picked ? 'var(--coral)' : 'var(--bg2)',
                color: picked !== null && (i === q.ans || i === picked) ? '#fff' : 'var(--text2)',
              }}>{LETTERS[i]}</span>
              {opt}
            </button>
          )
        })}
      </div>

      {picked !== null && (
        <div style={{
          borderRadius:'var(--radius-lg)', padding:'14px 16px', fontSize:13, lineHeight:1.7,
          background: picked === q.ans ? 'var(--teal-lt)' : 'var(--coral-lt)',
          border: `1px solid ${picked === q.ans ? 'var(--teal-md)' : 'var(--coral-md)'}`,
          color: picked === q.ans ? '#085041' : '#4A1B0C',
        }}>
          <div style={{ fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>
            {picked === q.ans ? '✓ Chính xác!' : '✗ Chưa đúng – lý do:'}
          </div>
          {q.ex}
        </div>
      )}

      {picked !== null && (
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <Btn onClick={handleNext}>
            {current + 1 >= questions.length ? 'Xem kết quả 🏁' : 'Tiếp theo →'}
          </Btn>
        </div>
      )}
    </div>
  )
}