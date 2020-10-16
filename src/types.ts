import { LovelaceCardConfig } from 'custom-card-helpers';

export interface IdFMCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  entity?: string;
  //lineType: string;
  line: string;
  station: string;
  way: string;
}
