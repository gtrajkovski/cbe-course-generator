import React from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, Clock, ChevronRight, Settings, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore, type RecentProject } from '../store';
import { Button } from './ui/Button';

export const ProjectHome: React.FC = () => {
  const { setCurrentProject, recentProjects, openSettings } = useAppStore();

  const handleNewProject = () => {
    setCurrentProject({ name: 'New CBE Course', path: '' });
  };

  const handleLoadProject = () => {
    // In production, this would open a file dialog
    setCurrentProject({ name: 'Loaded Course', path: '' });
  };

  const handleOpenRecent = (project: RecentProject) => {
    setCurrentProject({ name: project.name, path: project.path });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Settings button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openSettings}
        className="absolute top-6 right-6 p-2.5 rounded-xl bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all duration-200 cursor-pointer"
      >
        <Settings className="w-5 h-5" />
      </motion.button>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 relative z-10"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 mb-6 shadow-lg shadow-indigo-500/20"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>

        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          CBE Course Generator
        </h1>
        <p className="text-lg text-[var(--text-secondary)]">
          From CCW to Final Delivery
        </p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex gap-4 mb-12 relative z-10"
      >
        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5" />}
          onClick={handleNewProject}
        >
          New Project
        </Button>
        <Button
          variant="secondary"
          size="lg"
          icon={<FolderOpen className="w-5 h-5" />}
          onClick={handleLoadProject}
        >
          Load Project
        </Button>
      </motion.div>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-lg relative z-10"
        >
          <div className="flex items-center gap-2 mb-3 px-1">
            <Clock className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)] font-medium">Recent Projects</span>
          </div>
          <div className="space-y-2">
            {recentProjects.map((project, i) => (
              <motion.button
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                whileHover={{ x: 4 }}
                onClick={() => handleOpenRecent(project)}
                className={clsx(
                  'glass-card w-full flex items-center gap-4 px-5 py-4 cursor-pointer',
                  'group transition-all duration-200'
                )}
              >
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-white transition-colors">
                    {project.name}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    Phase {project.phase} &middot; {project.lastOpened}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state for recent projects */}
      {recentProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-[var(--text-muted)] relative z-10"
        >
          No recent projects. Create a new one to get started.
        </motion.div>
      )}
    </div>
  );
};
