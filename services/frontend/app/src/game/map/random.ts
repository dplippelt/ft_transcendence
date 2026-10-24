import MersenneTwister from "mersenne-twister";

export class Random {
  private generator: MersenneTwister;

  constructor(seed?: number) {
    if (seed === undefined) {
      seed = new Date().getTime();
    }
    this.generator = new MersenneTwister([seed]);
  }

  // generates a random value on [0, 1)
  random_value(): number {
    return this.generator.random_long();
  }

  init_seed(seed: number) {
    // TODO: For full python parity the number should be broken down into 32-bit words array
    this.generator.init_by_array([Math.abs(seed)], 1);
  }
}

export const gRandom = new Random()
