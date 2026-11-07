export const formatDate = (dateString) => {
  if (!dateString) return 'No deadline';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTimeMinutes = (minutes) => {
  if (!minutes || minutes <= 0) return '0h';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
};

export const getRemainingDays = (deadline) => {
  if (!deadline) return null;
  const target = new Date(deadline);
  const now = new Date();
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10';
    case 'In Progress':
      return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10';
    case 'Paused':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10';
    case 'On Hold':
      return 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10';
    case 'Cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10';
    case 'Not Started':
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/10';
  }
};

export const getPriorityBadgeStyle = (priority) => {
  switch (priority) {
    case 'Urgent':
      return 'bg-rose-500 text-white border-rose-600';
    case 'High':
      return 'bg-orange-500 text-white border-orange-600';
    case 'Medium':
      return 'bg-blue-500 text-white border-blue-600';
    case 'Low':
    default:
      return 'bg-slate-400 text-white border-slate-500';
  }
};

export const getDifficultyBadgeStyle = (difficulty) => {
  switch (difficulty) {
    case 'Hard':
      return 'bg-red-50 text-red-600 border-red-200';
    case 'Medium':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'Easy':
    default:
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  }
};
