import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Activity details are required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  const isObjectId = (value: unknown): value is string =>
    typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

  if (!isObjectId(userId) || !isObjectId(teamId) || typeof type !== 'string' || !type.trim() ||
      typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Valid userId, teamId, type, and minutes are required'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw Object.assign(new Error('The specified user or team does not exist'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Team details are required'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  const isObjectId = (value: unknown): value is string =>
    typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

  if (typeof name !== 'string' || !name.trim() || typeof mascot !== 'string' || !mascot.trim() ||
      !Array.isArray(members) || !members.every(isObjectId)) {
    throw Object.assign(new Error('Valid name, mascot, and member IDs are required'), { status: 400 });
  }

  if (members.length > 0) {
    const memberCount = await User.countDocuments({ _id: { $in: members } });
    if (memberCount !== new Set(members).size) {
      throw Object.assign(new Error('One or more team members do not exist'), { status: 404 });
    }
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members,
  });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: typeof Team.prototype._id; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const workouts = await Workout.find().lean();
  const activities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  const goalWorkouts = workouts.filter((workout) => workout.focus.trim().toLowerCase() === goalFocus);

  if (goalWorkouts.length > 0) {
    return goalWorkouts.map((workout) => ({
      ...workout,
      reason: `Recommended to support your ${user.fitnessGoal} goal.`,
    }));
  }

  const activity = activities.find((item) => item.type.trim());
  if (!activity) return [];

  const activityType = activity.type.trim().toLowerCase();
  const activityFocus = /^(run|cycle|swim|cardio)$/.test(activityType)
    ? 'endurance'
    : /^(strength|weights|weight training)$/.test(activityType)
      ? 'strength'
      : activityType;
  const matchingWorkouts = workouts.filter((workout) => workout.focus.trim().toLowerCase() === activityFocus);

  return matchingWorkouts.map((workout) => ({
    ...workout,
    reason: `Recommended based on your recent ${activity.type} activity.`,
  }));
}

export { User };
