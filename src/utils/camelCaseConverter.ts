// given cammelCaseConverter -> Camel Case Converter
export default function camelCaseConverter(str: string): string {
  return str.replace(/([A-Z])/g, " $1").replace(/^./, function (str) {
    return str.toUpperCase();
  });
}
