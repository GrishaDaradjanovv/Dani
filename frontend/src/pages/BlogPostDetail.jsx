import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MessageCircle, ArrowLeft, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { API } from '@/App';

const BlogPostDetail = ({ auth }) => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`${API}/blog/${postId}`);
      if (!response.ok) throw new Error('Post not found');
      const data = await response.json();
      setPost(data);
    } catch (error) {
      toast.error('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API}/blog/${postId}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!auth.user) {
      toast.error('Please log in to comment');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      const response = await fetch(`${API}/blog/${postId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: newComment }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const comment = await response.json();
      setComments([...comments, comment]);
      setNewComment('');
      toast.success('Comment posted!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderContent = (content) => {
    // Simple markdown-like rendering
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('## ')) {
        return <h2 key={index} className="font-heading text-2xl text-deep-navy mt-8 mb-4">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="font-heading text-xl text-deep-navy mt-6 mb-3">{line.slice(4)}</h3>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="text-terracotta font-medium my-2">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 text-deep-navy/70 mb-2">{line.slice(2)}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="text-deep-navy/70 leading-relaxed mb-4">{line}</p>;
    });
  };

  if (loading) {
    return (
      <Layout auth={auth}>
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="aspect-[21/9] bg-muted rounded-3xl" />
            <div className="h-12 bg-muted rounded w-3/4" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) return null;

  return (
    <Layout auth={auth}>
      <article className="container mx-auto px-6 py-8 max-w-4xl" data-testid="blog-post-detail">
        {/* Back button */}
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 text-deep-navy/60 hover:text-deep-navy mb-8 transition-colors"
          data-testid="back-to-blog"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Cover Image */}
        <div className="aspect-[21/9] rounded-3xl overflow-hidden mb-8">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="category-badge">{post.category}</span>
            <div className="flex items-center gap-2 text-deep-navy/60 text-sm">
              <Calendar className="w-4 h-4" />
              {formatDate(post.created_at)}
            </div>
            <div className="flex items-center gap-2 text-deep-navy/60 text-sm">
              <User className="w-4 h-4" />
              {post.author_name}
            </div>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-deep-navy leading-tight" data-testid="post-title">
            {post.title}
          </h1>
        </header>

        {/* Content */}
        <div className="prose max-w-none mb-16" data-testid="post-content">
          {renderContent(post.content)}
        </div>

        {/* Comments Section */}
        <section className="border-t border-border pt-12" data-testid="comments-section">
          <h2 className="font-heading text-2xl text-deep-navy mb-8 flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-terracotta" />
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-8" data-testid="comment-form">
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-deep-navy/5">
              {auth.user ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center text-white font-medium">
                      {auth.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-deep-navy font-medium">{auth.user.name}</span>
                  </div>
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-4 min-h-[100px] rounded-xl border-border resize-none"
                    data-testid="comment-input"
                  />
                  <Button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-6"
                    data-testid="submit-comment-btn"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-deep-navy/60 mb-4">Please log in to leave a comment</p>
                  <Link to="/login">
                    <Button className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-6">
                      Log In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-center text-deep-navy/60 py-8">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              comments.map((comment, index) => (
                <div 
                  key={comment.comment_id} 
                  className="bg-white rounded-2xl p-6 shadow-md shadow-deep-navy/5"
                  data-testid={`comment-${index}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center text-sage font-medium">
                      {comment.user_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-deep-navy">{comment.user_name}</p>
                      <p className="text-xs text-deep-navy/50">{formatDate(comment.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-deep-navy/70 leading-relaxed">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </article>
    </Layout>
  );
};

export default BlogPostDetail;
