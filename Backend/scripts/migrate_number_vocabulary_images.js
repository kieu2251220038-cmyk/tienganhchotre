const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const numberImages = [
  ['eight', 'Eight', 'number-eight.png'],
  ['nine', 'Nine', 'number-nine.png'],
  ['ten', 'Ten', 'number-ten.png']
];

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kids_english_db'
  });

  const sourceDirectory = path.resolve(process.cwd(), '..', 'Frontend', 'src', 'assets', 'vocabulary');
  const uploadDirectory = path.resolve(process.cwd(), 'uploads', 'vocabulary');
  await fs.mkdir(uploadDirectory, { recursive: true });

  try {
    for (const [wordKey, label, fileName] of numberImages) {
      const sourcePath = path.join(sourceDirectory, fileName);
      const destinationPath = path.join(uploadDirectory, fileName);
      await fs.copyFile(sourcePath, destinationPath);

      const publicUrl = `/uploads/vocabulary/${fileName}`;
      const [existingMedia] = await connection.query(
        'SELECT id FROM media_assets WHERE file_url = ? LIMIT 1',
        [publicUrl]
      );
      let mediaId = existingMedia[0]?.id;

      if (!mediaId) {
        const [mediaResult] = await connection.query(
          'INSERT INTO media_assets (title, media_type, file_url) VALUES (?, "IMAGE", ?)',
          [`Ảnh số ${label}`, publicUrl]
        );
        mediaId = mediaResult.insertId;
      }

      const [updateResult] = await connection.query(
        'UPDATE vocabularies SET image_id = ? WHERE LOWER(TRIM(word)) = ?',
        [mediaId, wordKey]
      );
      console.log(`${label}: linked media ${mediaId} to ${updateResult.affectedRows} vocabulary record(s).`);
    }
  } finally {
    await connection.end();
  }
})().catch((error) => {
  console.error('Could not link number vocabulary images:', error);
  process.exitCode = 1;
});
