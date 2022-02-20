import { LocalePicker } from "./LocalePicker";
import en from "./en.json";
import ko from "./ko.json";

const picker: LocalePicker = new LocalePicker({
  fallBackLocale: "en",
  locales: {
    en: en,
    ko: ko,
  },
});

export default picker;
