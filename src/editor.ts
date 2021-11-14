/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { IdFMCardConfig } from './types';
import { customElement, state } from 'lit/decorators';

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

  get _way(): string {
    return this._config?.way || '';
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
        <div class="option" @click=${this._toggleOption} .option=${'required'}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.required.icon}`}></ha-icon>
            <div class="title">${options.required.name}</div>
          </div>
          <div class="secondary">${options.required.secondary}</div>
        </div>
        ${options.required.show
          ? html`
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
                  label="${localize('config.parameters.way')} (${localize('config.required.way')})"
                  @value-changed=${this._valueChanged}
                  .configValue=${'way'}
                  value=${this._way}
                ></paper-input>
              </div>
            `
          : ''}
        <div class="option" @click=${this._toggleOption} .option=${'optional'}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.optional.icon}`}></ha-icon>
            <div class="title">${options.optional.name}</div>
          </div>
          <div class="secondary">${options.optional.secondary}</div>
        </div>
        ${options.optional.show
          ? html`
              <div class="values">
                <paper-input
                  always-float-label
                  label="${localize('config.parameters.name')}"
                  @value-changed=${this._valueChanged}
                  .configValue=${'name'}
                  value=${this._name}
                ></paper-input>
              </div>
            `
          : ''}
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

  private _valueChanged(ev): void {
    //console.log(ev);
    const name =
      ev.target.configValue === undefined || ev.target.configValue === null ? ev.target.name : ev.target.configValue;
    //console.log(name + ' changed to ' + ev.target.value);
    if (!this._config) {
      return;
    }
    if (name == 'helper-url') {
      const url: string = decodeURIComponent(ev.target.value);
      let tmpLine = '';
      let tmpStation = '';
      let tmpWay = '';
      const lineMatch = url.match(/(line[:\w]+)/);
      if (lineMatch && lineMatch.length > 1) {
        tmpLine = lineMatch[1];
      }
      const stopMatch = url.match(/(?:stop|departure)Id=(stop_(?:area|point)[:\w]+)[\/&]?/);
      if (stopMatch && stopMatch.length > 1) {
        tmpStation = stopMatch[1];
      }
      const wayMatch = url.match(/direction=(-?1)/);
      if (wayMatch && wayMatch.length > 1) {
        console.log(wayMatch);
        tmpWay = wayMatch[1] == '1' ? 'A' : 'R';
        switch (wayMatch[1]) {
          case '1':
            tmpWay = 'A';
            break;
          case '-1':
            tmpWay = 'R';
            break;
          default:
            tmpWay = 'AR';
        }
      }
      if (tmpLine != '' && tmpStation != '') {
        this._config = {
          ...this._config,
          ['line']: tmpLine,
          ['station']: tmpStation,
          ['way']: tmpWay,
        };
      }
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        delete this._config[target.configValue];
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
