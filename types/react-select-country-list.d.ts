declare module "react-select-country-list" {
  export type CountryOption = { label: string; value: string };

  export interface CountryListApi {
    getData(): CountryOption[];
    getLabel?(value: string): string | undefined;
    getValue?(label: string): string | undefined;
  }

  const countryList: (locale?: string) => CountryListApi;
  export default countryList;
}
