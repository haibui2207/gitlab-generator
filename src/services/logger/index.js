import Chalk from 'chalk';
import Moment from 'moment-timezone';
import { getData } from '../localstorage';

const messageFormatter = (type, message) => {
  const { timeZone } = getData();

  return `${Moment.tz(timeZone).format()} [${type}] ${message}`;
};
const debug = (message) => {
  console.log(Chalk.whiteBright(messageFormatter('DEBUG', message)));
};
const info = function (message) {
  console.log(Chalk.greenBright(messageFormatter('INFO', message)));
};
const warn = (message) => {
  console.log(Chalk.yellowBright(messageFormatter('WARN', message)));
};
const error = (message) => {
  console.log(Chalk.redBright(messageFormatter('ERROR', message)));
};

export default {
  debug,
  info,
  warn,
  error,
};
