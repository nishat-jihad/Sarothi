import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Comment } from '../types';
import { Send, Trash2, Edit, Reply, Loader2, User } from 'lucide-react';

interface CommentSectionProps {
  targetId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ targetId }) => {
  const { user, profile, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('targetId', '==', targetId),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    });
    return () => unsubscribe();
  }, [targetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        targetId,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'User',
        userPhoto: profile?.photoURL || user.photoURL || '',
        text: newComment,
        parentId: replyTo || null,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      console.error(err);
      alert('Failed to post comment');
    }
    setIsSubmitting(false);
  };

  const deleteComment = async (id: string) => {
    if (confirm('Delete this comment?')) await deleteDoc(doc(db, 'comments', id));
  };

  const renderComment = (comment: Comment) => {
    const isOwner = user?.uid === comment.userId;
    const canManage = isOwner || isAdmin;

    return (
      <div key={comment.id} className="space-y-4">
        <div className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="flex-shrink-0">
            {comment.userPhoto ? (
              <img src={comment.userPhoto} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center"><User className="w-5 h-5 text-zinc-400" /></div>
            )}
          </div>
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm font-bold text-zinc-900 dark:text-white">{comment.userName}</span>
                <span className="text-[10px] text-zinc-400 ml-2 uppercase tracking-widest">
                  {comment.createdAt?.seconds ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                </span>
              </div>
              {canManage && (
                <button onClick={() => deleteComment(comment.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">{comment.text}</p>
            <div className="flex gap-4 mt-4">
              <button onClick={() => setReplyTo(comment.id)} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline">
                <Reply className="w-3 h-3" /> Reply
              </button>
            </div>
          </div>
        </div>
        
        {/* Replies */}
        <div className="ml-12 space-y-4">
          {comments.filter(c => c.parentId === comment.id).map(renderComment)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {comments.filter(c => !c.parentId).map(renderComment)}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="relative">
          {replyTo && (
            <div className="flex items-center justify-between px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 text-xs text-emerald-600 rounded-t-xl border-x border-t border-emerald-100 dark:border-emerald-900/20">
              <span>Replying to comment...</span>
              <button type="button" onClick={() => setReplyTo(null)} className="font-bold">Cancel</button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className={`w-full p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[100px] ${replyTo ? 'rounded-b-2xl' : 'rounded-2xl'}`}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="absolute bottom-4 right-4 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      ) : (
        <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-zinc-500">
          Please <button onClick={() => window.location.href = '/login'} className="text-emerald-600 font-bold hover:underline">Sign In</button> to leave a comment.
        </div>
      )}
    </div>
  );
};
