import { locales } from "@/locales";
import { Locale } from "discord.js";

export type STRING_KEYS =
  | keyof (typeof locales)[Locale.Korean]
  | keyof (typeof locales)["en"];

export type LocaleData = { [key in STRING_KEYS]: string };

export type LocaleObject = { [key in Locale]: LocaleData };

export interface LocalePickerOption {
  fallBackLocale: string;
  locales: LocaleObject;
}

export type ReusableFormatFunc = (
  key: STRING_KEYS,
  ...args: string[]
) => string;
