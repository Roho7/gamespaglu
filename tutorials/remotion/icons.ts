import type { IconType } from "react-icons";
import { FaBullseye, FaCheck, FaHandshake, FaMobileAlt, FaTimes, FaTrophy, FaUsers } from "react-icons/fa";
import { MdOutlineWifiOff, MdSignalCellularNodata } from "react-icons/md";
import { PiArrowsHorizontalBold, PiTargetBold } from "react-icons/pi";
import { TbArrowsShuffle, TbRepeat } from "react-icons/tb";

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
  yes: FaCheck,
  no: FaTimes,
  shuffle: TbArrowsShuffle,
  phone: FaMobileAlt,
} as const satisfies Record<string, IconType>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as [IconName, ...IconName[]];
