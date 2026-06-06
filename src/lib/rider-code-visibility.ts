export function shouldConfirmHideRiderCode(input: {
  nextChecked: boolean;
  wasPublic: boolean;
}): boolean {
  return input.wasPublic && !input.nextChecked;
}
