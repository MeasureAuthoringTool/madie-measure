// build a string of given length
export default function buildString(length: number): string {
  let string = "";
  for (let i = 0; i < length; i++) {
    string += "a";
  }
  return string;
}
