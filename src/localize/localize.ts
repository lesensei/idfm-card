import * as en from './languages/en.json';
import * as nb from './languages/nb.json';
import * as fr from './languages/fr.json';

const languages: { [key: string]: object } = {
  en: en,
  nb: nb,
  fr: fr,
};

export function localize(string: string, search = '', replace = ''): string {
  // localStorage returns a literall 'null' string for selectedLanguage :-(
  const localLang =
    localStorage.getItem('selectedLanguage') != 'null' ? localStorage.getItem('selectedLanguage') : null;
  const lang = (localLang || navigator.language || 'en').replace(/['"]+/g, '').replace('-', '_');

  let translated: string;

  try {
    translated = (string.split('.').reduce((o, i) => o[i], languages[lang]) as unknown) as string;
  } catch (e) {
    translated = (string.split('.').reduce((o, i) => o[i], languages['en']) as unknown) as string;
  }

  if (translated === undefined)
    translated = (string.split('.').reduce((o, i) => o[i], languages['en']) as unknown) as string;

  if (search !== '' && replace !== '') {
    translated = translated.replace(search, replace);
  }
  return translated;
}
