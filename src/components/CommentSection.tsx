import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Comment } from '../types';
import { Send, Trash2, Reply, Loader2, User } from 'lucide-react';

interface CommentSectionProps {
  targetId: string;
  targetTitle?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ targetId, targetTitle }) => {
  const { user, profile, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('targetId', '==', targetId),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
      setLoading(false);
    }, (err) => {
      console.error('Comments load error:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [targetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const userName = profile?.displayName || user.displayName || user.email?.split('@')[0] || 'User';
      const userPhoto = profile?.photoURL || user.photoURL || '';

      // Save comment
      await addDoc(collection(db, 'comments'), {
        targetId,
        userId: user.uid,
        userName,
        userPhoto,
        text: newComment.trim(),
        parentId: replyTo?.id || null,
        createdAt: serverTimestamp(),
      });

      // ── Send notification to admin ──
      await addDoc(collection(db, 'notifications'), {
        recipientId: 'admin',
        title: `💬 New comment from ${userName}`,
        message: `"${newComment.trim().substring(0, 80)}${newComment.length > 80 ? '...' : ''}"${targetTitle ? ` on: ${targetTitle}` : ''}`,
        link: `/updates`,
        read: false,
        createdAt: serverTimestamp(),
      });

      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      console.error('Comment error:', err);
      alert('Failed to post comment. Please try again.');
    }
    setIsSubmitting(false);
  };

  const deleteComment = async (id: string) => {
    if (confirm('Delete this comment?')) {
      try {
        await deleteDoc(doc(db, 'comments', id));
      } catch (err) {
        alert('Failed to delete comment.');
      }
    }
  };

  const topLevelComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = user?.uid === comment.userId;
    const canDelete = isOwner || isAdmin;

    return (
      <div key={comment.id} className={`space-y-3 ${isReply ? '' : ''}`}>
        <div className={`flex gap-3 p-4 rounded-2xl border ${isReply ? 'bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/50' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800'}`}>
          <div className="flex-shrink-0">
            {comment.userPhoto ? (
              <img src={comment.userPhoto} className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover`} referrerPolicy="no-referrer" alt={comment.userName} />
            ) : (
              <div className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center`}>
                <span className="text-emerald-600 font-bold text-sm">{comment.userName?.[0]?.toUpperCase() || 'U'}</span>
              </div>
            )}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">{comment.userName}</span>
                {comment.userId === 'admin' && (
                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2 py-0.5 rounded-full">Admin</span>
                )}
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">
                  {comment.createdAt?.seconds
                    ? new Date(comment.createdAt.seconds * 1000).toLocaleString('en-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Just now'}
                </span>
              </div>
              {canDelete && (
                <button onClick={() => deleteComment(comment.id)} className="text-zinc-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1.5 leading-relaxed break-words">{comment.text}</p>
            {user && !isReply && (
              <button
                onClick={() => setReplyTo({ id: comment.id, name: comment.userName })}
                className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
              >
                <Reply className="w-3 h-3" /> Reply
              </button>
            )}
          </div>
        </div>

        {/* Replies */}
        {getReplies(comment.id).length > 0 && (
          <div className="ml-8 space-y-3">
            {getReplies(comment.id).map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : topLevelComments.length > 0 ? (
        <div className="space-y-4">
          {topLevelComments.map(c => renderComment(c))}
        </div>
      ) : (
        <div className="text-center py-10 text-zinc-400 text-sm">
          No comments yet. Be the first to discuss!
        </div>
      )}

      {/* Comment input */}
      {user ? (
        <form onSubmit={handleSubmit} className="relative">
          {replyTo && (
            <div className="flex items-center justify-between px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 text-xs text-emerald-600 rounded-t-xl border-x border-t border-emerald-100 dark:border-emerald-900/20">
              <span>↩ Replying to <strong>{replyTo.name}</strong></span>
              <button type="button" onClick={() => setReplyTo(null)} className="font-bold hover:text-red-500">✕ Cancel</button>
            </div>
          )}
          <div className={`flex gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 ${replyTo ? 'rounded-b-2xl border-t-0' : 'rounded-2xl'} focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all`}>
            {/* User avatar */}
            <div className="flex-shrink-0 mt-1">
              {(profile?.photoURL || user.photoURL) ? (
                <img src={profile?.photoURL || user.photoURL || ''} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" alt="You" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <span className="text-emerald-600 font-bold text-sm">{(profile?.displayName || user.email || 'U')[0].toUpperCase()}</span>
                </div>
              )}
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="flex-1 bg-transparent text-zinc-900 dark:text-white outline-none resize-none text-sm placeholder-zinc-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); }
              }}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="self-end p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 ml-1">Press Enter to send, Shift+Enter for new line</p>
        </form>
      ) : (
        <div className="p-6 text-center bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-zinc-500 text-sm">
          Please <a href="/login" className="text-emerald-600 font-bold hover:underline">Sign In</a> to join the discussion.
        </div>
      )}
    </div>
  );
};
