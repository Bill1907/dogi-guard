export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const calculateDDay = (targetDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const formatDate = (date: Date, locale: string = 'en'): string => {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return d.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', options);
};

export const getDDayColor = (dDay: number): string => {
  if (dDay <= 0) return '#FF3B30'; // Red - overdue
  if (dDay <= 7) return '#FF9500'; // Orange - urgent
  if (dDay <= 14) return '#FFCC00'; // Yellow - soon
  return '#34C759'; // Green - safe
};

export const getDDayStatus = (dDay: number): 'overdue' | 'urgent' | 'soon' | 'safe' => {
  if (dDay <= 0) return 'overdue';
  if (dDay <= 7) return 'urgent';
  if (dDay <= 14) return 'soon';
  return 'safe';
};