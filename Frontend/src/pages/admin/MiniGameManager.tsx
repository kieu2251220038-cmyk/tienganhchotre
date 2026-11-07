import { useEffect, useState } from 'react';
import { adminService, getAdminErrorMessage, type AdminTopic } from '../../services/adminService';
import {
  adminMiniGameService,
  type MiniGame,
  type MiniGamePayload,
  type MiniGameType
} from '../../services/miniGameService';

type GameForm = MiniGamePayload;

const GAME_TYPES: Array<{ value: MiniGameType; icon: string; label: string }> = [
  { value: 'MATCHING_PAIRS', icon: '🧩', label: 'Nối từ và tranh' },
  { value: 'MEMORY_CARDS', icon: '🃏', label: 'Lật thẻ tìm cặp' },
  { value: 'LISTEN_AND_PICK', icon: '🎧', label: 'Nghe và chọn tranh' },
  { value: 'COUNT_OBJECTS', icon: '🔢', label: 'Đếm số đồ vật trong ảnh' },
  { value: 'ORDER_SENTENCE', icon: '🧩', label: 'Sắp xếp câu ngắn' }
];

const emptyForm = (topicId = 0): GameForm => ({
  topic_id: topicId,
  name: '',
  game_type: 'MATCHING_PAIRS',
  difficulty: 1,
  points: 100,
  is_active: true,
  sort_order: 1
});

const isActive = (game: MiniGame) => game.is_active === true || Number(game.is_active) === 1;

const getStageLabel = (item: { age_group?: string; topic_sort_order?: number }) => {
  if (String(item.age_group) === '3') {
    const ranges = ['A-J', 'K-T', 'U-Z'];
    return `Chặng ${item.topic_sort_order || 1}: ${ranges[(item.topic_sort_order || 1) - 1] || 'chữ cái'}`;
  }
  if (String(item.age_group) === '4') {
    const stages = ['Numbers - Số đếm', 'Shapes - Hình dạng'];
    return `Chặng ${item.topic_sort_order || 1}: ${stages[(item.topic_sort_order || 1) - 1] || 'số và hình'}`;
  }
  if (String(item.age_group) === '5') {
    const stages = ['My Family - Gia đình', 'My Body - Cơ thể', 'Feelings - Cảm xúc'];
    return `Chặng ${item.topic_sort_order || 1}: ${stages[(item.topic_sort_order || 1) - 1] || 'bản thân và cảm xúc'}`;
  }
  if (String(item.age_group) === '6') {
    const stages = ['Greetings - Chào hỏi', 'About Me - Giới thiệu', 'School Things - Đồ dùng', 'Simple Questions - Hỏi đáp'];
    return `Chặng ${item.topic_sort_order || 1}: ${stages[(item.topic_sort_order || 1) - 1] || 'giao tiếp cơ bản'}`;
  }
  if (String(item.age_group) === '7') {
    const stages = ['Daily Routine - Hoạt động hằng ngày', 'Weather - Thời tiết', 'Food & Drinks - Đồ ăn'];
    return `Chặng ${item.topic_sort_order || 1}: ${stages[(item.topic_sort_order || 1) - 1] || 'đọc và giao tiếp'}`;
  }
  if (String(item.age_group) === '8') {
    const stages = ['Jobs - Nghề nghiệp', 'Nature - Thiên nhiên'];
    return `Chặng ${item.topic_sort_order || 1}: ${stages[(item.topic_sort_order || 1) - 1] || 'đọc hiểu và mô tả'}`;
  }
  return `Bậc ${item.age_group || '?'} tuổi`;
};

export default function MiniGameManager() {
  const [games, setGames] = useState<MiniGame[]>([]);
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState<MiniGame | null>(null);
  const [form, setForm] = useState<GameForm>(emptyForm());

  const loadData = async () => {
    try {
      const [gameRows, topicRows] = await Promise.all([
        adminMiniGameService.getAll(),
        adminService.getTopics()
      ]);
      setGames(gameRows);
      setTopics(topicRows);
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể tải dữ liệu mini game.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const openCreate = () => {
    setEditingGame(null);
    const topicId = topics[0]?.id || 0;
    const nextSortOrder = Math.max(0, ...games.filter((game) => game.topic_id === topicId).map((game) => game.sort_order)) + 1;
    setForm({ ...emptyForm(topicId), sort_order: nextSortOrder });
    setShowForm(true);
  };

  const openEdit = (game: MiniGame) => {
    setEditingGame(game);
    setForm({
      topic_id: game.topic_id,
      name: game.name,
      game_type: game.game_type,
      difficulty: game.difficulty,
      points: game.points,
      is_active: isActive(game),
      sort_order: game.sort_order
    });
    setShowForm(true);
  };

  const saveGame = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingGame) {
        await adminMiniGameService.update(editingGame.id, form);
        setMessage('✅ Đã lưu cấu hình mini game vào CSDL.');
      } else {
        await adminMiniGameService.create(form);
        setMessage('✅ Đã tạo mini game và thêm vào lộ trình học.');
      }
      setShowForm(false);
      await loadData();
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể lưu mini game.'));
    }
  };

  const toggleGame = async (game: MiniGame) => {
    const nextActive = !isActive(game);
    try {
      await adminMiniGameService.updateStatus(game.id, nextActive);
      setGames((previous) => previous.map((item) => item.id === game.id ? { ...item, is_active: nextActive } : item));
      setMessage(nextActive
        ? `✅ Đã bật “${game.name}”. Bé có thể chơi trong lộ trình.`
        : `🛑 Đã tắt “${game.name}”. Bé sẽ không còn truy cập được.`);
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể đổi trạng thái mini game.'));
    }
  };

  const deleteGame = async (game: MiniGame) => {
    if (!window.confirm(`Xóa mini game “${game.name}”? Bài học Game trong lộ trình sẽ hiển thị là chưa được mở.`)) return;
    try {
      await adminMiniGameService.remove(game.id);
      setGames((previous) => previous.filter((item) => item.id !== game.id));
      setMessage('✅ Đã xóa mini game khỏi CSDL.');
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể xóa mini game.'));
    }
  };

  const activeCount = games.filter(isActive).length;
  const selectableTopics = topics.filter((topic) => topic.status === 'PUBLISHED' || String(topic.age_group) !== '3');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#0F172A', margin: 0, fontWeight: 800 }}>🎮 Quản Lý Mini Game (A06)</h1>
          <p style={{ color: '#64748B', fontSize: '15px', margin: '4px 0 0' }}>
            Cấu hình lưu trong CSDL và tự hiển thị theo Chủ đề/Bậc tuổi của bé.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ background: '#DCFCE7', color: '#166534', borderRadius: '999px', padding: '8px 12px', fontWeight: 800, fontSize: '13px' }}>
            {activeCount}/{games.length} game đang bật
          </span>
          <button onClick={openCreate} style={{ border: 'none', borderRadius: '12px', padding: '12px 18px', background: '#0284C7', color: '#FFF', fontWeight: 800, cursor: 'pointer', boxShadow: '0 3px 0 #0369A1' }}>
            ＋ Tạo Mini Game
          </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '14px 18px', borderRadius: '12px', background: message.startsWith('✅') ? '#F0FDF4' : message.startsWith('🛑') ? '#FEF2F2' : '#FEF9C3', color: message.startsWith('✅') ? '#166534' : message.startsWith('🛑') ? '#991B1B' : '#92400E', fontWeight: 700 }}>
          {message}
        </div>
      )}

      <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '16px', padding: '16px 20px', color: '#1E40AF', fontSize: '14px', lineHeight: 1.6 }}>
        <strong>➕ Cách thêm trò chơi vào chặng:</strong> bấm “Tạo Mini Game”, chọn đúng Chặng 1 A-J, Chặng 2 K-T hoặc Chặng 3 U-Z, chọn kiểu chơi rồi lưu. Hệ thống sẽ tự tạo một bài GAME ở cuối chặng và bé sẽ thấy nút chơi trong lộ trình.
      </div>

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', background: '#FFF', borderRadius: '16px', color: '#64748B', fontWeight: 700 }}>Đang tải mini game từ CSDL...</div>
      ) : games.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', background: '#FFF', borderRadius: '16px', color: '#64748B', fontWeight: 700 }}>Chưa có mini game nào. Hãy tạo game đầu tiên.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
          {games.map((game) => {
            const type = GAME_TYPES.find((item) => item.value === game.game_type) || GAME_TYPES[0];
            const enabled = isActive(game);
            return (
              <article key={game.id} style={{ background: '#FFF', borderRadius: '20px', padding: '22px', border: `2px solid ${enabled ? '#BAE6FD' : '#E2E8F0'}`, boxShadow: enabled ? '0 4px 0 #BAE6FD' : '0 2px 0 #E2E8F0', opacity: enabled ? 1 : 0.78 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '38px' }}>{type.icon}</span>
                  <span style={{ borderRadius: '999px', padding: '6px 10px', fontSize: '12px', fontWeight: 800, background: enabled ? '#DCFCE7' : '#F1F5F9', color: enabled ? '#166534' : '#64748B' }}>
                    {enabled ? '● ĐANG BẬT' : '○ ĐÃ TẮT'}
                  </span>
                </div>
                <h2 style={{ fontSize: '18px', color: '#0F172A', margin: '16px 0 8px' }}>{game.name}</h2>
                <p style={{ margin: '0 0 5px', color: '#475569', fontSize: '14px' }}>{getStageLabel(game)} · {game.topic_name}</p>
                <p style={{ margin: '0 0 5px', color: '#475569', fontSize: '14px' }}>Loại: <strong>{type.label}</strong></p>
                <p style={{ margin: '0 0 18px', color: '#B45309', fontSize: '14px', fontWeight: 800 }}>⭐ {game.points} điểm · Cấp độ {game.difficulty}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                  <button onClick={() => openEdit(game)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFF', color: '#0369A1', fontWeight: 800, cursor: 'pointer' }}>⚙️ Cấu hình</button>
                  <button onClick={() => toggleGame(game)} style={{ padding: '10px', borderRadius: '10px', border: 'none', background: enabled ? '#FEE2E2' : '#DCFCE7', color: enabled ? '#B91C1C' : '#166534', fontWeight: 800, cursor: 'pointer' }}>{enabled ? 'Tắt game' : 'Bật game'}</button>
                  <button onClick={() => deleteGame(game)} style={{ gridColumn: '1 / -1', padding: '9px', borderRadius: '10px', border: '1px solid #FCA5A5', background: '#FFF', color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}>🗑️ Xóa game</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form onSubmit={saveGame} style={{ background: '#FFF', width: '560px', maxWidth: '100%', borderRadius: '22px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}>
            <h2 style={{ margin: '0 0 6px', color: '#0F172A' }}>{editingGame ? '⚙️ Cấu hình Mini Game' : '🎮 Tạo Mini Game'}</h2>
            <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: '14px' }}>Chọn đúng chặng; hệ thống tự tạo bài GAME liên kết vào cuối chặng đó.</p>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Tên mini game</label>
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '11px', borderRadius: '10px', border: '1px solid #CBD5E1', marginBottom: '14px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <label style={{ fontWeight: 700 }}>Chủ đề
                <select required value={form.topic_id} onChange={(event) => {
                  const topicId = Number(event.target.value);
                  const nextSortOrder = Math.max(0, ...games.filter((game) => game.topic_id === topicId).map((game) => game.sort_order)) + 1;
                  setForm({ ...form, topic_id: topicId, sort_order: editingGame ? form.sort_order : nextSortOrder });
                }} style={{ display: 'block', marginTop: '6px', width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                  <option value={0} disabled>Chọn chủ đề</option>
                  {selectableTopics.map((topic) => <option key={topic.id} value={topic.id}>{getStageLabel(topic)} · {topic.name}</option>)}
                </select>
              </label>
              <label style={{ fontWeight: 700 }}>Loại game
                <select value={form.game_type} onChange={(event) => setForm({ ...form, game_type: event.target.value as MiniGameType })} style={{ display: 'block', marginTop: '6px', width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                  {GAME_TYPES.map((type) => <option key={type.value} value={type.value}>{type.icon} {type.label}</option>)}
                </select>
              </label>
              <label style={{ fontWeight: 700 }}>Độ khó (1–5)
                <input type="number" min={1} max={5} value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: Number(event.target.value) })} style={{ display: 'block', marginTop: '6px', width: '100%', boxSizing: 'border-box', padding: '11px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </label>
              <label style={{ fontWeight: 700 }}>Điểm thưởng
                <input type="number" min={1} value={form.points} onChange={(event) => setForm({ ...form, points: Number(event.target.value) })} style={{ display: 'block', marginTop: '6px', width: '100%', boxSizing: 'border-box', padding: '11px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </label>
              <label style={{ fontWeight: 700 }}>Thứ tự game trong chặng
                <input type="number" min={1} value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} style={{ display: 'block', marginTop: '6px', width: '100%', boxSizing: 'border-box', padding: '11px', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              </label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontWeight: 700 }}>
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Hiển thị cho học sinh ngay
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '11px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ padding: '11px 20px', borderRadius: '10px', border: 'none', background: '#0284C7', color: '#FFF', fontWeight: 800, cursor: 'pointer' }}>{editingGame ? 'Lưu thay đổi' : 'Tạo mini game'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
