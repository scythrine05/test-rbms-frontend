type Department = 'TRD' | 'S&T' | 'ENGG'; // add more if needed

type DepotStructure = {
  [section: string]: {
    [department in Department]: string[];
  };
};
export let MajorSection = {
  "MAS": ["MAS-GDR", "MAS-AJJ", "AJJ-KPD", "KPD-JTJ", "AJJ-RU", "AJJ-CGL", "MSB-VM", "MSB-VLCY"],
  "TPJ": ["TPJ-VM", "VM-MV", "TPJ-MV", "TJ-KIK", "MV-TVR", "NMJ-MQ", "VM-PDY", "KPD-VM", "CUPJ-VRI", "TPJ-TP", "NGT-VLNK", "TVR-KKDI", "TTP-AGX"]
}


export let blockSection = {
  'TPJ-VM': [
    "TPJ-GOC", "GOC-TPTN", "TPTN-SRGM", "SRGM-UKV", "UKV-BXS",
    "BXS-VLDE", "VLDE-LLI", "LLI-KTTRIBS", "KTTRIBS-KTTR",
    "KTTR-PMB", "PMB-KKPM", "KKPM-KLGM", "KLGM-SLT", "SLT-ALU",
    "ALU-OTK", "OTK-VER", "VER-SNDI", "SNDI-MTUR", "MTUR-ICG",
    "ICG-PNDM", "PNDM-TLNR", "TLNR-VRT", "VRT-VRI", "VRI-PVN",
    "PVN-ULU", "ULU-PRKL", "PRKL-TVNL", "TVNL-KDMD", "KDMD-VM",
    "TPJ-YD", "GOC-YD", "TPTN-YD", "VLDE-YD", "LLI-YD", "KTTR-YD",
    "PMB-YD", "KKPM-YD", "KLGM-YD", "SLT-YD", "ALU-YD", "OTK-YD",
    "SNDI-YD", "MTUR-YD", "ICG-YD", "PNDM-YD", "TLNR-YD", "VRI-YD",
    "PVN-YD", "ULU-YD", "PRKL-YD", "TVNL-YD", "KDMD-YD", "VM-YD"
  ],
  'VM-MV': [
    "VM-SXR", "SXR-TUY", "TUY-PRT", "PRT-MBU", "MBU-NPM", "NPM-VKP",
    "VKP-TDPR", "TDPR-CUPJ", "CUPJ-CQS", "CQS-ALP", "ALP-PUC",
    "PUC-PO", "PO-KII", "KII-CDM", "CDM-VMP", "VMP-CLN", "CLN-SY",
    "SY-VDL", "VDL-ANP", "ANP-NID", "NID-MV",
    "VM-YD", "SXR-YD", "TUY-YD", "PRT-YD", "MBU-YD", "NPM-YD",
    "VKP-YD", "TDPR-YD", "CUPJ-YD", "CQS-YD", "ALP-YD", "PUC-YD",
    "PO-YD", "KII-YD", "CDM-YD", "VMP-YD", "CLN-YD", "SY-YD",
    "VDL-YD", "ANP-YD", "NID-YD", "MV-YD"
  ],
  'TPJ-MV': [
    "TPJ-GOC", "GOC-MCJ", "MCJ-TRB", "TRB-TOM", "TOM-SGM", "SGM-AYN",
    "AYN-BAL", "BAL-ALK", "ALK-TJ", "TJ-TT", "TT-PVL", "PVL-AZP",
    "AZP-PDV", "PDV-PML", "PML-SPL", "SPL-SWI", "SWI-DSM", "DSM-KMU",
    "KMU-TRM", "TRM-TDR", "TDR-ADT", "ADT-NPT", "NPT-KTM", "KTM-MV",
    "TPJ-YD", "GOC-YD", "MCJ-YD", "TRB-YD", "TOM-YD", "SGM-YD",
    "AYN-YD", "BAL-YD", "ALK-YD", "TJ-YD", "TT-YD", "PVL-YD",
    "AZP-YD", "PDV-YD", "PML-YD", "SPL-YD", "SWI-YD", "DSM-YD",
    "KMU-YD", "TRM-YD", "TDR-YD", "ADT-YD", "NPT-YD", "KTM-YD",
    "MV-YD"
  ],
  'TJ-KIK': [
    "TJ-KXO", "KXO-SMM", "SMM-AMT", "AMT-KYV", "KYV-NMJ",
    "NMJ-KDE", "KDE-TMU", "TMU-KU", "KU-TVR", "TVR-AYM",
    "AYM-KOQ", "KOQ-KVL", "KVL-SKK", "SKK-APE", "APE-NGT",
    "NGT-VXM", "VXM-NCR", "NCR-TMPT", "TMPT-KIK",
    "NMJ-YD", "KDE-YD", "KU-YD", "TVR-YD", "KVL-YD",
    "NGT-YD", "NCR-YD", "TMPT-YD", "KIK-YD"
  ],
  'MV-TVR': [
    "MV-PEM", "PEM-POM", "POM-NNM", "NNM-TVR",
    "MV-YD", "PEM-YD", "POM-YD", "NNM-YD", "TVR-YD"
  ],
  'NMJ-MQ': [
    "NMJ-MQ", "NMJ-YD", "MQ-YD"
  ],
  'VM-PDY': [
    "VM-VRA", "VRA-CBU", "CBU-VI", "VI-PDY",
    "CBU-YD", "VI-YD", "PDY-YD"
  ],
  'KPD-VM': [
    "KPD-VT", "VT-VLR", "VLR-PNTR", "PNTR-KNB", "KNB-KMM", "KMM-OPM",
    "OPM-SDPT", "SDPT-ARV", "ARV-MCL", "MCL-PRL", "PRL-AGM", "AGM-TJM",
    "TJM-TNM", "TNM-TNI", "TNI-AND", "AND-ACN", "ACN-TRK", "TRK-AYD",
    "AYD-MMP", "MMP-VKM", "VKM-VM",
    "KPD-YD", "VT-YD", "VLR-YD", "PNTR-YD", "KNB-YD", "KMM-YD", "OPM-YD", "SDPT-YD",
    "ARV-YD", "MCL-YD", "PRL-YD", "AGM-YD", "TJM-YD", "TNM-YD", "TNI-YD", "AND-YD",
    "ACN-YD", "TRK-YD", "AYD-YD", "MMP-YD", "VKM-YD", "VM-YD"
  ],
  'CUPJ-VRI': [
    "CUPJ-KJKPD", "KJKPD-VLU", "VLU-NVL", "NVL-UMG", "UMG-VRI",
    "CUPJ-YD", "KJKPD-YD", "VLU-YD", "NVL-YD", "UMG-YD", "VRI-YD"
  ],
  'TPJ-TP': [
    "TPJ-TPE", "TPE-TP",
    "TPJ-YD", "TPE-YD", "TP-YD"
  ],
  'NGT-VLNK': [
    "NGT-VLNK", "NGT-YD", "VLNK-YD"
  ],
  'TVR-KKDI': [
    "TVR-MAX", "MAX-MARD", "MARD-TNK", "TNK-AMNR", "AMNR-ATB",
    "ATB-MNLI", "MNLI-TTP", "TTP-TAM", "TAM-MTT", "MTT-AMM", "AMM-PKT",
    "PKT-TCT", "TCT-PVI", "PVI-AYI", "AYI-ATQ", "ATQ-VMM",
    "VMM-PYK", "PYK-KNPL", "KNPL-KKDI",
    "MARD-YD", "TNK-YD", "AMNR-YD", "ATB-YD", "MNLI-YD", "TTP-YD", "TAM-YD",
    "MTT-YD", "AMM-YD", "PKT-YD", "PVI-YD", "AYI-YD", "ATQ-YD", "PYK-YD", "KKDI-YD"
  ],
  'TTP-AGX': [
    "TTP-KXY", "KXY-KVV", "KVV-NVK", "NVK-TOY", "TOY-VDY", "VDY-AGX",
    "TTP-YD", "KXY-YD", "KVV-YD", "NVK-YD", "TOY-YD", "VDY-YD", "AGX-YD"
  ]
};



export let workType = {
  'S&T': ['Gear', 'Tw', 'Lt'],
  'ENGG': ['Machine', 'Non-Machine'],
  'TRD': ['Tw', 'Lt'],
};

export let Activity = {
  'Gear': ['Point', 'EI', 'Signal', 'DC Track', 'AFTC', 'SSDAC', 'MSDAC', 'Panel', 'LC Gate Mechanical', 'LC Gate ELB', 'Emergency Sliding Boom', 'IPS', 'Conventional power supply equipment', 'System Integrity Test of each PI/EI/RRI stations', 'Cable Insulation testing (cable meggering) for one station.', 'DLBI- SGE', 'TLBI-FM Inst', 'UFSBI', 'Fuse', 'EKT'],

  'Tw': ['AOH', 'POH', 'IOH', 'RE POH', 'RD WORK', 'TURN OUT CHECKING', 'CROSS OVER CHECKING', 'CROSS TRACK FEEDERS CHECKING', 'GANTRY MAINTENANCE', 'CONTACT WIRE RENEWAL WORK', 'CATENARY WIRE RENEWAL WORK', 'CANTILEVER ERECTION/REPLACEMENT(2x25KV WORK)', 'MAST ERECTION(2x25KV WORK)', 'FEEDERS ERECTION(2x25KV WORK)', 'OHE PROFILING', 'OHE/CN WORK', 'OTHER SPECIAL WORKS'],

  'Lt': ['AOH', 'POH', 'IOH', 'RE POH', 'RD WORK', 'TURN OUT CHECKING', 'CROSS OVER CHECKING', 'CROSS TRACK FEEDERS CHECKING', 'GANTRY MAINTENANCE', 'CONTACT WIRE RENEWAL WORK', 'CATENARY WIRE RENEWAL WORK', 'CANTILEVER ERECTION/REPLACEMENT(2x25KV WORK)', 'MAST ERECTION(2x25KV WORK)', 'FEEDERS ERECTION(2x25KV WORK)', 'OHE PROFILING', 'OHE/CN WORK', 'OTHER SPECIAL WORKS'],

  'Machine': ['BCM ', 'DTE ', 'CSM ', 'DUOMAT', 'UNIMAT', 'MFI', 'MPT',
    'MDU', 'BRM',
    'FRM ', 'TRT ',
    'UTV', 'DTS',
    'T28', 'SQRS',
    'RGM working'],
  'Non-Machine': ['Rail renewal',
    'Welding work',
    'Destressing work',
    'Switch renewal',
    'CMS Crossing renewal',
    'SEJ Renewal',
    'Glued Joint renewal',
    'Dummy Glued Joint removal',
    'TRR P 60 Kg',
    'TRR S 60 Kg',
    'TRR S 60 kg',
    'TRR S 52 kg',
    'Interchanging',
    'Trucking out/Shifting materials',
    'TWR with MFBW',
    'TBTR (Br sleeper renewal)',
    'TSR P 60 Kg',
    'TSR S 60 Kg',
    'TSR S 52 Kg',
    'TTSR work',
    'Jt Insp Notes Attn',
    'Stretcherbar renewal',
    'TFR Work',
    'Ballast Unloading',
    'Rail unloading',
    'Lifting and packing',
    'Gauge tie plate renewal',
    'Sleeper renewal',
    'Fish Plates O&E',
    'Preliminary/Post works',
    'Trucking out materials',
    'Cutting Widening work',
    'JCB working',
    'Earth work/Muck removal',
    'Crane Moving/Working',
    'Attention to Track',
    'Attention to Fittings',
    'Attention to Bridge',
    'Attention to Guard rail',
    'Attention to Points & Xing',
    'Attention to LC',
    'Attention to Curve check rail',
    'Sheet Piling work',
    'Platform work',
    'Platform Shelter work',
    'ABSS work',
    'Erection of Platform shelter purlins work',
    'Erection of FOB Girders',
    'Other FOB works',
    'Other Track works',
    'Other Bridge work',
  ],
};


export const streamData = {
  'TPJ-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'VM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'MV-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KTM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TJ-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KIK-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PEM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'POM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'NNM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TVR-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'NMJ-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'MQ-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'CBU-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'VI-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PDY-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KPD-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'VT-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'CUP J-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KJKPD-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },

  'VLNK-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KKDI-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TTP-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'AGX-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'GOC-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TPTN-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'VLDE-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'LLI-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KTTR-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PMB-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KKPM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KLGM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'SLTH-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'ALU-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'OTK-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'SNDI-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'MTUR-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'ICG-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PNDM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TLNR-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'VRI-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PVN-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'ULU-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PRKL-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TVNL-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KDMD-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'SXR-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TUY-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PRT-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'MBU-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'NPM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'VKP-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TDPR-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'CUPJ-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'CQS-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'ALP-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PUC-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PO-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KII-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'CDM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'VMP-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'CLN-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'SY-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'VDL-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'ANP-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'NID-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'MCJ-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TRB-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TOM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'SGM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'AYN-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'BAL-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'ALK-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TT-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PVL-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'AZP-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PDV-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PML-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'SPL-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'SWI-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'DSM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KMU-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TRM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TDR-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'ADT-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'NPT-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KDE-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KU-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KVL-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'NGT-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'NCR-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TMPT-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'MARD-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TNK-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'AMNR-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'ATB-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'MNLI-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TAM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'MTT-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'AMM-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PKT-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PVI-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'AYI-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'ATQ-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'PYK-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KXY-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'KVV-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'NVK-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'TOY-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  },
  'VDY-YD': {
    "up": [],
    "down": [],
    "both": ["Rd 1", "Rd 2", "Rd 3", "Rd 4"]
  }
};




export let lineData = {
  // TPJ-VM Section- All are UP and DN lines
  'TPJ-GOC': ['UP', 'DN'],
  'GOC-TPTN': ['UP', 'DN'],
  'TPTN-SRGM': ['UP', 'DN'],
  'SRGM-UKV': ['UP', 'DN'],
  'UKV-BXS': ['UP', 'DN'],
  'BXS-VLDE': ['UP', 'DN'],
  'VLDE-LLI': ['UP', 'DN'],
  'LLI-KTTR IBS': ['UP', 'DN'],
  'KTTR IBS-KTTR': ['UP', 'DN'],
  'KTTR-PMB': ['UP', 'DN'],
  'PMB-KKPM': ['UP', 'DN'],
  'KKPM-KLGM': ['UP', 'DN'],
  'KLGM-SLT': ['UP', 'DN'],
  'SLT-ALU': ['UP', 'DN'],
  'ALU-OTK': ['UP', 'DN'],
  'OTK-VER': ['UP', 'DN'],
  'VER-SNDI': ['UP', 'DN'],
  'SNDI-MTUR': ['UP', 'DN'],
  'MTUR-ICG': ['UP', 'DN'],
  'ICG-PNDM': ['UP', 'DN'],
  'PNDM-TLNR': ['UP', 'DN'],
  'TLNR-VRT': ['UP', 'DN'],
  'VRT-VRI': ['UP', 'DN'],
  'VRI-PVN': ['UP', 'DN'],
  'PVN-ULU': ['UP', 'DN'],
  'ULU-PRKL': ['UP', 'DN'],
  'PRKL-TVNL': ['UP', 'DN'],
  'TVNL-KDMD': ['UP', 'DN'],
  'KDMD-VM': ['UP', 'DN'],

  // Yard connections for TPJ-VM
  'TPJ-YD': ['UP', 'DN'],
  'GOC-YD': ['UP', 'DN'],
  'TPTN-YD': ['UP', 'DN'],
  'VLDE-YD': ['UP', 'DN'],
  'LLI-YD': ['UP', 'DN'],
  'KTTR-YD': ['UP', 'DN'],
  'PMB-YD': ['UP', 'DN'],
  'KKPM-YD': ['UP', 'DN'],
  'KLGM-YD': ['UP', 'DN'],
  'SLT-YD': ['UP', 'DN'],
  'ALU-YD': ['UP', 'DN'],
  'OTK-YD': ['UP', 'DN'],
  'SNDI-YD': ['UP', 'DN'],
  'MTUR-YD': ['UP', 'DN'],
  'ICG-YD': ['UP', 'DN'],
  'PNDM-YD': ['UP', 'DN'],
  'TLNR-YD': ['UP', 'DN'],
  'VRI-YD': ['UP', 'DN'],
  'PVN-YD': ['UP', 'DN'],
  'ULU-YD': ['UP', 'DN'],
  'PRKL-YD': ['UP', 'DN'],
  'TVNL-YD': ['UP', 'DN'],
  'KDMD-YD': ['UP', 'DN'],
  'VM-YD': ['UP', 'DN'],

  // TPJ-MV Section- Single line (represented as same string in array)
  // Already defined above, this is a junction
  'GOC-MCJ': ['SINGLE'],
  'MCJ-TRB': ['SINGLE'],
  'TRB-TOM': ['SINGLE'],
  'TOM-SGM': ['SINGLE'],
  'SGM-AYN': ['SINGLE'],
  'AYN-BAL': ['SINGLE'],
  'BAL-ALK': ['SINGLE'],
  'ALK-TJ': ['SINGLE'],
  'TJ-TT': ['SINGLE'],
  'TT-PVL': ['SINGLE'],
  'PVL-AZP': ['SINGLE'],
  'AZP-PDV': ['SINGLE'],
  'PDV-PML': ['SINGLE'],
  'PML-SPL': ['SINGLE'],
  'SPL-SWI': ['SINGLE'],
  'SWI-DSM': ['SINGLE'],
  'DSM-KMU': ['SINGLE'],
  'KMU-TRM': ['SINGLE'],
  'TRM-TDR': ['SINGLE'],
  'TDR-ADT': ['SINGLE'],
  'ADT-NPT': ['SINGLE'],
  'NPT-KTM': ['SINGLE'],
  'KTM-MV': ['SINGLE'],

  // Yard connections for TPJ-MV (Single line)
  'MCJ-YD': ['SINGLE'],
  'TRB-YD': ['SINGLE'],
  'TOM-YD': ['SINGLE'],
  'SGM-YD': ['SINGLE'],
  'AYN-YD': ['SINGLE'],
  'BAL-YD': ['SINGLE'],
  'ALK-YD': ['SINGLE'],
  'TJ-YD': ['SINGLE'],
  'TT-YD': ['SINGLE'],
  'PVL-YD': ['SINGLE'],
  'AZP-YD': ['SINGLE'],
  'PDV-YD': ['SINGLE'],
  'PML-YD': ['SINGLE'],
  'SPL-YD': ['SINGLE'],
  'SWI-YD': ['SINGLE'],
  'DSM-YD': ['SINGLE'],
  'KMU-YD': ['SINGLE'],
  'TRM-YD': ['SINGLE'],
  'TDR-YD': ['SINGLE'],
  'ADT-YD': ['SINGLE'],
  'NPT-YD': ['SINGLE'],
  'KTM-YD': ['SINGLE'],
  'MV-YD': ['SINGLE'],

  // TPJ-TP Section (Single line)
  'TPJ-TPE': ['SINGLE'],
  'TPE-TP': ['SINGLE'],
  'TPE-YD': ['SINGLE'],
  'TP-YD': ['SINGLE']
};






export const depot: DepotStructure = {
  "TPJ-VM": {
    'TRD': ["TPJ", "VM"],
    'S&T': ["TPJ", "VM"],
    'ENGG': ["TPJ", "VM"]
  },

  "VM-MV": {
    'TRD': ["VM", "MV"],
    'S&T': ["VM", "MV"],
    'ENGG': ["VM", "MV"]
  },

  "TPJ-MV": {
    'TRD': ["TPJ", "MV"],
    'S&T': ["TPJ", "MV"],
    'ENGG': ["TPJ", "KTM", "MV"]
  },

  "TJ-KIK": {
    'TRD': ["TJ", "KIK"],
    'S&T': ["TJ", "KIK"],
    'ENGG': ["TJ", "KIK"]
  },

  "MV-TVR": {
    'TRD': ["MV", "PEM", "POM", "NNM", "TVR"],
    'S&T': ["MV", "PEM", "POM", "NNM", "TVR"],
    'ENGG': ["MV", "PEM", "POM", "NNM", "TVR"]
  },

  "NMJ-MQ": {
    'TRD': ["NMJ", "MQ"],
    'S&T': ["NMJ", "MQ"],
    'ENGG': ["NMJ", "MQ"]
  },

  "VM-PDY": {
    'TRD': ["VM", "VRA", "CBU", "VI", "PDY"],
    'S&T': ["VM", "VRA", "CBU", "VI", "PDY"],
    'ENGG': ["VM", "VRA", "CBU", "VI", "PDY"]
  },

  "KPD-VM": {
    'TRD': ["KPD"],
    'S&T': ["KPD", "VT"],
    'ENGG': ["KPD", "VT"]
  },

  "CUPJ-VRI": {
    'TRD': ["CUP J", "KJKPD"],
    'S&T': ["CUP J", "KJKPD"],
    'ENGG': ["CUP J", "KJKPD"]
  },

  "TPJ-TP": {
    'TRD': ["TPJ"],
    'S&T': ["TPJ"],
    'ENGG': ["TPJ"]
  },

  "NGT-VLNK": {
    'TRD': ["NGT"],
    'S&T': ["NGT"],
    'ENGG': ["NGT"]
  },

  "TVR-KKDI": {
    'TRD': ["TVR", "KKDI"],
    'S&T': ["TVR", "KKDI"],
    'ENGG': ["TVR", "KKDI"]
  },

  "TTP-AGX": {
    'TRD': ["TTP", "AGX"],
    'S&T': ["TTP", "AGX"],
    'ENGG': ["TTP", "AGX"]
  }
};


export const location = {
  "MAS": "MADRAS",
  "AJJ": "AINSDFD",
  "AJJN": "DFSDFAJJN",
  "AJP": "DSFSD",
}

export const depotOnLocation = {
  "TPJ": [
    "TPJ", "VM", "MV", "KTM", "TJ", "KIK", "PEM", "POM", "NNM", "TVR",
    "NMJ", "MQ", "VRA", "CBU", "VI", "PDY", "KPD", "VT", "CUP J", "KJKPD",
    "NGT", "KKDI", "TTP", "AGX", "TVT", "PON", "SPE", "GDR", "WSTA",
    "WSTB", "AVD", "TRLA", "TRLB", "AJJ", "WJR", "AB", "JTJ", "TRT",
    "PUT", "CJ", "MS", "TBM", "CGL", "ACK", "TMV", "MSB", "BBQ", "GPD",
    "NYP", "TRL", "AJJE", "KPDW"
  ]
};


export let machine = [
  "BCM",
  "UNIMAT 4S",
  "MFI",
  "MPI",
  "MDU",
  "DUOMAT",
  "CSM",
  "DGS 353",
  "SBCM",
  "BRM R32",
  "UTV",
  "T 28",
  "TRT",
  "3X DTE",
];

export let work = [
  "RR / WW",
  "WELDING",
  "CMS XG RENEWAL",
  "SEJ / RR",
  "TRR / WW",
  "MFBW",
  "20R/P UNLOADING",
  "JOINT INSPECTION",
  "T/O",
  "RR / WW",
  "BRIDGE WORK",
  "FOB",
  "PF WORK",
];

export let workData = {
  ENGG: {
    Machine_Blocks: [
      "BCM ",
      "DTE ",
      "CSM ",
      "DUOMAT",
      "UNIMAT",
      "MFI",
      "MPT",
      "MDU",
      "BRM",
      "FRM ",
      "TRT ",
      "UTV",
      "DTS",
      "T28",
      "SQRS",
      "RGM working",
    ],
    Non_Machine: [
      "Rail renewal",
      "Welding work",
      "Destressing work",
      "Switch renewal",
      "CMS Crossing renewal",
      "SEJ Renewal",
      "Glued Joint renewal",
      "Dummy Glued Joint removal",
      "TRR P 60 Kg",
      "TRR S 60 Kg",
      "TRR S 60 kg",
      "TRR S 52 kg",
      "Interchanging",
      "Trucking out/Shifting materials",
      "TWR with MFBW",
      "TBTR (Br sleeper renewal)",
      "TSR P 60 Kg",
      "TSR S 60 Kg",
      "TSR S 52 Kg",
      "TTSR work",
      "Jt Insp Notes Attn",
      "Stretcherbar renewal",
      "TFR Work",
      "Ballast Unloading",
      "Rail unloading",
      "Lifting and packing",
      "Gauge tie plate renewal",
      "Sleeper renewal",
      "Fish Plates O&E",
      "Preliminary/Post works",
      "Trucking out materials",
      "Cutting Widening work",
      "JCB working",
      "Earth work/Muck removal",
      "Crane Moving/Working",
      "Attention to Track",
      "Attention to Fittings",
      "Attention to Bridge",
      "Attention to Guard rail",
      "Attention to Points & Xing",
      "Attention to LC",
      "Attention to Curve check rail",
      "Sheet Piling work",
      "Platform work",
      "Platform Shelter work",
      "ABSS work",
      "Erection of Platform shelter purlins work",
      "Erection of FOB Girders",
      "Other FOB works",
      "Other Track works",
      "Other Bridge work",
    ],
  },
  SIG: {
    Gear: [
      "Point",
      "EI",
      "Signal",
      "DC Track",
      "AFTC",
      "SSDAC",
      "MSDAC",
      "Panel",
      "LC Gate Mechanical",
      "LC Gate ELB",
      "Emergency Sliding Boom",
      "IPS",
      "Conventional power supply equipment",
      "System Integrity Test of each PI/EI/RRI stations",
      "Cable Insulation testing (cable meggering) for one station.",
      "DLBI- SGE",
      "TLBI -FM Inst",
      "UFSBI",
      "Fuse",
      "EKT",
    ],
  },
  TRD: {
    Tw_Working: [
      "AOH",
      "POH",
      "IOH",
      "RE POH",
      "RD WORK",
      "TURN OUT CHECKING",
      "CROSS OVER CHECKING",
      "CROSS TRACK FEEDERS CHECKING",
      "GANTRY MAINTENANCE",
      "CONTACT WIRE RENEWAL WORK",
      "CATENARY WIRE RENEWAL WORK",
      "CANTILEVER ERECTION/REPLACEMENT(2x25KV WORK)",
      "MAST ERECTION(2x25KV WORK)",
      "FEEDERS ERECTION(2x25KV WORK)",
      "OHE PROFILING",
      "OHE/CN WORK",
      "OTHER SPECIAL WORKS",
    ],
    Lt_Working: [
      "AOH",
      "POH",
      "IOH",
      "RE POH",
      "RD WORK",
      "TURN OUT CHECKING",
      "CROSS OVER CHECKING",
      "CROSS TRACK FEEDERS CHECKING",
      "GANTRY MAINTENANCE",
      "CONTACT WIRE RENEWAL WORK",
      "CATENARY WIRE RENEWAL WORK",
      "CANTILEVER ERECTION/REPLACEMENT(2x25KV WORK)",
      "MAST ERECTION(2x25KV WORK)",
      "FEEDERS ERECTION(2x25KV WORK)",
      "OHE PROFILING",
      "OHE/CN WORK",
      "OTHER SPECIAL WORKS",
    ],
  },
};

export let data = {
  sections: [
    {
      name: "AJJ-RU",
      section_blocks: [
        { block: "AJJ-AJJN", lines: ["UP", "DN"] },
        { block: "MLPM-AJJN", lines: ["UP", "DN"] },
        { block: "AJJN-TRT", lines: ["UP", "DN"] },
        { block: "TRT-POI", lines: ["UP", "DN"] },
        { block: "POI-NG", lines: ["UP", "DN"] },
        { block: "NG-VGA", lines: ["UP", "DN"] },
        { block: "POI-VKZ", lines: ["UP", "DN"] },
        { block: "VKZ-NG", lines: ["UP", "DN"] },
        { block: "NG-EKM", lines: ["UP", "DN"] },
        { block: "EKM-VGA", lines: ["UP", "DN"] },
        { block: "VGA-PUT", lines: ["UP", "DN"] },
        { block: "PUT-TDK", lines: ["UP", "DN"] },
        { block: "TDK-PUDI", lines: ["UP", "DN"] },
        { block: "PUDI-RU", lines: ["UP", "DN"] },
      ],
      station_blocks: [
        { block: "AJJ-YD", lines: ["UP", "DN"] },
        { block: "MLPM-YD", lines: ["UP", "DN"] },
        { block: "AJJN-YD", lines: ["UP", "DN"] },
        { block: "TRT-YD", lines: ["UP", "DN"] },
        { block: "POI-YD", lines: ["UP", "DN"] },
        { block: "NG-YD", lines: ["UP", "DN"] },
        { block: "VGA-YD", lines: ["UP", "DN"] },
        { block: "PUT-YD", lines: ["UP", "DN"] },
        { block: "TDK-YD", lines: ["UP", "DN"] },
        { block: "PUDI-YD", lines: ["UP", "DN"] },
        { block: "RU-YD", lines: ["UP", "DN"] },
      ],
      lines: ["UP", "DN"],
    },
    {
      name: "MAS-AJJ",
      section_blocks: [
        {
          block: "MAS-BBQ",
          lines: ["Up SW", "Down SW", "Up NE", "Down NE"],
        },
        {
          block: "MASS-BBQ",
          lines: ["Up SW Sub", "Down SW Sub"],
        },
        {
          block: "MMCC-BBQ",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "BBQ-VPY",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "VPY-VLK",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "VLK-ABU",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "ABU-AVD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "AVD-PAB",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "PAB-PTMS",
          lines: ["Up and Down Single"],
        },
        {
          block: "PTMS-TI",
          lines: ["Up and Down Single"],
        },
        {
          block: "PAB-TI",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "TI-TRL",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "TRL-KBT",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "KBT-TO",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "TO-AJJ",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
      ],
      station_blocks: [
        {
          block: "MAS-YD",
          lines: ["Up SW", "Down SW", "Up NE", "Down NE"],
        },
        {
          block: "BBQ-YD",
          lines: ["Up SW", "Down SW", "Up SW Sub", "Down SW Sub"],
        },
        {
          block: "MASS-YD",
          lines: ["Up SW Sub", "Down SW Sub"],
        },
        {
          block: "MMCC-YD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "VPY-YD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "VLK-YD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "ABU-YD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "AVD-YD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "PAB-YD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "PTMS-YD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "TI-YD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "TRL-YD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "KBT-YD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "TO-YD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
        {
          block: "AJJ-YD",
          lines: ["Up slow", "Down slow", "Up fast", "Down fast"],
        },
      ],
      lines: [
        "Up slow",
        "Down slow",
        "Up fast",
        "Down fast",
        "Up NE, Dowm NE, Up SW, Down SW",
      ],
    },
    {
      name: "MSB-VM",
      section_blocks: [
        {
          block: "MSB-MS",
          lines: ["A line", "B line", "Down Sub urban", "Up sub urban"],
        },
        {
          block: "MS-MKK",
          lines: ["A line", "B line", "Down Sub urban", "Up sub urban"],
        },
        {
          block: "MKK-MBM",
          lines: ["A line", "B line", "Down Sub urban", "Up sub urban"],
        },
        {
          block: "MBM-STM",
          lines: ["A line", "B line", "Down Sub urban", "Up sub urban"],
        },
        {
          block: "STM-PV",
          lines: ["A line", "B line", "Down Sub urban", "Up sub urban"],
        },
        {
          block: "PV-TBM",
          lines: ["A line", "B line", "Down Sub urban", "Up sub urban"],
        },
        { block: "TBM-PRGL", lines: ["UP line", "Down line"] },
        { block: "TBM-VDR", lines: ["UP line", "Down line", "3rd line"] },
        { block: "PRGL-VDR", lines: ["UP line", "Down line"] },
        { block: "VDR-UPM", lines: ["UP line", "Down line"] },
        { block: "VDR-GI", lines: ["UP line", "Down line", "3rd line"] },
        { block: "UPM-GI", lines: ["UP line", "Down line"] },
        { block: "POTI-CTM", lines: ["UP line", "Down line"] },
        { block: "CTM-MMNK", lines: ["UP line", "Down line"] },
        { block: "MMNK-SKL", lines: ["UP line", "Down line"] },
        { block: "SKL-PWU", lines: ["UP line", "Down line"] },
        { block: "GI-CTM", lines: ["UP line", "Down line", "3rd line"] },
        { block: "CTM-SKL", lines: ["UP line", "Down line", "3rd line"] },
        { block: "SKL-CGL", lines: ["UP line", "Down line", "3rd line"] },
        { block: "PWU-CGL", lines: ["UP line", "Down line"] },
        { block: "CGL-OV", lines: ["UP line", "Down line"] },
        { block: "OV-PTM", lines: ["UP line", "Down line"] },
        { block: "PTM-KGZ", lines: ["UP line", "Down line"] },
        { block: "OV-KGZ", lines: ["UP line", "Down line"] },
        { block: "KGZ-MMK", lines: ["UP line", "Down line"] },
        { block: "MMK-MLMR", lines: ["UP line", "Down line"] },
        { block: "MLMR-ACK", lines: ["UP line", "Down line"] },
        { block: "ACK-TZD", lines: ["UP line", "Down line"] },
        { block: "MLMR-TZD", lines: ["UP line", "Down line"] },
        { block: "TZD-OLA", lines: ["UP line", "Down line"] },
        { block: "OLA-TMV", lines: ["UP line", "Down line"] },
        { block: "TMV-MTL", lines: ["UP line", "Down line"] },
        { block: "MTL-PEI", lines: ["UP line", "Down line"] },
        { block: "PEI-VVN", lines: ["UP line", "Down line"] },
        { block: "VVN-MYP", lines: ["UP line", "Down line"] },
        { block: "MYP-VM", lines: ["UP line", "Down line"] },
      ],
      station_blocks: [
        {
          block: "MS-YD",
          lines: ["A line", "B line", "Down Sub urban", "Up sub urban"],
        },
        {
          block: "MKK-YD",
          lines: ["A line", "B line", "Down Sub urban", "Up sub urban"],
        },
        {
          block: "MBM-YD",
          lines: ["A line", "B line", "Down Sub urban", "Up sub urban"],
        },
        {
          block: "STM-YD",
          lines: ["A line", "B line", "Down Sub urban", "Up sub urban"],
        },
        {
          block: "PV-YD",
          lines: ["A line", "B line", "Down Sub urban", "Up sub urban"],
        },
        {
          block: "TBM-YD",
          lines: ["A line", "B line", "Down Sub urban", "Up sub urban"],
        },
        { block: "VDR-YD", lines: ["UP line", "Down line"] },
        { block: "PRGL-VDR", lines: ["UP line", "Down line"] },
        { block: "GI-YD", lines: ["UP line", "Down line"] },
        { block: "CTM-YD", lines: ["UP line", "Down line"] },
        { block: "SKL-YD", lines: ["UP line", "Down line"] },
        { block: "CGL-YD", lines: ["UP line", "Down line"] },
        { block: "OV-YD", lines: ["UP line", "Down line"] },
        { block: "KGZ-YD", lines: ["UP line", "Down line"] },
        { block: "MMK-YD", lines: ["UP line", "Down line"] },
        { block: "MLMR-YD", lines: ["UP line", "Down line"] },
        { block: "TZD-YD", lines: ["UP line", "Down line"] },
        { block: "OLA-YD", lines: ["UP line", "Down line"] },
        { block: "TMV-YD", lines: ["UP line", "Down line"] },
        { block: "MTL-YD", lines: ["UP line", "Down line"] },
        { block: "PEI-YD", lines: ["UP line", "Down line"] },
        { block: "VVN-YD", lines: ["UP line", "Down line"] },
        { block: "MYP-YD", lines: ["UP line", "Down line"] },
        { block: "VM-YD", lines: ["UP line", "Down line"] },
      ],
      lines: [
        "UP line",
        "Down line",
        "A line",
        "B line",
        "Down Sub urban",
        "Up sub urban",
      ],
    },
    {
      name: "AJJ-KPD",
      section_blocks: [
        { block: "AJJ-MLPM", lines: ["UP line", "Down line"] },
        { block: "MLPM-CTRE", lines: ["UP line", "Down line"] },
        { block: "CTRE-MDVE", lines: ["UP line", "Down line"] },
        { block: "MDVE-SHU", lines: ["UP line", "Down line"] },
        { block: "SHU-TUG", lines: ["UP line", "Down line"] },
        { block: "TUG-WJR", lines: ["UP line", "Down line"] },
        { block: "WJR-MCN", lines: ["UP line", "Down line"] },
        { block: "MCN-THL", lines: ["UP line", "Down line"] },
        { block: "THL-SVUR", lines: ["UP line", "Down line"] },
        { block: "SVUR-KPD", lines: ["UP line", "Down line"] },
        { block: "KPD-RAM", lines: ["UP line", "Down line"] },
        { block: "KPD-VLR", lines: ["UP line", "Down line"] },
      ],
      station_blocks: [
        { block: "AJJ-YD", lines: ["UP line", "Down line"] },
        { block: "MLPM-YD", lines: ["UP line", "Down line"] },
        { block: "CTRE-YD", lines: ["UP line", "Down line"] },
        { block: "MDVE-YD", lines: ["UP line", "Down line"] },
        { block: "SHU-YD", lines: ["UP line", "Down line"] },
        { block: "TUG-YD", lines: ["UP line", "Down line"] },
        { block: "WJR-YD", lines: ["UP line", "Down line"] },
        { block: "MCN-YD", lines: ["UP line", "Down line"] },
        { block: "THL-YD", lines: ["UP line", "Down line"] },
        { block: "SVUR-YD", lines: ["UP line", "Down line"] },
        { block: "KPD-YD", lines: ["UP line", "Down line"] },
      ],
      lines: ["UP line", "Down line"],
    },
    {
      name: "KPD-JTJ",
      section_blocks: [
        { block: "KPD-LTI", lines: ["UP line", "Down line"] },
        { block: "LTI-KVN", lines: ["UP line", "Down line"] },
        { block: "KVN-GYM", lines: ["UP line", "Down line"] },
        { block: "GYM-VLT", lines: ["UP line", "Down line"] },
        { block: "VLT-MPI", lines: ["UP line", "Down line"] },
        { block: "MPI-PCKM", lines: ["UP line", "Down line"] },
        { block: "PCKM-AB", lines: ["UP line", "Down line"] },
        { block: "AB-VGM", lines: ["UP line", "Down line"] },
        { block: "VGM-VN", lines: ["UP line", "Down line"] },
        { block: "VN-KDY", lines: ["UP line", "Down line"] },
        { block: "KDY-JTJ", lines: ["UP line", "Down line"] },
        { block: "JTJ-SKPT", lines: ["UP line", "Down line"] },
        { block: "JTJ-TPT", lines: ["UP line", "Down line"] },
        { block: "JTJ AUX-TPT", lines: ["UP line", "Down line"] },
      ],
      station_blocks: [
        { block: "KPD-YD", lines: ["UP line", "Down line"] },
        { block: "LTI-YD", lines: ["UP line", "Down line"] },
        { block: "KVN-YD", lines: ["UP line", "Down line"] },
        { block: "GYM-YD", lines: ["UP line", "Down line"] },
        { block: "VLT-YD", lines: ["UP line", "Down line"] },
        { block: "MPI-YD", lines: ["UP line", "Down line"] },
        { block: "PCKM-YD", lines: ["UP line", "Down line"] },
        { block: "AB-YD", lines: ["UP line", "Down line"] },
        { block: "VGM-YD", lines: ["UP line", "Down line"] },
        { block: "VN-YD", lines: ["UP line", "Down line"] },
        { block: "KDY-YD", lines: ["UP line", "Down line"] },
        { block: "JTJ-YD", lines: ["UP line", "Down line"] },
      ],
      lines: ["UP line", "Down line"],
    },
    {
      name: "AJJ-CGL",
      section_blocks: [
        { block: "CGL-RDY", lines: ["SINGLE LINE"] },
        { block: "CGL-PALR", lines: ["SINGLE LINE"] },
        { block: "RDY-VB", lines: ["SINGLE LINE"] },
        { block: "VB-PALR", lines: ["SINGLE LINE"] },
        { block: "PALR-PYV", lines: ["SINGLE LINE"] },
        { block: "PALR-WJ", lines: ["SINGLE LINE"] },
        { block: "PYV-WJ", lines: ["SINGLE LINE"] },
        { block: "WJ-NTT", lines: ["SINGLE LINE"] },
        { block: "WJ-CJ", lines: ["SINGLE LINE"] },
        { block: "NTT-CJ(O)", lines: ["SINGLE LINE"] },
        { block: "CJ(O)-CJ(E)", lines: ["SINGLE LINE"] },
        { block: "CJ(E)-TMLP", lines: ["SINGLE LINE"] },
        { block: "TMLP-TKO", lines: ["SINGLE LINE"] },
        { block: "TMLP-MLPM", lines: ["SINGLE LINE"] },
        { block: "TKO-MLPM", lines: ["SINGLE LINE"] },
        { block: "MLPM-AJJ", lines: ["SINGLE LINE"] },
      ],
      station_blocks: [
        { block: "CGL-YD", lines: ["SINGLE LINE"] },
        { block: "PALR-YD", lines: ["SINGLE LINE"] },
        { block: "WJ-YD", lines: ["SINGLE LINE"] },
        { block: "CJ(O)-YD", lines: ["SINGLE LINE"] },
        { block: "CJ(E)-YD", lines: ["SINGLE LINE"] },
        { block: "TMLP-YD", lines: ["SINGLE LINE"] },
        { block: "MLPM-YD", lines: ["SINGLE LINE"] },
        { block: "AJJ-YD", lines: ["SINGLE LINE"] },
      ],
      lines: ["UP line", "Down line"],
    },
    {
      name: "MAS-GDR",
      section_blocks: [
        {
          block: "MASS-BBQ",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "MAS-BBQ",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "MMC-BBQ",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "BBQ-KOK",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "VPY-KOK",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "WST-KOK",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "KOK-TNP",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "TNP-TVT",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "TVT-ENR",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "ENR-AIPP",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "AIPP-AIP",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        { block: "AIP-MJR", lines: ["UP line", "Down line"] },
        { block: "MJR-PON", lines: ["UP line", "Down line"] },
        { block: "PON-KVP", lines: ["UP line", "Down line"] },
        { block: "KVP-GPD", lines: ["UP line", "Down line"] },
        { block: "GPD-ELR", lines: ["UP line", "Down line"] },
        { block: "ELR-AKM", lines: ["UP line", "Down line"] },
        { block: "AKM-TAD", lines: ["UP line", "Down line"] },
        { block: "TAD-SPE", lines: ["UP line", "Down line"] },
        { block: "TAD-AKAT", lines: ["UP line", "Down line"] },
        { block: "AKAT-SPE", lines: ["UP line", "Down line"] },
        { block: "SPE-PEL", lines: ["UP line", "Down line"] },
        { block: "PEL-DVR", lines: ["UP line", "Down line"] },
        { block: "DVR-NYP", lines: ["UP line", "Down line"] },
        { block: "NYP-PYA", lines: ["UP line", "Down line"] },
        { block: "PYA-ODR", lines: ["UP line", "Down line"] },
        { block: "ODR-GDR", lines: ["UP line", "Down line"] },
      ],
      station_blocks: [
        {
          block: "MMC-YD",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "MAS-YD",
          lines: ["UP NE", "Down NE"],
        },
        {
          block: "BBQ-YD",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "KOK-YD",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "TNP-YD",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "TVT-YD",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "ENR-YD",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "AIP-YD",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        {
          block: "AIPP-YD",
          lines: ["UP slow", "Down Slow", "UP fast", "Down Fast"],
        },
        { block: "MJR-YD", lines: ["UP line", "Down line"] },
        { block: "PON-YD", lines: ["UP line", "Down line"] },
        { block: "KVP-YD", lines: ["UP line", "Down line"] },
        { block: "GPD-YD", lines: ["UP line", "Down line"] },
        { block: "ELR-YD", lines: ["UP line", "Down line"] },
        { block: "AKM-YD", lines: ["UP line", "Down line"] },
        { block: "TAD-YD", lines: ["UP line", "Down line"] },
        { block: "SPE-YD", lines: ["UP line", "Down line"] },
        { block: "PEL-YD", lines: ["UP line", "Down line"] },
        { block: "DVR-YD", lines: ["UP line", "Down line"] },
        { block: "NYP-YD", lines: ["UP line", "Down line"] },
        { block: "PYA-YD", lines: ["UP line", "Down line"] },
        { block: "ODR-YD", lines: ["UP line", "Down line"] },
        { block: "GDR-YD", lines: ["UP line", "Down line"] },
      ],
      lines: [
        "UP line",
        "Down line",
        "UP slow",
        "Down Slow",
        "UP fast",
        "Down Fast",
        "UP NE",
        "Down NE",
      ],
    },
    {
      name: "MSB-VLCY",
      section_blocks: [
        {
          block: "MSB-MCPK",
          lines: ["UP line", "Down line"],
        },
        {
          block: "MCPK-MTMY",
          lines: ["UP line", "Down line"],
        },
        {
          block: "MTMY-VLCY",
          lines: ["UP line", "Down line"],
        },
      ],
      station_blocks: [],
      lines: ["UP line", "Down line"],
    },
  ],
};

export let sectionData = {
  "AJJ-RU": {
    section: [
      "AJJ-AJJN",
      "MLPM-AJJN",
      "AJJN-TRT",
      "TRT-POI",
      "POI-VKZ",
      "POI-NG",
      "VKZ-NG",
      "NG-EKM",
      "NG-VGA",
      "EKM-VGA",
      "VGA-PUT",
      "PUT-TDK",
      "TDK-PUDI",
      "PUDI-RU",
    ],
    station: [
      "AJJ-YD",
      "MLPM-YD",
      "AJJN-YD",
      "TRT-YD",
      "POI-YD",
      "NG-YD",
      "VAG-YD",
      "PUT-YD",
      "TDK-YD",
      "PUDI-YD",
      "RU-YD",
    ],
  },
  "MAS-AJJ": {
    station: [
      "MAS-BBQ",
      "MASS-BBQ",
      "MMCC-BBQ",
      "BBQ-VPY",
      "VPY-VLK",
      "VLK-ABU",
      "ABU-AVD",
      "AVD-PAB",
      "PAB-PTMS",
      "PTMS-TI",
      "PAB-TI",
      "TI-TRL",
      "TRL-KBT",
      "KBT-TO",
      "TO-AJJ",
    ],
    section: [
      "MAS-YD",
      "BBQ-YD",
      "MMCC-YD",
      "MASS-YD",
      "VPY-YD",
      "VLK-YD",
      "ABU-YD",
      "AVD-YD",
      "PAB-YD",
      "PTMS-YD",
      "TI-YD",
      "TRL-YD",
      "KBT-YD",
      "TO-YD",
      "AJJ-YD",
    ],
  },
  "MSB-VM": {
    section: [
      "MSB-MS",
      "MS-MKK",
      "MKK-MBM",
      "MBM-STM",
      "STM-PV",
      "PV-TBM",
      "TBM-PRGL",
      "TBM-VDR",
      "PRGL-VDR",
      "VDR-UPM",
      "VDR-GI",
      "UPM-GI",
      "POTI-CTM",
      "GI-CTM",
      "CTM-MMNK",
      "CTM-SKL",
      "MMNK-SKL",
      "SKL-PWU",
      "SKL-CGL",
      "PWU-CGL",
      "CGL-OV",
      "OV-PTM",
      "OV-KGZ",
      "PTM-KGZ",
      "KGZ-MMK",
      "MMK-MLMR",
      "MLMR-ACK",
      "MLMR-TZD",
      "ACK-TZD",
      "TZD-OLA",
      "OLA-TMV",
      "TMV-MTL",
      "MTL-PEI",
      "PEI-VVN",
      "VVN-MYP",
      "MYP-VM",
    ],
    station: [
      "MS-YD",
      "MKK-YD",
      "MBM-YD",
      "STM-YD",
      "PV-YD",
      "TBM-YD",
      "VDR-YD",
      "GI-YD",
      "CTM-YD",
      "SKL-YD",
      "CGL-YD",
      "OV-YD",
      "KGZ-YD",
      "MMK-YD",
      "MLMR-YD",
      "TZD-YD",
      "OLA-YD",
      "TMV-YD",
      "MTL-YD",
      "PEI-YD",
      "VVN-YD",
      "MYP-YD",
      "VM-YD",
    ],
  },
  "AJJ-KPD": {
    section: [
      "AJJ-MLPM",
      "MLPM-CTRE",
      "CTRE-MDVE",
      "MDVE-SHU",
      "SHU-TUG",
      "TUG-WJR",
      "WJR-MCN",
      "MCN-THL",
      "THL-SVUR",
      "SVUR-KPD",
      "KPD-RAM",
      "KPD-VLR",
    ],
    station: [
      "AJJ-YD",
      "MLPM-YD",
      "CTRE-YD",
      "MDVE-YD",
      "SHU-YD",
      "TUG-YD",
      "WJR-YD",
      "MCN-YD",
      "THL-YD",
      "SVUR-YD",
      "KPD-YD",
    ],
  },
  "KPD-JTJ": {
    section: [
      "KPD-LTI",
      "LTI-KVN",
      "KVN-GYM",
      "GYM-VLT",
      "VLT-MPI",
      "MPI-PCKM",
      "PCKM-AB",
      "AB-VGM",
      "VGM-VN",
      "VN-KDY",
      "KDY-JTJ",
      "JTJ-SKPT",
      "JTJ-TPT",
      "JTJ AUX-TPT",
    ],
    station: [
      "AJJ-YD",
      "MLPM-YD",
      "CTRE-YD",
      "MDVE-YD",
      "SHU-YD",
      "TUG-YD",
      "WJR-YD",
      "MCN-YD",
      "THL-YD",
      "SVUR-YD",
      "KPD-YD",
      "LTI-YD",
      "KVN-YD",
      "GYM-YD",
      "VLT-YD",
      "MPI-YD",
      "PCKM-YD",
      "AB-YD",
      "VGM-YD",
      "VN-YD",
      "KDY-YD",
      "JTJ-YD",
    ],
  },
  "AJJ-CGL": {
    section: [
      "CGL-RDY",
      "RDY-VB",
      "CGL-PALR",
      "VB-PALR",
      "PALR-PYV",
      "PALR-WJ",
      "PYV-WJ",
      "WJ-NTT",
      "WJ-CJ",
      "NTT-CJ(O)",
      "CJ(O)-CJ(E)",
      "CJ(E)-TMLP",
      "TMLP-TKO",
      "TMLP-MLPM",
      "TKO-MLPM",
      "MLPM-AJJ",
    ],
    station: [
      "CGL-YD",
      "PALR-YD",
      "WJ-YD",
      "CJ(O)-YD",
      "CJ(E)-YD",
      "TMLP-YD",
      "MLPM-YD",
      "AJJ-YD",
    ],
  },
  "MAS-GDR": {
    section: [
      "MASS-BBQ",
      "MAS-BBQ",
      "MMC-BBQ",
      "VPY-KOK",
      "BBQ-KOK",
      "VPY-KOK",
      "WST-KOK",
      "KOK-TNP",
      "TNP-TVT",
      "TVT-ENR",
      "ENR-AIPP",
      "AIPP-AIP",
      "AIP-MJR",
      "MJR-PON",
      "PON-KVP",
      "KVP-GPD",
      "GPD-ELR",
      "ELR-AKM",
      "AKM-TAD",
      "TAD-AKAT",
      "TAD-SPE",
      "AKAT-SPE",
      "SPE-PEL",
      "PEL-DVR",
      "DVR-NYP",
      "NYP-PYA",
      "PYA-ODR",
      "ODR-GDR",
    ],
    station: [
      "MMC-YD",
      "MAS-YD",
      "BBQ-YD",
      "KOK-YD",
      "TNP-YD",
      "TVT-YD",
      "ENR-YD",
      "AIP-YD",
      "AIPP-YD",
      "MJR-YD",
      "PON-YD",
      "KVP-YD",
      "GPD-YD",
      "ELR-YD",
      "AKM-YD",
      "TAD-YD",
      "SPE-YD",
      "PEL-YD",
      "DVR-YD",
      "NYP-YD",
      "PYA-YD",
      "ODR-YD",
      "GDR-YD",
    ],
  },
  "MSB-VLCY": {
    section: ["MSB-MCPK", "MCPK-MTMY", "MTMY-VLCY"],
    station: [],
  },
};
