export const COMMENT_LEVELS = {
  CAMPUS: 0,
  HQ_WELFARE: 1,
  DVC_HQ: 2,
};

export const COMMENT_LEVEL_META = {
  [COMMENT_LEVELS.CAMPUS]: {
    id: COMMENT_LEVELS.CAMPUS,
    key: 'campus',
    title: 'Campus Internal',
    description: 'Comments between Hostel Warden and Student Director Welfare on this campus report.',
    participants: ['wadden', 'warefare', 'it'],
  },
  [COMMENT_LEVELS.HQ_WELFARE]: {
    id: COMMENT_LEVELS.HQ_WELFARE,
    key: 'hq_welfare',
    title: 'Headquarters & Welfare',
    description: 'Comments between Head Quarter and Student Director Welfare.',
    participants: ['head_quarter', 'warefare', 'it'],
  },
  [COMMENT_LEVELS.DVC_HQ]: {
    id: COMMENT_LEVELS.DVC_HQ,
    key: 'dvc_hq',
    title: 'DVC & Headquarters',
    description: 'Comments between DVC and Head Quarter.',
    participants: ['dvc', 'head_quarter'],
  },
};

const ROLE_VISIBLE_LEVELS = {
  admin: [0, 1, 2],
  wadden: [0],
  warefare: [0, 1],
  it: [0, 1],
  head_quarter: [1, 2],
  dvc: [2],
};

const ROLE_DEFAULT_LEVEL = {
  admin: 0,
  wadden: 0,
  warefare: 0,
  it: 0,
  head_quarter: 1,
  dvc: 2,
};

export const getVisibleLevelsForRole = (role) =>
  ROLE_VISIBLE_LEVELS[role] || [];

export const getDefaultCommentLevel = (role) =>
  ROLE_DEFAULT_LEVEL[role] ?? 0;

export const getVisibleLevelMeta = (role) =>
  getVisibleLevelsForRole(role).map((level) => COMMENT_LEVEL_META[level]);

export const normalizeStoredLevel = (comment) => {
  const stored = Number(comment?.level ?? 0);
  if (stored >= 0 && stored <= 2) {
    return stored;
  }

  const authorRole = comment?.author?.role;
  if (authorRole === 'dvc') return COMMENT_LEVELS.DVC_HQ;
  if (authorRole === 'head_quarter') return COMMENT_LEVELS.HQ_WELFARE;
  return COMMENT_LEVELS.CAMPUS;
};

export const filterCommentsByLevel = (comments, level) => {
  const target = Number(level);

  return comments
    .filter((comment) => normalizeStoredLevel(comment) === target)
    .map((comment) => ({
      ...comment,
      replies: comment.replies || [],
    }));
};

export const countComments = (items = []) =>
  items.reduce(
    (total, item) => total + 1 + countComments(item.replies || []),
    0
  );

export const countCommentsForRole = (comments, role) => {
  const visibleLevels = getVisibleLevelsForRole(role);
  return visibleLevels.reduce((total, level) => {
    const levelComments = filterCommentsByLevel(comments, level);
    return total + countComments(levelComments);
  }, 0);
};
