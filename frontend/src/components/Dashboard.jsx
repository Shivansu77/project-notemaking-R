import { motion } from 'framer-motion';
import {
  FileText, 
  Globe, 
  Lock, 
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  PieChart
} from 'lucide-react';

function Dashboard({ notes }) {
  // Calculate statistics
  const totalNotes = notes.length;
  const publicNotes = notes.filter(note => note.isPublic).length;
  const privateNotes = totalNotes - publicNotes;
  
  // Recent activity (notes from last 7 days)
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentNotes = notes.filter(note => note.updatedAt > weekAgo).length;
  
  // Most recent notes
  const latestNotes = [...notes]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);
  
  // Notes by day of week
  const notesByDay = notes.reduce((acc, note) => {
    const day = new Date(note.updatedAt).toLocaleDateString('en-US', { weekday: 'short' });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-500/20`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <TrendingUp className="h-4 w-4 text-green-500" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
          {value}
        </h3>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your note-taking activity
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FileText}
          title="Total Notes"
          value={totalNotes}
          subtitle="All your notes"
          color="blue"
        />
        <StatCard
          icon={Globe}
          title="Public Notes"
          value={publicNotes}
          subtitle="Visible to others"
          color="green"
        />
        <StatCard
          icon={Lock}
          title="Private Notes"
          value={privateNotes}
          subtitle="Only visible to you"
          color="purple"
        />
        <StatCard
          icon={Clock}
          title="Recent Activity"
          value={recentNotes}
          subtitle="Notes from last 7 days"
          color="orange"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Notes Distribution
            </h3>
            <PieChart className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          
          {totalNotes > 0 ? (
            <div className="space-y-4">
              {/* Public vs Private */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Public</span>
                  <span className="text-gray-800 dark:text-white font-medium">
                    {publicNotes} ({Math.round((publicNotes / totalNotes) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(publicNotes / totalNotes) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Private</span>
                  <span className="text-gray-800 dark:text-white font-medium">
                    {privateNotes} ({Math.round((privateNotes / totalNotes) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(privateNotes / totalNotes) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No data to display
              </p>
            </div>
          )}
        </motion.div>

        {/* Recent Notes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Recent Notes
            </h3>
            <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          
          {latestNotes.length > 0 ? (
            <div className="space-y-3">
              {latestNotes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-white/10 dark:bg-black/10 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {note.title || 'Untitled Note'}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(note.updatedAt)}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center space-x-2">
                    {note.isPublic ? (
                      <Globe className="h-3 w-3 text-green-500" />
                    ) : (
                      <Lock className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No notes yet
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Create your first note to see it here
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Quick Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalNotes}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total Notes
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.round((publicNotes / Math.max(totalNotes, 1)) * 100)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Public
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round((privateNotes / Math.max(totalNotes, 1)) * 100)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Private
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {recentNotes}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              This Week
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
