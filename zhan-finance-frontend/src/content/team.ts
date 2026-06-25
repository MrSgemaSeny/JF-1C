export interface TeamMember {
  name: string;
  role: string;
  photo: string;
  highlight?: boolean;
}

export const teamRows: TeamMember[][] = [
  [
    {
      name: 'ЖАРИЛКАГАНОВ АМАНКЕЛЬДИ НАКМАДИНОВИЧ',
      role: 'Руководитель компании',
      photo: '',
      highlight: true,
    },
  ],
  [
    { name: 'Кожамбердиева Алма', role: 'Главный бухгалтер',       photo: '' },
    { name: 'Омарова Лиза', role: 'Главный бухгалтер',     photo: '' },
  ],
  [
    { name: 'Сейдулла Асем', role: 'Бугхалтер',  photo: '' },
    { name: 'Тулепбек Малика', role: 'Бугхалтер',     photo: '' },
    { name: 'Маханбет Багила', role: 'Бугхалтер',     photo: '' },
    { name: 'Абдираемова Акерке', role: 'Бугхалтер',   photo: '' },
    { name: 'Мусабаев Даурен', role: 'Бугхалтер',    photo: '' },
    { name: 'Мұрат Орынбасар', role: 'IT-специалист',   photo: '' },
  ],
];
