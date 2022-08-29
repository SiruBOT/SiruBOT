import { LocalePicker } from "./LocalePicker";
import en from "./en.json";
import ko from "./ko.json";

export const locales = {
  en,
  ko,
};

const picker: LocalePicker = new LocalePicker({
  fallBackLocale: "ko",
  locales,
});

export default picker;
