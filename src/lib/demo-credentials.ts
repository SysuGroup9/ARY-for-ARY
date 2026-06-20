export interface DemoCredential {
  label: string;
  username: string;
  password: string;
  role: string;
}

export function getDemoCredentials(): DemoCredential[] {
  return [
    {
      label: "管理员 / 主办方",
      username: "organizer_demo",
      password: "organizer123",
      role: "ADMIN + ORGANIZER",
    },
    {
      label: "评委 Demo",
      username: "judge_demo",
      password: "rider123",
      role: "JUDGE",
    },
    {
      label: "骑手 Alice",
      username: "rider_alice",
      password: "rider123",
      role: "RIDER",
    },
    {
      label: "骑手 Bob",
      username: "rider_bob",
      password: "rider123",
      role: "RIDER",
    },
    {
      label: "管理员",
      username: "admin_demo",
      password: "organizer123",
      role: "ADMIN",
    },
  ];
}
