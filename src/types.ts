export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
  hscBoard?: string;
  hscYear?: string;
  sscBoard?: string;
  sscYear?: string;
  gpa?: string;
  mobile?: string;
  gender?: 'Male' | 'Female' | 'None';
  group?: 'Science' | 'Commerce' | 'Arts';
}

export interface SlideshowImage {
  id: string;
  url: string;
  order: number;
}

export interface Question {
  id: string;
  type: 'HSC' | 'SSC' | 'Admission';
  category?: 'Engineering' | 'Medical' | 'University' | 'GST';
  year: string;
  board?: string;
  group?: string;
  subject: string;
  paper?: '1st Paper' | '2nd Paper';
  questionType: 'MCQ' | 'CQ';
  imageUrl: string;
  downloadUrl: string;
  university?: string;
  uploadedAt: any;
}

export interface Update {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: any;
}

export interface Comment {
  id: string;
  targetId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  parentId?: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: any;
}
