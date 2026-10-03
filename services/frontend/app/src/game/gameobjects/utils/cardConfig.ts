import type { StyledBoxConfig } from "./StyledBox";
import type { StyledTextConfig } from "./StyledText";

export const cardStyleConfig: StyledBoxConfig = {
  width: 140,
  height: 190,
  bgColorRed: 50,
  bgColorGreen: 80,
  bgColorBlue: 80,
  strokeColorRed: 30,
  strokeColorGreen: 40,
  strokeColorBlue: 40,
  strokeWidth: 1,
};

export const cardTextConfig: StyledTextConfig = {
  textColorRed: 200,
  textColorGreen: 230,
  textColorBlue: 20,
  textStyle: {
    fontFamily: "Arial Black",
    fontSize: "15px",
    align: "center",
    fixedWidth: 34,
    fixedHeight: 42,
  },
};

// Needs to review
export interface CardConfig {
  cardStyleConfig: StyledBoxConfig;
  cardContentConfig: StyledTextConfig;
  focusDiff: number;
}

export const cardConfig: CardConfig = {
  cardStyleConfig: cardStyleConfig,
  cardContentConfig: cardTextConfig,
  focusDiff: 30,
};
