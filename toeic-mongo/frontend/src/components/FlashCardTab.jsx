import React, { useState, useEffect } from 'react';
import { AgentBanner, Btn, TypingDots } from './UI';
import { agentAPI } from '../data/api';

export default function OCRFlashcardTab() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [deckData, setDeckData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [savedDecks, setSavedDecks] = useState([]); 
  const [studyDeck, setStudyDeck] = useState(null); 
 

  // Tải danh sách flashcard từ Database khi mở tab
  useEffect(() => {
    const fetchMyDecks = async () => {
      try {
        console.log("⏳ Đang gọi API lấy kho Flashcard...");
        // const myUserId = "52bbbc97-aa08-4fe4-a54d-18ababdff731";
        const currentUserId = localStorage.getItem('toeic_user') ? JSON.parse(localStorage.getItem('toeic_user')).id : null;
        // const data = await agentAPI.getSavedFlashcards(); 
        if (!currentUserId) return;

      const data = await agentAPI.getSavedFlashcards(currentUserId);
        
        console.log("📥 Dữ liệu trả về từ Database:", data);
        
        if (data) {
          let fetchedDecks = [];
          if (Array.isArray(data)) fetchedDecks = data;
          else if (Array.isArray(data.data)) fetchedDecks = data.data;
          else if (Array.isArray(data.flashcards)) fetchedDecks = data.flashcards;
            
          setSavedDecks(fetchedDecks); 
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải kho Flashcard:", err);
      }
    };

    fetchMyDecks();
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDeckData(null);
      setError(null);
    }
  };

  const generateFlashcards = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    try {
      const data = await agentAPI.generateFlashcards(imageFile);
      setDeckData(data.flashcards); 
    } catch (err) {
      console.error(err);
      setError("Không thể đọc được ảnh. Thử lại nhé!");
    } finally {
      setLoading(false);
    }
  };

  const saveToDB = async () => {
    setSaving(true);
    try {
      await agentAPI.saveFlashcards(deckData);
      alert("Đã lưu bộ từ vựng vào kho của bạn! 🎉");
      
      setSavedDecks(prev => {
        const currentList = Array.isArray(prev) ? prev : [];
        return [{ ...deckData, id: Date.now() }, ...currentList];
      });
      
      setDeckData(null);
      setImageFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      setError("Lỗi khi lưu Database.");
    } finally {
      setSaving(false);
    }
  };

  if (studyDeck) {
    return (
      <StudyMode 
        deck={studyDeck} 
        onBack={() => setStudyDeck(null)} 
      />
    );
  }

  const safeSavedDecks = Array.isArray(savedDecks) ? savedDecks : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 20 }}>
      <AgentBanner icon="📸" title="Quét ảnh tạo Flashcard">
        Chụp sách hoặc đoạn văn tiếng Anh, AI sẽ tự động trích xuất từ vựng TOEIC và tạo bộ thẻ cho bạn!
      </AgentBanner>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input 
           type="file" 
          id="upload-ocr-img" 
          accept="image/*" 
          onChange={handleImageSelect} 
          style={{ display: 'none' }} 
        />
        
        <label 
          htmlFor="upload-ocr-img"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: previewUrl ? '8px' : '30px 20px', minHeight: previewUrl ? 'auto' : '120px',
            border: '1.5px dashed var(--purple-md)', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg)', color: 'var(--text2)', cursor: 'pointer',
            textAlign: 'center', transition: 'all 0.2s ease', overflow: 'hidden'
          }}
        >
          {previewUrl ? (
             <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8 }} />
          ) : (
            <>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📥</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--purple)' }}>Nhấn để chọn hoặc chụp ảnh</div>
            </>
          )}
        </label>

        {previewUrl && !deckData && (
          <Btn onClick={generateFlashcards} disabled={loading}>
            {loading ? '⏳' : '✨'} {loading ? 'AI đang đọc ảnh...' : 'Trích xuất từ vựng'}
          </Btn>
        )}
      </div>

      {loading && (
        <div style={{ background: 'linear-gradient(135deg,#EEEDFE,#E1F5EE)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <TypingDots />
        </div>
      )}

      {error && <div style={{ color: 'var(--coral)', fontSize: 13, fontWeight: 500 }}>{error}</div>}

      {deckData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text2)', textTransform: 'uppercase' }}>
            Xem trước: {deckData.deck_name}
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
            {deckData.cards?.map((card, idx) => (
              <FlashcardItem key={idx} data={card} />
            ))}
          </div>

          <Btn onClick={saveToDB} disabled={saving} style={{ background: 'var(--purple)', color: '#fff' }}>
            {saving ? '⏳ Đang lưu...' : '💾 Lưu vào Kho của bạn'}
          </Btn>
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '8px 0' }} />

      {/* KHU VỰC 2: KHO FLASHCARD ĐÃ LƯU */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
          📚 KHO FLASHCARD CỦA BẠN
        </div>
        
        {safeSavedDecks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', background: 'var(--bg)', borderRadius: 12, color: 'var(--text2)', fontSize: 14 }}>
            Bạn chưa có bộ flashcard nào. Hãy quét ảnh để tạo nhé!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {safeSavedDecks.map((deck) => (
              <div 
                key={deck.id || deck._id || Math.random()} 
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#fff', border: '1px solid #E5E7EB',
                  borderRadius: 12, padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {deck.deck_name || "Bộ thẻ AI"}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {deck.cards?.length || 0} thẻ từ
                  </div>
                </div>
                <Btn 
                  onClick={() => setStudyDeck(deck)} 
                  style={{ padding: '8px 16px', minWidth: 'auto', fontSize: 14 }}
                >
                  ▶ Học ngay
                </Btn>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// COMPONENT: CHẾ ĐỘ HỌC BÀI LẬT THẺ (STUDY MODE)
// ----------------------------------------------------
function StudyMode({ deck, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  let cards = [];
  if (Array.isArray(deck?.cards)) {
    cards = deck.cards;
  } else if (typeof deck?.cards === 'string') {
    try { cards = JSON.parse(deck.cards); } catch (e) { console.error("Lỗi parse chuỗi:", e); }
  } else if (Array.isArray(deck?.flashcards)) {
    cards = deck.flashcards;
  }

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false); 
    setTimeout(() => {
      if (currentIndex < cards.length - 1) setCurrentIndex(prev => prev + 1);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    }, 150);
  };

  if (!currentCard || cards.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 40 }}>🪹</div>
        <div style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.5 }}>
          Bộ thẻ này chưa có từ vựng nào hoặc dữ liệu tải về bị lỗi.
        </div>
        <button 
          onClick={onBack} 
          style={{ padding: '10px 20px', background: 'var(--purple)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, marginTop: 12 }}
        >
          ← Quay lại Kho thẻ
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontWeight: 600 }}>
          ← Thoát học
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--purple)' }}>
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, textAlign: 'center', color: 'var(--text)' }}>
        {deck.deck_name || "Bộ thẻ AI"}
      </div>

      <div 
        style={{ 
          perspective: '1000px', 
          width: '100%', 
          height: '280px',
          cursor: 'pointer'
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          style={{
            width: '100%', height: '100%',
            transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)',
            transformStyle: 'preserve-3d', 
            position: 'relative',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* MẶT TRƯỚC */}
          <div style={cardFaceStyle(false)}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--purple)', marginBottom: 8 }}>
              {currentCard.word}
            </div>
            <div style={{ fontSize: 16, color: 'var(--purple-md)', fontFamily: 'var(--mono)' }}>
              {currentCard.ipa}
            </div>
            <div style={{ marginTop: 'auto', fontSize: 13, color: 'var(--text2)', opacity: 0.6 }}>
              Nhấn vào thẻ để xem nghĩa
            </div>
          </div>

          {/* MẶT SAU */}
          <div style={cardFaceStyle(true)}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#3C3489', background: 'rgba(255,255,255,.6)', padding: '6px 16px', borderRadius: 99, marginBottom: 12 }}>
              {currentCard.part_of_speech}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--purple)', marginBottom: 16 }}>
              {currentCard.meaning}
            </div>
            {currentCard.example && (
              <div style={{ fontSize: 14, color: 'var(--text2)', background: 'rgba(255,255,255,.7)', borderRadius: 10, padding: '12px', lineHeight: 1.6, width: '100%' }}>
                📝 {currentCard.example}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10 }}>
        <Btn onClick={handlePrev} disabled={currentIndex === 0} style={{ flex: 1, background: '#E5E7EB', color: 'var(--text)' }}>
          Trước
        </Btn>
        <Btn onClick={handleNext} disabled={currentIndex === cards.length - 1} style={{ flex: 1 }}>
          Tiếp theo
        </Btn>
      </div>
    </div>
  );
}

const cardFaceStyle = (isBack) => ({
  position: 'absolute',
  width: '100%',
  height: '100%',
  backfaceVisibility: 'hidden',
  background: isBack ? 'linear-gradient(135deg,#E1F5EE,#EEEDFE)' : 'linear-gradient(135deg,#EEEDFE,#E1F5EE)',
  borderRadius: '24px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  boxShadow: '0 8px 24px rgba(83,74,183,0.1)',
  transform: isBack ? 'rotateY(180deg)' : 'rotateY(0deg)'
});

function FlashcardItem({ data }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#EEEDFE,#E1F5EE)',
      borderRadius: 'var(--radius-lg)', padding: '16px 20px',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(83,74,183,.08)' }} />
      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--purple)', letterSpacing: -0.5 }}>{data.word}</div>
      <div style={{ fontSize: 13, color: 'var(--purple-md)', fontFamily: 'var(--mono)', margin: '2px 0 8px' }}>
        {data.ipa} <span style={{ opacity: 0.5 }}>•</span> {data.part_of_speech}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#3C3489', background: 'rgba(255,255,255,.6)', display: 'inline-block', padding: '4px 12px', borderRadius: 99, marginBottom: 12 }}>
        {data.meaning}
      </div>
      {data.example && (
        <div style={{ fontSize: 13, color: 'var(--text2)', background: 'rgba(255,255,255,.7)', borderRadius: 10, padding: '10px 12px', lineHeight: 1.6, fontFamily: 'var(--mono)' }}>
          📝 {data.example}
        </div>
      )}
    </div>
  );
}