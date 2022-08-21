import { locales } from "./index";

export type STRING_KEYS =
  | keyof typeof locales["en"]
  | keyof typeof locales["ko"]
  | string;

export interface Locale {
  [key: string]: string;
}

export interface LocalePickerOption {
  fallBackLocale: string;
  locales: { [key: string]: Locale };
}

export type ReusableFormatFunction = (
  key: STRING_KEYS,
  ...args: string[]
) => string;

export class LocalePicker {
  public option: LocalePickerOption;
  constructor(option: LocalePickerOption) {
    this.option = option;
  }

  public format(locale: string, key: STRING_KEYS, ...args: string[]): string {
    let localeData: Locale | undefined = this.option.locales[locale];
    if (!localeData) {
      localeData = this.option.locales[this.option.fallBackLocale];
    }
    const valueData: string | undefined = localeData?.[key];
    if (!valueData) {
      return `${locale}.${key}`;
    }
    // {0} {1} {2} to {args[0]} {args[1]} {args[2]}
    return valueData.replace(/{(\d+)}/g, (match, number) => {
      return typeof args[number] !== "undefined" ? args[number] : match;
    });
  }

  public addLocale(localeName: string, localeData: Locale): void {
    this.option.locales[localeName] = localeData;
  }

  public getReusableFormatFunction(localeName: string): ReusableFormatFunction {
    return (key: STRING_KEYS, ...args: string[]): string => {
      return this.format(localeName, key, ...args);
    };
  }
}
