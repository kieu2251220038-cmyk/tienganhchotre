const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const courses = [
  { age: '3', title: 'Bậc 1: Bé 3 tuổi - Làm quen tiếng Anh', description: 'Làm quen âm thanh tiếng Anh qua chữ cái, hình ảnh, bài hát và trò chơi.' },
  { age: '4', title: 'Bậc 2: Bé 4 tuổi - Nhận biết và ghi nhớ', description: 'Ghi nhớ từ vựng, số đếm, màu sắc, hình dạng và hướng dẫn đơn giản.' },
  { age: '5', title: 'Bậc 3: Bé 5 tuổi - Phát triển từ vựng', description: 'Mở rộng vốn từ và bắt đầu nói câu ngắn về bản thân, gia đình và cuộc sống.' },
  { age: '6', title: 'Bậc 4: Bé 6 tuổi - Giao tiếp cơ bản', description: 'Hình thành kỹ năng giao tiếp cơ bản và làm quen đọc từ, câu đơn giản.' },
  { age: '7', title: 'Bậc 5: Bé 7 tuổi - Nghe, nói và đọc', description: 'Nghe hiểu câu ngắn, đọc từ và câu đơn giản, hỏi đáp về chủ đề quen thuộc.' },
  { age: '8', title: 'Bậc 6: Bé 8 tuổi - Ứng dụng tiếng Anh', description: 'Đọc hiểu đoạn ngắn, viết câu cơ bản và giao tiếp trong tình huống quen thuộc.' }
];

const curriculum = {
  '3': [
    ['Alphabet A-F', 'Làm quen chữ cái A đến F qua hình ảnh.', ['Apple', 'Ball', 'Cat', 'Dog', 'Fish']],
    ['Colors & Letters G-L', 'Nhận biết màu sắc và chữ cái G đến L.', ['Red', 'Blue', 'Yellow', 'Green']],
    ['Animals & Letters M-R', 'Gọi tên con vật quen thuộc và chữ cái M đến R.', ['Cat', 'Dog', 'Bird', 'Fish']],
    ['Fruits & Letters S-W', 'Nhận biết trái cây và chữ cái S đến W.', ['Apple', 'Banana', 'Orange', 'Mango']],
    ['Toys & Letters X-Z', 'Nhận biết đồ chơi và các chữ cái cuối bảng.', ['Ball', 'Car', 'Doll', 'Teddy bear']],
    ['Alphabet Review & Actions', 'Ôn chữ cái qua bài hát và vận động.', ['Hello', 'Clap', 'Jump', 'Wave']]
  ],
  '4': [
    ['Numbers', 'Bé đếm và nhận biết số từ 1 đến 10 qua hình ảnh.', ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']],
    ['Shapes', 'Bé nhận biết và phân loại các hình dạng cơ bản.', ['Circle', 'Square', 'Triangle', 'Star']]
  ],
  '5': [
    ['My Family', 'Bé gọi tên người thân và nói câu ngắn về gia đình.', ['Father', 'Mother', 'Sister', 'Brother']],
    ['My Body', 'Bé nhận biết bộ phận cơ thể và nói câu ngắn.', ['Head', 'Eyes', 'Nose', 'Mouth', 'Hands']],
    ['Feelings', 'Bé nhận biết và nói về cảm xúc quen thuộc.', ['Happy', 'Sad', 'Angry', 'Tired']]
  ],
  '6': [
    ['My School - Trường học', 'Bé gọi tên người, đồ vật và không gian quen thuộc trong lớp học.', ['School', 'Classroom', 'Teacher', 'Student', 'Book', 'Pencil', 'Notebook', 'Ruler', 'Eraser', 'Desk', 'Chair', 'Backpack']],
    ['About Me - Về bản thân', 'Bé giới thiệu bản thân, gia đình, sở thích và cảm xúc bằng câu ngắn.', ['Name', 'Age', 'Friend', 'Family', 'Hobby', 'Like', 'Happy', 'Tall', 'Short', 'Kind', 'Play', 'Read']],
    ['Daily Actions - Hoạt động mỗi ngày', 'Bé sắp xếp và nói được các hoạt động cơ bản trong một ngày.', ['Wake up', 'Brush teeth', 'Get dressed', 'Have breakfast', 'Go to school', 'Study', 'Play', 'Come home', 'Do homework', 'Have dinner', 'Take a bath', 'Go to bed']],
    ['Colors, Shapes & Places - Màu sắc, hình dạng', 'Bé mô tả đồ vật bằng màu sắc, hình dạng và vị trí đơn giản.', ['Red', 'Blue', 'Yellow', 'Green', 'Circle', 'Square', 'Triangle', 'Star', 'Big', 'Small', 'In', 'On']],
    ['Polite Conversations - Giao tiếp lịch sự', 'Bé thực hành chào hỏi, cảm ơn, xin lỗi và hỏi đáp ngắn.', ['Hello', 'Goodbye', 'Good morning', 'Please', 'Thank you', 'Sorry', 'Excuse me', 'Yes', 'No', 'What', 'Where', 'How']]
  ],
  '7': [
    ['Daily Routine & Time - Thói quen và thời gian', 'Bé đọc, nói và sắp xếp hoạt động theo buổi sáng, trưa, chiều, tối.', ['Get up', 'Wash face', 'Get dressed', 'Have breakfast', 'Go to school', 'Have lunch', 'Go home', 'Do homework', 'Read', 'Have dinner', 'Go to bed', 'Morning']],
    ['Weather & Seasons - Thời tiết và mùa', 'Bé mô tả thời tiết, nhiệt độ và bốn mùa bằng câu ngắn.', ['Sunny', 'Rainy', 'Cloudy', 'Windy', 'Hot', 'Cold', 'Spring', 'Summer', 'Autumn', 'Winter', 'Weather', 'Rainbow']],
    ['Food & Healthy Choices - Đồ ăn lành mạnh', 'Bé gọi tên món ăn, đồ uống và nói lựa chọn tốt cho sức khỏe.', ['Milk', 'Bread', 'Rice', 'Egg', 'Apple', 'Banana', 'Carrot', 'Chicken', 'Water', 'Breakfast', 'Lunch', 'Dinner']],
    ['My Neighborhood - Khu phố của em', 'Bé hỏi đường và nhận biết những địa điểm, phương tiện gần nhà.', ['Home', 'School', 'Park', 'Library', 'Hospital', 'Supermarket', 'Zoo', 'Street', 'Bus', 'Bike', 'Left', 'Right']],
    ['Hobbies & Sports - Sở thích và thể thao', 'Bé nói về sở thích, môn thể thao và hoạt động cuối tuần.', ['Reading', 'Drawing', 'Singing', 'Dancing', 'Swimming', 'Football', 'Basketball', 'Running', 'Skipping', 'Music', 'Game', 'Weekend']]
  ],
  '8': [
    ['Jobs & Future Dreams - Nghề nghiệp và ước mơ', 'Bé đọc hiểu và nói về nghề nghiệp, nơi làm việc và ước mơ tương lai.', ['Teacher', 'Doctor', 'Farmer', 'Pilot', 'Engineer', 'Chef', 'Police officer', 'Firefighter', 'Artist', 'Scientist', 'Job', 'Dream']],
    ['Nature & Science - Thiên nhiên và khoa học', 'Bé mô tả thiên nhiên, bầu trời và các sự vật khoa học quen thuộc.', ['Tree', 'River', 'Mountain', 'Forest', 'Flower', 'Ocean', 'Animal', 'Plant', 'Sun', 'Moon', 'Star', 'Earth']],
    ['Travel & Community - Du lịch và cộng đồng', 'Bé sử dụng từ vựng trong những tình huống đi lại và khám phá nơi mới.', ['Travel', 'Airport', 'Station', 'Ticket', 'Map', 'Train', 'Plane', 'Beach', 'Hotel', 'City', 'Country', 'Visit']],
    ['Stories & Reading - Đọc truyện', 'Bé đọc đoạn ngắn, nhận biết trình tự câu chuyện và trả lời câu hỏi.', ['Story', 'Character', 'Beginning', 'Middle', 'End', 'Read', 'Write', 'Sentence', 'Question', 'Answer', 'Picture', 'Book']],
    ['Our Healthy Planet - Trái đất xanh', 'Bé học cách nói về môi trường và những hành động bảo vệ Trái đất.', ['Clean', 'Recycle', 'Reuse', 'Save', 'Water', 'Energy', 'Earth', 'Trash', 'Plastic', 'Garden', 'Healthy', 'Protect']]
  ]
};

// Level 1 is intentionally kept narrow and recognition-based for three-year-olds.
// This override keeps age 3 focused on recognition and divides the alphabet into
// three large stages: A-J, K-T and U-Z. Each stage teaches its letters, lets the
// child practise speaking with AI, asks a simple recognition question, then opens
// the matching game.
curriculum['3'] = [
  ['Chặng 1 - Chữ A-J', 'Bé học và nhận diện 10 chữ cái từ A đến J, sau đó chơi ngay.', 'ABCDEFGHIJ'.split('')],
  ['Chặng 2 - Chữ K-T', 'Bé học và nhận diện 10 chữ cái từ K đến T, sau đó chơi ngay.', 'KLMNOPQRST'.split('')],
  ['Chặng 3 - Chữ U-Z', 'Bé học và nhận diện 6 chữ cái từ U đến Z, sau đó chơi ngay.', 'UVWXYZ'.split('')]
];
courses[0].description = 'Bé 3 tuổi học nhận diện 26 chữ cái theo 3 chặng A-J, K-T và U-Z; mỗi chặng học xong sẽ chơi ngay.';
courses[1].description = 'Bé 4 tuổi học số đếm 1-10, đếm hình ảnh và nhận biết các hình dạng cơ bản theo 2 chặng.';
courses[2].description = 'Bé 5 tuổi học về gia đình, cơ thể và cảm xúc; luyện từ vựng và nói câu tiếng Anh ngắn theo 3 chặng.';
courses[3].description = 'Bé 6 tuổi học 5 chủ đề giao tiếp gần gũi, khoảng 60 từ vựng và câu ngắn chuẩn bị vào lớp 1.';
courses[4].description = 'Bé 7 tuổi học 5 chủ đề đời sống, khoảng 60 từ vựng, đọc hiểu câu ngắn và hỏi đáp tự nhiên.';
courses[5].description = 'Bé 8 tuổi học 5 chủ đề khám phá, khoảng 60 từ vựng, đọc đoạn ngắn và diễn đạt ý tưởng.';

const lessonTypes = ['FLASHCARD', 'FLASHCARD', 'SPEAKING', 'GAME', 'QUIZ'];
const lessonTitles = ['Learn Vocabulary', 'Flashcards', 'Listening & Speaking', 'Mini-game', 'Quiz & Rewards'];
const lessonTitlesByAge = {
  '3': [
    'Học chữ cái qua hình ảnh',
    'Nói chữ cái với AI',
    'Câu hỏi: Đâu là chữ cái đúng?',
    'Trò chơi lật thẻ tìm cặp giống nhau'
  ],
  '4': [
    'Học qua hình ảnh',
    'Nói số và hình với AI',
    'Quiz: Đếm và nhận biết',
    'Trò chơi đếm hình ảnh'
  ],
  '5': [
    'Học từ vựng qua hình ảnh',
    'Nói câu ngắn với AI',
    'Quiz: Bé nhận biết đúng',
    'Trò chơi ghép từ và hình'
  ],
  '6': [
    'Học giao tiếp qua hình ảnh',
    'Nói câu và hỏi đáp với AI',
    'Quiz: Chọn câu đúng',
    'Trò chơi sắp xếp câu'
  ],
  '7': [
    'Đọc từ và câu ngắn qua hình ảnh',
    'Nói câu về cuộc sống hằng ngày với AI',
    'Quiz: Đọc hiểu và chọn đáp án',
    'Trò chơi sắp xếp câu'
  ],
  '8': [
    'Đọc từ và câu mô tả qua hình ảnh',
    'Nói câu mô tả với AI',
    'Quiz: Đọc hiểu và chọn đáp án',
    'Trò chơi sắp xếp câu'
  ]
};
const lessonTypesByAge = {
  '3': ['FLASHCARD', 'SPEAKING', 'QUIZ', 'GAME'],
  '4': ['FLASHCARD', 'SPEAKING', 'QUIZ', 'GAME'],
  '5': ['FLASHCARD', 'SPEAKING', 'QUIZ', 'GAME'],
  '6': ['FLASHCARD', 'SPEAKING', 'QUIZ', 'GAME'],
  '7': ['FLASHCARD', 'SPEAKING', 'QUIZ', 'GAME'],
  '8': ['FLASHCARD', 'SPEAKING', 'QUIZ', 'GAME']
};
const gameTypes = ['MATCHING_PAIRS', 'MEMORY_CARDS', 'LISTEN_AND_PICK'];
const wordMeanings = {
  Apple: 'Quả táo', Ball: 'Quả bóng', Cat: 'Con mèo', Dog: 'Con chó', Fish: 'Con cá',
  Red: 'Màu đỏ', Blue: 'Màu xanh dương', Yellow: 'Màu vàng', Green: 'Màu xanh lá', Bird: 'Con chim',
  Banana: 'Quả chuối', Orange: 'Quả cam', Mango: 'Quả xoài', Car: 'Xe ô tô', Doll: 'Búp bê', 'Teddy bear': 'Gấu bông',
  Hello: 'Xin chào', Clap: 'Vỗ tay', Jump: 'Nhảy', Wave: 'Vẫy tay', One: 'Một', Two: 'Hai', Three: 'Ba', Four: 'Bốn', Five: 'Năm',
  Six: 'Sáu', Seven: 'Bảy', Eight: 'Tám', Nine: 'Chín', Ten: 'Mười',
  Circle: 'Hình tròn', Square: 'Hình vuông', Triangle: 'Hình tam giác', Star: 'Ngôi sao', Pink: 'Màu hồng', Purple: 'Màu tím',
  Black: 'Màu đen', White: 'Màu trắng', Book: 'Quyển sách', Pencil: 'Bút chì', Bag: 'Cặp sách', Chair: 'Cái ghế', Milk: 'Sữa',
  Bread: 'Bánh mì', Big: 'To', Small: 'Nhỏ', Father: 'Bố', Mother: 'Mẹ', Sister: 'Chị/em gái', Brother: 'Anh/em trai',
  Head: 'Đầu', Eyes: 'Mắt', Nose: 'Mũi', Mouth: 'Miệng', Hands: 'Bàn tay', Happy: 'Vui', Sad: 'Buồn', Angry: 'Tức giận', Tired: 'Mệt mỏi',
  Shirt: 'Áo sơ mi', Dress: 'Váy', Shoes: 'Giày', Hat: 'Mũ', Bedroom: 'Phòng ngủ', Kitchen: 'Nhà bếp', Bathroom: 'Phòng tắm',
  'Living room': 'Phòng khách', Apples: 'Những quả táo', Cats: 'Những con mèo', Books: 'Sách', Games: 'Trò chơi', Goodbye: 'Tạm biệt',
  'Good morning': 'Chào buổi sáng', 'Good afternoon': 'Chào buổi chiều', 'Good night': 'Chúc ngủ ngon', Name: 'Tên', Age: 'Tuổi', Six: 'Sáu', Friend: 'Bạn bè',
  Notebook: 'Vở', Ruler: 'Thước kẻ', Eraser: 'Cục tẩy', Run: 'Chạy', Walk: 'Đi bộ', Read: 'Đọc', What: 'Cái gì', Color: 'Màu sắc',
  This: 'Cái này', That: 'Cái kia', Sunny: 'Có nắng', Rainy: 'Có mưa', Cloudy: 'Nhiều mây', Windy: 'Có gió', Wake: 'Thức dậy',
  'Wake up': 'Thức dậy', 'Brush teeth': 'Đánh răng', 'Eat breakfast': 'Ăn sáng', 'Go to school': 'Đi học', Rice: 'Cơm/gạo', Egg: 'Trứng',
  Monday: 'Thứ Hai', Sunday: 'Chủ nhật', Morning: 'Buổi sáng', Afternoon: 'Buổi chiều', Park: 'Công viên', School: 'Trường học',
  Supermarket: 'Siêu thị', Zoo: 'Sở thú', Story: 'Câu chuyện', Character: 'Nhân vật', Start: 'Bắt đầu', End: 'Kết thúc',
  Teacher: 'Giáo viên', Doctor: 'Bác sĩ', Farmer: 'Nông dân', Pilot: 'Phi công', Tree: 'Cây', River: 'Sông', Mountain: 'Núi', Forest: 'Rừng',
  Reading: 'Đọc sách', Swimming: 'Bơi lội', Drawing: 'Vẽ', Singing: 'Ca hát', 'Get up': 'Thức dậy', 'Have lunch': 'Ăn trưa',
  'Do homework': 'Làm bài tập', 'Go to bed': 'Đi ngủ', Gray: 'Màu xám', Beautiful: 'Đẹp', Write: 'Viết', Sentence: 'Câu', Answer: 'Câu trả lời',
  School: 'Trường học', Classroom: 'Lớp học', Teacher: 'Giáo viên', Student: 'Học sinh', Book: 'Sách', Pencil: 'Bút chì', Notebook: 'Vở', Ruler: 'Thước kẻ', Eraser: 'Cục tẩy', Desk: 'Bàn học', Chair: 'Ghế', Backpack: 'Ba lô',
  Family: 'Gia đình', Hobby: 'Sở thích', Like: 'Thích', Tall: 'Cao', Short: 'Thấp', Kind: 'Tốt bụng', Play: 'Chơi', Read: 'Đọc',
  'Get dressed': 'Mặc quần áo', Study: 'Học bài', 'Come home': 'Về nhà', 'Have dinner': 'Ăn tối', 'Take a bath': 'Tắm',
  Circle: 'Hình tròn', Square: 'Hình vuông', Triangle: 'Hình tam giác', Star: 'Ngôi sao', Big: 'To', Small: 'Nhỏ', In: 'Ở trong', On: 'Ở trên',
  Please: 'Làm ơn', 'Thank you': 'Cảm ơn', Sorry: 'Xin lỗi', 'Excuse me': 'Xin phép', Yes: 'Có', No: 'Không', What: 'Cái gì', Where: 'Ở đâu', How: 'Như thế nào',
  'Wash face': 'Rửa mặt', 'Have lunch': 'Ăn trưa', 'Go home': 'Về nhà', Morning: 'Buổi sáng', Hot: 'Nóng', Cold: 'Lạnh', Spring: 'Mùa xuân', Summer: 'Mùa hè', Autumn: 'Mùa thu', Winter: 'Mùa đông', Weather: 'Thời tiết', Rainbow: 'Cầu vồng',
  Carrot: 'Cà rốt', Chicken: 'Thịt gà', Breakfast: 'Bữa sáng', Lunch: 'Bữa trưa', Dinner: 'Bữa tối', Home: 'Nhà', Park: 'Công viên', Library: 'Thư viện', Hospital: 'Bệnh viện', Supermarket: 'Siêu thị', Zoo: 'Sở thú', Street: 'Con phố', Bus: 'Xe buýt', Bike: 'Xe đạp', Left: 'Bên trái', Right: 'Bên phải',
  Dancing: 'Nhảy múa', Football: 'Bóng đá', Basketball: 'Bóng rổ', Skipping: 'Nhảy dây', Music: 'Âm nhạc', Weekend: 'Cuối tuần',
  Engineer: 'Kỹ sư', Chef: 'Đầu bếp', 'Police officer': 'Cảnh sát', Firefighter: 'Lính cứu hỏa', Artist: 'Nghệ sĩ', Scientist: 'Nhà khoa học', Job: 'Nghề nghiệp', Dream: 'Ước mơ',
  Flower: 'Bông hoa', Ocean: 'Đại dương', Animal: 'Động vật', Plant: 'Cây cối', Sun: 'Mặt trời', Moon: 'Mặt trăng', Earth: 'Trái đất',
  Travel: 'Du lịch', Airport: 'Sân bay', Station: 'Nhà ga', Ticket: 'Vé', Map: 'Bản đồ', Train: 'Tàu hỏa', Plane: 'Máy bay', Beach: 'Bãi biển', Hotel: 'Khách sạn', City: 'Thành phố', Country: 'Đất nước', Visit: 'Thăm',
  Story: 'Câu chuyện', Character: 'Nhân vật', Beginning: 'Mở đầu', Middle: 'Phần giữa', End: 'Kết thúc', Question: 'Câu hỏi', Picture: 'Bức tranh',
  Clean: 'Sạch', Recycle: 'Tái chế', Reuse: 'Tái sử dụng', Save: 'Tiết kiệm', Water: 'Nước', Energy: 'Năng lượng', Trash: 'Rác', Plastic: 'Nhựa', Garden: 'Khu vườn', Healthy: 'Khỏe mạnh', Protect: 'Bảo vệ'
};

Object.assign(wordMeanings, {
  A: 'Chữ A', B: 'Chữ B', C: 'Chữ C', D: 'Chữ D', E: 'Chữ E', F: 'Chữ F',
  G: 'Chữ G', H: 'Chữ H', I: 'Chữ I', J: 'Chữ J', K: 'Chữ K', L: 'Chữ L',
  M: 'Chữ M', N: 'Chữ N', O: 'Chữ O', P: 'Chữ P', Q: 'Chữ Q', R: 'Chữ R',
  S: 'Chữ S', T: 'Chữ T', U: 'Chữ U', V: 'Chữ V', W: 'Chữ W', X: 'Chữ X',
  Y: 'Chữ Y', Z: 'Chữ Z', Cow: 'Con bò', Duck: 'Con vịt', Fish: 'Con cá', Rabbit: 'Con thỏ',
  Lion: 'Sư tử', Monkey: 'Con khỉ', Elephant: 'Con voi', Pink: 'Màu hồng', Purple: 'Màu tím',
  Black: 'Màu đen', White: 'Màu trắng', Grape: 'Quả nho', Pear: 'Quả lê', Watermelon: 'Dưa hấu',
  Strawberry: 'Dâu tây', Goodbye: 'Tạm biệt', Run: 'Chạy', Stop: 'Dừng lại', 'Turn around': 'Xoay người',
  'Sit down': 'Ngồi xuống', 'Stand up': 'Đứng lên'
});

const alphabetPhonetics = {
  A: '/eɪ/', B: '/biː/', C: '/siː/', D: '/diː/', E: '/iː/', F: '/ɛf/',
  G: '/dʒiː/', H: '/eɪtʃ/', I: '/aɪ/', J: '/dʒeɪ/', K: '/keɪ/', L: '/ɛl/',
  M: '/ɛm/', N: '/ɛn/', O: '/oʊ/', P: '/piː/', Q: '/kjuː/', R: '/ɑːr/',
  S: '/ɛs/', T: '/tiː/', U: '/juː/', V: '/viː/', W: '/ˈdʌbəl.juː/', X: '/ɛks/',
  Y: '/waɪ/', Z: '/ziː/'
};

const alphabetStarterWords = [
  ['A', 'Chu cai A', '/eɪ/'],
  ['B', 'Chu cai B', '/biː/'],
  ['C', 'Chu cai C', '/siː/'],
  ['D', 'Chu cai D', '/diː/'],
  ['E', 'Chu cai E', '/iː/'],
  ['F', 'Chu cai F', '/ɛf/']
];

async function ensureAlphabetStarter(connection, topicId, exampleWords) {
  // Keep the first lesson ordered as letters first, followed by picture words.
  await connection.query('DELETE FROM vocabularies WHERE topic_id = ?', [topicId]);

  for (const [letter, meaning, phonetic] of alphabetStarterWords) {
    await connection.query(
      'INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic) VALUES (?, ?, ?, ?)',
      [topicId, letter, meaning, phonetic]
    );
  }

  for (const word of exampleWords) {
    await connection.query(
      'INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic) VALUES (?, ?, ?, ?)',
      [topicId, word, wordMeanings[word] || word, '']
    );
  }
}

async function ensureAlphabetChild(connection) {
  const username = 'be3_alphabet';
  const [rows] = await connection.query(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    [username]
  );

  let childId;
  if (rows.length === 0) {
    const [result] = await connection.query(
      `INSERT INTO users (username, password_hash, display_name, role, age_group, daily_goal_minutes)
       VALUES (?, ?, ?, 'USER', '3', 10)`,
      [username, '123456', 'Be 3 tuoi - Alphabet']
    );
    childId = result.insertId;
  } else {
    childId = rows[0].id;
    await connection.query(
      `UPDATE users
       SET display_name = ?, role = 'USER', age_group = '3', daily_goal_minutes = 10
       WHERE id = ?`,
      ['Be 3 tuoi - Alphabet', childId]
    );
  }

  await connection.query(
    `INSERT INTO user_rewards (user_id, total_stars, total_coins, current_streak)
     VALUES (?, 0, 0, 0)
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [childId]
  );

  console.log(`  + Demo child ${username}: age 3, starts with Alphabet A-Z`);
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function getOrCreateCourse(connection, course) {
  const [rows] = await connection.query('SELECT id FROM courses WHERE age_group = ? LIMIT 1', [course.age]);
  if (rows.length > 0) {
    await connection.query('UPDATE courses SET title = ?, description = ?, status = "PUBLISHED" WHERE id = ?', [course.title, course.description, rows[0].id]);
    return rows[0].id;
  }
  const [result] = await connection.query('INSERT INTO courses (title, description, age_group, status) VALUES (?, ?, ?, "PUBLISHED")', [course.title, course.description, course.age]);
  return result.insertId;
}

async function getOrCreateTopic(connection, courseId, courseAge, topic, sortOrder) {
  const [rows] = await connection.query('SELECT id FROM topics WHERE course_id = ? AND sort_order = ? LIMIT 1', [courseId, sortOrder]);
  if (rows.length > 0) {
    await connection.query('UPDATE topics SET name = ?, description = ?, sort_order = ?, status = "PUBLISHED" WHERE id = ?', [topic[0], topic[1], sortOrder, rows[0].id]);
    return rows[0].id;
  }
  const [result] = await connection.query('INSERT INTO topics (course_id, name, description, sort_order, status) VALUES (?, ?, ?, ?, "PUBLISHED")', [courseId, topic[0], topic[1], sortOrder]);
  console.log(`  + Level ${courseAge}: ${topic[0]}`);
  return result.insertId;
}

async function hideExtraTopics(connection, courseId, visibleTopicCount) {
  const [rows] = await connection.query(
    'SELECT id FROM topics WHERE course_id = ? AND sort_order > ?',
    [courseId, visibleTopicCount]
  );

  for (const row of rows) {
    await connection.query('UPDATE topics SET status = "DRAFT" WHERE id = ?', [row.id]);
    await connection.query('UPDATE lessons SET status = "DRAFT" WHERE topic_id = ?', [row.id]);
    await connection.query('UPDATE mini_games SET is_active = 0 WHERE topic_id = ?', [row.id]);
  }
}

async function upsertVocabulary(connection, topicId, words) {
  for (const word of words) {
    const meaning = wordMeanings[word] || word;
    const phonetic = alphabetPhonetics[word] || '';
    const [rows] = await connection.query('SELECT id FROM vocabularies WHERE topic_id = ? AND word = ? LIMIT 1', [topicId, word]);
    if (rows.length === 0) {
      await connection.query('INSERT INTO vocabularies (topic_id, word, meaning_vi, phonetic) VALUES (?, ?, ?, ?)', [topicId, word, meaning, phonetic]);
    } else {
      await connection.query(
        'UPDATE vocabularies SET meaning_vi = ?, phonetic = CASE WHEN ? <> "" THEN ? ELSE phonetic END WHERE id = ?',
        [meaning, phonetic, phonetic, rows[0].id]
      );
    }
  }
}

async function pruneVocabulary(connection, topicId, words) {
  const placeholders = words.map(() => '?').join(', ');
  await connection.query(
    `DELETE FROM vocabularies WHERE topic_id = ? AND word NOT IN (${placeholders})`,
    [topicId, ...words]
  );
}

async function getOrCreateMiniGames(connection, topicId, topicName, age) {
  const isNumbersTopic = String(age) === '4' && /number/i.test(topicName);
  const isShapesTopic = String(age) === '4' && /shape/i.test(topicName);
  const isAge6Topic = String(age) === '6';
  const isAge7Topic = String(age) === '7';
  const isAge8Topic = String(age) === '8';
  const gameNames = isNumbersTopic
    ? ['Đếm số trong ảnh', 'Lật thẻ số và hình', 'Nghe và chọn số']
    : isShapesTopic
    ? ['Ghép hình và tên', 'Lật thẻ hình dạng', 'Nghe và chọn hình']
    : isAge7Topic
    ? ['Sắp xếp câu về chủ đề', 'Lật thẻ từ và hình', 'Nghe và chọn đáp án']
    : isAge8Topic
    ? ['Sắp xếp câu mô tả', 'Lật thẻ nghề nghiệp và thiên nhiên', 'Nghe và chọn đáp án']
    : isAge6Topic
    ? ['Sắp xếp câu ngắn', 'Lật thẻ giao tiếp', 'Nghe và chọn câu']
    : ['Ghép từ và hình', 'Lật thẻ ghi nhớ', 'Nghe và chọn hình'];
  const types = isNumbersTopic
    ? ['COUNT_OBJECTS', 'MEMORY_CARDS', 'LISTEN_AND_PICK']
    : isAge6Topic || isAge7Topic || isAge8Topic
    ? ['ORDER_SENTENCE', 'MEMORY_CARDS', 'LISTEN_AND_PICK']
    : gameTypes;
  const [existingGames] = await connection.query(
    'SELECT id FROM mini_games WHERE topic_id = ? ORDER BY sort_order ASC, id ASC',
    [topicId]
  );
  const difficulty = Math.max(1, Math.min(5, Number(age) - 2));
  const games = [];

  for (let index = 0; index < gameNames.length; index += 1) {
    const gameName = `${gameNames[index]}: ${topicName}`;
    const gameType = types[index];
    const existing = existingGames[index];
    if (existing) {
      await connection.query(
        'UPDATE mini_games SET name = ?, game_type = ?, difficulty = ?, points = ?, is_active = 1, sort_order = ? WHERE id = ?',
        [gameName, gameType, difficulty, 50 + Number(age) * 10 + index * 10, index + 1, existing.id]
      );
      games.push({ id: existing.id, name: gameName });
    } else {
      const [result] = await connection.query(
        'INSERT INTO mini_games (topic_id, name, game_type, difficulty, points, is_active, sort_order) VALUES (?, ?, ?, ?, ?, 1, ?)',
        [topicId, gameName, gameType, difficulty, 50 + Number(age) * 10 + index * 10, index + 1]
      );
      games.push({ id: result.insertId, name: gameName });
    }
  }
  return games;
}

async function upsertLesson(connection, topicId, age, topicName, lessonIndex, miniGameId = null) {
  const types = lessonTypesByAge[String(age)] || lessonTypes;
  const type = types[lessonIndex];
  const titles = lessonTitlesByAge[String(age)] || lessonTitles;
  const title = `${titles[lessonIndex]}: ${topicName}`;
  const difficulty = Math.max(1, Math.min(5, Math.ceil(Number(age) / 2)));
  if (miniGameId !== null) {
    // A mini game can belong to only one lesson. Clear a stale link left by
    // an older curriculum before assigning it to the current GAME lesson.
    await connection.query(
      'UPDATE lessons SET mini_game_id = NULL WHERE mini_game_id = ? AND NOT (topic_id = ? AND sort_order = ?)',
      [miniGameId, topicId, lessonIndex + 1]
    );
  }
  let rows;
  [rows] = await connection.query('SELECT id FROM lessons WHERE topic_id = ? AND sort_order = ? LIMIT 1', [topicId, lessonIndex + 1]);
  const values = [topicId, miniGameId, title, type, difficulty, lessonIndex + 1, Number(age), `Bé ${age} tuổi luyện tập ${topicName}.`, `curriculum/${slug(age)}-${slug(topicName)}-${lessonIndex + 1}`];
  if (rows.length > 0) {
    await connection.query(`UPDATE lessons SET topic_id = ?, mini_game_id = ?, title = ?, lesson_type = ?, difficulty = ?, sort_order = ?, status = "PUBLISHED", approval_status = "APPROVED", target_age = ?, learning_outcomes = ?, sample_materials_url = ? WHERE id = ?`, [...values, rows[0].id]);
    return rows[0].id;
  }
  const [result] = await connection.query(`INSERT INTO lessons (topic_id, mini_game_id, title, lesson_type, difficulty, sort_order, status, approval_status, target_age, learning_outcomes, sample_materials_url) VALUES (?, ?, ?, ?, ?, ?, "PUBLISHED", "APPROVED", ?, ?, ?)`, values);
  return result.insertId;
}

async function ensureQuizQuestion(connection, lessonId, topicName, words, age) {
  const isLetterQuiz = words.every((word) => /^[A-Z]$/i.test(word));
  const isNumberQuiz = String(age) === '4' && /number/i.test(topicName);
  const isShapeQuiz = String(age) === '4' && /shape/i.test(topicName);
  const isAge5Quiz = String(age) === '5';
  const isAge6Quiz = String(age) === '6';
  const isAge7Quiz = String(age) === '7';
  const isAge8Quiz = String(age) === '8';
  const questionCount = (isLetterQuiz && String(age) === '3') || isNumberQuiz || isShapeQuiz || isAge5Quiz || isAge6Quiz || isAge7Quiz || isAge8Quiz
    ? isAge7Quiz || isAge8Quiz ? 5 : Math.min(5, words.length)
    : 1;
  const questionTemplates = [
    (letter) => `Which one is the letter ${letter}?`,
    (letter) => `Can you find the letter ${letter}?`,
    (letter) => `Touch the letter ${letter}.`,
    (letter) => `Where is the letter ${letter}?`,
    (letter) => `Choose the letter ${letter}.`
  ];

  // Rebuild the question set so an old one-question quiz never remains mixed
  // with the new multi-question version.
  const [oldQuestions] = await connection.query('SELECT id FROM questions WHERE lesson_id = ?', [lessonId]);
  if (oldQuestions.length > 0) {
    const questionIds = oldQuestions.map((question) => question.id);
    const placeholders = questionIds.map(() => '?').join(', ');
    await connection.query(`DELETE FROM answers WHERE question_id IN (${placeholders})`, questionIds);
    await connection.query(`DELETE FROM questions WHERE id IN (${placeholders})`, questionIds);
  }

  for (let questionIndex = 0; questionIndex < questionCount; questionIndex += 1) {
    const target = isLetterQuiz || isNumberQuiz || isShapeQuiz || isAge5Quiz || isAge6Quiz || isAge7Quiz || isAge8Quiz
      ? words[isAge7Quiz || isAge8Quiz ? questionIndex % words.length : questionIndex]
      : words[0];
    const questionText = isLetterQuiz
      ? questionTemplates[questionIndex % questionTemplates.length](target)
      : isNumberQuiz
      ? 'How many objects are there? Choose the correct number.'
      : isShapeQuiz
      ? 'Which shape is this?'
      : isAge5Quiz
      ? `Which word belongs to ${topicName}?`
      : isAge6Quiz
      ? `Choose the best word for ${topicName}.`
      : isAge7Quiz
      ? `Read and choose the best word for ${topicName}.`
      : isAge8Quiz
      ? `Read and choose the best answer about ${topicName}.`
      : `Which word belongs to ${topicName}?`;
    const [question] = await connection.query(
      'INSERT INTO questions (lesson_id, question_type, question_text, points) VALUES (?, "MULTIPLE_CHOICE", ?, 10)',
      [lessonId, questionText]
    );

    const distractors = words.filter((word) => word !== target).slice(0, 3);
    const baseOptions = [target, ...distractors];
    const correctIndex = questionIndex % baseOptions.length;
    const options = baseOptions.map((_, index) => baseOptions[(index - correctIndex + baseOptions.length) % baseOptions.length]);
    for (let index = 0; index < options.length; index += 1) {
      await connection.query(
        'INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)',
        [question.insertId, options[index], index === correctIndex ? 1 : 0]
      );
    }
  }
}

async function ensureSpeakingLessonType(connection) {
  const [columns] = await connection.query("SHOW COLUMNS FROM lessons LIKE 'lesson_type'");
  const type = columns[0]?.Type || '';
  if (!type.includes("'SPEAKING'")) {
    // Các lesson Speaking đã seed nhầm thành chuỗi rỗng khi enum cũ chưa hỗ trợ loại này.
    await connection.query("UPDATE lessons SET lesson_type = 'VIDEO' WHERE lesson_type = '' AND title LIKE 'Listening & Speaking:%'");
    await connection.query("ALTER TABLE lessons MODIFY COLUMN lesson_type ENUM('VIDEO', 'FLASHCARD', 'SPEAKING', 'QUIZ', 'GAME') NOT NULL");
  }
}

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kids_english_db'
  });
  try {
    await ensureSpeakingLessonType(connection);
    await connection.beginTransaction();
    const requestedAges = String(process.env.CURRICULUM_AGES || '')
      .split(',')
      .map((age) => age.trim())
      .filter((age) => /^(3|4|5|6|7|8)$/.test(age));
    const coursesToSeed = requestedAges.length > 0
      ? courses.filter((course) => requestedAges.includes(course.age))
      : courses;

    for (const course of coursesToSeed) {
      const courseId = await getOrCreateCourse(connection, course);
      const topics = curriculum[course.age];
      for (let topicIndex = 0; topicIndex < topics.length; topicIndex += 1) {
        const topic = topics[topicIndex];
        const topicId = await getOrCreateTopic(connection, courseId, course.age, topic, topicIndex + 1);
        if (course.age === '3' || course.age === '4' || course.age === '5' || course.age === '6' || course.age === '7' || course.age === '8') {
          await pruneVocabulary(connection, topicId, topic[2]);
        }
        await upsertVocabulary(connection, topicId, topic[2]);
        const miniGames = await getOrCreateMiniGames(connection, topicId, topic[0], course.age);
        const lessonTypesForCourse = lessonTypesByAge[course.age] || lessonTypes;
        const miniGameId = course.age === '3' ? miniGames[1].id : miniGames[0].id;
        for (let lessonIndex = 0; lessonIndex < lessonTypesForCourse.length; lessonIndex += 1) {
          const gameLessonId = lessonTypesForCourse[lessonIndex] === 'GAME' ? miniGameId : null;
          const lessonId = await upsertLesson(connection, topicId, course.age, topic[0], lessonIndex, gameLessonId);
          if (lessonTypesForCourse[lessonIndex] === 'QUIZ') await ensureQuizQuestion(connection, lessonId, topic[0], topic[2], course.age);
        }
        if (course.age === '3' || course.age === '4' || course.age === '5' || course.age === '6' || course.age === '7' || course.age === '8') {
          await connection.query(
            'UPDATE lessons SET status = "DRAFT" WHERE topic_id = ? AND sort_order > ?',
            [topicId, lessonTypesForCourse.length]
          );
        }
      }
      if (course.age === '3' || course.age === '4' || course.age === '5' || course.age === '6' || course.age === '7' || course.age === '8') await hideExtraTopics(connection, courseId, topics.length);
    }
    if (coursesToSeed.some((course) => course.age === '3')) await ensureAlphabetChild(connection);
    await connection.commit();
    const topicCount = coursesToSeed.reduce((total, course) => total + curriculum[course.age].length, 0);
    const lessonCount = coursesToSeed.reduce((total, course) => total + (curriculum[course.age].length * (lessonTypesByAge[course.age] || lessonTypes).length), 0);
    console.log(`Đã đồng bộ ${coursesToSeed.length} cấp độ, ${topicCount} chủ đề và ${lessonCount} bài học.`);
  } catch (error) {
    await connection.rollback();
    console.error('Seed curriculum failed:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

seed();
