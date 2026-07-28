import { SectionConfig } from "@/lib/types";
import { BaseSize, SectionStyleConfig } from "../layouts/types";

export interface SectionRenderProps {
  section: SectionConfig;
  config?: SectionStyleConfig;
  baseSize: BaseSize;
}
