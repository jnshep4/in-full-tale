// Region index. Region 0 is the hub. Ten regions are planned (NOTES.md, "Design plan").
import { hub } from './hub.js';
import { region1 } from './r1.js';
export const REGIONS_PLANNED = 10;
export const MARKED_PER_REGION = 20;
export const REGIONS = [hub, region1];
export const regionById = (id) => REGIONS.find((r) => r.id === id);
