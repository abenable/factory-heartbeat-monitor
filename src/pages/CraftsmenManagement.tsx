import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import {
  crafts,
  allSkills,
  allLevels,
  SKILL_LABELS,
  LEVEL_LABELS,
  getCostFor,
} from "@/data/crafts";
import { getWorker, ALLOWED_USERNAMES } from "@/data/workers";

export default function CraftsmenManagement() {
  return (
    <AppLayout pageTitle="Craftsmen Management" breadcrumb="WORKFORCE PLANNING">
      <div className="flex flex-col gap-6">
        {/* Summary cards per skill */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allSkills.map((skill) => {
            const skillCrafts = crafts.filter((c) => c.skill === skill);
            const avgCost =
              skillCrafts.length > 0
                ? skillCrafts.reduce((s, c) => s + c.costPerHourUSD, 0) /
                  skillCrafts.length
                : 0;
            return (
              <Panel key={skill} className="p-5">
                <span className="font-mono-data text-[10px] text-primary uppercase tracking-widest">
                  {SKILL_LABELS[skill]}
                </span>
                <p className="font-mono-data text-3xl font-bold mt-2">
                  {String(skillCrafts.length).padStart(2, "0")}
                </p>
                <p className="font-mono-data text-xs text-muted-foreground mt-1">
                  Avg ${avgCost.toFixed(2)} / hr
                </p>
              </Panel>
            );
          })}
        </div>

        {/* Detailed matrix per skill */}
        {allSkills.map((skill) => (
          <div key={skill}>
            <SectionHeading>{SKILL_LABELS[skill]}</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allLevels.map((level) => {
                const levelCrafts = crafts.filter(
                  (c) => c.skill === skill && c.level === level,
                );
                const rate = getCostFor(skill, level);
                return (
                  <Panel key={level} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono-data text-xs uppercase tracking-widest text-primary">
                        {LEVEL_LABELS[level]}
                      </span>
                      <span className="font-mono-data text-[10px] bg-primary text-primary-foreground border border-primary px-2 py-0.5 rounded-full">
                        ${rate}/hr
                      </span>
                    </div>
                    {levelCrafts.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No workers at this level.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {levelCrafts.map((c) => {
                          const worker = getWorker(c.workerUsername);
                          return (
                            <li
                              key={c.workerUsername}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="font-medium">
                                {worker?.name ?? c.workerUsername}
                              </span>
                              <span className="font-mono-data text-[10px] text-primary uppercase">
                                {worker?.workerId ?? "—"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Panel>
                );
              })}
            </div>
          </div>
        ))}

        {/* Unassigned workers warning */}
        <div>
          <SectionHeading>Unmapped Workers</SectionHeading>
          <Panel className="p-5">
            <div className="flex flex-wrap gap-2">
              {ALLOWED_USERNAMES.filter(
                (u) => !crafts.some((c) => c.workerUsername === u) && !getWorker(u)?.viewer,
              ).map((u) => {
                const worker = getWorker(u);
                return (
                  <span
                    key={u}
                    className="text-xs px-2.5 py-1 bg-primary text-primary-foreground border border-primary font-medium rounded-full"
                  >
                    {worker?.name ?? u}
                  </span>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </AppLayout>
  );
}
