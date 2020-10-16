# IdFM Card by [@lesensei](https://www.github.com/lesensei)

A simple Home Assistant Lovelace card to show upcoming vehicles on the Ile de France Mobilite network.

For now, this card is not based on any entity configuration. It will only make API calls to get next departures when its tab is active, and refresh every 30s as long as the tab stays open.

## Options

| Name    | Type   | Requirement  | Description                  | Default              |
| ------- | ------ | ------------ | ---------------------------- | -------------------- |
| type    | string | **Required** | `custom:idfm-card`           |                      |
| name    | string | **Optional** | Card name (used as header)   | `Prochains passages` |
| line    | string | **Required** | ID of the line to monitor    |                      |
| station | string | **Required** | ID of the station to monitor |                      |
| way     | string | **Required** | Way to monitor (A, R, AR)    |                      |

At the moment, `line` and `station` IDs must be recovered from monitoring the API calls made by vianavigo.com. The goal is to make it easy using the editor card, but I don't know enough of Polymer to do that yet.
