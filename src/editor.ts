import { LitElement, html, customElement, property, TemplateResult, CSSResult, css } from 'lit-element';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { IdFMCardConfig } from './types';
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
  @property() public hass?: HomeAssistant;
  @property() private _config?: IdFMCardConfig;
  @property() private _toggle?: boolean;

  public setConfig(config: IdFMCardConfig): void {
    this._config = config;
  }

  constructor() {
    super();
  }

  get _name(): string {
    if (this._config) {
      return this._config.name || '';
    }

    return '';
  }

  get _line(): string {
    if (this._config) {
      return this._config.line || '';
    }

    return '';
  }

  get _station(): string {
    if (this._config) {
      return this._config.station || '';
    }

    return '';
  }

  get _way(): string {
    if (this._config) {
      return this._config.way || '';
    }

    return '';
  }

  /*connectedCallback(): void {
    super.connectedCallback();
    document.querySelector("#line-combo vaadin-combo-box")?.setAttribute("items", JSON.stringify(this._lines));
    console.log('test12');
  }*/

  protected render(): TemplateResult | void {
    if (!this.hass) {
      return html``;
    }

    // You can restrict on domain type
    // const entities = Object.keys(this.hass.states).filter(eid => eid.substr(0, eid.indexOf('.')) === 'sun');

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
    if (!this._config || !this.hass) {
      return;
    }
    if (name == 'helper-url') {
      const url: string = decodeURIComponent(ev.target.value);
      let tmpLine = '';
      let tmpStation = '';
      const lineMatch = url.match(/(line[:\w]+)/);
      if (lineMatch && lineMatch.length > 1) {
        tmpLine = lineMatch[1];
      }
      const stopMatch = url.match(/(?:stop|arrival)Id=(stop_(?:area|point)[:\w]+)[\/&]?/);
      if (stopMatch && stopMatch.length > 1) {
        tmpStation = stopMatch[1];
      }
      if (tmpLine != '' && tmpStation != '') {
        this._config = {
          ...this._config,
          ['line']: tmpLine,
          ['station']: tmpStation,
          ['way']: 'AR',
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

  static get styles(): CSSResult {
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
