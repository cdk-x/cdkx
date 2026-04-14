import { Command } from 'commander';
import { launchCommand } from './launch.command.js';
import { startCommand } from './start.command.js';
import { stopCommand } from './stop.command.js';
import { deleteCommand } from './delete.command.js';

const multipass = new Command('multipass').description(
  'Manage Multipass VMs defined in multipass.yaml',
);

multipass.addCommand(launchCommand);
multipass.addCommand(startCommand);
multipass.addCommand(stopCommand);
multipass.addCommand(deleteCommand);

export { multipass as multipassCommand };
