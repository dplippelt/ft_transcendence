import type { StyledTextConfig } from "../cards/CardContent";
import type { StyledBoxConfig } from "../cards/CardStyle";

export const buttonStyleConfig: StyledBoxConfig = {
  width: 100,
  height: 50,
  bgColorRed: 100,
  bgColorBlue: 100,
  bgColorGreen: 100,
  strokeColorRed: 0,
  strokeColorBlue: 0,
  strokeColorGreen: 0,
  strokeWidth: 1,
};

export const buttonContentConfig: StyledTextConfig = {
  textColorRed: 255,
  textColorBlue: 255,
  textColorGreen: 255,
  textStyle: {
    fontFamily: "Arial Black",
    fontSize: "15px",
    align: "center",
  },
};
