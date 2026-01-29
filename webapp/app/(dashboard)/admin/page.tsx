'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Activity,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  UserMinus,
  Download
} from 'lucide-react';

interface ActivityData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    totalSimulations: number;
    verificationRate: string;
  };
  dailyActivity: Array<{
    date: string;
    label: string;
    simulations: number;
    activeUsers: number;
    newRegistrations: number;
    assetsCreated: number;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: string;
    emailVerified: boolean;
    subscriptionTier: string;
    _count: {
      simulationRuns: number;
      assets: number;
    };
  }>;
  topUsers: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    subscriptionTier: string;
    _count: {
      simulationRuns: number;
    };
  }>;
  strategyStats: Array<{
    strategy: string;
    count: number;
  }>;
}

interface FeedbackData {
  stats: {
    total: number;
    highPriority: number;
    unread: number;
    avgSatisfaction: string;
    avgNPS: string;
    byType: Record<string, number>;
  };
  feedback: Array<{
    id: string;
    feedbackType: string;
    priority: number;
    status: string;
    satisfactionScore?: number;
    npsScore?: number;
    improvementSuggestion?: string;
    whatIsConfusing?: string;
    missingFeatures?: string;
    createdAt: string;
    user?: {
      email: string;
      firstName?: string;
      lastName?: string;
      subscriptionTier: string;
    };
  }>;
}

interface DeletionData {
  stats: {
    totalDeletions: number;
    deletionsInPeriod: number;
    sameDayDeletions: number;
    sameDayRate: string;
    deletionRate: string;
    deletedUsersWithSimulations: number;
    deletedUsersWithAssets: number;
    totalActiveUsers: number;
  };
  dailyTrend: Array<{
    date: string;
    label: string;
    deletions: number;
  }>;
  topReasons: Array<{
    reason: string;
    count: number;
  }>;
  recentDeletions: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: string;
    deletedAt: string | null;
    scheduledDeletionAt: string | null;
    deletionReason?: string;
    subscriptionTier: string;
    simulationRuns: number;
    assets: number;
    daysActive: number;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [deletionData, setDeletionData] = useState<DeletionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('7');
  const [deletionDays, setDeletionDays] = useState('30');
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');

  useEffect(() => {
    loadActivityData();
    loadFeedbackData();
  }, [days]);

  useEffect(() => {
    loadDeletionData();
  }, [deletionDays]);

  const loadActivityData = async () => {
    try {
      const response = await fetch(`/api/admin/activity?days=${days}`);
      if (response.status === 403) {
        alert('You do not have admin access');
        router.push('/dashboard');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setActivityData(data);
      }
    } catch (error) {
      console.error('Failed to load activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbackData = async () => {
    try {
      const params = new URLSearchParams();
      if (feedbackFilter !== 'all') {
        params.append('status', feedbackFilter);
      }
      const response = await fetch(`/api/admin/feedback?${params}`);
      if (response.status === 403) return;
      const data = await response.json();
      if (data.success) {
        setFeedbackData(data);
      }
    } catch (error) {
      console.error('Failed to load feedback data:', error);
    }
  };

  const loadDeletionData = async () => {
    try {
      const response = await fetch(`/api/admin/deletions?days=${deletionDays}`);
      if (response.status === 403) return;
      const data = await response.json();
      if (data.success) {
        setDeletionData(data);
      }
    } catch (error) {
      console.error('Failed to load deletion data:', error);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId,
          status: newStatus
        })
      });

      if (response.ok) {
        loadFeedbackData();
      }
    } catch (error) {
      console.error('Failed to update feedback:', error);
    }
  };

  const downloadDeletionsCSV = async () => {
    try {
      const response = await fetch(`/api/admin/deletions?days=${deletionDays}&format=csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deletions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download CSV:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor user activity and feedback</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 Days</SelectItem>
            <SelectItem value="14">14 Days</SelectItem>
            <SelectItem value="30">30 Days</SelectItem>
            <SelectItem value="90">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="deletions">Deletions</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activityData?.stats.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {activityData?.stats.verificationRate}% verified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activityData?.stats.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Last {days} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Simulations</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activityData?.stats.totalSimulations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{feedbackData?.stats.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {feedbackData?.stats.unread || 0} unread
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>Simulations and user engagement over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activityData?.dailyActivity.map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground">{day.label}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="bg-primary h-6 rounded"
                          style={{
                            width: `${Math.max(1, (day.simulations / (activityData.dailyActivity.reduce((max, d) => Math.max(max, d.simulations), 0) || 1)) * 100)}%`
                          }}
                        />
                        <span className="text-sm font-medium">{day.simulations}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">{day.activeUsers} users</Badge>
                      {day.newRegistrations > 0 && (
                        <Badge variant="secondary">{day.newRegistrations} new</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Feedback Alerts */}
          {feedbackData && feedbackData.stats.highPriority > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  High Priority Feedback
                </CardTitle>
                <CardDescription>Requires immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  There are <strong>{feedbackData.stats.highPriority}</strong> high-priority feedback items waiting for review.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    document.querySelector('[value="feedback"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                  }}
                >
                  View Feedback
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Registrations</CardTitle>
                <CardDescription>Last 10 users who signed up</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityData?.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {user.firstName || user.lastName
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : user.email}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                            {user.emailVerified ? 'Verified' : 'Unverified'}
                          </Badge>
                          {user.subscriptionTier === 'premium' && (
                            <Badge variant="default">Premium</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-right">
                        <div>{user._count.simulationRuns} sims</div>
                        <div className="text-muted-foreground">{user._count.assets} assets</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Users */}
            <Card>
              <CardHeader>
                <CardTitle>Most Active Users</CardTitle>
                <CardDescription>By simulation count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityData?.topUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {user.firstName || user.lastName
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : user.email}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{user._count.simulationRuns}</div>
                        <div className="text-xs text-muted-foreground">simulations</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deletions Tab */}
        <TabsContent value="deletions" className="space-y-6">
          {/* Header with filters and export */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Deletion Analytics</h2>
              <p className="text-muted-foreground">Track and analyze user account deletions</p>
            </div>
            <div className="flex gap-2">
              <Select value={deletionDays} onValueChange={setDeletionDays}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                  <SelectItem value="180">6 Months</SelectItem>
                  <SelectItem value="365">1 Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={downloadDeletionsCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Deletion Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deletions</CardTitle>
                <UserMinus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deletionData?.stats.totalDeletions || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Deletions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deletionData?.stats.deletionsInPeriod || 0}</div>
                <p className="text-xs text-muted-foreground">Last {deletionDays} days</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Same-Day Deletions</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{deletionData?.stats.sameDayDeletions || 0}</div>
                <p className="text-xs text-muted-foreground">{deletionData?.stats.sameDayRate || '0%'} of total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deletion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deletionData?.stats.deletionRate || '0%'}</div>
                <p className="text-xs text-muted-foreground">Of all users</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Deletion Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Deletion Trend</CardTitle>
              <CardDescription>Daily account deletions over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deletionData?.dailyTrend && deletionData.dailyTrend.length > 0 ? (
                  deletionData.dailyTrend.map((day) => {
                    const maxDeletions = Math.max(...deletionData.dailyTrend.map(d => d.deletions), 1);
                    return (
                      <div key={day.date} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-muted-foreground">{day.label}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="bg-orange-500 h-6 rounded"
                              style={{
                                width: `${Math.max(1, (day.deletions / maxDeletions) * 100)}%`
                              }}
                            />
                            <span className="text-sm font-medium">{day.deletions}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-4">No deletion data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Deletion Reasons */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Deletion Reasons</CardTitle>
                <CardDescription>Most common reasons users delete their accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deletionData?.topReasons && deletionData.topReasons.length > 0 ? (
                    deletionData.topReasons.map((reason) => {
                      const total = deletionData.topReasons.reduce((sum, r) => sum + r.count, 0);
                      const percentage = ((reason.count / total) * 100).toFixed(1);
                      return (
                        <div key={reason.reason} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate mr-2">{reason.reason}</span>
                            <span className="text-muted-foreground whitespace-nowrap">{reason.count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-orange-500 h-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No deletion reasons available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Engagement Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Deleted User Engagement</CardTitle>
                <CardDescription>How engaged were users before deleting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Users with Simulations</div>
                      <div className="text-sm text-muted-foreground">Ran at least one simulation</div>
                    </div>
                    <div className="text-2xl font-bold">{deletionData?.stats.deletedUsersWithSimulations || 0}</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Users with Assets</div>
                      <div className="text-sm text-muted-foreground">Added at least one asset</div>
                    </div>
                    <div className="text-2xl font-bold">{deletionData?.stats.deletedUsersWithAssets || 0}</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Active Users</div>
                      <div className="text-sm text-muted-foreground">Currently active accounts</div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{deletionData?.stats.totalActiveUsers || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Deletions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Deletions</CardTitle>
              <CardDescription>Last 20 users who deleted their accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deletionData?.recentDeletions && deletionData.recentDeletions.length > 0 ? (
                  deletionData.recentDeletions.map((user) => (
                    <div key={user.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            {user.firstName || user.lastName
                              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                              : user.email}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-muted-foreground">
                            Deleted {new Date(user.deletedAt || '').toLocaleDateString()}
                          </div>
                          <Badge variant={user.subscriptionTier === 'premium' ? 'default' : 'secondary'}>
                            {user.subscriptionTier}
                          </Badge>
                        </div>
                      </div>
                      {user.deletionReason && (
                        <div className="text-sm">
                          <strong>Reason:</strong> {user.deletionReason}
                        </div>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{user.simulationRuns} simulations</span>
                        <span>{user.assets} assets</span>
                        <span>{user.daysActive} days active</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No recent deletions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          {/* Feedback Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{feedbackData?.stats.avgSatisfaction || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">Out of 5</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg NPS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{feedbackData?.stats.avgNPS || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">Out of 10</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{feedbackData?.stats.highPriority || 0}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{feedbackData?.stats.unread || 0}</div>
                <p className="text-xs text-muted-foreground">New feedback</p>
              </CardContent>
            </Card>
          </div>

          {/* Feedback List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Feedback Items</CardTitle>
                  <CardDescription>Review and manage user feedback</CardDescription>
                </div>
                <Select value={feedbackFilter} onValueChange={(v) => {
                  setFeedbackFilter(v);
                  loadFeedbackData();
                }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="actioned">Actioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedbackData?.feedback.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={fb.priority >= 4 ? 'destructive' : fb.priority >= 3 ? 'default' : 'secondary'}
                          >
                            Priority {fb.priority}
                          </Badge>
                          <Badge variant="outline">{fb.feedbackType}</Badge>
                          {fb.status === 'new' && (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              New
                            </Badge>
                          )}
                          {fb.status === 'actioned' && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Actioned
                            </Badge>
                          )}
                        </div>
                        {fb.user && (
                          <div className="text-sm text-muted-foreground">
                            From: {fb.user.firstName || fb.user.email}
                            {fb.user.subscriptionTier === 'premium' && (
                              <Badge variant="outline" className="ml-2">Premium</Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {fb.satisfactionScore !== null && (
                      <div className="text-sm">
                        Satisfaction: <strong>{fb.satisfactionScore}/5</strong>
                      </div>
                    )}
                    {fb.npsScore !== null && (
                      <div className="text-sm">
                        NPS: <strong>{fb.npsScore}/10</strong>
                      </div>
                    )}

                    {fb.improvementSuggestion && (
                      <div className="text-sm">
                        <strong>Suggestion:</strong> {fb.improvementSuggestion}
                      </div>
                    )}
                    {fb.whatIsConfusing && (
                      <div className="text-sm">
                        <strong>Confusion:</strong> {fb.whatIsConfusing}
                      </div>
                    )}
                    {fb.missingFeatures && (
                      <div className="text-sm">
                        <strong>Missing Features:</strong> {fb.missingFeatures}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {fb.status === 'new' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateFeedbackStatus(fb.id, 'reviewed')}
                          >
                            Mark Reviewed
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updateFeedbackStatus(fb.id, 'actioned')}
                          >
                            Mark Actioned
                          </Button>
                        </>
                      )}
                      {fb.status !== 'closed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateFeedbackStatus(fb.id, 'closed')}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Distribution</CardTitle>
              <CardDescription>Most popular retirement strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityData?.strategyStats.map((stat) => {
                  const total = activityData.strategyStats.reduce((sum, s) => sum + s.count, 0);
                  const percentage = ((stat.count / total) * 100).toFixed(1);
                  return (
                    <div key={stat.strategy} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{stat.strategy}</span>
                        <span className="text-muted-foreground">{stat.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {feedbackData && (
            <Card>
              <CardHeader>
                <CardTitle>Feedback by Type</CardTitle>
                <CardDescription>Distribution of feedback categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(feedbackData.stats.byType).map(([type, count]) => {
                    const total = Object.values(feedbackData.stats.byType).reduce((sum, c) => sum + c, 0);
                    const percentage = ((count / total) * 100).toFixed(1);
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{type}</span>
                          <span className="text-muted-foreground">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
