import * as orgChartRepo from "../repositories/orgChart.repository";

export type OrgChartMember = Awaited<
  ReturnType<typeof orgChartRepo.findChartMembers>
>[number];

// Returns a flat list; the frontend builds the tree from manager_id.
// Cleans the links so the client can always build a valid tree:
//  - manager not on the chart (terminated/onboarding/missing) → becomes a root
//  - any leftover reporting cycle in old data → broken at the repeat point
export async function getOrgChart(): Promise<OrgChartMember[]> {
  const rows = await orgChartRepo.findChartMembers();
  const byId = new Map(rows.map((r) => [r.id, r]));

  for (const row of rows) {
    if (row.manager_id != null && !byId.has(row.manager_id)) {
      row.manager_id = null;
    }
  }

  for (const row of rows) {
    const seen = new Set<number>([row.id]);
    let current = row;
    while (current.manager_id != null) {
      if (seen.has(current.manager_id)) {
        current.manager_id = null; // break the cycle
        break;
      }
      seen.add(current.manager_id);
      current = byId.get(current.manager_id)!;
    }
  }

  return rows;
}
