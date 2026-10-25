"use client";

import { useState } from "react";
import { ActivityBoard } from "@/learn/boards/activity-board";
import type { Activity, BoardState } from "@/learn/types";

const empty: BoardState = { picks: {}, selected: null, checked: false };

export function PracticeBoard({ activity }: { activity: Activity }) {
  const [state, setState] = useState<BoardState>(empty);

  return (
    <ActivityBoard
      activity={activity}
      state={state}
      onChange={(partial) =>
        setState((s) => ({
          ...s,
          ...partial,
          picks: partial.picks ?? s.picks,
        }))
      }
    />
  );
}
