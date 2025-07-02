declare module "@mapbox/polyline" {
  const polyline: {
    decode: (encoded: string) => number[][];
    encode: (coords: number[][]) => string;
  };
  export default polyline;
}