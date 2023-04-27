/* eslint-disable security/detect-object-injection */
import { Locale } from "discord.js";
import { LocaleData } from "@/types/locales";
import { fallBackLocale } from "@/locales";
import {
  LocalePickerOption,
  ReusableFormatFunc,
  STRING_KEYS,
} from "@/types/locales";

export class LocalePicker {
  public option: LocalePickerOption;
  constructor(option: LocalePickerOption) {
    this.option = option;
  }

  public format(locale: Locale, key: STRING_KEYS, ...args: string[]): string {
    let localeData: LocaleData | undefined = this.option.locales[locale];
    localeData ??= this.option.locales[fallBackLocale];

    return localeData?.[key]
      ? localeData?.[key].replace(/{(\d+)}/g, (match, number) => {
          return typeof args[number] !== "undefined" ? args[number] : match;
        })
      : `${locale}.${key}`;
  }

  public getReusableFormatFunction(localeName: Locale): ReusableFormatFunc {
    return (key: STRING_KEYS, ...args: string[]): string => {
      return this.format(localeName, key, ...args);
    };
  }
}
