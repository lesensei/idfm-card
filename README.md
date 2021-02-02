# IdFM Card by [@lesensei](https://www.github.com/lesensei)

A simple Home Assistant Lovelace card to show upcoming vehicles on the Ile de France Mobilite network.

![Screenshot](https://raw.githubusercontent.com/lesensei/idfm-card/master/IDFM-card%20screenshot.png)

For now, this card is not based on any entity configuration. It will only make API calls to get next departures when its tab is active, and refresh every 30s as long as the tab stays open.

## Options

| Name    | Type   | Requirement  | Description                  | Default              |
| ------- | ------ | ------------ | ---------------------------- | -------------------- |
| type    | string | **Required** | `custom:idfm-card`           |                      |
| name    | string | **Optional** | Card name (used as header)   | `Prochains passages` |
| line    | string | **Required** | ID of the line to monitor    |                      |
| station | string | **Required** | ID of the station to monitor |                      |
| way     | string | **Required** | Way to monitor (A, R, AR)    | `AR`                 |

At the moment, `line` and `station` IDs must be recovered from URLs on the Ile de France Mobilités. The goal is to make it easy using the editor card, but I don't know enough of Polymer to do that yet.

## Installation

### Download

Go to <https://github.com/lesensei/idfm-card/releases>, click on "Assets" and download the `idfm-card.js` file.

### Upload to HA

Put the downloaded file in the config/www/ folder of your HA installation.

### Add the custom to Lovelace resources

Go to Config > Lovelace dashboards -> Resources, click the bottom-right "add" button, enter the `/local/idfm-card.js` URL and choose the "javascript module" type, then click "create".

### Add the component to your dashboard

1. Go to <https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/> and query the next departure times for your chosen transport line and station. Once you can see them displayed, copy your browsers URL.
2. Back to HA, open your dashboard of choice, click the "hamburger" menu in the top right then "modify", and click the "add card" button in the bottom-right. Choose the IDFM card (probably "carte ile de france mobilité"), and paste the URL from the previous step. It should automatically populate the `line`, `station` and `way` fields. That last field you may want to fiddle with to find the value that suits your need between outward `A`, inward `R` or both `AR`. Note: for buses, AR is the only supported value.
3. Add an optional title to your card if you wish and click "save".

If step 2 above doesn't work for you, you can still find the IDs you need manually, though it is a bit harder. You will need to look at the URL from step 1 and find the line and stop_area parameters (beware, they are URL encoded).

Here are some examples:

- `https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/bus/line%3A0%3A100100073%3A73/horaires?date=2021-02-01T23%3A03&direction=-1&line=line%3A0%3A100100073%3A73%7C%7C73%7CBus%7C&routeId=route%3A0%3A1001000730001R&stopId=stop_point%3A0%3ASP%3A59%3A4022897&transporter`

  in this URL, the line parameter is `line:0:100100073:73` and the station parameter is `stop_point:0:SP:59:4022897`

- `https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/tramway/line%3A0%3A100112013%3AT3A/horaires?date=2021-02-01T23%3A05&stopId=stop_area%3A0%3ASA%3A59559`

  in this URL, the line parameter is `line:0:100112013:T3A` and the station parameter is `stop_area:0:SA:59559`

- `https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/train/line%3A0%3A810%3AA/horaires?arrivalId=stop_area%3A0%3ASA%3A8775814&date=2021-02-01T23%3A10&departureId=stop_area%3A0%3ASA%3A8775817`

  in this URL, the line parameter is `line:0:810:A` and the station parameter is `stop_area:0:SA:8775817` (Beware ! Look for departureId, not arrivalId !)

- `https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/metro/line%3A0%3A100110003%3A3/horaires?date=2021-02-01T23%3A10&stopId=stop_area%3A0%3ASA%3A59325`

  in this URL, the line parameter is `line:0:100110003:3` and the station parameter is `stop_area:0:SA:59325`

If you need help decoding the parameters, [this site](https://meyerweb.com/eric/tools/dencoder/) looks legit enough (local decoding through javascript).

### ?

### Profit!
