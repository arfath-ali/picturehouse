export const inFlightIndexKeys = new Set<string>();

export const inFlightActiveRequests = new Map<string, Promise<any>>();

export async function waitForFlightIn(mediaDetailsIndexKey: string) {
  for (let i = 1; i < 20 && inFlightIndexKeys.has(mediaDetailsIndexKey); i++) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
