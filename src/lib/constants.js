export const LEVELS = [
  ['beginner', 'Beginner'], ['junior', 'Junior'], ['middle', 'Middle'], ['senior', 'Senior'], ['lead', 'Lead'],
]
export const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'PHP', 'Go', 'Rust', 'Kotlin',
  'Swift', 'Dart', 'Ruby', 'SQL', 'HTML', 'CSS', 'Bash', 'Other',
]
export const ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full-stack Developer', 'Mobile Developer',
  'UI/UX Developer', 'DevOps', 'Game Developer', 'Other',
]
export const PROJECT_STATUSES = [
  ['idea', 'Idea', 'blue'], ['looking', 'Looking for developers', 'orange'],
  ['in_development', 'In development', 'violet'], ['completed', 'Completed', 'green'],
]
export const WORK_MODES = [['remote', 'Remote'], ['onsite', 'On-site'], ['hybrid', 'Hybrid']]
export const EMPLOYMENT_TYPES = [
  ['full_time', 'Full-time'], ['part_time', 'Part-time'], ['contract', 'Contract'],
  ['internship', 'Internship'], ['freelance', 'Freelance'],
]
export const REPORT_REASONS = [
  ['spam', 'Spam'], ['harassment', 'Harassment'], ['inappropriate', 'Inappropriate content'],
  ['fake_account', 'Fake account'], ['scam', 'Scam'], ['other', 'Other'],
]
export const NOTIFICATION_TYPES = [
  ['follow', 'New follower'], ['post_like', 'Post likes'], ['post_comment', 'Comments'],
  ['comment_reply', 'Comment replies'], ['question_answer', 'Answers to my questions'],
  ['answer_upvote', 'Answer upvotes'], ['join_request', 'Project join requests'],
  ['join_accepted', 'Accepted project requests'], ['message', 'New messages'], ['group_activity', 'Group activity'],
]

export const label = (pairs, value) => pairs.find((p) => p[0] === value)?.[1] ?? value
export const PROFILE_FIELDS = 'id, username, full_name, avatar_url, level, main_language'
