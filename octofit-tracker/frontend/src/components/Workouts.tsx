import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; focus: string; reason: string };

const loadWorkouts = () => getJson<{ suggestions: WorkoutSuggestion[] }>(
  `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`,
);

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loadData={loadWorkouts}
      dataKey="suggestions"
      emptyMessage="No workout suggestions available."
      renderItem={(workout) => (
        <>
          <strong>{workout.title}</strong> ({workout.focus}) — {workout.reason}
        </>
      )}
    />
  );
}
