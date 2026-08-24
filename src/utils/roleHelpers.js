/**
 * Shared role helpers. Campus IT has the same access as Student Director Welfare (warefare).
 */
export const CAMPUS_WELFARE_ROLES = ['warefare', 'it'];

export const CAMPUS_REQUIRED_ROLES = ['warefare', 'wadden', 'it'];

export const ROLES_WITHOUT_CAMPUS = ['admin', 'head_quarter', 'dvc'];

export const isCampusWelfareRole = (role) => CAMPUS_WELFARE_ROLES.includes(role);

export const requiresCampus = (role) => CAMPUS_REQUIRED_ROLES.includes(role);

export const isNoCampusRole = (role) => ROLES_WITHOUT_CAMPUS.includes(role);
