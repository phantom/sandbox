/**
 * A simple helper function used to space out our signature polling
 * @param {Number} milliseconds an amount of time in milliseconds
 * @returns
 */
const pause = (milliseconds: number): Promise<unknown> => {
  return new Promise((res) => {
    setTimeout(res, milliseconds);
  });
};

export default pause;
