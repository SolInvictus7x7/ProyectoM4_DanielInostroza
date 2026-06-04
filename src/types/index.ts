import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  username: string;
  email?: string;
}

export interface Task {
  tid: string;
  title: string;
  description: string;
  complete: boolean;
  'created-at': Timestamp;
  'assigned-to': string;
  members: string[];
}

export interface Group {
  gid: string;
  title: string;
  'admin-uid': string[];
  members: string[];
  tasks: string[];
}
