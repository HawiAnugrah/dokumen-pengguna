export interface TestCase {
  id: number | string;
  action: string;
  expectedResult: string;
}

export interface StoryImage {
  id: number | string;
  url: string;
  caption?: string | null;
  createdAt?: string;
}

export interface CommentUser {
  id: number | string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface Comment {
  id: number | string;
  content: string;
  createdAt: string;
  user: CommentUser;
}

export interface LinkedStory {
  linkId: number | string;
  storyId: number | string;
  code?: string | null;
  iWant: string;
  linkType: 'relates_to' | 'blocked_by';
}

export interface UserStory {
  id: number | string;
  epicId?: number | string;
  code: string;
  as_a: string;
  i_want: string;
  so_that: string;
  acceptanceCriteria?: string[];
  techNotes?: string[];
  testCases?: TestCase[];
  images?: StoryImage[];
  labels?: string[];
}

export interface Epic {
  id: number | string;
  code: string;
  name: string;
  description: string;
  user_stories: UserStory[];
}

export interface NFR {
  id: number | string;
  category: string;
  description: string;
  project_id?: number;
}