// Region index. Region 0 is the hub. Ten regions are planned (NOTES.md, "Design plan").
import { hub } from './hub.js';
import { region1 } from './r1.js';
import { region2 } from './r2.js';
import { region3 } from './r3.js';
import { region4 } from './r4.js';
import { region5 } from './r5.js';
export const REGIONS_PLANNED = 10;
export const MARKED_PER_REGION = 20;
export const REGIONS = [hub, region1, region2, region3, region4, region5];
export const regionById = (id) => REGIONS.find((r) => r.id === id);
