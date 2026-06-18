export interface DemoCredential {
  label: string;
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
      label: "Rider Captains",
      username: "rider_alice ~ rider_olivia",
      password: "rider123",
    },
    {
      label: "Rider Members",
      username: "rider_active_assistant_01 ~ rider_finished_member_06",
      password: "rider123",
    },
  ];
}
