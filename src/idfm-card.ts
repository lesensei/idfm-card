import { LitElement, html, customElement, property, CSSResult, TemplateResult, css } from 'lit-element';
import {
  HomeAssistant,
  //hasConfigOrEntityChanged,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
  LovelaceCard,
} from 'custom-card-helpers';

import './editor';

import { IdFMCardConfig } from './types';
import { CARD_VERSION } from './const';

import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  IDFM-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'idfm-card',
  name: localize('common.card.name'),
  description: localize('common.card.description'),
});

interface Schedule {
  lineId: string;
  shortName: string;
  vehicleName: string;
  lineDirection: string;
  sens: string;
  code: string;
  time?: string;
  schedule?: string;
}

@customElement('idfm-card')
export class IdFMCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('idfm-card-editor') as LovelaceCardEditor;
  }

  public static getStubConfig(): object {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  @property() public hass!: HomeAssistant;
  @property() private _config!: IdFMCardConfig;
  @property() private _schedules!: Array<Schedule>;
  private _lastUpdated = new Date();
  private _timer;
  private _error = false;

  public setConfig(config: IdFMCardConfig): void {
    if (!config || !config.station || !config.line || !config.way || !['A', 'R', 'AR'].includes(config.way)) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this._config = {
      name: localize('common.card.name'),
      ...config,
    };
  }

  private getSchedules(card: IdFMCard): void {
    fetch(`https://api-iv.iledefrance-mobilites.fr/lines/${card._config.line}/stops/${card._config.station}/realtime`)
      .then(response => {
        if (!response.ok) {
          card._error = true;
          throw new Error(response.statusText);
        }
        card._error = false;
        return response.json();
      })
      .then(data => {
        card._lastUpdated = new Date();
        card._schedules = data.filter((element: Schedule) => {
          if (card._config.way == 'AR') return true;
          return element.sens == (card._config.way == 'A' ? '1' : '-1');
        });
      });
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._schedules = [];
    this.getSchedules(this);
    this._timer = setInterval(this.getSchedules, 30000, this);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._timer);
  }

  protected render(): TemplateResult | void {
    return html`
      <ha-card
        .header=${this._config.name}
        @action=${this._handleAction}
        tabindex="0"
        aria-label=${`IdFM: ${this._config.name}`}
        class="idfm-card"
        ><table class="timetable">
          <tbody>
            ${this._schedules.map(
              schedule =>
                html`
                  <tr class="idfm-entry">
                    <td><span class="idfm-code">${schedule.vehicleName}</span></td>
                    <td><span class="idfm-destination">${schedule.lineDirection}</span></td>
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
        ${this._error
          ? html`
              <span class="updateError"> !</span>
            `
          : ''}
      </ha-card>
    `;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this._config && ev.detail.action) {
      handleAction(this, this.hass, this._config, ev.detail.action);
    }
  }

  private showWarning(warning: string): TemplateResult {
    return html`
      <hui-warning>${warning}</hui-warning>
    `;
  }

  private showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card') as LovelaceCard;
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this._config,
    });

    return html`
      ${errorCard}
    `;
  }

  static get styles(): CSSResult {
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
      }
      .idfm-entry {
        border-bottom: 1px solid gray;
      }
      .idfm-code {
        background-color: darkslategray;
        color: white;
        font-weight: normal;
        font-size: xx-small;
        letter-spacing: 0.1em;
        border-radius: 3px;
        padding: 1px 5px;
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
