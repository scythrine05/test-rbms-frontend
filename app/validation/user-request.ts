import { z } from "zod";

export const userRequestSchema = z.object({
    date: z.string(),  // present in both
    selectedDepartment: z.string(),  // present in both
    selectedSection: z.string(),  // present in both
    missionBlock: z.string(),  // present in both
    workType: z.string(),  // present in both
    activity: z.string(),  // present in both
    corridorTypeSelection: z.enum(["Corridor", "Outside Corridor", "Urgent Block", ""]),  // present in both
    cautionRequired: z.boolean(),  // present in both
    cautionSpeed: z.number().optional(),  // present in both
    workLocationFrom: z.string(),  // present in both
    workLocationTo: z.string(),  // present in both
    demandTimeFrom: z.string(),  // present in both
    demandTimeTo: z.string(),  // present in both
    sigDisconnection: z.boolean(),  // present in both
    elementarySection: z.string().optional(),  // present in both
    cautionLocationFrom: z.string().optional(),
    cautionLocationTo: z.string().optional(),
    freshCautionRequired: z.boolean().nullable(),
    freshCautionSpeed: z.number().optional(),
    freshCautionLocationFrom: z.string().optional(),
    sigElementarySectionFrom: z.string().optional(),
    sigElementarySectionTo: z.string().optional(),
    sntDisconnectionLineFrom: z.string().optional(),
    sntDisconnectionLineTo: z.string().optional(),
    repercussions: z.string().optional(),
    sntDisconnectionLine: z.string().optional(),
    elementarySectionTo: z.string().optional(),
    freshCautionLocationTo: z.string().optional(),
    requestremarks: z.string().optional(),  // present in both
    selectedDepo: z.string(),  // present in both
    selectedStream: z.string(),  // present in both
    routeFrom: z.string(),  // present in both
    routeTo: z.string(),  // present in both
    sntDisconnectionRequired: z.boolean().nullable(),  // Added missing field
    sntDisconnectionRequirements: z.array(z.string().optional()).optional(),  // present in both
    powerBlockRequirements: z.array(z.string().optional()).optional(),  // present in both
    sigResponse: z.string().optional(),
    ohDisconnection: z.string().optional(),
    oheDisconnection: z.string().optional(),
    oheResponse: z.string().optional(),
    sigActionsNeeded: z.boolean().optional(),
    trdActionsNeeded: z.boolean().optional(),
    powerBlockRequired: z.boolean().optional(),
    processedLineSections: z.array(z.object({  // present in both
        block: z.string(),
        type: z.string(),
        lineName: z.string(),
        otherLines: z.string(),
        stream: z.string().optional(),
        road: z.string().optional(),
        otherRoads: z.string().optional(),
    }))
});

export type UserRequestInput = z.infer<typeof userRequestSchema>;
