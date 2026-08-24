import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Reply, Trash2, Send, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { commentService } from '../services/api/commentService';
import { useNotification } from '../contexts/NotificationContext';
import { getMediaUrl } from '../utils/mediaUrl';
import { UserAvatar } from './UserAvatar';
import { formatUserRole } from '../utils/userRoleLabels';
import {
  COMMENT_LEVEL_META,
  countComments,
  filterCommentsByLevel,
  getDefaultCommentLevel,
  getVisibleLevelMeta,
  normalizeStoredLevel,
} from '../utils/commentLevels';

const CommentComposer = ({
  title,
  content,
  onContentChange,
  onSubmit,
  submitting,
  images,
  onImageChange,
  onRemoveImage,
  onCancel,
  submitLabel,
  placeholder,
}) => (
  <form onSubmit={onSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel reply
        </button>
      )}
    </div>

    <textarea
      value={content}
      onChange={(e) => onContentChange(e.target.value)}
      rows={4}
      className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f5d31] focus:outline-none"
      placeholder={placeholder}
    />

    {images.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-2">
        {images.map((file, index) => (
          <div key={`${file.name}-${index}`} className="relative">
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="h-20 w-20 object-cover rounded-md border border-gray-200"
            />
            <button
              type="button"
              onClick={() => onRemoveImage(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    )}

    <div className="mt-3 flex items-center justify-between gap-3">
      <label className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100">
        <ImageIcon className="h-4 w-4 mr-2" />
        Attach images
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onImageChange}
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center px-4 py-2 text-sm bg-[#2f5d31] text-white rounded-md hover:bg-[#004a6b] disabled:opacity-50"
      >
        <Send className="h-4 w-4 mr-2" />
        {submitting ? 'Posting...' : submitLabel}
      </button>
    </div>
  </form>
);

const CommentItem = ({
  comment,
  currentUser,
  onReply,
  onDelete,
  replyTo,
  replyContent,
  onReplyContentChange,
  onReplySubmit,
  replyImages,
  onReplyImageChange,
  onReplyImageRemove,
  submittingReply,
  onCancelReply,
  depth = 0,
}) => {
  const canDelete =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'head_quarter' ||
    comment.userId === currentUser?.id ||
    comment.author?.id === currentUser?.id;

  return (
    <div className={`${depth > 0 ? 'ml-6 mt-3 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <UserAvatar name={comment.author?.names} size="sm" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900">{comment.author?.names || 'Unknown'}</span>
                <span className="text-xs text-gray-500">
                  {formatUserRole(comment.author?.role)}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>

              {comment.images?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {comment.images.map((image, index) => {
                    const src = getMediaUrl(image);
                    return (
                      <a
                        key={`${comment.id}-img-${index}`}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                        title="Open image"
                      >
                        <img
                          src={src}
                          alt={`Comment attachment ${index + 1}`}
                          className="h-24 w-24 object-cover rounded-md border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0.4';
                            e.currentTarget.title = 'Image failed to load';
                          }}
                        />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="inline-flex items-center px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 rounded"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="inline-flex items-center px-2 py-1 text-xs text-red-700 hover:bg-red-50 rounded"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </button>
            )}
          </div>
        </div>

        {replyTo?.id === comment.id && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Replying to {comment.author?.names}</p>
            <CommentComposer
              title={`Reply to ${comment.author?.names}`}
              content={replyContent}
              onContentChange={onReplyContentChange}
              onSubmit={onReplySubmit}
              submitting={submittingReply}
              images={replyImages}
              onImageChange={onReplyImageChange}
              onRemoveImage={onReplyImageRemove}
              onCancel={onCancelReply}
              submitLabel="Post Reply"
              placeholder="Write your reply..."
            />
          </div>
        )}
      </div>

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          currentUser={currentUser}
          onReply={onReply}
          onDelete={onDelete}
          replyTo={replyTo}
          replyContent={replyContent}
          onReplyContentChange={onReplyContentChange}
          onReplySubmit={onReplySubmit}
          replyImages={replyImages}
          onReplyImageChange={onReplyImageChange}
          onReplyImageRemove={onReplyImageRemove}
          submittingReply={submittingReply}
          onCancelReply={onCancelReply}
          depth={depth + 1}
        />
      ))}
    </div>
  );
};

const ReportComments = ({ reportId, currentUser, onCountChange }) => {
  const { showSuccess, showError } = useNotification();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [commentImages, setCommentImages] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [replyImages, setReplyImages] = useState([]);
  const [activeLevel, setActiveLevel] = useState(getDefaultCommentLevel(currentUser?.role));

  const visibleLevels = useMemo(
    () => getVisibleLevelMeta(currentUser?.role),
    [currentUser?.role]
  );

  const levelCounts = useMemo(
    () =>
      visibleLevels.reduce((acc, levelMeta) => {
        const levelComments = filterCommentsByLevel(comments, levelMeta.id);
        acc[levelMeta.id] = countComments(levelComments);
        return acc;
      }, {}),
    [comments, visibleLevels]
  );

  const activeLevelMeta = COMMENT_LEVEL_META[activeLevel] || visibleLevels[0];
  const activeComments = useMemo(
    () => filterCommentsByLevel(comments, activeLevel),
    [comments, activeLevel]
  );

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentService.getReportComments(reportId);
      const data = response.data || [];
      setComments(data);
      onCountChange?.(response.meta?.count ?? countComments(data));
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveLevel(getDefaultCommentLevel(currentUser?.role));
  }, [currentUser?.role, reportId]);

  useEffect(() => {
    loadComments();
  }, [reportId]);

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    setCommentImages((prev) => [...prev, ...files].slice(0, 5));
    event.target.value = '';
  };

  const handleReplyImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    setReplyImages((prev) => [...prev, ...files].slice(0, 5));
    event.target.value = '';
  };

  const removeCommentImage = (index) => {
    setCommentImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeReplyImage = (index) => {
    setReplyImages((prev) => prev.filter((_, i) => i !== index));
  };

  const resetComposer = () => {
    setContent('');
    setCommentImages([]);
  };

  const resetReplyComposer = () => {
    setReplyContent('');
    setReplyImages([]);
    setReplyTo(null);
  };

  const handleReply = (comment) => {
    const level = normalizeStoredLevel(comment);
    setActiveLevel(level);
    setReplyTo(comment);
    setReplyContent('');
    setReplyImages([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!content.trim()) {
      showError('Please enter a comment');
      return;
    }

    const commentLevel = replyTo ? normalizeStoredLevel(replyTo) : activeLevel;

    try {
      setSubmitting(true);
      const response = await commentService.createComment(reportId, {
        content: content.trim(),
        parentId: null,
        commentLevel: activeLevel,
        images: commentImages,
      });

      if (response.success) {
        showSuccess('Comment posted successfully');
        resetComposer();
        await loadComments();
      } else {
        showError(response.message || 'Failed to post comment');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (event) => {
    event.preventDefault();

    if (!replyTo) {
      return;
    }

    if (!replyContent.trim()) {
      showError('Please enter a reply');
      return;
    }

    try {
      setSubmitting(true);
      const response = await commentService.createComment(reportId, {
        content: replyContent.trim(),
        parentId: replyTo.id,
        commentLevel: normalizeStoredLevel(replyTo),
        images: replyImages,
      });

      if (response.success) {
        showSuccess('Reply posted successfully');
        resetReplyComposer();
        await loadComments();
      } else {
        showError(response.message || 'Failed to post reply');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment and its replies?')) {
      return;
    }

    try {
      const response = await commentService.deleteComment(commentId);
      if (response.success) {
        showSuccess('Comment deleted successfully');
        await loadComments();
      } else {
        showError(response.message || 'Failed to delete comment');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500">
        <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visibleLevels.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {visibleLevels.map((levelMeta) => (
            <button
              key={levelMeta.id}
              type="button"
              onClick={() => {
                setActiveLevel(levelMeta.id);
                setReplyTo(null);
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                activeLevel === levelMeta.id
                  ? 'border-[#2f5d31] bg-[#2f5d31] text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {levelMeta.title} ({levelCounts[levelMeta.id] || 0})
            </button>
          ))}
        </div>
      )}

      {activeLevelMeta && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">{activeLevelMeta.title}</h4>
              <p className="mt-1 text-sm text-amber-800">{activeLevelMeta.description}</p>
            </div>
          </div>
        </div>
      )}

      <CommentComposer
        title={`Add comment in ${activeLevelMeta?.title || 'this level'}`}
        content={content}
        onContentChange={setContent}
        onSubmit={handleSubmit}
        submitting={submitting}
        images={commentImages}
        onImageChange={handleImageChange}
        onRemoveImage={removeCommentImage}
        submitLabel="Post Comment"
        placeholder="Write your comment for this level..."
      />

      {activeComments.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No comments in this level yet. Be the first to comment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={handleReply}
              onDelete={handleDelete}
              replyTo={replyTo}
              replyContent={replyContent}
              onReplyContentChange={setReplyContent}
              onReplySubmit={handleReplySubmit}
              replyImages={replyImages}
              onReplyImageChange={handleReplyImageChange}
              onReplyImageRemove={removeReplyImage}
              submittingReply={submitting}
              onCancelReply={resetReplyComposer}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { countComments };
export default ReportComments;
