import { baseApi } from './baseApi';
import type { Comment, CursorPage, Post, PostRequest, PostSort } from '@/types/api';

/** community=slug, author=username, or neither for the signed-in member's feed. */
export interface PostListArgs {
  community?: string;
  author?: string;
  sort: PostSort;
  cursor?: string;
}

export const postApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    posts: build.query<CursorPage<Post>, PostListArgs>({
      query: ({ community, author, sort, cursor }) => ({ url: 'api/v1/posts', params: { community, author, sort, cursor } }),
      providesTags: [{ type: 'Post', id: 'LIST' }],
    }),
    post: build.query<Post, number>({
      query: (id) => `api/v1/posts/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Post', id }],
    }),
    createPost: build.mutation<Post, PostRequest>({
      query: (body) => ({ url: 'api/v1/posts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }, { type: 'Community', id: 'LIST' }],
    }),
    updatePost: build.mutation<Post, { id: number; body: PostRequest }>({
      query: ({ id, body }) => ({ url: `api/v1/posts/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Post', id }, { type: 'Post', id: 'LIST' }],
    }),
    deletePost: build.mutation<null, number>({
      query: (id) => ({ url: `api/v1/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Post', id }, { type: 'Post', id: 'LIST' }],
    }),
    vote: build.mutation<Post, { id: number; value: -1 | 0 | 1 }>({
      query: ({ id, value }) => ({ url: `api/v1/posts/${id}/vote`, method: 'PUT', body: { value } }),
      // Update every cached copy of the post in place, so the arrow and score change instantly without a refetch.
      async onQueryStarted({ id }, { dispatch, queryFulfilled, getState }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(postApi.util.updateQueryData('post', id, () => data));
          for (const { endpointName, originalArgs } of postApi.util.selectInvalidatedBy(getState(), [{ type: 'Post', id: 'LIST' }])) {
            if (endpointName !== 'posts') continue;
            dispatch(postApi.util.updateQueryData('posts', originalArgs as PostListArgs, (draft) => {
              const i = draft.items.findIndex((p) => p.id === id);
              if (i >= 0) draft.items[i] = data;
            }));
          }
        } catch { /* the error is shown by the caller */ }
      },
    }),
    comments: build.query<Comment[], number>({
      query: (postId) => `api/v1/posts/${postId}/comments`,
      providesTags: (_r, _e, postId) => [{ type: 'Post', id: `comments-${postId}` }],
    }),
    addComment: build.mutation<Comment, { postId: number; body: string; parentId?: number }>({
      query: ({ postId, body, parentId }) => ({ url: `api/v1/posts/${postId}/comments`, method: 'POST', body: { body, parentId } }),
      invalidatesTags: (_r, _e, { postId }) => [{ type: 'Post', id: `comments-${postId}` }, { type: 'Post', id: postId }],
    }),
    editComment: build.mutation<Comment, { id: number; postId: number; body: string }>({
      query: ({ id, body }) => ({ url: `api/v1/comments/${id}`, method: 'PATCH', body: { body } }),
      invalidatesTags: (_r, _e, { postId }) => [{ type: 'Post', id: `comments-${postId}` }],
    }),
    deleteComment: build.mutation<null, { id: number; postId: number }>({
      query: ({ id }) => ({ url: `api/v1/comments/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { postId }) => [{ type: 'Post', id: `comments-${postId}` }, { type: 'Post', id: postId }],
    }),
  }),
});

export const {
  usePostsQuery,
  usePostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useVoteMutation,
  useCommentsQuery,
  useAddCommentMutation,
  useEditCommentMutation,
  useDeleteCommentMutation,
} = postApi;
