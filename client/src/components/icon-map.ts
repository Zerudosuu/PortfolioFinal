/* Maps icon keys stored in content/*.json to their components.
   JSON can't hold JSX, so content files reference keys and resolve here.
   Unknown keys render nothing (lookups return undefined). */
import type { ComponentType } from "react"
import {
  AppWindow,
  Database,
  Globe,
  MousePointerClick,
  Workflow,
} from "lucide-react"
import {
  RiCodeSSlashLine,
  RiGitBranchLine,
  RiGithubLine,
  RiLinkedinLine,
  RiPenNibLine,
  RiReactjsLine,
  RiSpeedLine,
  RiTriangleLine,
  RiTwitterXLine,
  RiWindyLine,
} from "@remixicon/react"

type IconComponent = ComponentType<{ className?: string }>

const ICONS: Record<string, IconComponent> = {
  // lucide (services)
  "mouse-pointer-click": MousePointerClick,
  workflow: Workflow,
  database: Database,
  globe: Globe,
  "app-window": AppWindow,
  // remixicon (skills)
  react: RiReactjsLine,
  typescript: RiCodeSSlashLine,
  tailwind: RiWindyLine,
  speed: RiSpeedLine,
  triangle: RiTriangleLine,
  "git-branch": RiGitBranchLine,
  "pen-nib": RiPenNibLine,
  // remixicon (socials)
  github: RiGithubLine,
  linkedin: RiLinkedinLine,
  twitter: RiTwitterXLine,
}

export function getIcon(key: string): IconComponent | undefined {
  return ICONS[key]
}
