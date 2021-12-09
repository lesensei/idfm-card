import { LovelaceCardConfig } from 'custom-card-helpers';

export interface IdFMCardConfig extends LovelaceCardConfig {
  name?: string;
  entity?: string;
  line: string;
  station: string;
  arrivalStation?: string;
  direction?: string;
  maxTrainsShown?: number;
  maxWaitMinutes?: number;
}
