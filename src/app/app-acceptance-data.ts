import type { ToolcraftComponentAcceptance } from "./acceptance/types";
import { goldAcceptance } from "../gold/gold-acceptance";
import { goldReadiness, goldSectionInventory, goldTransferMode } from "../gold/gold-inventory";

export const appTransferMode = goldTransferMode;

export const appProductReadiness = goldReadiness;

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = goldAcceptance;

// Product entries use the same explicit stable section IDs as appSchema.
export const appControlSectionInventory = goldSectionInventory;
