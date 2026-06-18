export enum TerminalColor {
  Black = 1,
  Red,
  Green,
  Yellow,
  Blue,
  Magenta,
  Cyan,
  White,
  BrightBlack,
  BrightRed,
  BrightGreen,
  BrightYellow,
  BrightBlue,
  BrightMagenta,
  BrightCyan,
  BrightWhite,
}

export default class TerminalEffect {
  private foregroundColor?: TerminalColor;
  private backgroundColor?: TerminalColor;
  private bold?: boolean;
  private underline?: boolean;

  setBold() {
    this.bold = true;

    return this;
  }

  setUnderline() {
    this.underline = true;

    return this;
  }

  setColor(color: TerminalColor) {
    this.foregroundColor = color;

    return this;
  }

  setBackgroundColor(color: TerminalColor) {
    this.backgroundColor = color;

    return this;
  }

  async _internal_apply(): Promise<string> {
    let outputString = "";

    if (this.bold) outputString += "\x1b[1m";
    if (this.underline) outputString += "\x1b[4m";
    if (this.foregroundColor) {
      switch (this.foregroundColor) {
        case TerminalColor.Black: {
          outputString += "\x1b[30m";
          break;
        }
        case TerminalColor.Red: {
          outputString += "\x1b[31m";
          break;
        }
        case TerminalColor.Green: {
          outputString += "\x1b[32m";
          break;
        }
        case TerminalColor.Yellow: {
          outputString += "\x1b[33m";
          break;
        }
        case TerminalColor.Blue: {
          outputString += "\x1b[34m";
          break;
        }
        case TerminalColor.Magenta: {
          outputString += "\x1b[35m";
          break;
        }
        case TerminalColor.Cyan: {
          outputString += "\x1b[36m";
          break;
        }
        case TerminalColor.White: {
          outputString += "\x1b[37m";
          break;
        }
        case TerminalColor.BrightBlack: {
          outputString += "\x1b[90m";
          break;
        }
        case TerminalColor.BrightRed: {
          outputString += "\x1b[91m";
          break;
        }
        case TerminalColor.BrightGreen: {
          outputString += "\x1b[92m";
          break;
        }
        case TerminalColor.BrightYellow: {
          outputString += "\x1b[93m";
          break;
        }
        case TerminalColor.BrightBlue: {
          outputString += "\x1b[94m";
          break;
        }
        case TerminalColor.BrightMagenta: {
          outputString += "\x1b[95m";
          break;
        }
        case TerminalColor.BrightCyan: {
          outputString += "\x1b[96m";
          break;
        }
        case TerminalColor.BrightWhite: {
          outputString += "\x1b[97m";
          break;
        }
      }
    }
    if (this.backgroundColor) {
      switch (this.backgroundColor) {
        case TerminalColor.Black: {
          outputString += "\x1b[40m";
          break;
        }
        case TerminalColor.Red: {
          outputString += "\x1b[41m";
          break;
        }
        case TerminalColor.Green: {
          outputString += "\x1b[42m";
          break;
        }
        case TerminalColor.Yellow: {
          outputString += "\x1b[43m";
          break;
        }
        case TerminalColor.Blue: {
          outputString += "\x1b[44m";
          break;
        }
        case TerminalColor.Magenta: {
          outputString += "\x1b[45m";
          break;
        }
        case TerminalColor.Cyan: {
          outputString += "\x1b[46m";
          break;
        }
        case TerminalColor.White: {
          outputString += "\x1b[47m";
          break;
        }
        case TerminalColor.BrightBlack: {
          outputString += "\x1b[100m";
          break;
        }
        case TerminalColor.BrightRed: {
          outputString += "\x1b[101m";
          break;
        }
        case TerminalColor.BrightGreen: {
          outputString += "\x1b[102m";
          break;
        }
        case TerminalColor.BrightYellow: {
          outputString += "\x1b[103m";
          break;
        }
        case TerminalColor.BrightBlue: {
          outputString += "\x1b[104m";
          break;
        }
        case TerminalColor.BrightMagenta: {
          outputString += "\x1b[105m";
          break;
        }
        case TerminalColor.BrightCyan: {
          outputString += "\x1b[106m";
          break;
        }
        case TerminalColor.BrightWhite: {
          outputString += "\x1b[107m";
          break;
        }
      }
    }

    return outputString;
  }
}
