"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { toast } from "react-toastify";
import {
  FileText,
  Heart,
  Share2,
  ChevronRight,
  Loader2,
  AlertCircle,
  User,
  ArrowUp,
} from "lucide-react";
import "../../admin/components/Blog-Componenets/Blog.css";
import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function BlogDetail() {
  const params = useParams();
  const router = useRouter();
  const blogId = params?.id;

  const { user } = useAuth();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const [localViews, setLocalViews] = useState(0);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  // near the other useState() lines
  const [replyingTo, setReplyingTo] = useState(null); // commentId currently replying to
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    if (blogId) fetchBlog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]);

  useEffect(() => {
    // Update document title when blog loads
    if (blog?.title) document.title = `${blog.title} | My Blog`;
  }, [blog]);

  useEffect(() => {
    // reading progress
    const onScroll = () => {
      const article = document.querySelector("article.prose");
      if (!article) return setReadingProgress(0);
      const rect = article.getBoundingClientRect();
      const height = article.scrollHeight - window.innerHeight;
      const scrolled = Math.min(
        Math.max(window.scrollY - (article.offsetTop - 80), 0),
        height || 1,
      );
      const percent = height > 0 ? Math.round((scrolled / height) * 100) : 0;
      setReadingProgress(percent);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [blog]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/blog/${blogId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Blog not found");
      setBlog(data.blog);
      setLocalLikes(data.blog?.likes.count || 0);
      setLocalViews(data.blog?.views || 0);
    } catch (err) {
      console.error("Error fetching blog:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = (imageSrc) => {
    if (!imageSrc)
      return "https://placehold.co/900x600/FFB6C1/FFFFFF?text=Pink+Dreams";
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
      return imageSrc;
    }

    if (imageSrc.startsWith("/images/")) {
      return `${baseURL}${imageSrc}`;
    }

    // fallback
    return `${baseURL}/images/${imageSrc}`;
  };

  const sanitizeHTML = (dirty) => {
    try {
      return { __html: dirty };
    } catch (e) {
      return { __html: "" };
    }
  };

  const handleShare = async () => {
    if (!blog) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.shortDescription || blog.metaDescription,
          url,
        });
      } catch (err) {
        console.log("Share canceled or failed:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Blog URL copied to clipboard!", { autoClose: 2000 });
    }
  };

  const handleLike = async () => {
    if (!user) return toast.error("Log in to like this blog!");
    if (!blog) return;
    try {
      setIsLiking(true);
      const res = await fetch(`${API_BASE}/blog/${blog?._id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();

      if (data.success == true) {
        if (data?.liked) setLocalLikes((prev) => prev + 1);
        if (!data?.liked) setLocalLikes((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Like failed:", err);
      setLocalLikes((prev) => Math.max(0, prev - 1));
      toast.error("Failed to like. Try again.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Log in to comment on this blog!");
    if (!blog?.commentsEnabled) return toast.error("Comments are disabled.");

    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const payload = {
        text: commentText.trim(),
        user: user,
      };
      const res = await fetch(`${API_BASE}/blog/${blog?._id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result.success)
        throw new Error(result.message || "Failed");
      fetchBlog();
      setCommentText("");
      commentInputRef.current?.blur();
      toast.success("Comment submitted!");
    } catch (err) {
      console.error("Comment err:", err);
      toast.error("Failed to post comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (commentId) => {
    if (!user) return toast.error("Log in to reply to this comment.");
    if (!blog?.commentsEnabled) return toast.error("Comments are disabled.");
    if (!replyText.trim()) return toast.error("Reply cannot be empty.");

    try {
      setReplyLoading(true);

      const payload = {
        text: replyText.trim(),
        user: user, // your backend expects a user object
      };

      const res = await fetch(
        `${API_BASE}/blogs/${blog?._id}/comments/${commentId}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to post reply");
      }

      // Optimistically update local comment list so we don't re-fetch whole blog (better UX)
      setBlog((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.comments = (updated.comments || []).map((c) => {
          if (String(c._id) === String(commentId)) {
            // backend returns nothing (or you can return the new reply). We'll append a minimal reply object
            const newReply = {
              _id: result.replyId || new Date().toISOString(), // prefer backend id, fallback temporary id
              user: user,
              text: replyText.trim(),
              createdAt: new Date().toISOString(),
            };
            // ensure replies array exists
            const replies = c.replies ? [...c.replies, newReply] : [newReply];
            return { ...c, replies };
          }
          return c;
        });
        return updated;
      });

      setReplyText("");
      setReplyingTo(null);
      toast.success("Reply posted");
    } catch (err) {
      console.error("Reply err:", err);
      toast.error("Failed to post reply");
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading article...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              Article Not Found
            </h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {error || "The article you are looking for does not exist."}
            </p>
            <Link
              href="/blog"
              className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm sm:text-base"
            >
              Back to Blog
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const {
    title,
    shortDescription,
    content,
    author,
    category,
    tags = [],
    image,
    featured,
    trending,
    publishedAt,
    readTime,
    likes,
    views,
    comments = [],
    commentsEnabled,
  } = blog;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
        <div className="h-1 bg-transparent">
          <div
            className="h-1 bg-pink-500 transition-all"
            style={{ width: `${readingProgress}%` }}
            aria-hidden
          />
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 overflow-x-auto">
            <Link href="/" className="hover:text-pink-600 whitespace-nowrap">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href="/blog"
              className="hover:text-pink-600 whitespace-nowrap"
            >
              Blog
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">
              {title}
            </span>
          </nav>
        </div>
      </div>

      <main className="py-8 sm:py-12">
        <div className="container mx-auto ">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:px-2">
            {/* Main content */}
            <article className="lg:col-span-8 bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Hero */}
              <div className="relative">
                <div className="relative overflow-hidden w-full h-64 sm:h-80 md:h-96">
                  <Image
                    src={image}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw,
           (max-width: 1024px) 100vw,
           50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority={false}
                  />
                </div>

                {/* small badges - overlaid */}
                <div className="absolute top-4 left-4 flex space-x-2">
                  {featured && (
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Featured
                    </span>
                  )}
                  {trending && (
                    <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Trending
                    </span>
                  )}
                </div>

                {/* compact meta - mobile */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between bg-white/80 backdrop-blur rounded-lg p-3 shadow-sm lg:hidden">
                  <div className="flex items-center space-x-3">
                    {/* <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100">
                      <img
                        src={author?.profileImage || ""}
                        alt={author?.name || "Author"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/80x80/FFB6C1/FFFFFF?text=U";
                        }}
                      />
                    </div> */}
                    <div className="relative rounded-full overflow-hidden bg-gray-100 w-9 h-9">
                      <Image
                        src={author?.profileImage}
                        alt={author?.name}
                        fill
                        sizes="(max-width: 640px) 100vw,
           (max-width: 1024px) 100vw,
           50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        priority={false}
                      />
                    </div>
                    <div className="text-xs">
                      <div className="font-medium text-gray-800">
                        {author?.name || "Unknown"}
                      </div>
                      <div className="text-gray-500">
                        {readTime || 1} min •{" "}
                        {new Date(publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      aria-label="Like"
                      onClick={handleLike}
                      disabled={isLiking}
                      className="flex items-center space-x-1 px-2 py-1 border rounded-md hover:border-pink-500"
                    >
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm">{localLikes}</span>
                    </button>
                    <button
                      aria-label="Share"
                      onClick={handleShare}
                      className="p-2 border rounded-md"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-5 space-y-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  {title}
                </h1>

                {/* <div className="hidden lg:flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                      <img src={author?.profileImage || ""} alt={author?.name || "Author"} className="w-full h-full object-cover" onError={(e)=>{e.target.src = "https://placehold.co/80x80/FFB6C1/FFFFFF?text=U"}} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{author?.name || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{author?.bio || ""}</div>
                    </div>
                    <div className="text-xs text-gray-500 ml-4">{new Date(publishedAt).toLocaleDateString()} • {readTime || 1} min read</div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button aria-label="Like" onClick={handleLike} disabled={isLiking} className="flex items-center space-x-2 px-3 py-2 border rounded-lg hover:border-pink-500 transition-all">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm">{localLikes}</span>
                    </button>

                    <button aria-label="Share" onClick={handleShare} className="p-2 border rounded-lg hover:border-gray-300">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div> */}

                {shortDescription && (
                  <p className="text-gray-700 text-sm sm:text-base">
                    {shortDescription}
                  </p>
                )}

                {/* article content */}
                <div className="prose max-w-none lg:prose-lg">
                  <div
                    className="blog-content"
                    dangerouslySetInnerHTML={sanitizeHTML(content || "")}
                  />
                </div>

                {/* comments */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Comments ({comments.length})
                  </h3>

                  {/* comment form */}
                  {commentsEnabled ? (
                    <form
                      onSubmit={handleSubmitComment}
                      className="space-y-3 mb-4"
                    >
                      <textarea
                        ref={commentInputRef}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write your comment..."
                        className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Be respectful. Your comment will be visible to others.
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmittingComment}
                          className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                        >
                          {isSubmittingComment ? "Posting..." : "Post Comment"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mb-4 text-sm text-gray-700 border rounded-lg bg-gray-100 py-3 px-2">
                      Comments are disabled for this post.
                    </div>
                  )}

                  {/* comments list */}
                  <div className="space-y-3">
                    {comments.length === 0 && (
                      <p className="text-sm text-gray-600">
                        No comments yet. Be the first to comment!
                      </p>
                    )}

                    {!isSubmittingComment &&
                      comments.map((c) => (
                        <div key={c._id} className="border rounded-lg p-3 w-full relative">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-gray-800">
                                  {c?.user?.name || "Anonymous"}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(c?.createdAt).toLocaleString()}
                                </div>
                              </div>

                              <div className="text-sm text-gray-700 mt-1">
                                {c?.text}
                              </div>

                              {/* reply controls */}
                              <div className="mt-3 flex items-center gap-3">
                                {commentsEnabled && (
                                  <button
                                    onClick={() =>
                                      setReplyingTo(
                                        replyingTo === c._id ? null : c._id,
                                      )
                                    }
                                    className="text-xs text-pink-600 hover:underline"
                                  >
                                    Reply
                                  </button>
                                )}
                                <div className="text-xs text-gray-400">
                                  {/* keep like/time actions here if needed */}
                                </div>
                              </div>

                              {/* reply input (single open at a time) */}
                              {replyingTo === c._id && commentsEnabled && (
                                <div className="mt-3">
                                  <textarea
                                    value={replyText}
                                    onChange={(e) =>
                                      setReplyText(e.target.value)
                                    }
                                    placeholder="Write your reply..."
                                    className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                                    rows={2}
                                  />
                                  <div className="mt-2 flex items-center gap-2">
                                    <button
                                      onClick={() => handleReplySubmit(c._id)}
                                      disabled={replyLoading}
                                      className="bg-pink-600 text-white px-3 py-1 rounded text-sm disabled:opacity-60"
                                    >
                                      {replyLoading
                                        ? "Posting..."
                                        : "Post Reply"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplyText("");
                                        setReplyingTo(null);
                                      }}
                                      className="text-sm text-gray-500 px-3 py-1 rounded"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* replies list (single-level) */}
                              {c.replies && c.replies.length > 0 && (
                                <div className="mt-4 flex  w-full">
                                <div className="border-l pl-2 sm:pl-4 space-y-3 w-[40%]">
                                  {c.replies.map((r) => (
                                    <div key={r._id} className="pb-2">
                                      <div className="flex items-center justify-between">
                                        <div className="sm:text-sm text-xs font-medium text-gray-800">
                                          {r?.user?.name || "Anonymous"}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          {new Date(
                                            r?.createdAt,
                                          ).toLocaleString()}
                                        </div>
                                      </div>
                                      <div className="sm:text-sm text-xs text-gray-700 mt-1 whitespace-normal break-words w-[70%]">
                                        {r?.text}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </article>

            {/* Right sidebar (meta) */}
            <aside className="lg:col-span-4">
              <div className="sticky top-36 space-y-4">
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex flex-col items-center space-y-4">
                    {/* <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100">
                      <img
                        src={author?.profileImage || ""}
                        alt={author?.name || "Author"}
                        className="w-full h-full object-cover border"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/80x80/FFB6C1/FFFFFF?text=U";
                        }}
                      />
                    </div> */}
                    <div className="relative rounded-full overflow-hidden bg-gray-100 w-14 h-14">
                      <Image
                        src={author?.profileImage}
                        alt={author?.name}
                        fill
                        sizes="(max-width: 640px) 100vw,
           (max-width: 1024px) 100vw,
           50vw"
                        className="object-cover border transition-transform duration-300 group-hover:scale-105"
                        priority={false}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">
                        {author?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500 text-justify">
                        {author?.bio || ""}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="font-medium text-gray-800">
                        {readTime || 1} min
                      </div>
                      <div className="text-xs text-gray-500">Read</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {localViews}
                      </div>
                      <div className="text-xs text-gray-500">Views</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {localLikes}
                      </div>
                      <div className="text-xs text-gray-500">Likes</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-2">
                    <button
                      onClick={handleLike}
                      disabled={isLiking}
                      className="flex-1 flex items-center justify-center px-3 py-2 border rounded-md hover:border-pink-500"
                    >
                      <Heart className="w-4 h-4 text-red-500 mr-2" /> Like
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 border rounded-md"
                      aria-label="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* category & tags */}
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="text-xs text-gray-500">Category</div>
                  <div className="mt-1 font-medium text-gray-800 flex items-center space-x-2">
                    <FileText className="w-4 h-4" />{" "}
                    <span>{category || "Misc"}</span>
                  </div>

                  <div className="text-xs text-gray-500 mt-3">Tags</div>
                  {tags && tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((t, i) => (
                        <p
                          key={i}
                          // href={`/blog?tag=${encodeURIComponent(t)}`}
                          className="bg-pink-50 text-pink-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-pink-100 transition-colors duration-200"
                        >
                          #{t}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* quick nav */}
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-800">
                    Quick actions
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                      className="text-sm flex items-center gap-2 px-3 py-2 border rounded-md"
                    >
                      {" "}
                      <ArrowUp className="w-4 h-4" /> Back to top
                    </button>
                    <Link
                      href="/blog"
                      className="text-sm flex items-center gap-2 px-3 py-2 border rounded-md"
                    >
                      {" "}
                      <ChevronRight className="w-4 h-4" /> Browse all posts
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
