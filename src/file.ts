const { exec } = require('child_process');
import * as fs from 'fs'

function killProcess(pid) {
  return new Promise((resolve, reject) => {
    exec(`taskkill /PID ${pid} /F`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return reject(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}



const filepath = 'C:/Users/chen/unzip/temp.txt'
function runAsAdmin(command) {
  return new Promise<string>((resolve, reject) => {
    // Create a temporary file to store the command output
    // let tempFile = path.join(os.tmpdir(), 'temp.txt');

    let tempFile = filepath;
    const psCommand = `Start-Process cmd.exe -Verb runAs -ArgumentList '/c ${command} > ${tempFile}' -Wait; ; Get-Content ${tempFile}`;
    // console.log(psCommand)
    exec(`powershell "${psCommand}"`, (err) => {
      if (err) {
        return reject(err);
      }

      // Read the command output from the temporary file
      const output = fs.readFileSync(tempFile, 'utf-8');

      // Delete the temporary file
      fs.unlinkSync(tempFile);

      resolve(output);
    });
  });
}

// powershell Start-Process cmd.exe -Verb runAs -ArgumentList '/c C:/Users/chen/unzip/sys/handle.exe -accepteula -nobanner D:/Downloads/a4k.net_2023-05-02_773498654.rar'
// 使用示例
runAsAdmin('C:/Users/chen/unzip/sys/handle.exe -accepteula -nobanner C:\\Users\\chen\\unzip\\Release\\test.tar.xz')
  .then(stdout => {
    console.log(stdout);
    let processInfo = parseOutput(stdout)
    console.log(processInfo);
    // 使用示例
    killProcess(processInfo[0].pid)
      .then(output => {
        console.log(output);
      })
      .catch(err => {
        console.error(err);
      });
  })
  .catch(err => {
    console.error(err);
  });


type ProcessInfo = {
  processName: string;
  pid: number;
  type: string;
  descriptor: string;
  filePath: string;
};

function parseOutput(output: string): ProcessInfo[] {
  // Regex to match the output format
  const regex = /(\S+)\s+pid:\s+(\d+)\s+type:\s+(\S+)\s+(\S+):\s+(.+)/g;

  let match;
  const result: ProcessInfo[] = [];

  // Loop over the output and extract the process info
  while ((match = regex.exec(output)) !== null) {
    result.push({
      processName: match[1],
      pid: parseInt(match[2], 10),
      type: match[3],
      descriptor: match[4],
      filePath: match[5],
    });
  }

  return result;
}

