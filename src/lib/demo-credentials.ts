export interface DemoCredential {
  label: "Organizer" | "Rider";
  username: string;
  password: string;
}

export function getDemoCredentials(): DemoCredential[] {
  return [
    {
      label: "Organizer",
      username: "organizer_demo",
      password: "organizer123",
    },
    {
      label: "Rider",
      username: "rider_demo",
      password: "rider123",
    },
  ];
}
