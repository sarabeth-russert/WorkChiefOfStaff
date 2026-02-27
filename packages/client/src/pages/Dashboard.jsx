import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [wellnessScore, setWellnessScore] = useState(null);
  const [wellnessSource, setWellnessSource] = useState(null); // 'oura' or 'self-reported'
  const [todayEvents, setTodayEvents] = useState(null);
  const [activeTickets, setActiveTickets] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch wellness data
      const wellnessResponse = await fetch(`${apiUrl}/api/wellness/daily`).catch(() => null);
      if (wellnessResponse?.ok) {
        const wellnessData = await wellnessResponse.json();

        // Try Oura readiness score first
        if (wellnessData.metrics?.readiness?.score) {
          setWellnessScore(wellnessData.metrics.readiness.score);
          setWellnessSource('oura');
        }
        // Fallback to self-reported score from morning standup
        else if (wellnessData.metrics?.sessions) {
          const todayStandups = wellnessData.metrics.sessions.filter(s => s.type === 'standup');
          if (todayStandups.length > 0) {
            // Get most recent standup
            const latestStandup = todayStandups[todayStandups.length - 1];
            // Look for self-reported readiness score in conversation
            const readinessMsg = latestStandup.conversation?.find(msg =>
              msg.role === 'user' && /readiness[:\s]+(\d+)/i.test(msg.content)
            );
            if (readinessMsg) {
              const match = readinessMsg.content.match(/readiness[:\s]+(\d+)/i);
              if (match) {
                setWellnessScore(parseInt(match[1]));
                setWellnessSource('self-reported');
              }
            }
          }
        }
      }

      // Fetch today's calendar events
      const outlookResponse = await fetch(`${apiUrl}/api/outlook/events/today`).catch(() => null);
      if (outlookResponse?.ok) {
        const outlookData = await outlookResponse.json();
        setTodayEvents(outlookData.count || 0);
      }

      // Fetch active Jira tickets
      const jiraResponse = await fetch(`${apiUrl}/api/jira/projects/CONTECH/issues?myIssuesOnly=true`).catch(() => null);
      if (jiraResponse?.ok) {
        const jiraData = await jiraResponse.json();
        const inProgress = jiraData.issues?.filter(issue =>
          issue.fields.status?.name === 'In Progress' ||
          issue.fields.status?.name === 'In Development'
        ).length || 0;
        setActiveTickets(inProgress);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-7xl font-poster text-vintage-text text-letterpress mb-4">
          Welcome to Adventureland
        </h1>
        <p className="text-xl text-vintage-text opacity-80 max-w-2xl mx-auto">
          Your command center for productivity, wellness, and expedition planning
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wellness Score */}
        <Link to="/medic">
          <Card variant="canvas" className="text-center cursor-pointer hover:shadow-vintage-strong transition-shadow">
            <div className="flex justify-center mb-6">
              <img
                src="/images/dashboard/wellness.png"
                alt="Wellness"
                className="w-32 h-32 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="text-7xl" style={{ display: 'none' }}>💪</div>
            </div>
            <h3 className="text-3xl font-poster text-vintage-text mb-2">
              {loading ? '...' : wellnessScore !== null ? wellnessScore : '--'}
            </h3>
            <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
              Wellness Score
            </p>
            {wellnessScore !== null && wellnessSource && !loading && (
              <p className="text-xs text-vintage-text opacity-50 mt-2">
                {wellnessSource === 'oura' ? 'From Oura' : 'Self-reported'}
              </p>
            )}
            {wellnessScore === null && !loading && (
              <p className="text-xs text-vintage-text opacity-50 mt-2">Not available</p>
            )}
          </Card>
        </Link>

        {/* Today's Schedule */}
        <Link to="/outbound-passage">
          <Card variant="canvas" className="text-center cursor-pointer hover:shadow-vintage-strong transition-shadow">
            <div className="flex justify-center mb-6">
              <img
                src="/images/dashboard/calendar.png"
                alt="Calendar"
                className="w-32 h-32 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="text-7xl" style={{ display: 'none' }}>📅</div>
            </div>
            <h3 className="text-3xl font-poster text-vintage-text mb-2">
              {loading ? '...' : todayEvents !== null ? todayEvents : '--'}
            </h3>
            <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
              Today's Meetings
            </p>
            {todayEvents === null && !loading && (
              <p className="text-xs text-vintage-text opacity-50 mt-2">Not connected</p>
            )}
          </Card>
        </Link>

        {/* Active Assignments */}
        <Link to="/jira">
          <Card variant="canvas" className="text-center cursor-pointer hover:shadow-vintage-strong transition-shadow">
            <div className="flex justify-center mb-6">
              <img
                src="/images/dashboard/assignments.png"
                alt="Assignments"
                className="w-32 h-32 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="text-7xl" style={{ display: 'none' }}>📋</div>
            </div>
            <h3 className="text-3xl font-poster text-vintage-text mb-2">
              {loading ? '...' : activeTickets !== null ? activeTickets : '--'}
            </h3>
            <p className="font-ui uppercase text-sm text-vintage-text opacity-70">
              Active Assignments
            </p>
            {activeTickets === null && !loading && (
              <p className="text-xs text-vintage-text opacity-50 mt-2">Not connected</p>
            )}
          </Card>
        </Link>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="Expedition"
          icon="🗺️"
          iconImage="/images/dashboard/expedition.png"
        >
          <p className="mb-4 text-vintage-text">
            Chat with your AI guide agents to get help with tasks, plan your day,
            and receive personalized wellness coaching.
          </p>
          <Link
            to="/expedition"
            className="text-terracotta hover:text-terracotta-dark font-ui uppercase text-sm"
          >
            Launch Expedition →
          </Link>
        </Card>

        <Card
          title="Field Assignments"
          icon="📋"
          iconImage="/images/dashboard/assignments.png"
        >
          <p className="mb-4 text-vintage-text">
            Track your Jira tickets in a Kanban view. See what's in progress,
            create new tickets, and manage your workload.
          </p>
          <Link
            to="/jira"
            className="text-terracotta hover:text-terracotta-dark font-ui uppercase text-sm"
          >
            View Assignments →
          </Link>
        </Card>

        <Card
          title="Base Camp"
          icon="⛺"
          iconImage="/images/dashboard/base-camp.png"
        >
          <p className="mb-4 text-vintage-text">
            Your daily planning hub. Review wellness sessions, track your progress,
            and plan your next expedition.
          </p>
          <Link
            to="/base-camp"
            className="text-terracotta hover:text-terracotta-dark font-ui uppercase text-sm"
          >
            Enter Base Camp →
          </Link>
        </Card>

        <Card
          title="Outbound Passage"
          icon="🧭"
          iconImage="/images/dashboard/calendar.png"
        >
          <p className="mb-4 text-vintage-text">
            View your weekly calendar at a glance. See today's meetings and
            plan your journey through the week ahead.
          </p>
          <Link
            to="/outbound-passage"
            className="text-terracotta hover:text-terracotta-dark font-ui uppercase text-sm"
          >
            Chart Your Course →
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
