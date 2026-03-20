import React from "react";
import { Badge } from "@/components/ui/badge";

const stageLabels = { idea: "Idea Stage", pre_seed: "Pre-Seed", seed: "Seed", series_a: "Series A", series_b: "Series B", bootstrapped: "Bootstrapped" };
const stageColors = { idea: "bg-muted text-muted-foreground", pre_seed: "bg-chart-3/10 text-chart-3", seed: "bg-accent/10 text-accent", series_a: "bg-primary/10 text-primary", series_b: "bg-chart-5/10 text-chart-5", bootstrapped: "bg-chart-4/10 text-chart-4" };

export default function FundingStageBadge({ stage }) { return <Badge className={`${stageColors[stage] || stageColors.idea} font-medium text-xs`}>{stageLabels[stage] || stage}</Badge>; }
export { stageLabels };
