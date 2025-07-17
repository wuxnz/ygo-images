declare module "@g-loot/react-tournament-brackets" {
  import React, { ReactNode } from "react";

  export interface Participant {
    id: string;
    name: string;
    isWinner?: boolean;
    resultText?: string;
  }

  export interface MatchData {
    id: string;
    name: string;
    nextMatchId?: string | null;
    tournamentRoundText: string;
    startTime: string;
    state: {
      status: string;
    };
    participants: Participant[];
  }

  export interface ThemeConfig {
    textColor?: {
      main?: string;
      highlighted?: string;
      dark?: string;
    };
    matchBackground?: {
      wonColor?: string;
      lostColor?: string;
    };
    score?: {
      background?: {
        wonColor?: string;
        lostColor?: string;
      };
    };
    border?: {
      color?: string;
      highlightedColor?: string;
    };
    roundHeader?: {
      backgroundColor?: string;
      fontColor?: string;
    };
    connectorColor?: string;
    connectorColorHighlight?: string;
    svgBackground?: string;
  }

  export interface SVGViewerProps {
    width: number;
    height: number;
    children: ReactNode;
    [key: string]: any;
  }

  export interface BracketProps {
    matches: MatchData[];
    onMatchClick?: (match: MatchData) => void;
    theme?: ThemeConfig;
    svgWrapper?: (props: SVGViewerProps) => React.ReactElement;
  }

  export function SingleEliminationBracket(
    props: BracketProps,
  ): React.ReactElement;
  export function DoubleEliminationBracket(
    props: BracketProps,
  ): React.ReactElement;
  export function SVGViewer(props: SVGViewerProps): React.ReactElement;
  export function createTheme(config: ThemeConfig): ThemeConfig;
  export function Match(props: any): React.ReactElement;
}
