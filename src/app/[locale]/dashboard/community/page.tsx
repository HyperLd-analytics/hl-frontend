"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/components/providers/toast-provider";
import { Heart, MessageSquare, Eye, Plus, Share2 } from "lucide-react";

type PostItem = {
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

type PostsResponse = {
  items: PostItem[];
  total: number;
  page: number;
  page_size: number;
};

const POST_TYPES = [
  { value: "", label: "全部" },
  { value: "analysis", label: "钱包分析" },
  { value: "strategy", label: "交易策略" },
  { value: "insight", label: "市场洞察" },
  { value: "discussion", label: "话题讨论" },
];

function PostCard({ post, locale, onLike, onShare }: { post: PostItem; locale: string; onLike: (id: string, liked: boolean) => void; onShare: (post: PostItem) => void }) {
  const t = useTranslations("common");
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    setLiking(true);
    try {
      await onLike(post.id, post.is_liked);
    } finally {
      setLiking(false);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/${locale}/dashboard/profile/${post.user?.id}`} className="flex items-center gap-2 hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold">
            {post.user?.username?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div>
            <p className="text-sm font-medium">{post.user?.username ?? "Anonymous"}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </Link>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {POST_TYPES.find((p) => p.value === post.post_type)?.label ?? post.post_type}
        </span>
      </div>

      <a href={`/${locale}/dashboard/community/${post.id}`} className="block">
        <h3 className="font-semibold hover:text-primary">{post.title}</h3>
        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{post.content}</p>
      </a>

      {post.wallet_address && (
        <div className="text-xs font-mono text-primary">
          关联钱包：{post.wallet_address.slice(0, 6)}...{post.wallet_address.slice(-4)}
        </div>
      )}

      {post.tags && (
        <div className="flex flex-wrap gap-1">
          {post.tags.split(",").map((tag) => (
            <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-xs">
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-border pt-2 text-sm text-muted-foreground">
        <button
          className={`flex items-center gap-1 transition-colors ${post.is_liked ? "text-red-500" : "hover:text-red-400"}`}
          onClick={handleLike}
          disabled={liking}
        >
          <Heart className={`h-4 w-4 ${post.is_liked ? "fill-current" : ""}`} />
          <span>{post.likes_count}</span>
        </button>
        <a
          href={`/${locale}/dashboard/community/${post.id}`}
          className="flex items-center gap-1 hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{post.comments_count}</span>
        </a>
        <span className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>{post.views_count}</span>
        </span>
        <button
          className="ml-auto flex items-center gap-1 hover:text-foreground"
          onClick={() => onShare(post)}
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

export default function CommunityPage() {
  const t = useTranslations("community");
  const locale = useLocale();
  const { request } = useApi();
  const { pushToast } = useToast();
  const [page, setPage] = useState(1);
  const [postType, setPostType] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createTags, setCreateTags] = useState("");
  const [creating, setCreating] = useState(false);

  const queryPath = `/community/posts?page=${page}&page_size=20${postType ? `&post_type=${postType}` : ""}`;
  const { data, loading, error, refetch } = useApiQuery<PostsResponse>(queryPath, {
    debounceMs: 300,
    staleTimeMs: 30_000,
  });

  const handleLike = async (id: string, currentlyLiked: boolean) => {
    try {
      const res = await request<{ liked: boolean; likes_count: number }>({
        path: `/community/posts/${id}/like`,
        method: "POST",
      });
      // Optimistically update
      if (data) {
        const item = data.items.find((i) => i.id === id);
        if (item) {
          item.is_liked = res.liked;
          item.likes_count = res.likes_count;
        }
      }
    } catch (e) {
      pushToast((e as Error).message, "error");
    }
  };

  const handleShare = async (post: PostItem) => {
    const url = `${window.location.origin}/${locale}/dashboard/community/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.content.slice(0, 100), url });
      } catch {
        // User cancelled or not supported
      }
    } else {
      await navigator.clipboard.writeText(url);
      pushToast("链接已复制到剪贴板");
    }
  };

  const handleCreate = async () => {
    if (!createTitle.trim() || !createContent.trim()) {
      pushToast("标题和内容不能为空", "error");
      return;
    }
    setCreating(true);
    try {
      await request({
        path: "/community/posts",
        method: "POST",
        body: JSON.stringify({
          title: createTitle,
          content: createContent,
          tags: createTags || undefined,
          post_type: "analysis",
        }),
      });
      setShowCreate(false);
      setCreateTitle("");
      setCreateContent("");
      setCreateTags("");
      pushToast(t("postCreated"));
      await refetch();
    } catch (e) {
      pushToast((e as Error).message, "error");
    } finally {
      setCreating(false);
    }
  };

  if (loading && !data) return <PageLoading />;
  if (error && !data) return <PageError message={error.message} onRetry={refetch} />;

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.page_size ?? 20)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("createPost")}
        </Button>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {POST_TYPES.map((type) => (
          <button
            key={type.value}
            className={`shrink-0 rounded-full px-3 py-1 text-sm transition-colors ${
              postType === type.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            onClick={() => {
              setPostType(type.value);
              setPage(1);
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* 新建帖子弹窗 */}
      {showCreate && (
        <Card className="space-y-3 p-4">
          <h2 className="font-semibold">{t("createPost")}</h2>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder={t("postTitlePlaceholder")}
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder={t("postContentPlaceholder")}
            rows={4}
            value={createContent}
            onChange={(e) => setCreateContent(e.target.value)}
          />
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder={t("tagsPlaceholder")}
            value={createTags}
            onChange={(e) => setCreateTags(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? t("publishing") : t("publish")}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              取消
            </Button>
          </div>
        </Card>
      )}

      {/* 帖子列表 */}
      <div className="space-y-3">
        {data?.items.length === 0 ? (
          <Card className="py-12 text-center text-muted-foreground">
            {t("noPosts")}
          </Card>
        ) : (
          data?.items.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} onLike={handleLike} onShare={handleShare} />
          ))
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
