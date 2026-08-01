import type { SeatingSectionInput, SeatMapFocalPoint } from "@/features/seating/api";

export type SeatingPresetId = "classic" | "theater" | "stadium" | "arena";

export type SeatingPreset = {
  id: SeatingPresetId;
  name: string;
  description: string;
};

export const SEATING_PRESETS: SeatingPreset[] = [
  {
    id: "classic",
    name: "Classic rows",
    description: "Straight rows facing a stage. Good for halls and small venues.",
  },
  {
    id: "theater",
    name: "Theater",
    description: "Curved orchestra blocks and a balcony facing the stage.",
  },
  {
    id: "stadium",
    name: "Round stadium",
    description: "Two rings of wedge sections around a central field.",
  },
  {
    id: "arena",
    name: "Arena / court",
    description: "Four stands around a central court.",
  },
];

export type PresetResult = {
  sections: SeatingSectionInput[];
  focalPoint: SeatMapFocalPoint | null;
};

/**
 * Build starter sections for a venue preset. `ticketTypeIds` maps price tiers:
 * index 0 = premium/closest tier, index 1 = second tier (falls back to index 0).
 */
export function buildSeatingPreset(
  preset: SeatingPresetId,
  ticketTypeIds: string[],
): PresetResult {
  const tier = (i: number) => ticketTypeIds[i] ?? ticketTypeIds[0] ?? "";

  if (preset === "stadium") {
    const innerColor = "#8b5cf6";
    const outerColor = "#06b6d4";
    const sections: SeatingSectionInput[] = [];
    for (let i = 0; i < 6; i++) {
      sections.push({
        ticketTypeId: tier(0),
        name: `A${i + 1}`,
        color: innerColor,
        sortOrder: i,
        rowCount: 4,
        seatsPerRow: 10,
        rowLabelStart: "A",
        shape: "ARC",
        posX: 0,
        posY: 0,
        rotation: i * 60,
        curve: 50,
        arcRadius: 268,
      });
    }
    for (let i = 0; i < 6; i++) {
      sections.push({
        ticketTypeId: tier(1),
        name: `B${i + 1}`,
        color: outerColor,
        sortOrder: 6 + i,
        rowCount: 5,
        seatsPerRow: 14,
        rowLabelStart: "A",
        shape: "ARC",
        posX: 0,
        posY: 0,
        rotation: i * 60,
        curve: 50,
        arcRadius: 408,
      });
    }
    return {
      sections,
      focalPoint: { kind: "field", x: 0, y: 0, width: 300, height: 190 },
    };
  }

  if (preset === "theater") {
    const orchestraColor = "#ec4899";
    const balconyColor = "#f59e0b";
    const sections: SeatingSectionInput[] = [
      {
        ticketTypeId: tier(0),
        name: "Orchestra Left",
        color: orchestraColor,
        sortOrder: 0,
        rowCount: 8,
        seatsPerRow: 6,
        rowLabelStart: "A",
        shape: "ARC",
        posX: 0,
        posY: 0,
        rotation: 140,
        curve: 30,
        arcRadius: 250,
      },
      {
        ticketTypeId: tier(0),
        name: "Orchestra Center",
        color: orchestraColor,
        sortOrder: 1,
        rowCount: 8,
        seatsPerRow: 8,
        rowLabelStart: "A",
        shape: "ARC",
        posX: 0,
        posY: 0,
        rotation: 180,
        curve: 44,
        arcRadius: 250,
      },
      {
        ticketTypeId: tier(0),
        name: "Orchestra Right",
        color: orchestraColor,
        sortOrder: 2,
        rowCount: 8,
        seatsPerRow: 6,
        rowLabelStart: "A",
        shape: "ARC",
        posX: 0,
        posY: 0,
        rotation: 220,
        curve: 30,
        arcRadius: 250,
      },
      {
        ticketTypeId: tier(1),
        name: "Balcony",
        color: balconyColor,
        sortOrder: 3,
        rowCount: 4,
        seatsPerRow: 26,
        rowLabelStart: "A",
        shape: "ARC",
        posX: 0,
        posY: 0,
        rotation: 180,
        curve: 80,
        arcRadius: 498,
      },
    ];
    return {
      sections,
      focalPoint: { kind: "stage", x: 0, y: 0, width: 300, height: 52 },
    };
  }

  if (preset === "arena") {
    const mainColor = "#10b981";
    const sideColor = "#6366f1";
    const sections: SeatingSectionInput[] = [
      {
        ticketTypeId: tier(0),
        name: "North Stand",
        color: mainColor,
        sortOrder: 0,
        rowCount: 4,
        seatsPerRow: 12,
        rowLabelStart: "A",
        shape: "GRID",
        posX: 0,
        posY: -130,
        rotation: 180,
        curve: 0,
        arcRadius: 0,
      },
      {
        ticketTypeId: tier(0),
        name: "South Stand",
        color: mainColor,
        sortOrder: 1,
        rowCount: 4,
        seatsPerRow: 12,
        rowLabelStart: "A",
        shape: "GRID",
        posX: 0,
        posY: 130,
        rotation: 0,
        curve: 0,
        arcRadius: 0,
      },
      {
        ticketTypeId: tier(1),
        name: "West Stand",
        color: sideColor,
        sortOrder: 2,
        rowCount: 4,
        seatsPerRow: 8,
        rowLabelStart: "A",
        shape: "GRID",
        posX: -179,
        posY: 0,
        rotation: 90,
        curve: 0,
        arcRadius: 0,
      },
      {
        ticketTypeId: tier(1),
        name: "East Stand",
        color: sideColor,
        sortOrder: 3,
        rowCount: 4,
        seatsPerRow: 8,
        rowLabelStart: "A",
        shape: "GRID",
        posX: 179,
        posY: 0,
        rotation: 270,
        curve: 0,
        arcRadius: 0,
      },
    ];
    return {
      sections,
      focalPoint: { kind: "court", x: 0, y: 0, width: 220, height: 120 },
    };
  }

  return {
    sections: [
      {
        ticketTypeId: tier(0),
        name: "Main Floor",
        color: "#ec4899",
        sortOrder: 0,
        rowCount: 5,
        seatsPerRow: 8,
        rowLabelStart: "A",
        shape: "GRID",
        posX: 0,
        posY: 0,
        rotation: 0,
        curve: 0,
        arcRadius: 0,
      },
    ],
    focalPoint: null,
  };
}
