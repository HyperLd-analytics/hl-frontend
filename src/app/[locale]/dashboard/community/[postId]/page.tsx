"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/components/providers/toast-provider";
import { Heart, MessageSquare, Eye, Share2, ArrowLeft } from "lucide-react";
import Link from "next/link";

type CommentItem = {
  id: string;
  content: string;
  replies_count: number;
  created_at: string;
  user: { id: string; username: string; avatar_url: string | null } | null;
  replies: {
    id: string;
    content: string;
    created_at: string;
    user: { id: string; username: string; avatar_url: string | null } | null;
  }[];
};

type PostDetail = {
  id: string;
  title: string;
  content: string;
  post_type: string;
  wallet_address: string | null;
  tags: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  is_liked: boolean;
  created_at: string;
  user: { id: string; username: string; avatar_url: string | null } | null;
};

type CommentsResponse = {
  items: CommentItem[];
  total: number;
  page: number;
  page_size: number;
};

export default function PostDetailPage() {
  const t = useTranslations("community");
  const locale = useLocale();
  const params = useParams();
  const postId = params.postId as string;
  const { request } = useApi();
  const { pushToast } = useToast();

  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticLikes, setOptimisticLikes] = useState<number | null>(null);

  const { data: post, loading: postLoading, error: postError, refetch: refetchPost } = useApiQuery<PostDetail>(
    `/community/posts/${postId}`
  );
  const { data: comments, loading: commentsLoading, refetch: refetchComments } = useApiQuery<CommentsResponse>(
    `/community/comments/post/${postId}`
  );

  const displayLiked = optimisticLiked ?? post?.is_liked ?? false;
  const displayLikes = optimisticLikes ?? post?.likes_count ?? 0;

  const handleLike = async () => {
    if (!post) return;
    const prevLiked = displayLiked;
    const prevCount = displayLikes;
    // Optimistic update
    setOptimisticLiked(!prevLiked);
    setOptimisticLikes(prevLiked ? prevCount - 1 : prevCount + 1);
    try {
      const res = await request<{ liked: boolean; likes_count: number }>({
        path: `/community/posts/${postId}/like`,
        method: "POST",
      });
      setOptimisticLiked(res.liked);
      setOptimisticLikes(res.likes_count);
    } catch {
      // Revert
      setOptimisticLiked(prevLiked);
      setOptimisticLikes(prevCount);
      pushToast("操作失败", "error");
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await request({
        path: `/community/comments/post/${postId}`,
        method: "POST",
        body: JSON.stringify({ content: commentText }),
      });
      setCommentText("");
      pushToast(t("commentAdded"));
      await refetchComments();
      await refetchPost();
    } catch (e) {
      pushToast((e as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title, url });
      } catch {
        // Cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      pushToast("链接已复制");
    }
  };

  if (postLoading) return <PageLoading />;
  if (postError) return <PageError message={postError.message} onRetry={refetchPost} />;
  if (!post) return null;

  return (
    <div className="space-y-4">
      <Link href={`/${locale}/dashboard/community`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <Card className="p-6 space-y-4">
        {/* 头部 */}
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard/profile/${post.user?.id}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold hover:opacity-80">
            {post.user?.username?.[0]?.toUpperCase() ?? "A"}
          </Link>
          <div>
            <Link href={`/${locale}/dashboard/profile/${post.user?.id}`} className="font-medium hover:text-primary">
              {post.user?.username ?? "Anonymous"}
            </Link>
            <p className="text-xs text-muted-foreground">
              {new Date(post.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-bold">{post.title}</h1>

        <div className="prose prose-invert max-w-none text-sm">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>

        {post.wallet_address && (
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">关联钱包</p>
            <Link
              href={`/${locale}/dashboard/wallet/${post.wallet_address}`}
              className="font-mono text-sm text-primary hover:underline"
            >
              {post.wallet_address}
            </Link>
          </div>
        )}

        {post.tags && (
          <div className="flex flex-wrap gap-1">
            {post.tags.split(",").map((tag) => (
              <span key={tag} className="rounded bg-muted px-2 py-0.5 text-xs">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* 操作栏 */}
        <div className="flex items-center gap-4 border-t border-border pt-3 text-sm text-muted-foreground">
          <button
            className={`flex items-center gap-1 transition-colors ${displayLiked ? "text-red-500" : "hover:text-red-400"}`}
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 ${displayLiked ? "fill-current" : ""}`} />
            <span>{displayLikes}</span>
          </button>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{post.comments_count}</span>
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{post.views_count}</span>
          </span>
          <button className="ml-auto flex items-center gap-1 hover:text-foreground" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            分享
          </button>
        </div>
      </Card>

      {/* 评论区 */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold">{t("comments")} ({comments?.total ?? 0})</h2>

        {/* 评论输入 */}
        <div className="space-y-2">
          <textarea
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder={t("commentPlaceholder")}
            rows={2}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <Button size="sm" onClick={handleComment} disabled={submitting || !commentText.trim()}>
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </div>

        {/* 评论列表 */}
        {commentsLoading && !comments ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : comments?.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noComments")}</p>
        ) : (
          <div className="space-y-3">
            {comments?.items.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  <Link href={`/${locale}/dashboard/profile/${comment.user?.id}`} className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold hover:opacity-80">
                    {comment.user?.username?.[0]?.toUpperCase() ?? "A"}
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/${locale}/dashboard/profile/${comment.user?.id}`} className="text-sm font-medium hover:text-primary">
                        {comment.user?.username ?? "Anonymous"}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{comment.content}</p>
                  </div>
                </div>

                {/* 子评论 */}
                {comment.replies?.length > 0 && (
                  <div className="ml-9 space-y-2 border-l-2 border-border pl-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2">
                        <Link href={`/${locale}/dashboard/profile/${reply.user?.id}`} className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold hover:opacity-80">
                          {reply.user?.username?.[0]?.toUpperCase() ?? "A"}
                        </Link>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/${locale}/dashboard/profile/${reply.user?.id}`} className="text-xs font-medium hover:text-primary">
                              {reply.user?.username ?? "Anonymous"}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
