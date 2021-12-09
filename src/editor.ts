/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { IdFMCardConfig } from './types';
import { customElement, state } from 'lit/decorators.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';

import { localize } from './localize/localize';

const options = {
  required: {
    icon: 'tune',
    name: localize('config.required.name'),
    secondary: localize('config.required.secondary'),
    show: true,
  },
  optional: {
    icon: 'palette',
    name: localize('config.optional.name'),
    secondary: localize('config.optional.secondary'),
    show: false,
  },
};

@customElement('idfm-card-editor')
export class IdFMCardEditor extends LitElement implements LovelaceCardEditor {
  @state() private _config?: IdFMCardConfig;
  @state() private _toggle?: boolean;
  private _initialized = false;

  public setConfig(config: IdFMCardConfig): void {
    this._config = config;
  }

  protected shouldUpdate(): boolean {
    if (!this._initialized) {
      this._initialize();
    }

    return true;
  }

  /*constructor() {
    super();
  }*/

  get _name(): string {
    return this._config?.name || '';
  }

  get _line(): string {
    return this._config?.line || '';
  }

  get _station(): string {
    return this._config?.station || '';
  }

  get _arrivalStation(): string {
    return this._config?.arrivalStation || '';
  }

  get _direction(): string {
    return this._config?.direction || '';
  }

  get _maxTrainsShown(): number | undefined {
    return this._config?.maxTrainsShown;
  }

  get _maxWaitMinutes(): number | undefined {
    return this._config?.maxWaitMinutes;
  }

  get _show_warning(): boolean {
    return this._config?.show_warning || false;
  }

  get _show_error(): boolean {
    return this._config?.show_error || false;
  }

  /*connectedCallback(): void {
    super.connectedCallback();
    document.querySelector("#line-combo vaadin-combo-box")?.setAttribute("items", JSON.stringify(this._lines));
    console.log('test12');
  }*/

  protected render(): TemplateResult | void {
    return html`
      <div class="card-config">
              <div class="values">
                <paper-input
                  name="helper-url"
                  always-float-label
                  label="${localize('config.parameters.url')}"
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  always-float-label
                  label="${localize('config.parameters.line')} (${localize('config.required.name')})"
                  @value-changed=${this._valueChanged}
                  .configValue=${'line'}
                  value=${this._line}
                ></paper-input>
                <paper-input
                  always-float-label
                  label="${localize('config.parameters.station')} (${localize('config.required.name')})"
                  @value-changed=${this._valueChanged}
                  .configValue=${'station'}
                  value=${this._station}
                ></paper-input>
                <paper-input
                  always-float-label
                  label="${localize('config.parameters.arrivalStation')} (${localize('config.required.name')})"
                  @value-changed=${this._valueChanged}
                  .configValue=${'arrivalStation'}
                  value=${this._arrivalStation}
                ></paper-input>
                <paper-input
                  always-float-label
                  label="${localize('config.parameters.direction')} (${localize('config.required.name')})"
                  @value-changed=${this._valueChanged}
                  .configValue=${'direction'}
                  value=${this._direction}
                ></paper-input>
                <paper-input
                  always-float-label
                  label="${localize('config.parameters.name')} (${localize('config.optional.name')})"
                  @value-changed=${this._valueChanged}
                  .configValue=${'name'}
                  value=${this._name}
                ></paper-input>
                <paper-input
                  always-float-label
                  label="${localize('config.parameters.maxTrainsShown')} (${localize('config.optional.name')})"
                  @value-changed=${this._valueChanged}
                  .configValue=${'maxTrainsShown'}
                  value=${ifDefined(this._maxTrainsShown)}
                ></paper-input>
                <paper-input
                  always-float-label
                  label="${localize('config.parameters.maxWaitMinutes')} (${localize('config.optional.name')})"
                  @value-changed=${this._valueChanged}
                  .configValue=${'maxWaitMinutes'}
                  value=${ifDefined(this._maxWaitMinutes)}
                ></paper-input>
              </div>
      </div>
    `;
  }

  private _initialize(): void {
    if (this._config === undefined) return;
    this._initialized = true;
  }

  private _toggleOption(ev): void {
    this._toggleThing(ev, options);
  }

  private _toggleThing(ev, optionList): void {
    const show = !optionList[ev.target.option].show;
    for (const [key] of Object.entries(optionList)) {
      optionList[key].show = false;
    }
    optionList[ev.target.option].show = show;
    this._toggle = !this._toggle;
  }

  /**
   * Takes in a IdFM "next departures" URL and breaks it into its parts to populate the `IdFMCardConfig` object
   *
   * Example such URLs:
   *   - https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/train/line%3AIDFM%3AC01729/horaires?arrivalId=stop_area%3AIDFM%3A73798&date=2021-11-17T07%3A50&departureId=stop_area%3AIDFM%3A67897
   *   - https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/train/line%3AIDFM%3AC01740/horaires?arrivalId=stop_area%3AIDFM%3A71370&date=2021-11-17T09%3A15&departureId=stop_area%3AIDFM%3A70956
   *   - https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/train/line%3AIDFM%3AC01742/horaires?arrivalId=stop_area%3AIDFM%3A73626&date=2021-11-20T18%3A20&departureId=stop_area%3AIDFM%3A70902
   *   - https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/metro/line%3AIDFM%3AC01375/horaires?date=2021-11-20T18%3A18&direction=-1&routeId=route%3AIDFM%3ARATP%3A557-C01375-2272463&stopId=stop_area%3AIDFM%3A72004
   *   - https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/bus/line%3AIDFM%3AC01114/horaires?date=2021-11-20T18%3A19&direction=1&line=line%3AIDFM%3AC01114%7C%7C82%7CBus%7C&stopId=stop_point%3AIDFM%3A8439&transporter
   *   - https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/tramway/line%3AIDFM%3AC01391/horaires?date=2021-11-20T18%3A20&direction=-1&routeId=route%3AIDFM%3AC01391-inbound&stopId=stop_area%3AIDFM%3A70620
   *   - https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/tramway/line%3AIDFM%3AC01794/horaires?date=2021-12-09T16%3A37&direction=-1&routeId=route%3AIDFM%3ARATP%3A13338-C01794-2575706&stopId=stop_area%3AIDFM%3A73918
   *   - https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/bus/line%3AIDFM%3AC00294/horaires?date=2021-12-09T16%3A42&direction=1&line=line%3AIDFM%3AC00294%7C%7C2%7CBus%7C&stopId=stop_point%3AIDFM%3A7574&transporter
   *
   * @param origUrl The URL of a realtime "next departures" page on the IdFM website
   *
   * @return an `IdFMCardConfig` corresponding to the URL
   */
  private urlToConfig(origUrl: string, conf: IdFMCardConfig): IdFMCardConfig {
    const url: string = decodeURIComponent(origUrl);
    let tmpLine = '';
    let tmpDeparture = '';
    let tmpArrival = '';
    let tmpDirection = '';
    const lineMatch = url.match(/(line[:\w]+)/);
    if (lineMatch && lineMatch.length > 1) {
      tmpLine = lineMatch[1];
    }
    let stopMatch = url.match(/(?:stop|departure)Id=(stop_(?:area|point)[:\w]+)[\/&]?/);
    if (stopMatch && stopMatch.length > 1) {
      tmpDeparture = stopMatch[1];
    }
    stopMatch = url.match(/arrivalId=(stop_(?:area|point)[:\w]+)[\/&]?/);
    if (stopMatch && stopMatch.length > 1) {
      tmpArrival = stopMatch[1];
    }
    const wayMatch = url.match(/direction=(-?1)/);
    if (wayMatch && wayMatch.length > 1) {
      switch (wayMatch[1]) {
        case '1':
          tmpDirection = 'A';
          break;
        case '-1':
          tmpDirection = 'R';
          break;
        default:
          tmpDirection = 'AR';
      }
    }
    if (tmpLine != '' && tmpDeparture != '') {
      conf = {
        ...conf,
        line: tmpLine,
        station: tmpDeparture,
        arrivalStation: tmpArrival,
        direction: tmpDirection,
      };
    }
    return conf;
  }

  private _valueChanged(ev): void {
    const target = ev.target;
    const name =
      target.configValue === undefined || target.configValue === null ? target.name : target.configValue;
    if (!this._config) {
      return;
    }
    if (name == 'helper-url') {
      this._config = this.urlToConfig(target.value, this._config);
    }
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        this._config = {
          ...this._config,
          [target.configValue]: undefined,
        };
      } else {
        this._config = {
          ...this._config,
          [target.configValue]: target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static get styles(): CSSResultGroup {
    return css`
      .option {
        padding: 4px 0px;
        cursor: pointer;
      }
      .row {
        display: flex;
        margin-bottom: -14px;
        pointer-events: none;
      }
      .title {
        padding-left: 16px;
        margin-top: -6px;
        pointer-events: none;
      }
      .secondary {
        padding-left: 40px;
        color: var(--secondary-text-color);
        pointer-events: none;
      }
      .values {
        padding-left: 16px;
        background: var(--secondary-background-color);
      }
      ha-switch {
        padding-bottom: 8px;
      }
    `;
  }
}
