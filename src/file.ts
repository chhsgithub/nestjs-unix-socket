const { exec } = require('child_process');
import * as fs from 'fs'

const filepath = 'C:/Users/chen/unzip/temp.txt'
function runAsAdmin(command) {
  return new Promise((resolve, reject) => {
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
runAsAdmin('C:/Users/chen/unzip/sys/handle.exe -accepteula -nobanner D:/Downloads/a4k.net_2023-05-02_773498654.rar')
  .then(stdout => {
    console.log(stdout);
  })
  .catch(err => {
    console.error(err);
  });

