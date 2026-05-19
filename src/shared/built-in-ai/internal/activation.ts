export function hasUserActivation(): boolean {
  return navigator.userActivation?.isActive ?? false;
}
