// import React, { useState, useEffect } from 'react'
// import { useAuth }  from './hooks/useAuth'
// import { useStats } from './hooks/useStats'
// import { agentAPI } from './data/api'
// import LoginPage from './pages/LoginPage'
// import HomeTab   from './components/HomeTab'
// import QuizTab   from './components/QuizTab'
// import VocabTab  from './components/VocabTab'
// import ChatTab   from './components/ChatTab'
// import StatsTab  from './components/StatsTab'
// import FlashCardTab from './components/FlashCardTab'
// import { Spinner } from './components/UI'

// const TABS = [
//   { id:'home',  icon:'ti-home',      label:'Trang chủ' },
//   { id:'quiz',  icon:'ti-target',    label:'Luyện tập' },
//   {id:'flashcard', icon:'ti-book',      label:'Flashcards' },
//   { id:'vocab', icon:'ti-books',     label:'Từ vựng thơ' },
//   { id:'chat',  icon:'ti-message',   label:'Hỏi AI' },
//   { id:'stats', icon:'ti-chart-bar', label:'Thống kê' },
// ]

// export default function App() {
//   const { user, loading: authLoading, login, register, signOut } = useAuth()
//   const { stats, xp, loadFromServer, recordAnswer, reset, accuracy, weakest, totals } = useStats(!!user)

//   const [activeTab,   setActiveTab]   = useState('home')
//   const [selectedMode,setSelectedMode]= useState('reading')
//   const [skipLogin,   setSkipLogin]   = useState(false)

//   // Load stats từ MongoDB sau khi login
//   useEffect(() => {
//     if (!user) return
//     agentAPI.me()
//       .then(data => { if (data.stats) loadFromServer(data.stats, data.profile?.xp || 0) })
//       .catch(() => {})
//   }, [user])

//   if (authLoading) return (
//     <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg2)' }}>
//       <Spinner />
//     </div>
//   )

//   if (!user && !skipLogin) return (
//     <LoginPage
//       onLogin={login}
//       onRegister={register}
//       onSkip={() => setSkipLogin(true)}
//     />
//   )

//   const xpPct = Math.min((xp % 200) / 200 * 100, 100)

//   return (
//     <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', maxWidth:820, margin:'0 auto', background:'var(--bg)', boxShadow:'0 0 40px rgba(0,0,0,0.06)' }}>

//       {/* Header */}
//       <header style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 20px', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
//         <div style={{ fontSize:20, fontWeight:900, color:'var(--purple)', letterSpacing:-1 }}>
//           TOEIC<span style={{ color:'var(--teal)' }}>AI</span>
//         </div>
//         <div style={{ fontSize:11, fontWeight:800, color:'var(--teal)', background:'var(--teal-lt)', padding:'3px 10px', borderRadius:99, display:'flex', alignItems:'center', gap:4 }}>
//           <i className="ti ti-robot" /> Agent ON
//         </div>
//         <a href="https://smith.langchain.com" target="_blank" rel="noreferrer"
//           style={{ fontSize:11, fontWeight:800, color:'#2E7D32', background:'#E8F5E9', padding:'3px 10px', borderRadius:99, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
//           <i className="ti ti-activity" /> LangSmith
//         </a>

//         <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
//           <div style={{ display:'flex', alignItems:'center', gap:7 }}>
//             <span style={{ fontSize:12, fontWeight:800, color:'var(--purple)' }}>{xp} XP</span>
//             <div style={{ width:72, height:7, background:'var(--purple-lt)', borderRadius:99, overflow:'hidden' }}>
//               <div style={{ height:'100%', width:`${xpPct}%`, background:'linear-gradient(90deg,var(--purple),var(--teal))', borderRadius:99, transition:'width .5s' }} />
//             </div>
//           </div>
//           <div style={{ fontSize:12, fontWeight:800, color:'var(--amber)', background:'var(--amber-lt)', padding:'3px 10px', borderRadius:99 }}>
//             🔥 1 ngày
//           </div>
//           {user ? (
//             <button onClick={signOut} style={{ fontSize:12, fontWeight:700, padding:'4px 12px', border:'1px solid var(--border2)', borderRadius:99, background:'var(--bg)', color:'var(--text2)', cursor:'pointer' }}>
//               Đăng xuất
//             </button>
//           ) : (
//             <button onClick={() => setSkipLogin(false)} style={{ fontSize:12, fontWeight:700, padding:'4px 12px', border:'1px solid var(--purple)', borderRadius:99, background:'var(--purple-lt)', color:'var(--purple)', cursor:'pointer' }}>
//               Đăng nhập
//             </button>
//           )}
//         </div>
//       </header>

//       {/* Nav */}
//       <nav style={{ display:'flex', gap:2, padding:'0 20px', borderBottom:'1px solid var(--border)', overflowX:'auto' }}>
//         {TABS.map(t => (
//           <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
//             fontFamily:'var(--font)', fontSize:13, fontWeight:700, padding:'10px 14px',
//             border:'none', background:'none', cursor:'pointer', whiteSpace:'nowrap', transition:'all .15s',
//             color: activeTab===t.id ? 'var(--purple)' : 'var(--text2)',
//             borderBottom: `2px solid ${activeTab===t.id ? 'var(--purple)' : 'transparent'}`,
//           }}>
//             <i className={`ti ${t.icon}`} style={{ marginRight:4 }} />{t.label}
//           </button>
//         ))}
//       </nav>

//       {/* Content */}
//       <main style={{ flex:1 }}>
//         {activeTab==='home'  && <HomeTab stats={stats} accuracy={accuracy} weakest={weakest} selectedMode={selectedMode} onSelectMode={setSelectedMode} onStart={() => setActiveTab('quiz')} user={user} />}
//         {activeTab==='quiz'  && <QuizTab selectedMode={selectedMode} recordAnswer={recordAnswer} onFinish={dest => setActiveTab(dest)} />}
//         {activeTab==='vocab' && <VocabTab />}
//         {activeTab==='chat'  && <ChatTab />}
//         {activeTab==='flashcard' && <FlashCardTab />}
//         {activeTab==='stats' && <StatsTab stats={stats} accuracy={accuracy} weakest={weakest} totals={totals} xp={xp} onReset={reset} user={user} />}
//       </main>
//     </div>
//   )
// }


import React, { useState, useEffect } from 'react'
import { useAuth }  from './hooks/useAuth'
import { useStats } from './hooks/useStats'
import { agentAPI } from './data/api'
import LoginPage from './pages/LoginPage'
import HomeTab   from './components/HomeTab'
import QuizTab   from './components/QuizTab'
import VocabTab  from './components/VocabTab'
import ChatTab   from './components/ChatTab'
import StatsTab  from './components/StatsTab'
import FlashCardTab from './components/FlashCardTab'
import { Spinner } from './components/UI'

const TABS = [
  { id:'home',  icon:'ti-home',      label:'Trang chủ' },
  { id:'quiz',  icon:'ti-target',    label:'Luyện tập' },
  { id:'flashcard', icon:'ti-book',  label:'Flashcards' },
  { id:'vocab', icon:'ti-books',     label:'Từ vựng thơ' },
  { id:'chat',  icon:'ti-message',   label:'Hỏi AI' },
  { id:'stats', icon:'ti-chart-bar', label:'Thống kê' },
]

export default function App() {
  const { user, loading: authLoading, login, register, signOut } = useAuth()
  const { stats, xp, loadFromServer, recordAnswer, reset, accuracy, weakest, totals } = useStats(!!user)

  const [activeTab,   setActiveTab]   = useState('home')
  const [selectedMode,setSelectedMode]= useState('reading')
  const [skipLogin,   setSkipLogin]   = useState(false)

  // 🔥 STATE LƯU TRỮ CÂU HỎI TỪ AI
  const [aiQuestions, setAiQuestions] = useState(null)

  useEffect(() => {
    if (!user) return
    agentAPI.me()
      .then(data => { if (data.stats) loadFromServer(data.stats, data.profile?.xp || 0) })
      .catch(() => {})
  }, [user])

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg2)' }}>
      <Spinner />
    </div>
  )

  if (!user && !skipLogin) return (
    <LoginPage
      onLogin={login}
      onRegister={register}
      onSkip={() => setSkipLogin(true)}
    />
  )

  const xpPct = Math.min((xp % 200) / 200 * 100, 100)

  return (
    // <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', maxWidth:1200, margin:'0 auto', background:'var(--bg)', boxShadow:'0 0 40px rgba(0,0,0,0.06)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', background: 'var(--bg)' }}>

      <header style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 20px', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
        <div style={{ fontSize:20, fontWeight:900, color:'var(--purple)', letterSpacing:-1 }}>
          TOEIC<span style={{ color:'var(--teal)' }}>AI</span>
        </div>
        <div style={{ fontSize:11, fontWeight:800, color:'var(--teal)', background:'var(--teal-lt)', padding:'3px 10px', borderRadius:99, display:'flex', alignItems:'center', gap:4 }}>
          <i className="ti ti-robot" /> Agent ON
        </div>
        <a href="https://smith.langchain.com" target="_blank" rel="noreferrer"
          style={{ fontSize:11, fontWeight:800, color:'#2E7D32', background:'#E8F5E9', padding:'3px 10px', borderRadius:99, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
          <i className="ti ti-activity" /> LangSmith
        </a>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ fontSize:12, fontWeight:800, color:'var(--purple)' }}>{xp} XP</span>
            <div style={{ width:72, height:7, background:'var(--purple-lt)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${xpPct}%`, background:'linear-gradient(90deg,var(--purple),var(--teal))', borderRadius:99, transition:'width .5s' }} />
            </div>
          </div>
          <div style={{ fontSize:12, fontWeight:800, color:'var(--amber)', background:'var(--amber-lt)', padding:'3px 10px', borderRadius:99 }}>
            🔥 1 ngày
          </div>
          {user ? (
            <button onClick={signOut} style={{ fontSize:12, fontWeight:700, padding:'4px 12px', border:'1px solid var(--border2)', borderRadius:99, background:'var(--bg)', color:'var(--text2)', cursor:'pointer' }}>
              Đăng xuất
            </button>
          ) : (
            <button onClick={() => setSkipLogin(false)} style={{ fontSize:12, fontWeight:700, padding:'4px 12px', border:'1px solid var(--purple)', borderRadius:99, background:'var(--purple-lt)', color:'var(--purple)', cursor:'pointer' }}>
              Đăng nhập
            </button>
          )}
        </div>
      </header>

      <nav style={{ display:'flex', gap:2, padding:'0 20px', borderBottom:'1px solid var(--border)', overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            fontFamily:'var(--font)', fontSize:13, fontWeight:700, padding:'10px 14px',
            border:'none', background:'none', cursor:'pointer', whiteSpace:'nowrap', transition:'all .15s',
            color: activeTab===t.id ? 'var(--purple)' : 'var(--text2)',
            borderBottom: `2px solid ${activeTab===t.id ? 'var(--purple)' : 'transparent'}`,
          }}>
            <i className={`ti ${t.icon}`} style={{ marginRight:4 }} />{t.label}
          </button>
        ))}
      </nav>

      <main style={{ flex:1 }}>
        {activeTab==='home'  && (
          <HomeTab 
            stats={stats} 
            accuracy={accuracy} 
            weakest={weakest} 
            selectedMode={selectedMode} 
            onSelectMode={setSelectedMode} 
            user={user} 
            // 🔥 Hứng câu hỏi từ HomeTab
            onStart={(mode, questionsFromAI) => {
              setSelectedMode(mode);
              setAiQuestions(questionsFromAI);
              setActiveTab('quiz');
            }} 
          />
        )}
        
        {activeTab==='quiz'  && (
          <QuizTab 
            selectedMode={selectedMode} 
            recordAnswer={recordAnswer} 
            // 🔥 Xóa câu hỏi AI khi về Home để lần sau quét lại
            onFinish={dest => {
              if (dest === 'home') setAiQuestions(null);
              setActiveTab(dest);
            }} 
            // 🔥 Chuyền câu hỏi AI xuống QuizTab
            customQuestions={aiQuestions} 
          />
        )}

        {activeTab==='vocab' && <VocabTab />}
        {activeTab==='chat'  && <ChatTab />}
        {activeTab==='flashcard' && <FlashCardTab />}
        {activeTab==='stats' && <StatsTab stats={stats} accuracy={accuracy} weakest={weakest} totals={totals} xp={xp} onReset={reset} user={user} />}
      </main>
    </div>
  )
}