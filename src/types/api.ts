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
  coverUrl: string | null;
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
  coverKey?: string;
  collaborators?: string[];
  promoteDays?: number;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export type MediaKind = 'AVATAR' | 'COVER' | 'EVENT' | 'COMMUNITY' | 'POST';

export interface MediaUpload {
  key: string;
  url: string;
}

/** Profile fields to change; omitted fields stay as they are. Image keys come from an upload ("" removes). */
export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  interests?: string[];
  links?: Record<string, string>;
  avatarKey?: string;
  coverKey?: string;
  profileVisibility?: Profile['profileVisibility'];
}

export type CommunityRole = 'OWNER' | 'MODERATOR' | 'MEMBER';
export type MembershipStatus = 'ACTIVE' | 'INVITED';

export interface Community {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  rules: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  coverUrl: string | null;
  memberCount: number;
  postCount: number;
  creator: UserSummary;
  myRole: CommunityRole | null;
  myStatus: MembershipStatus | null;
  canModerate: boolean;
  createdAt: string;
}

/** Create or update; on update omitted fields stay. coverKey "" removes the cover. */
export interface CommunityRequest {
  name?: string;
  slug?: string;
  description?: string;
  rules?: string;
  visibility?: Community['visibility'];
  coverKey?: string;
}

export interface CommunityMember {
  user: UserSummary;
  role: CommunityRole;
  status: MembershipStatus;
  since: string;
}

export interface Post {
  id: number;
  author: UserSummary;
  community: { slug: string; name: string } | null;
  title: string;
  body: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  score: number;
  myVote: -1 | 0 | 1;
  commentCount: number;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  editedAt: string | null;
}

/** communitySlug only on create. imageKey / videoKey "" removes; a post has one or the other. */
export interface PostRequest {
  communitySlug?: string;
  title?: string;
  body?: string;
  imageKey?: string;
  videoKey?: string;
}

export interface Comment {
  id: number;
  postId: number;
  parentId: number | null;
  author: UserSummary | null;
  body: string | null;
  deleted: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  editedAt: string | null;
}

export type PostSort = 'hot' | 'new' | 'top';

export interface ChatMessage {
  id: number;
  conversationId: number;
  sender: UserSummary | null;
  body: string | null;
  imageUrl: string | null;
  deleted: boolean;
  system: boolean;
  createdAt: string;
}

export interface Chat {
  id: number;
  type: 'DIRECT' | 'GROUP';
  title: string;
  avatarUrl: string | null;
  members: { user: UserSummary; role: 'ADMIN' | 'MEMBER'; online: boolean; lastReadMessageId: number | null }[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  myRole: 'ADMIN' | 'MEMBER' | null;
  createdAt: string;
}

/** Pushed over the WebSocket to /user/queue/chat. */
export interface ChatEvent {
  type: 'MESSAGE' | 'MESSAGE_DELETED' | 'READ' | 'TYPING' | 'CHAT_UPDATED' | 'REMOVED';
  conversationId: number;
  message: ChatMessage | null;
  userId: number | null;
  messageId: number | null;
}
