
import { LevelInfo, Badge } from './types';

export const APP_ID = 'studygram-v3-max';

export const LEVELS: LevelInfo[] = [
  { min: 0, title: "Mầm Non", icon: "🌱", color: "text-green-500" },
  { min: 100, title: "Tập Sự", icon: "🐣", color: "text-yellow-500" },
  { min: 500, title: "Học Giả", icon: "🦉", color: "text-blue-500" },
  { min: 1500, title: "Giáo Sư", icon: "👓", color: "text-purple-500" },
  { min: 3000, title: "Thần Đồng", icon: "👑", color: "text-red-500" },
  { min: 6000, title: "Huyền Thoại", icon: "🐉", color: "text-amber-500" }
];

export const BADGES: Badge[] = [
  {
    id: 'streak_7',
    icon: '🔥',
    name: 'Chiến Binh Lửa',
    description: 'Đạt chuỗi Streak 7 ngày liên tục',
    condition: (u) => u.streak >= 7,
    color: 'bg-orange-500'
  },
  {
    id: 'quiz_10',
    icon: '🧠',
    name: 'Bộ Não Siêu Việt',
    description: 'Hoàn thành 10 bài kiểm tra',
    condition: (u) => u.completedQuizzes >= 10,
    color: 'bg-indigo-500'
  },
  {
    id: 'rich_kid',
    icon: '💎',
    name: 'Nhà Sưu Tầm',
    description: 'Sở hữu 1000 Gems',
    condition: (u) => u.gems >= 1000,
    color: 'bg-teal-500'
  },
  {
    id: 'level_5',
    icon: '👑',
    name: 'Vua Học Tập',
    description: 'Đạt cấp độ Thần Đồng',
    condition: (u) => u.exp >= 3000,
    color: 'bg-amber-500'
  }
];

export const STUDY_CATEGORIES = [
  "Toán học", "Ngữ văn", "Ngoại ngữ", "Vật lý", "Hóa học", "Lịch sử", "Địa lý", "Tin học", "Khác"
];

export const getLevelInfo = (exp: number): LevelInfo => {
  return [...LEVELS].reverse().find(l => exp >= l.min) || LEVELS[0];
};
