"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { PageError } from "@/components/common/page-error";
import { PageLoading } from "@/components/common/page-loading";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/components/providers/toast-provider";
import { Heart, MessageSquare, Eye, ArrowLeft, Users } from "lucide-react";

type UserProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  wallet_address: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
  is_self: boolean;
};

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

type Tab = "posts" | "followers" | "following";

export default function UserProfilePage() {
  const t = useTranslations("community");
  const locale = useLocale();
  const params = useParams();
  const userId = params.userId as string;
  const { request } = useApi();
  const { pushToast } = useToast();
  const [tab, setTab] = useState<Tab | null>("posts");
  const [postsPage, setPostsPage] = useState(1);
  const [followPage, setFollowPage] = useState(1);
  const [followTab, setFollowTab] = useState<"followers" | "following">("followers");

  const { data: profile, loading: profileLoading, error: profileError, refetch: refetchProfile } =
    useApiQuery<UserProfile>(`/community/users/${userId}`);

  const postsQueryPath = `/community/posts/user/${userId}?page=${postsPage}&page_size=10`;
  const { data: posts, loading: postsLoading, refetch: refetchPosts } =
    useApiQuery<PostsResponse>(postsQueryPath, { enabled: tab === "posts" });

  const followersPath = `/community/users/${userId}/followers?page=${followPage}&page_size=20`;
  const followingPath = `/community/users/${userId}/following?page=${followPage}&page_size=20`;
  const { data: followers, loading: followersLoading, refetch: refetchFollowers } =
    useApiQuery<{ items: any[]; total: number }>(followersPath, { enabled: tab === "followers" });
  const { data: following, loading: followingLoading, refetch: refetchFollowing } =
    useApiQuery<{ items: any[]; total: number }>(followingPath, { enabled: tab === "following" });

  const handleFollow = async () => {
    if (!profile) return;
    try {
      const res = await request<{ following: boolean }>({
        path: `/community/follows/${userId}`,
        method: profile.is_following ? "DELETE" : "POST",
      });
      pushToast(res.following ? "已关注" : "已取消关注");
      await refetchProfile();
    } catch (e) {
      pushToast((e as Error).message, "error");
    }
  };

  const handleFollowUser = async (targetUserId: string, currentlyFollowing: boolean) => {
    try {
      await request({
        path: `/community/follows/${targetUserId}`,
        method: currentlyFollowing ? "DELETE" : "POST",
      });
      await refetchFollowers();
      await refetchFollowing();
      await refetchProfile();
    } catch (e) {
      pushToast((e as Error).message, "error");
    }
  };

  if (profileLoading) return <PageLoading />;
  if (profileError) return <PageError message={profileError.message} onRetry={refetchProfile} />;
  if (!profile) return null;

  return (
    <div className="space-y-4">
      <Link href={`/${locale}/dashboard/community`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      {/* 用户资料卡片 */}
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-xl font-bold">
              {profile.username?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div>
              <h1 className="text-xl font-bold">{profile.username}</h1>
              {profile.wallet_address && (
                <Link
                  href={`/${locale}/dashboard/wallet/${profile.wallet_address}`}
                  className="text-xs font-mono text-primary hover:underline"
                >
                  {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
                </Link>
              )}
            </div>
          </div>
          {!profile.is_self && (
            <Button size="sm" variant={profile.is_following ? "outline" : "default"} onClick={handleFollow}>
              {profile.is_following ? "已关注" : "关注"}
            </Button>
          )}
        </div>

        {/* 统计数据 */}
        <div className="flex gap-6 text-sm">
          <button
            className={`flex flex-col items-center gap-1 ${tab === "posts" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab("posts")}
          >
            <span className="font-bold">{profile.posts_count}</span>
            <span>帖子</span>
          </button>
          <button
            className={`flex flex-col items-center gap-1 ${tab === "followers" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setTab("followers"); setFollowTab("followers"); }}
          >
            <span className="font-bold">{profile.followers_count}</span>
            <span>粉丝</span>
          </button>
          <button
            className={`flex flex-col items-center gap-1 ${tab === "following" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setTab("following"); setFollowTab("following"); }}
          >
            <span className="font-bold">{profile.following_count}</span>
            <span>关注</span>
          </button>
        </div>
      </Card>

      {/* 标签切换 */}
      <div className="flex border-b border-border">
        {(["posts", "followers", "following"] as Tab[]).map((tabItem) => (
          <button
            key={tabItem}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              tab === tabItem ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab(tabItem)}
          >
            {tabItem === "posts" ? t("title") : tabItem === "followers" ? "粉丝" : "关注"}
          </button>
        ))}
      </div>

      {/* 帖子列表 */}
      {tab === "posts" && (
        <div className="space-y-3">
          {postsLoading && !posts ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : posts?.items.length === 0 ? (
            <Card className="py-12 text-center text-muted-foreground">{t("noPosts")}</Card>
          ) : (
            <>
              {posts?.items.map((post) => (
                <Card key={post.id} className="p-4 space-y-3">
                  <Link href={`/${locale}/dashboard/community/${post.id}`} className="block">
                    <h3 className="font-semibold hover:text-primary">{post.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {post.comments_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.views_count}
                    </span>
                    <span className="text-xs">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))}
              {posts && Math.ceil(posts.total / posts.page_size) > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button size="sm" variant="outline" disabled={postsPage <= 1} onClick={() => setPostsPage((p) => p - 1)}>
                    上一页
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {postsPage} / {Math.ceil(posts.total / posts.page_size)}
                  </span>
                  <Button size="sm" variant="outline" disabled={postsPage >= Math.ceil(posts.total / posts.page_size)} onClick={() => setPostsPage((p) => p + 1)}>
                    下一页
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 粉丝/关注列表 */}
      {tab !== "posts" && (
        <div className="space-y-3">
          {tab === "followers" && (
            followersLoading && !followers ? (
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            ) : followers?.items.length === 0 ? (
              <Card className="py-12 text-center text-muted-foreground">暂无粉丝</Card>
            ) : (
              <>
                {followers?.items.map((item) => (
                  <Card key={item.id} className="flex items-center justify-between p-4">
                    <Link href={`/${locale}/dashboard/profile/${item.user.id}`} className="flex items-center gap-3 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold">
                        {item.user.username?.[0]?.toUpperCase() ?? "A"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.user.username}</p>
                      </div>
                    </Link>
                    {item.user.id !== userId && (
                      <Button
                        size="sm"
                        variant={item.is_following ? "outline" : "default"}
                        onClick={() => handleFollowUser(item.user.id, item.is_following)}
                      >
                        {item.is_following ? "已关注" : "关注"}
                      </Button>
                    )}
                  </Card>
                ))}
                {followers && Math.ceil(followers.total / 20) > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button size="sm" variant="outline" disabled={followPage <= 1} onClick={() => setFollowPage((p) => p - 1)}>
                      上一页
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {followPage} / {Math.ceil(followers.total / 20)}
                    </span>
                    <Button size="sm" variant="outline" disabled={followPage >= Math.ceil(followers.total / 20)} onClick={() => setFollowPage((p) => p + 1)}>
                      下一页
                    </Button>
                  </div>
                )}
              </>
            )
          )}
          {tab === "following" && (
            followingLoading && !following ? (
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            ) : following?.items.length === 0 ? (
              <Card className="py-12 text-center text-muted-foreground">暂无关注</Card>
            ) : (
              <>
                {following?.items.map((item) => (
                  <Card key={item.id} className="flex items-center justify-between p-4">
                    <Link href={`/${locale}/dashboard/profile/${item.user.id}`} className="flex items-center gap-3 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold">
                        {item.user.username?.[0]?.toUpperCase() ?? "A"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.user.username}</p>
                      </div>
                    </Link>
                    {item.user.id !== userId && (
                      <Button
                        size="sm"
                        variant={item.is_following ? "outline" : "default"}
                        onClick={() => handleFollowUser(item.user.id, item.is_following)}
                      >
                        {item.is_following ? "已关注" : "关注"}
                      </Button>
                    )}
                  </Card>
                ))}
                {following && Math.ceil(following.total / 20) > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button size="sm" variant="outline" disabled={followPage <= 1} onClick={() => setFollowPage((p) => p - 1)}>
                      上一页
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {followPage} / {Math.ceil(following.total / 20)}
                    </span>
                    <Button size="sm" variant="outline" disabled={followPage >= Math.ceil(following.total / 20)} onClick={() => setFollowPage((p) => p + 1)}>
                      下一页
                    </Button>
                  </div>
                )}
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
