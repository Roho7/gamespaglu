import type { IconType } from "react-icons";
import { FaBullseye, FaHandshake, FaTrophy, FaUsers } from "react-icons/fa";
import { MdOutlineWifiOff, MdSignalCellularNodata } from "react-icons/md";
import { PiArrowsHorizontalBold, PiTargetBold } from "react-icons/pi";
import { TbRepeat } from "react-icons/tb";

export const ICONS = {
  players: FaUsers,
  offline: MdOutlineWifiOff,
  rounds: TbRepeat,
  bullseye: FaBullseye,
  near: PiTargetBold,
  edge: PiArrowsHorizontalBold,
  trophy: FaTrophy,
  tie: FaHandshake,
  static: MdSignalCellularNodata,
} as const satisfies Record<string, IconType>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as [IconName, ...IconName[]];
