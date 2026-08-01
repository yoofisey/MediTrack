import { Smile, User, CircleUser, UserRound, Frown, Meh, Sparkles, Baby, Laugh, Heart, Star, Sun, Dumbbell, Moon, HeartHandshake, Flower, Bug, Panda, Flower2, Palette } from "lucide-react";

export const AVATAR_CHOICES = [
  { key: "Smile", Icon: Smile },
  { key: "User", Icon: User },
  { key: "CircleUser", Icon: CircleUser },
  { key: "UserRound", Icon: UserRound },
  { key: "Frown", Icon: Frown },
  { key: "Meh", Icon: Meh },
  { key: "Sparkles", Icon: Sparkles },
  { key: "Baby", Icon: Baby },
  { key: "Laugh", Icon: Laugh },
  { key: "Heart", Icon: Heart },
  { key: "Star", Icon: Star },
  { key: "Sun", Icon: Sun },
  { key: "Dumbbell", Icon: Dumbbell },
  { key: "Moon", Icon: Moon },
  { key: "HeartHandshake", Icon: HeartHandshake },
  { key: "Flower", Icon: Flower },
  { key: "Bug", Icon: Bug },
  { key: "Panda", Icon: Panda },
  { key: "Flower2", Icon: Flower2 },
  { key: "Palette", Icon: Palette },
];

export const AVATAR_ICONS = AVATAR_CHOICES.map(c => c.Icon);

const EMOJI_TO_KEY = {
  "😊": "Smile", "🧑": "User", "👩": "CircleUser", "👨": "UserRound", "🧓": "Frown",
  "👴": "Meh", "👵": "Sparkles", "🧒": "Baby", "👦": "Laugh", "👧": "Heart",
  "🙂": "Star", "😄": "Sun", "💪": "Dumbbell", "🌟": "Moon", "❤️": "HeartHandshake",
  "🌸": "Flower", "🐻": "Bug", "🦁": "Panda", "🐼": "Flower2", "🌴": "Palette",
};

const KEY_MAP = Object.fromEntries(AVATAR_CHOICES.map(c => [c.key, c.Icon]));

export function avatarIcon(stored) {
  const key = EMOJI_TO_KEY[stored] || stored || "Smile";
  return KEY_MAP[key] || Smile;
}
