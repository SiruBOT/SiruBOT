import { Logger } from 'tslog'
import { ArgumentParser } from 'argparse'

const parser:ArgumentParser = new ArgumentParser({ description: 'SiruBOT BootStrapper CLI' })

const log: Logger = new Logger({ name: 'BootStrap' })


parser.add_argument('-s', '--shard', { help: 'Enable auto sharding', default: false })

parser.parse_args()