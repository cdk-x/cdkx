import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { App, Asset, Stack, StackOutput } from '@cdk-x/core';
import { MltInstance } from '@cdk-x/multipass';
import { SshShellScript, SshDocument, SshRunDocument } from '@cdk-x/ssh';

const SSH_KEY_PATH = path.join(os.homedir(), '.ssh', 'cdkx_e2e');
const SSH_PUB_KEY_PATH = SSH_KEY_PATH + '.pub';

// Read the public key at synth time to embed it in cloud-init
const pubKey = fs.readFileSync(SSH_PUB_KEY_PATH, 'utf8').trim();

// Generate cloud-init with the SSH public key so the VM accepts our key
const cloudInitContent = `#cloud-config
package_update: true
package_upgrade: true
packages:
  - curl
  - htop
users:
  - name: ubuntu
    ssh_authorized_keys:
      - ${pubKey}
runcmd:
  - echo "cdkx multipass e2e asset provisioned $(date -u)" > /etc/cdkx-e2e.txt
`;

const generatedCloudInitPath = path.resolve(__dirname, '../cloud-init-generated.yaml');
fs.writeFileSync(generatedCloudInitPath, cloudInitContent);

const app = new App();

const stack = new Stack(app, 'Network');

const cloudInit = new Asset(stack, 'CloudInit', {
  path: generatedCloudInitPath,
});

// Directory asset: stages the full `cloud-init/` folder under
// `cdkx.out/assets/asset.<hash>/`. Kept alongside the file asset above to
// exercise the directory-packaging path end-to-end.
new Asset(stack, 'CloudInitDir', {
  directoryPath: path.resolve(__dirname, '../cloud-init'),
});

const instance = new MltInstance(stack, 'Instance', {
  name: 'cdk-x-multipass-e2e',
  image: 'jammy',
  cpus: 1,
  memory: '1G',
  networks: [{ name: 'en0', mode: 'auto' }],
  mounts: [
    { source: path.resolve(__dirname, '../cdkx.out'), target: '/cdkx.out' },
  ],
  cloudInit: cloudInit.absolutePath,
});

const nginxInstall = new SshShellScript(stack, 'NginxInstall', {
  name: 'nginx-install',
  runCommand: ['sudo apt-get update', 'sudo apt-get install -y nginx'],
});

const deployDoc = new SshDocument(stack, 'DeployDoc', {
  name: 'deploy-nginx',
  documentType: 'Automation',
  mainSteps: [
    {
      name: 'install',
      action: 'ssh:runShellScript',
      scriptRef: nginxInstall.attrName,
      inputs: {
        runCommand: nginxInstall.attrRunCommand,
      },
    },
  ],
});

new SshRunDocument(stack, 'RunNginx', {
  documentName: deployDoc.attrName,
  documentType: deployDoc.attrDocumentType,
  mainSteps: deployDoc.attrMainSteps,
  host: instance.attrIpAddress,
  user: instance.attrSshUser,
  privateKeyPath: SSH_KEY_PATH,
});

new StackOutput(stack, 'InstanceName', {
  value: instance.attrIpAddress,
});

new StackOutput(stack, 'InstanceUser', {
  value: instance.attrSshUser,
});

app.synth();
