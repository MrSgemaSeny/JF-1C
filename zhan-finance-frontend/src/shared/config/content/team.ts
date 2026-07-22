export interface TeamMember {
  nameKey: string;
  roleKey: string;
  photo: string;
  highlight?: boolean;
}

export const teamRows: TeamMember[][] = [
  [
    {
      nameKey: 'landing:team.0.name',
      roleKey: 'landing:team.0.role',
      photo: '',
      highlight: true,
    },
  ],
  [
    { nameKey: 'landing:team.1.name', roleKey: 'landing:team.1.role', photo: '' },
    { nameKey: 'landing:team.2.name', roleKey: 'landing:team.2.role', photo: '' },
  ],
  [
    { nameKey: 'landing:team.3.name', roleKey: 'landing:team.3.role', photo: '' },
    { nameKey: 'landing:team.4.name', roleKey: 'landing:team.4.role', photo: '' },
    { nameKey: 'landing:team.5.name', roleKey: 'landing:team.5.role', photo: '' },
    { nameKey: 'landing:team.6.name', roleKey: 'landing:team.6.role', photo: '' },
    { nameKey: 'landing:team.7.name', roleKey: 'landing:team.7.role', photo: '' },
    { nameKey: 'landing:team.8.name', roleKey: 'landing:team.8.role', photo: '' },
  ],
];
