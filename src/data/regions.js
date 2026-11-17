// Region index. Ten regions are planned (NOTES.md, "Design plan"); list each here as it is built.
import { region1 } from './r1.js';
export const REGIONS_PLANNED = 10;
export const MARKED_PER_REGION = 20;
export const REGIONS = [region1];
export const regionById = (id) => REGIONS.find((r) => r.id === id);
