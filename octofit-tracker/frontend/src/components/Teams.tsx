import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot: string; members: string[] };

const loadTeams = () => getJson<{ teams: Team[] }>('/api/teams');

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      loadData={loadTeams}
      dataKey="teams"
      emptyMessage="No teams yet."
      renderItem={(team) => (
        <>
          <strong>{team.name}</strong> — {team.mascot}
          <div>Members: {team.members.join(', ') || 'None'}</div>
        </>
      )}
    />
  );
}
