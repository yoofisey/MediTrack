"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { sb } from "@/lib/supabase";
import { useSwipe } from "@/lib/useSwipe";
import { MessageCircle, Heart, ThumbsUp, Send, Plus, Filter, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All", color: "var(--teal)" },
  { id: "general", label: "General", color: "#007AFF" },
  { id: "medication_tips", label: "Medication Tips", color: "#34C759" },
  { id: "wellness", label: "Wellness", color: "#AF52DE" },
  { id: "motivation", label: "Motivation", color: "#FF9500" },
  { id: "questions", label: "Questions", color: "#FF3B30" },
];

const REACTIONS = [
  { emoji: "❤️", key: "heart" },
  { emoji: "👍", key: "thumbsup" },
  { emoji: "💪", key: "strong" },
  { emoji: "🎉", key: "celebrate" },
];

const USER_EMOJIS = ["🧑‍⚕️", "👩‍⚕️", "🧑‍🔬", "👩‍💻", "🧑‍🎨", "👩‍🚀", "🧑‍🌾", "🦸", "🧙", "🦊", "🐱", "🐼", "🦋", "🌸", "⭐", "🌊"];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function fallbackEmoji(userId) {
  if (!userId) return USER_EMOJIS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  return USER_EMOJIS[Math.abs(hash) % USER_EMOJIS.length];
}

function UserAvatar({ userId, profileMap, size = 36 }) {
  const prof = profileMap?.[userId];
  const emoji = prof?.avatar_emoji || fallbackEmoji(userId);
  const imgUrl = prof?.avatar_url;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--ib1)", display: "grid", placeItems: "center", fontSize: size * 0.5, flexShrink: 0, overflow: "hidden" }}>
      {imgUrl ? <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : emoji}
    </div>
  );
}

function getCategoryColor(catId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  return cat?.color || "var(--teal)";
}

function getCategoryLabel(catId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  return cat?.label || catId;
}

export default function CommunityTab({ user, profile, onBack }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showComposer, setShowComposer] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [composerCategory, setComposerCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [profileMap, setProfileMap] = useState({});
  const composerRef = useRef(null);
  const commentInputRef = useRef(null);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Anonymous";

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await sb
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setPosts(data || []);
      const userIds = [...new Set((data || []).map(p => p.user_id).filter(Boolean))];
      if (userIds.length) {
        const { data: profiles } = await sb.from("profiles").select("id, avatar_emoji, avatar_url, full_name").in("id", userIds);
        if (profiles) {
          const map = {};
          profiles.forEach(p => { map[p.id] = p; });
          setProfileMap(map);
        }
      }
    } catch (e) {
      console.error("fetchPosts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filteredPosts = activeCategory === "all"
    ? posts
    : posts.filter(p => p.category === activeCategory);

  async function handlePost() {
    const text = composerText.trim();
    if (!text || !user?.id) return;
    setSubmitting(true);
    try {
      const { error } = await sb.from("community_posts").insert({
        user_id: user.id,
        content: text,
        category: composerCategory,
        reactions: {},
      });
      if (error) throw error;
      setComposerText("");
      setShowComposer(false);
      await fetchPosts();
    } catch (e) {
      console.error("handlePost:", e);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleReaction(postId, reactionKey) {
    if (!user?.id) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const reactions = { ...(post.reactions || {}) };
    const arr = Array.isArray(reactions[reactionKey]) ? reactions[reactionKey] : [];
    const userIdx = arr.indexOf(user.id);
    if (userIdx >= 0) {
      arr.splice(userIdx, 1);
    } else {
      arr.push(user.id);
    }
    reactions[reactionKey] = arr;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, reactions } : p));
    try {
      await sb.from("community_posts").update({ reactions }).eq("id", postId);
    } catch (e) {
      console.error("toggleReaction:", e);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, reactions: post.reactions } : p));
    }
  }

  async function fetchComments(postId) {
    if (comments[postId] !== undefined) {
      setExpandedPost(expandedPost === postId ? null : postId);
      return;
    }
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const { data, error } = await sb
        .from("community_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at");
      if (error) throw error;
      setComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (e) {
      console.error("fetchComments:", e);
      setComments(prev => ({ ...prev, [postId]: [] }));
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
      setExpandedPost(postId);
    }
  }

  async function submitComment(postId) {
    const text = commentText.trim();
    if (!text || !user?.id) return;
    setSubmittingComment(true);
    try {
      const { error } = await sb.from("community_comments").insert({
        user_id: user.id,
        post_id: postId,
        content: text,
      });
      if (error) throw error;
      setCommentText("");
      const { data } = await sb
        .from("community_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at");
      setComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (e) {
      console.error("submitComment:", e);
    } finally {
      setSubmittingComment(false);
    }
  }

  function handleRefresh() {
    setLoading(true);
    fetchPosts();
    setComments({});
    setExpandedPost(null);
  }

  const refreshSwipe = useSwipe({ onSwipeDown: handleRefresh, onSwipeRight: onBack });

  if (loading) {
    return (
      <div className="scroll">
        <div className="nav-large">Community</div>
        <div style={{ padding: "0 20px 24px" }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div className="skel-line skel-pulse" style={{ width: 36, height: 36, borderRadius: "50%" }} />
                <div style={{ flex: 1 }}>
                  <div className="skel-line skel-pulse" style={{ width: 90, height: 12, marginBottom: 4 }} />
                  <div className="skel-line skel-pulse" style={{ width: 50, height: 10 }} />
                </div>
              </div>
              <div className="skel-line skel-pulse" style={{ width: "100%", height: 14, marginBottom: 6 }} />
              <div className="skel-line skel-pulse" style={{ width: "70%", height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="scroll" {...refreshSwipe}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 8px 4px" }}>
        {onBack && <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",padding:6,color:"var(--teal)",display:"flex",alignItems:"center"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>}
        <div className="nav-large" style={{ padding: 0 }}>Community</div>
        <div style={{flex:1}}/>
        <button
          onClick={handleRefresh}
          style={{ background: "var(--ib1)", border: "none", borderRadius: 10, width: 36, height: 36, display: "grid", placeItems: "center", cursor: "pointer" }}
          aria-label="Refresh"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
        </button>
      </div>

      {/* Category chips */}
      <div style={{ padding: "8px 0 4px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "flex", gap: 8, padding: "0 20px", minWidth: "min-content" }}>
          {CATEGORIES.map(cat => {
            const isSel = activeCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all .2s",
                  background: isSel ? cat.color : "var(--card)",
                  color: isSel ? "white" : "var(--t2)",
                  border: `1.5px solid ${isSel ? cat.color : "var(--sep)"}`,
                  flexShrink: 0,
                }}
              >
                {cat.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* New Post Button / Composer */}
      <div style={{ padding: "12px 20px" }}>
        {!showComposer ? (
          <div
            onClick={() => setShowComposer(true)}
            className="card"
            style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
          >
            <UserAvatar userId={user?.id} profileMap={profileMap} />
            <div style={{ flex: 1, fontSize: 13, color: "var(--t3)" }}>Share something with the community...</div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--teal)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Plus size={18} color="white" strokeWidth={2.5} />
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <UserAvatar userId={user?.id} profileMap={profileMap} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{displayName}</div>
                <div style={{ fontSize: 11, color: "var(--t3)" }}>Posting publicly</div>
              </div>
            </div>
            <textarea
              ref={composerRef}
              value={composerText}
              onChange={e => setComposerText(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              style={{
                width: "100%",
                border: "1px solid var(--sep)",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 14,
                background: "var(--bg)",
                color: "var(--t1)",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
            {/* Category selector */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {CATEGORIES.filter(c => c.id !== "all").map(cat => {
                const isSel = composerCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setComposerCategory(cat.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: isSel ? cat.color + "20" : "var(--bg)",
                      color: isSel ? cat.color : "var(--t3)",
                      border: `1.5px solid ${isSel ? cat.color : "var(--sep)"}`,
                    }}
                  >
                    {cat.label}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowComposer(false); setComposerText(""); }}
                className="btn btn-ghost"
                style={{ fontSize: 13, padding: "8px 14px" }}
              >
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={!composerText.trim() || submitting}
                className="btn btn-primary"
                style={{
                  fontSize: 13,
                  padding: "8px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: !composerText.trim() || submitting ? 0.5 : 1,
                }}
              >
                <Send size={14} strokeWidth={2.5} />
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div style={{ padding: "50px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)", marginBottom: 6 }}>
            {activeCategory === "all" ? "Be the first to share something!" : "No posts in this category yet"}
          </div>
          <div style={{ fontSize: 13, color: "var(--t3)", lineHeight: 1.5 }}>
            {activeCategory === "all"
              ? "Share tips, encouragement, or ask questions. This is a safe space."
              : "Be the first to start a conversation here."}
          </div>
        </div>
      ) : (
        <div style={{ padding: "0 20px 24px" }}>
          {filteredPosts.map(post => {
            const reactions = post.reactions || {};
            const commentCount = comments[post.id]?.length;
            const isExpanded = expandedPost === post.id;
            const myUserId = user?.id;

            return (
              <div key={post.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <UserAvatar userId={post.user_id} profileMap={profileMap} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {post.user_id === myUserId ? "You" : (profileMap[post.user_id]?.full_name || `User ${post.user_id?.slice(0, 6)}`)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--t3)" }}>{timeAgo(post.created_at)}</div>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: getCategoryColor(post.category),
                    background: getCategoryColor(post.category) + "15",
                    padding: "3px 8px",
                    borderRadius: 99,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}>
                    {getCategoryLabel(post.category)}
                  </span>
                </div>

                {/* Content */}
                <div style={{ fontSize: 14, color: "var(--t1)", lineHeight: 1.55, marginBottom: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {post.content}
                </div>

                {/* Reactions */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8, position: "relative" }}>
                  {REACTIONS.map(r => {
                    const arr = Array.isArray(reactions[r.key]) ? reactions[r.key] : [];
                    const count = arr.length;
                    const myReacted = myUserId && arr.includes(myUserId);
                    return (
                      <button
                        key={r.key}
                        onClick={() => toggleReaction(post.id, r.key)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 8px",
                          borderRadius: 99,
                          border: `1.5px solid ${myReacted ? "var(--teal)" : "var(--sep)"}`,
                          background: myReacted ? "var(--ib1)" : "transparent",
                          cursor: "pointer",
                          fontSize: 13,
                          transition: "all .15s",
                        }}
                      >
                        <span>{r.emoji}</span>
                        {count > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: myReacted ? "var(--teal)" : "var(--t3)" }}>{count}</span>}
                      </button>
                    );
                  })}

                  <div style={{ flex: 1 }} />

                  {/* Comment toggle */}
                  <button
                    onClick={() => fetchComments(post.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 8px",
                      borderRadius: 99,
                      border: `1.5px solid ${isExpanded ? "var(--teal)" : "var(--sep)"}`,
                      background: isExpanded ? "var(--ib1)" : "transparent",
                      cursor: "pointer",
                      fontSize: 12,
                      color: isExpanded ? "var(--teal)" : "var(--t3)",
                    }}
                  >
                    <MessageCircle size={14} />
                    {commentCount != null && <span style={{ fontWeight: 600 }}>{commentCount}</span>}
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                {/* Comments section */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--sep)", paddingTop: 10 }}>
                    {loadingComments[post.id] ? (
                      <div style={{ textAlign: "center", padding: 12 }}>
                        <div className="skel-line skel-pulse" style={{ width: 60, height: 12, margin: "0 auto" }} />
                      </div>
                    ) : (
                      <>
                        {(comments[post.id] || []).length === 0 && (
                          <div style={{ fontSize: 12, color: "var(--t3)", textAlign: "center", padding: 8 }}>
                            No comments yet. Be the first to respond!
                          </div>
                        )}
                        {(comments[post.id] || []).map(c => (
                          <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                            <UserAvatar userId={c.user_id} profileMap={profileMap} size={26} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)" }}>
                                  {c.user_id === myUserId ? "You" : `User ${c.user_id?.slice(0, 6)}`}
                                </span>
                                <span style={{ fontSize: 10, color: "var(--t3)" }}>{timeAgo(c.created_at)}</span>
                              </div>
                              <div style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.45, marginTop: 2, wordBreak: "break-word" }}>
                                {c.content}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Comment input */}
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                            <UserAvatar userId={user?.id} profileMap={profileMap} size={26} />
                          <input
                            ref={commentInputRef}
                            type="text"
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(post.id); } }}
                            placeholder="Write a comment..."
                            style={{
                              flex: 1,
                              border: "1px solid var(--sep)",
                              borderRadius: 99,
                              padding: "7px 12px",
                              fontSize: 12,
                              background: "var(--bg)",
                              color: "var(--t1)",
                              outline: "none",
                            }}
                          />
                          <button
                            onClick={() => submitComment(post.id)}
                            disabled={!commentText.trim() || submittingComment}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              border: "none",
                              background: commentText.trim() ? "var(--teal)" : "var(--ib1)",
                              display: "grid",
                              placeItems: "center",
                              cursor: commentText.trim() ? "pointer" : "default",
                              flexShrink: 0,
                              transition: "background .15s",
                            }}
                          >
                            <Send size={14} color={commentText.trim() ? "white" : "var(--t3)"} strokeWidth={2.5} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Safe space notice */}
      <div style={{ padding: "0 20px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--t3)", lineHeight: 1.5 }}>
          This is a moderated, anonymous-friendly space. No personal health data is shared. Be kind and supportive.
        </div>
      </div>
    </div>
  );
}
