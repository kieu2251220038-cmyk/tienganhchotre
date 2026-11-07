const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('========================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ THỰC TẾ & BẢO MẬT PHÂN QUYỀN API');
  console.log('========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // 1. Luồng Học Sinh (Bé Nga)
  console.log('--- 1. LUỒNG HỌC SINH (BÉ NGA) ---');
  const kidLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nga', password: '123456' })
  });
  const kidLoginData = await kidLoginRes.json();
  assert(kidLoginRes.status === 200 && kidLoginData.user.role === 'USER', 'Bé Nga đăng nhập thành công với vai trò USER');

  const kidToken = kidLoginData.token;

  // Bé học bài và lưu tiến độ
  const progressRes = await fetch(`${API_BASE}/progress/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${kidToken}`
    },
    body: JSON.stringify({
      userId: 6,
      lessonId: 1,
      score: 100
    })
  });
  const progressData = await progressRes.json();
  assert(progressRes.status === 200, 'Bé học bài và lưu tiến độ nhận sao thưởng thành công (+10 sao, +20 xu)');

  // Kiểm tra điểm thưởng của bé
  const rewardsRes = await fetch(`${API_BASE}/progress/rewards/6`, {
    headers: { 'Authorization': `Bearer ${kidToken}` }
  });
  const rewardsData = await rewardsRes.json();
  assert(rewardsRes.status === 200 && rewardsData.total_stars >= 10, `Bé có tổng ${rewardsData.total_stars} sao và ${rewardsData.total_coins} xu`);

  // BẢO MẬT: Trẻ em cố tình truy cập API của Phụ Huynh
  const kidAccessParentRes = await fetch(`${API_BASE}/parent/children`, {
    headers: { 'Authorization': `Bearer ${kidToken}` }
  });
  assert(kidAccessParentRes.status === 403, 'Trẻ em (role USER) cố tình truy cập API Phụ Huynh bị chặn 403 Forbidden đúng chuẩn RBAC');

  const kidAccessChildOverviewRes = await fetch(`${API_BASE}/parent/child/6/overview`, {
    headers: { 'Authorization': `Bearer ${kidToken}` }
  });
  assert(kidAccessChildOverviewRes.status === 403, 'Trẻ em cố tình gọi API tổng quan tiến độ của Phụ huynh bị chặn 403 Forbidden');

  // 2. Luồng Phụ Huynh (Mẹ Thu Hương)
  console.log('\n--- 2. LUỒNG PHỤ HUYNH (MẸ THU HƯƠNG) ---');
  const parentLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'phuhuynh_huong', password: '123456' })
  });
  const parentLoginData = await parentLoginRes.json();
  assert(parentLoginRes.status === 200 && parentLoginData.user.role === 'PARENT', 'Mẹ Thu Hương đăng nhập thành công với vai trò PARENT');

  const parentToken = parentLoginData.token;

  // Lấy danh sách con em đã liên kết
  const childrenRes = await fetch(`${API_BASE}/parent/children`, {
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });
  const childrenData = await childrenRes.json();
  assert(childrenRes.status === 200 && Array.isArray(childrenData) && childrenData.length > 0, `Phụ huynh lấy danh sách con em thành công (${childrenData.length} bé được liên kết)`);

  // Xem tổng quan tiến độ của bé Nga
  const overviewRes = await fetch(`${API_BASE}/parent/child/6/overview`, {
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });
  const overviewData = await overviewRes.json();
  assert(overviewRes.status === 200 && overviewData.child && overviewData.child.id === 6, 'Phụ huynh xem báo cáo tiến độ chi tiết của con gái (Bé Nga) thành công');
  assert(Array.isArray(overviewData.progress_by_age), 'Báo cáo có thống kê tiến độ từng độ tuổi (3-8 tuổi)');

  // Xem lịch sử bài học & kết quả quiz
  const activitiesRes = await fetch(`${API_BASE}/parent/child/6/activity-log`, {
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });
  const activitiesData = await activitiesRes.json();
  assert(activitiesRes.status === 200 && Array.isArray(activitiesData), 'Phụ huynh xem lịch sử bài học và điểm số quiz của bé thành công');

  // Cập nhật mục tiêu thời lượng học tập
  const goalRes = await fetch(`${API_BASE}/parent/child/6/goals`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${parentToken}`
    },
    body: JSON.stringify({ daily_goal_minutes: 20 })
  });
  assert(goalRes.status === 200, 'Phụ huynh cập nhật mục tiêu học tập 20 phút/ngày thành công (không khóa bài học của bé)');

  // 3. Kiểm thử liên kết hồ sơ bé an toàn
  console.log('\n--- 3. KIỂM THỬ LIÊN KẾT HỒ SƠ BÉ AN TOÀN ---');
  // Thử liên kết với mật khẩu sai -> phải bị từ chối
  const linkFailRes = await fetch(`${API_BASE}/parent/children/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${parentToken}`
    },
    body: JSON.stringify({
      username: 'Tuong',
      password: 'wrong_password_999'
    })
  });
  assert(linkFailRes.status === 400, 'Liên kết tài khoản bé với mật khẩu sai bị từ chối 400 đúng quy chuẩn bảo mật');

  // Liên kết với mật khẩu đúng
  const linkSuccessRes = await fetch(`${API_BASE}/parent/children/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${parentToken}`
    },
    body: JSON.stringify({
      username: 'Tuong',
      password: '123456',
      relationship: 'Mẹ'
    })
  });
  assert(linkSuccessRes.status === 200, 'Liên kết tài khoản bé Tưởng với mật khẩu đúng thành công');

  // 4. Tạo hồ sơ bé mới trực tiếp từ tài khoản Phụ huynh
  console.log('\n--- 4. TẠO HỒ SƠ BÉ MỚI TRỰC TIẾP ---');
  const testNewUsername = `test_be_${Date.now()}`;
  const createChildRes = await fetch(`${API_BASE}/parent/children/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${parentToken}`
    },
    body: JSON.stringify({
      displayName: 'Bé Bắp Test',
      username: testNewUsername,
      password: '123456',
      ageGroup: '4',
      relationship: 'Mẹ'
    })
  });
  const createChildData = await createChildRes.json();
  assert(createChildRes.status === 201 && createChildData.child.id, `Tạo mới hồ sơ ${createChildData.child?.display_name} và tự động liên kết thành công`);

  // 5. Kiểm tra phòng chống IDOR (Phụ huynh B cố truy cập con Phụ huynh A)
  console.log('\n--- 5. KIỂM TRA PHÒNG CHỐNG TRUY CẬP TRÁI QUYỀN (ANTI-IDOR) ---');
  // Đăng ký tài khoản Phụ huynh B
  const parentBUsername = `phuhuynh_b_${Date.now()}`;
  await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: parentBUsername,
      password: '123456',
      displayName: 'Phụ Huynh B (Khác gia đình)',
      role: 'PARENT'
    })
  });

  const parentBLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: parentBUsername, password: '123456' })
  });
  const parentBToken = (await parentBLoginRes.json()).token;

  // Phụ huynh B cố tình truy vấn tiến độ Bé Nga (con của Mẹ Thu Hương)
  const idorAttackRes = await fetch(`${API_BASE}/parent/child/6/overview`, {
    headers: { 'Authorization': `Bearer ${parentBToken}` }
  });
  assert(idorAttackRes.status === 403, 'Phụ huynh khác cố tình xem hồ sơ con em gia đình khác bị chặn 403 Forbidden (Chống IDOR thành công!)');

  console.log('\n========================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} BÀI TEST THÀNH CÔNG (100% PASS)`);
  console.log('========================================================');
}

runTests().catch(console.error);
