/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  TemplateResult,
  css,
  PropertyValues,
  CSSResultGroup,
} from 'lit';
import { customElement, state } from "lit/decorators.js";
import {
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers';

import './editor';

import type { IdFMCardConfig } from './types';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

import { compareTwoStrings } from 'string-similarity';

/* eslint no-console: 0 */
console.info(
  `%c  IDFM-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

/* eslint-disable @typescript-eslint/no-explicit-any */
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'idfm-card',
  name: localize('common.card.name'),
  description: localize('common.card.description'),
});
/* eslint-enable @typescript-eslint/no-explicit-any */

interface Line {
  id: string;
  label: string;
  shortName: string;
  mode: string;
  color: string;
  textColor: string;
  operator: string;
}

interface Schedule {
  lineId: string;
  shortName: string;
  vehicleName: string;
  lineDirection: string;
  sens?: string;
  code?: string;
  time?: string;
  schedule?: string;
}

interface Stop {
  type: string;
  id: string;
  x: number;
  y: number;
  name: string;
  zipCode: string;
  city: string;
  elevator: true;
  stopArea?: Stop;
}

interface RouteStops {
  routeId: string;
  sens: string;
  stops: Array<Stop>;
}

@customElement('idfm-card')
export class IdFMCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('idfm-card-editor') as LovelaceCardEditor;
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  @state() private config!: IdFMCardConfig;
  @state() private _schedules!: Array<Schedule>;
  @state() private _lastUpdated = new Date();
  private _timer;
  @state() private _error = false;
  private routeStops: Array<RouteStops> = [];
  private destInfo?: Stop;
  private depInfo?: Stop;
  @state() private _line!: Line;

  public setConfig(config: IdFMCardConfig): void {
    if (!config || !config.station || !config.line) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: localize('common.card.name'),
      ...config,
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    if (changedProps.has('config'))
      this.initialize();

    if (changedProps.has('_schedules') || changedProps.has('_lastUpdated') ||
        changedProps.has('_error') || changedProps.has('config')) {
      return true;
    }

    return false;
  }

  /**
   * Fetch the "mode" parameter for the given line and return true when equal to "Bus"
   * @param {IdFMCard} card The IdFMCard with the IdFMCardConfig that holds the line ID
   * @returns {Promise<Response>}
   */
  protected loadLineInfo(card: IdFMCard): Promise<unknown> {
    return fetch(`https://api-iv.iledefrance-mobilites.fr/lines?lineEC=${card.config.line}`)
      .then((response) => {
        if (!response.ok) {
          console.log("Error getting line info for '%s'", card.config.line);
        }
        return response.json();
      })
      .then((data) => {
        if (data?.lines?.length == 1) {
          card._line = {
            id: data.lines[0].id,
            label: data.lines[0].label,
            shortName: data.lines[0].shortName,
            operator: data.lines[0].companies[0].label,
            mode: data.lines[0].modeLabel,
            color: data.lines[0].color,
            textColor: data.lines[0].textColor
          };
        } else {
          console.log("Got '%s' info details for line '%s'", data?.length, card.config.line);
        }
      });
  }

  /**
   * Loads routes and their repsective stops for the given line
   * @param {IdFMCard} card The {IdFMCard} with the {IdFMCardConfig} that holds the line ID
   * @returns {Promise<Response>}
   */
  protected loadRouteStops(card: IdFMCard): Promise<unknown> {
    return fetch(`https://api-iv.iledefrance-mobilites.fr/lines/${card.config.line}/stops?stopPoints=true&routes=true`)
      .then((response) => {
        if (!response.ok) {
          console.log("Error getting stops for line '%s'", card.config.line);
        }
        return response.json();
      })
      .then((data: RouteStops[]) => {
        if (data?.length >= 1) {
          card.routeStops = data;
          data.forEach((r) => {
            r.stops.forEach((s) => {
              if (s.id == card.config.station || s.stopArea?.id == card.config.station) {
                card.depInfo = s.stopArea;
              }
              if (s.id == card.config.arrivalStation || s.stopArea?.id == card.config.arrivalStation) {
                card.destInfo = s.stopArea;
              }
            });
          });
        } else {
          console.log("Got no stops data for line '%s'", card.config.line);
        }
      });
  }

  /**
   * Loads next scheduled stops for the given line at the given station
   * @param {IdFMCard} card The {IdFMCard} with the {IdFMCardConfig} that holds the line ID
   * @returns {Promise<Schedule[]>} unless something fails
   */
  private getSchedules(card: IdFMCard): Promise<unknown> {
    return fetch(`https://api-iv.iledefrance-mobilites.fr/lines/${card.config.line}/stops/${card.config.station}/realtime`)
      .then((response) => {
        if (!response.ok) {
          card._error = true;
        } else {
          card._error = false;
        }
        return response.json();
      })
      .then((data) => {
        card._lastUpdated = new Date();
        if (data.message == 'NO_REALTIME_SCHEDULES_FOUND') {
          card._error = false;
          card._schedules = [{
            lineId: card._line.id,
            shortName: card._line.shortName,
            vehicleName: '',
            lineDirection: localize('timetable.no_departures')
          }];
        } else if (data.length >= 1) {
          if (((card.config.direction ?? 'AR') == 'AR') && !card.destInfo) {
            card._schedules = data;
          } else {
            // We have a direction or an arrival station, so we need to filter received schedules
            let tmpSch: Schedule[] = data.filter((sch: Schedule) => {
              if ((Number.parseInt(sch.time ?? '0')) > (card.config.maxWaitMinutes ?? 1000)) return false;
              // A direction is configured and the info is present in the returned schedules (hurray !)
              if (card.config.direction && sch.sens) {
                return sch.sens == (card.config.direction == 'A' ? '1' : '-1');
              // Filter based on retained routes (see initialize())
              } else if (card.destInfo || card.config.direction) {
                return card.routeStops.filter((r) => {
                  return r.stops.filter((s) => {
                    /*
                     * Because sometimes public transport people can be quite playful, the destination's
                     * name in some cases is not the exact name of a station (it can actually differ
                     * quite a lot), so we need a clever algorithm for comparison.
                     * The threshold here (0.60) is quite arbitrary but kinda seems to
                     * approximately pretty much work OK, I guess ?
                     */
                    return compareTwoStrings(
                      s.stopArea?.name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
                      sch.lineDirection
                    ) >= 0.60;
                  }).length > 0;
                }).length > 0;
              }
              return null;
            });
            if (card.config.maxWaitMinutes && tmpSch.length == 0) {
              tmpSch = [{
                lineId: card._line.id,
                shortName: card._line.shortName,
                vehicleName: '',
                lineDirection: localize('timetable.no_departures_in', '%maxwait%', card.config.maxWaitMinutes.toString())
              }];
            }
            if (card.config.maxTrainsShown) {
              tmpSch = tmpSch.slice(0, card.config.maxTrainsShown);
            }
            card._schedules = tmpSch;
          }
        }
      });
  }

  protected async initialize(): Promise<unknown> {
    // Get info for the line
    await this.loadLineInfo(this);
    // Load the routes for this line
    await this.loadRouteStops(this);

    /*
     * Find all routes corresponding to our configuration for cases where the API
     * does not give useful direction information (buses, SNCF trains, ...)
     */
    if (this.config.arrivalStation || ((this.config.direction ?? 'AR') != 'AR')) {
      const tmpRoutes = this.routeStops.filter((r) => {
        // Remove all stops before departure station
        while (r.stops.length > 0 && r.stops[0].stopArea?.id != this.depInfo?.id) {
          r.stops.shift();
        }
        // If no stop remains (departure station was not found in route), filter out this route
        if (r.stops.length == 0) return false;
        if (this.config.arrivalStation) {
          // Check that the arrival station is also in route
          const tmpDest = r.stops.filter((s) => { return s.stopArea?.id == this.destInfo?.id });
          // and store info about it for later use
          /*if (!this.destInfo && tmpDest.length > 0)
            this.destInfo = tmpDest[0];*/
          return tmpDest.length > 0;
        } else if ((this.config.direction ?? 'AR') != 'AR') {
          return r.sens == (this.config.direction == 'A' ? '1' : '-1');
        }
        return r.stops.length > 0;
      });
      // Retain interesting routes
      this.routeStops = tmpRoutes;
    }
    if (this.routeStops.length == 0) {
      this._error = true;
      throw new Error(localize('common.no_routes'));
    }
    this._error = false;

    // Card setup finished, get the schedules !
    const tmpPromise = this.getSchedules(this);
    this._timer = setInterval(this.getSchedules, 30000, this);
    return tmpPromise;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._schedules = [];
    this.initialize();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._timer);
  }

  protected cardHeader(): TemplateResult {
    if (!this._line || this.config.name != localize('common.card.name')) {
      return html`${this.config.name}`;
    }

    const destSpan = (dest: Stop) => html`
      <div class="idfm-to">→ <span class="idfm-dest">${dest.name}</span></div>
    `

    const pictoStyle = (line: Line) => {
      let style = `color: #${line.textColor}; `;
      if (line.mode == 'Tramway') {
        style += `border-color: #${line.color};`;
      } else {
        style += `background-color: #${line.color};`;
      }
      return style;
    }

    return html`
      <span class="idfm-picto idfm-picto-${this._line.mode}" style="${pictoStyle(this._line)}"> ${
      this._line.mode == 'Tramway' && ['a', 'b'].includes(this._line.shortName.substr(this._line.shortName.length - 1, 1)) ?
      html`${this._line.shortName.substr(0, this._line.shortName.length - 1)}<span class="idfm-tram-letter">${this._line.shortName.substr(this._line.shortName.length - 1, 1)}</span>` :
      this._line.shortName
      } </span>
      <div class="idfm-from"><span class="idfm-dep">${this.depInfo?.name}</span></div>
      ${this.destInfo ? destSpan(this.destInfo) : ''}
    `;
  }

  protected render(): TemplateResult | void {
    return html`
      <ha-card
        tabindex="0"
        aria-label="IdFM: ${this.config.name}"
        class="idfm-card"
        >
        <h1 class="card-header">
          ${this.cardHeader()}
        </h1>
        <table class="timetable">
          <tbody>
            ${this._schedules.map(
              (schedule) =>
                html`
                  <tr class="idfm-entry">
                    <td class="idfm-code"><span>${schedule.vehicleName}</span></td>
                    <td class="idfm-destination"><span>${schedule.lineDirection}</span></td>
                    <td class="idfm-delay-msg">
                      <div class="idfm-delay-div">
                        <span class="idfm-delay">${schedule.time ? schedule.time : ''}</span>
                        <span class="idfm-min">${schedule.time ? 'min' : ''}</span>
                      </div>
                      <span class="idfm-msg">${schedule.schedule ? schedule.schedule : ''}</span>
                    </td>
                  </tr>
                `,
            )}
          </tbody>
        </table>
        <span class="lastUpdated">${localize('timetable.lastupdated')}: ${this._lastUpdated.toLocaleTimeString()}</span>
        ${this._error ? html`<span class="updateError"> !</span>` : ''}
      </ha-card>
    `;
  }

  private showWarning(warning: string): TemplateResult {
    return html`<hui-warning>${warning}</hui-warning>`;
  }

  private showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card') as LovelaceCardEditor;
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html`${errorCard}`;
  }

  static get styles(): CSSResultGroup {
    return css`
      .timetable {
        width: 100%;
        border-top: 2px solid red;
        border-spacing: 0;
        border-collapse: collapse;
      }
      .timetable tr {
        line-height: 1em;
      }
      .timetable tr td {
        border-bottom: 1px solid gray;
        padding: 0;
      }
      .idfm-card {
        font-family: Arial, Helvetica, sans-serif;
        font-weight: bold;
        color: darkblue;
        background-color: #FFFFF0;
      }
      .idfm-card .card-header {
        line-height: unset;
      }
      .idfm-picto {
        display: inline-block;
      }
      .idfm-picto-RER,
      .idfm-picto-Train {
        text-align: center;
        width: 1.5em;
        height: 1.5em;
        line-height: 1.5em;
        border-radius: 20%;
        vertical-align: middle;
        font-weight: bold;
      }
      .idfm-picto-Metro {
        text-align: center;
        width: 1.5em;
        height: 1.5em;
        line-height: 1.5em;
        border-radius: 50%;
        vertical-align: middle;
        font-weight: bold;
      }
      .idfm-picto-Bus {
        text-align: center;
        width: 2em;
        height: 1.2em;
        line-height: 1.2em;
        vertical-align: middle;
        font-weight: bold;
      }
      .idfm-picto-Tramway {
        text-align: center;
        width: 1.8em;
        height: 1.1em;
        line-height: 1.1em;
        vertical-align: middle;
        font-weight: bold;
        border-top: 0.2em solid;
        border-bottom: 0.2em solid;
      }
      .idfm-tram-letter {
        line-height: 1.0em;
        vertical-align: top;
        font-size: smaller;
      }
      .idfm-from {
        display: inline-block;
        margin-left: 0.5em;
      }
      .idfm-to {
        display: inline-block;
        margin-left: 5em;
        font-size: smaller;
      }
      .idfm-entry {
        border-bottom: 1px solid gray;
      }
      .idfm-code {
        width: 3.5em;
      }
      .idfm-code span {
        background-color: darkslategray;
        color: white;
        font-weight: normal;
        font-size: xx-small;
        letter-spacing: 0.1em;
        border-radius: 3px;
        padding: 1px 5px;
        width: 3em;
        display: inline-block;
        height: 1.3em;
        vertical-align: middle;
        margin-left: 0.1em;
      }
      .idfm-delay-msg {
        width: 10em;
      }
      .idfm-msg,
      .idfm-delay-div {
        display: block;
        height: 1.3em;
        float: left;
        color: orange;
        background-color: black;
      }
      .idfm-delay-div {
        width: 2em;
      }
      .idfm-delay {
        width: 100%;
        text-align: center;
        height: 1em;
        display: inline-block;
      }
      .idfm-min {
        font-size: 0.4em;
        height: 0.3em;
        width: 100%;
        text-align: center;
        display: inline-block;
        position: relative;
        top: -2.9ex;
      }
      .idfm-msg {
        display: inline-block;
        width: 7.7em;
        background-color: darkslategray;
        color: orange;
        padding-left: 0.3em;
      }
      .lastUpdated {
        text-align: right;
        display: inline-block;
        width: 95%;
        font-size: 0.7em;
      }
      .updateError {
        color: red;
        font-weight: bold;
        font-size: 0.7em;
      }
    `;
  }
}
