export type SubscriberUpdate = { subscriberId: string; assetKey: string; state: "ready" };

export function publishReadyUpdate(assetKey: string, subscriberIds: string[]): SubscriberUpdate[] {
  return subscriberIds.map((subscriberId) => ({ subscriberId, assetKey, state: "ready" }));
}
