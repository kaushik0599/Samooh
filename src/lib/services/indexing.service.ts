import { getGovernanceEvents, getTreasuryEvents } from "@/lib/blockchain";
import { extractActor, describeEvent, type RawChainEvent } from "@/lib/blockchain/events";
import { recordActivity } from "@/lib/services/activity.service";
import { getSamoohById } from "@/lib/services/samooh.service";

export interface SyncResult {
  samoohId: string;
  eventsFound: number;
  activitiesRecorded: number;
}

/**
 * Lightweight manual/cron-triggered sync: pulls Governance + Treasury
 * events for one Samooh since `fromBlock` and stores each as an Activity
 * row. Deduplication is handled by the DB's partial unique index on
 * (samooh_id, type, transaction_hash) — see activity.service.ts.
 */
export async function syncSamoohActivity(
  samoohId: string,
  fromBlock: number
): Promise<SyncResult> {
  const samooh = await getSamoohById(samoohId);

  const [governanceEvents, treasuryEvents] = await Promise.all([
    getGovernanceEvents(fromBlock, "latest", samooh.governance_contract),
    getTreasuryEvents(fromBlock, "latest", samooh.treasury_contract),
  ]);

  const events: RawChainEvent[] = [...governanceEvents, ...treasuryEvents];

  let activitiesRecorded = 0;
  for (const event of events) {
    const inserted = await recordActivity({
      samooh_id: samoohId,
      type: event.eventName,
      actor: extractActor(event),
      description: describeEvent(event),
      transaction_hash: event.transactionHash,
    });
    if (inserted) activitiesRecorded += 1;
  }

  return { samoohId, eventsFound: events.length, activitiesRecorded };
}
