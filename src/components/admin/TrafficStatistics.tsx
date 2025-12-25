import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Eye, Calendar, TrendingUp, Globe, Monitor } from 'lucide-react';

interface VisitorStats {
  visitorsNow: number;
  visitorsToday: number;
  visitorsThisWeek: number;
  visitorsThisMonth: number;
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  topPages: { page: string; views: number }[];
  topReferrers: { referrer: string; count: number }[];
  visitorsByHour: { hour: number; count: number }[];
}

export default function TrafficStatistics() {
  const [stats, setStats] = useState<VisitorStats>({
    visitorsNow: 0,
    visitorsToday: 0,
    visitorsThisWeek: 0,
    visitorsThisMonth: 0,
    totalVisitors: 0,
    uniqueVisitors: 0,
    pageViews: 0,
    topPages: [],
    topReferrers: [],
    visitorsByHour: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data: visitorsNow } = await supabase
        .from('visitor_logs')
        .select('session_id', { count: 'exact' })
        .gte('visited_at', fiveMinutesAgo.toISOString());

      const { data: visitorsToday } = await supabase
        .from('visitor_logs')
        .select('session_id', { count: 'exact' })
        .gte('visited_at', startOfToday.toISOString());

      const { data: visitorsWeek } = await supabase
        .from('visitor_logs')
        .select('session_id', { count: 'exact' })
        .gte('visited_at', startOfWeek.toISOString());

      const { data: visitorsMonth } = await supabase
        .from('visitor_logs')
        .select('session_id', { count: 'exact' })
        .gte('visited_at', startOfMonth.toISOString());

      const { data: allVisitors } = await supabase
        .from('visitor_logs')
        .select('session_id, page_url, referrer, visited_at');

      const uniqueSessions = new Set(visitorsNow?.map(v => v.session_id) || []);
      const uniqueSessionsToday = new Set(visitorsToday?.map(v => v.session_id) || []);
      const uniqueSessionsWeek = new Set(visitorsWeek?.map(v => v.session_id) || []);
      const uniqueSessionsMonth = new Set(visitorsMonth?.map(v => v.session_id) || []);
      const totalUniqueSessions = new Set(allVisitors?.map(v => v.session_id) || []);

      const pageViewsMap = new Map<string, number>();
      allVisitors?.forEach(v => {
        const count = pageViewsMap.get(v.page_url) || 0;
        pageViewsMap.set(v.page_url, count + 1);
      });

      const referrerMap = new Map<string, number>();
      allVisitors?.forEach(v => {
        if (v.referrer && v.referrer !== 'direct') {
          const count = referrerMap.get(v.referrer) || 0;
          referrerMap.set(v.referrer, count + 1);
        }
      });

      const topPages = Array.from(pageViewsMap.entries())
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      const topReferrers = Array.from(referrerMap.entries())
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const hourlyMap = new Map<number, number>();
      visitorsToday?.forEach(v => {
        const hour = new Date(v.visited_at).getHours();
        const count = hourlyMap.get(hour) || 0;
        hourlyMap.set(hour, count + 1);
      });

      const visitorsByHour = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: hourlyMap.get(i) || 0,
      }));

      setStats({
        visitorsNow: uniqueSessions.size,
        visitorsToday: uniqueSessionsToday.size,
        visitorsThisWeek: uniqueSessionsWeek.size,
        visitorsThisMonth: uniqueSessionsMonth.size,
        totalVisitors: totalUniqueSessions.size,
        uniqueVisitors: totalUniqueSessions.size,
        pageViews: allVisitors?.length || 0,
        topPages,
        topReferrers,
        visitorsByHour,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Visitors Now</p>
              <p className="text-3xl font-bold mt-2">{stats.visitorsNow}</p>
            </div>
            <Eye className="w-10 h-10 text-green-100 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Today</p>
              <p className="text-3xl font-bold mt-2">{stats.visitorsToday}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-100 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">This Week</p>
              <p className="text-3xl font-bold mt-2">{stats.visitorsThisWeek}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-100 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold mt-2">{stats.visitorsThisMonth}</p>
            </div>
            <Globe className="w-10 h-10 text-orange-100 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Visitors</p>
              <p className="text-3xl font-bold mt-2">{stats.totalVisitors}</p>
            </div>
            <Users className="w-10 h-10 text-red-100 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Page Views
          </h3>
          <div className="text-3xl font-bold text-blue-600 mb-4">{stats.pageViews}</div>
          <div className="text-sm text-gray-600">Total page views across all visitors</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Visitors by Hour (Today)</h3>
          <div className="space-y-2">
            <div className="flex gap-1 items-end h-32">
              {stats.visitorsByHour.map((item) => (
                <div
                  key={item.hour}
                  className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                  style={{
                    height: `${Math.max((item.count / Math.max(...stats.visitorsByHour.map(v => v.count))) * 100, 3)}%`,
                  }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.hour}:00 - {item.count} visitors
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
          <div className="space-y-3">
            {stats.topPages.length === 0 ? (
              <p className="text-gray-500 text-sm">No page data available yet</p>
            ) : (
              stats.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{page.page}</p>
                  </div>
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                    {page.views}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Top Referrers</h3>
          <div className="space-y-3">
            {stats.topReferrers.length === 0 ? (
              <p className="text-gray-500 text-sm">No referrer data available yet</p>
            ) : (
              stats.topReferrers.map((referrer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{referrer.referrer}</p>
                  </div>
                  <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                    {referrer.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
