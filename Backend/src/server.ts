import 'dotenv/config';
import app from './app';
import pool from './config/database';

const PORT = Number(process.env.PORT || 5000);

pool.getConnection()
    .then(() => {
        console.log('✅ Connected to MySQL database!');
    })
    .catch((err) => {
        console.error('❌ Lỗi kết nối Database:', err);
    });

app.listen(PORT, () => {
    console.log(`🚀 Server Backend running at http://localhost:${PORT}`);
});
