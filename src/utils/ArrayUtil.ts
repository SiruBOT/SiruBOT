export class ArrayUtil {
  static chunkArray<T>(arr: T[], chunkSize: number): T[][] {
    const array = [];
    for (let i = 0, len = arr.length; i < len; i += chunkSize) {
      array.push(arr.slice(i, i + chunkSize));
    }
    return array;
  }
}
