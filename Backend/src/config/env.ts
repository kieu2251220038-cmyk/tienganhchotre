import path from 'node:path';
import dotenv from 'dotenv';

// Always load the Backend/.env file, even when the server is started from
// the repository root instead of the Backend directory.
dotenv.config({ path: path.resolve(__dirname, '../../../Backend/.env') });
