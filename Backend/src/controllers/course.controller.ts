import { Request, Response } from 'express';
import pool from '../config/database';

export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        const [courses] = await pool.query('SELECT * FROM courses WHERE status = "PUBLISHED" ORDER BY CAST(age_group AS UNSIGNED) ASC, id ASC');
        res.status(200).json(courses);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách khóa học:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};
