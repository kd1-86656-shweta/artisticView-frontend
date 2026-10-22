/** Every backend response is wrapped as { data, error, meta }. */
export interface ApiEnvelope<T> {
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface Me {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  roles: string[];
  emailVerified: boolean;
}

export interface SubFeatureAccess {
  id: number;
  name: string;
  displayName: string;
  description: string;
  route: string;
  sequenceNumber: number;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export interface FeatureAccess {
  id: number;
  name: string;
  featureName: string;
  displayName: string;
  description: string;
  icon: string;
  route: string;
  sequenceNumber: number;
  subFeatures: SubFeatureAccess[];
}

export interface Session {
  user: Me;
  permissions: string[];
  features: FeatureAccess[];
}

export interface AuthResponse {
  accessToken: string;
  expiresInSeconds: number;
  session: Session;
}

export interface PersonCard {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  interests: string[];
  followerCount: number;
  followedByMe: boolean;
}

export interface HomeData {
  memberCount: number;
  newMembersThisWeek: number;
  profileIncomplete: boolean;
  suggestedPeople: PersonCard[];
  featuredEvents: EventItem[];
  upcomingEvents: EventItem[];
}

export interface Profile {
  id: number;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  interests: string[];
  links: Record<string, string>;
  profileVisibility: 'PUBLIC' | 'MEMBERS' | 'FOLLOWERS';
  followerCount: number;
  followingCount: number;
  followedByMe: boolean;
  blockedByMe: boolean;
  me: boolean;
  createdAt: string;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface UserSummary {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export type EventLocationType = 'ONLINE' | 'IN_PERSON';
export type CollaboratorStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED';

export interface EventCollaborator {
  user: UserSummary;
  status: CollaboratorStatus;
}

export interface EventItem {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  startsAt: string;
  endsAt: string | null;
  locationType: EventLocationType;
  location: string | null;
  meetingUrl: string | null;
  capacity: number | null;
  status: 'SCHEDULED' | 'CANCELLED';
  host: UserSummary;
  collaborators: EventCollaborator[];
  rsvpCount: number;
  going: boolean;
  promoted: boolean;
  promotedUntil: string | null;
  isHost: boolean;
  canManage: boolean;
  myCollaboration: CollaboratorStatus | null;
  createdAt: string;
}

/** Create or update. On update, omitted fields stay as they are. */
export interface EventRequest {
  title?: string;
  description?: string;
  category?: string;
  startsAt?: string;
  endsAt?: string | null;
  locationType?: EventLocationType;
  location?: string;
  meetingUrl?: string;
  capacity?: number | null;
  collaborators?: string[];
  promoteDays?: number;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}
