export const REQUIRED_PROFILE_FIELDS = [
  'names',
  'phone',
  'gender',
  'living_district',
  'dob',
  'nationality',
  'employee_id_number',
  'image',
  'signature_url',
];

export const PROFILE_FIELD_LABELS = {
  names: 'Full name',
  phone: 'Phone',
  gender: 'Gender',
  living_district: 'Living district',
  dob: 'Date of birth',
  nationality: 'Nationality',
  employee_id_number: 'Employee ID number',
  image: 'Profile photo',
  signature_url: 'Signature',
};

export function isForceDeactivated(user) {
  return Number(user?.force_deactivated) === 1;
}

export function isAccountActive(user) {
  return Number(user?.active) === 1 && !isForceDeactivated(user);
}

export function needsProfileCompletion(user) {
  if (!user) return false;
  if (isForceDeactivated(user)) return false;
  if (user.needs_profile_completion != null) return Boolean(user.needs_profile_completion);
  return Number(user.active) !== 1;
}

export function getMissingProfileFields(user = {}) {
  if (Array.isArray(user.missing_profile_fields)) return user.missing_profile_fields;
  return REQUIRED_PROFILE_FIELDS.filter((field) => !String(user[field] || '').trim());
}
