import { LocalePicker } from "@/locales/LocalePicker";
import { LocaleObject } from "@/types/locales";
import ko from "./ko.json";
import en from "./en.json";

export const locales = {
  ko: ko,
  en: en,
};

export const fallBackLocale = "ko" as const;

const picker =  new LocalePicker({
  fallBackLocale,
  locales: locales as unknown as LocaleObject,
});



export const format = picker.format.bind(picker);
// export const = picker.
export const getReusableFormatFunction = picker.getReusableFormatFunction.bind(picker);